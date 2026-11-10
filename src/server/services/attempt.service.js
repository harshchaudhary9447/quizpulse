import prisma from '../../lib/prisma';
import { gradeAttempt } from './grading.service';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startAttempt(quizId, user, accessCode = null) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      quizQuestions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  // 1. Check if quiz is published
  if (!quiz.isPublished && user.role === 'STUDENT') {
    const error = new Error('This quiz is not currently published');
    error.statusCode = 403;
    error.code = 'QUIZ_NOT_PUBLISHED';
    throw error;
  }

  // 2. Check schedule constraints
  const now = new Date();
  if (quiz.scheduledStartTime && new Date(quiz.scheduledStartTime) > now) {
    const error = new Error(`Quiz is scheduled to start on ${quiz.scheduledStartTime}`);
    error.statusCode = 403;
    error.code = 'QUIZ_NOT_STARTED';
    throw error;
  }
  if (quiz.scheduledEndTime && new Date(quiz.scheduledEndTime) < now) {
    const error = new Error('Quiz schedule has ended');
    error.statusCode = 403;
    error.code = 'QUIZ_EXPIRED';
    throw error;
  }

  // 3. Check access code if required
  if (quiz.accessCode) {
    if (!accessCode || accessCode.trim().toLowerCase() !== quiz.accessCode.trim().toLowerCase()) {
      const error = new Error('Invalid quiz access code');
      error.statusCode = 403;
      error.code = 'INVALID_ACCESS_CODE';
      throw error;
    }
  }

  // 4. Check for existing active attempt (prevent multiple concurrent attempts)
  const existingActive = await prisma.attempt.findFirst({
    where: {
      quizId,
      studentId: user.id,
      status: 'IN_PROGRESS',
    },
  });

  if (existingActive) {
    return getAttemptById(existingActive.id, user);
  }

  // 5. Check max attempts
  const completedAttemptsCount = await prisma.attempt.count({
    where: {
      quizId,
      studentId: user.id,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
    },
  });

  if (completedAttemptsCount >= quiz.maxAttempts && user.role === 'STUDENT') {
    const error = new Error(`You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz`);
    error.statusCode = 403;
    error.code = 'MAX_ATTEMPTS_REACHED';
    throw error;
  }

  // 6. Create new attempt
  const attempt = await prisma.attempt.create({
    data: {
      quizId: quiz.id,
      studentId: user.id,
      status: 'IN_PROGRESS',
    },
  });

  return formatActiveAttempt(attempt, quiz);
}

function formatActiveAttempt(attempt, quiz, savedAnswers = []) {
  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startTime).getTime()) / 1000);
  const totalLimitSeconds = quiz.timeLimitMinutes * 60;
  const remainingSeconds = quiz.timeLimitMinutes > 0 ? Math.max(0, totalLimitSeconds - elapsedSeconds) : null;

  const answerMap = {};
  for (const a of savedAnswers) {
    answerMap[a.questionId] = {
      selectedOptionIds: JSON.parse(a.selectedOptions || '[]'),
      textAnswer: a.textAnswer,
    };
  }

  let questionsList = quiz.quizQuestions.map((qq) => {
    const q = qq.question;
    let opts = q.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      order: opt.order,
    }));

    if (quiz.shuffleOptions) {
      opts = shuffleArray(opts);
    }

    return {
      id: q.id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      points: qq.points,
      options: opts,
      savedAnswer: answerMap[q.id] || null,
    };
  });

  if (quiz.shuffleQuestions) {
    questionsList = shuffleArray(questionsList);
  }

  return {
    attemptId: attempt.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    timeLimitMinutes: quiz.timeLimitMinutes,
    remainingSeconds,
    isTimedOut: remainingSeconds !== null && remainingSeconds <= 0,
    startTime: attempt.startTime,
    totalQuestions: questionsList.length,
    questions: questionsList,
  };
}

export async function getAttemptById(attemptId, user) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          quizQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    error.code = 'ATTEMPT_NOT_FOUND';
    throw error;
  }

  if (attempt.studentId !== user.id && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: Access denied to this attempt');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return getAttemptReview(attemptId, user);
  }

  if (attempt.quiz.timeLimitMinutes > 0) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
    const totalLimitSeconds = attempt.quiz.timeLimitMinutes * 60;
    if (elapsedSeconds >= totalLimitSeconds) {
      return gradeAttempt(attempt.id, null, true);
    }
  }

  return formatActiveAttempt(attempt, attempt.quiz, attempt.answers);
}

export async function saveDraft(attemptId, user, answers) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    error.code = 'ATTEMPT_NOT_FOUND';
    throw error;
  }

  if (attempt.studentId !== user.id) {
    const error = new Error('Forbidden: Cannot save draft for another student');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (attempt.status !== 'IN_PROGRESS') {
    const error = new Error('Cannot save draft for a finished attempt');
    error.statusCode = 400;
    error.code = 'ATTEMPT_ALREADY_FINISHED';
    throw error;
  }

  for (const ans of (answers || [])) {
    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: ans.questionId,
        },
      },
      create: {
        attemptId: attempt.id,
        questionId: ans.questionId,
        selectedOptions: JSON.stringify(ans.selectedOptionIds || []),
        textAnswer: ans.textAnswer || null,
      },
      update: {
        selectedOptions: JSON.stringify(ans.selectedOptionIds || []),
        textAnswer: ans.textAnswer || null,
      },
    });
  }

  return { message: 'Progress saved successfully' };
}

export async function logProctorEvent(attemptId, user, { type, metadata }) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    error.code = 'ATTEMPT_NOT_FOUND';
    throw error;
  }

  if (attempt.studentId !== user.id) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const event = await prisma.proctorEvent.create({
    data: {
      attemptId,
      type,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return event;
}

export async function submitAttempt(attemptId, user, answers = null) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    error.code = 'ATTEMPT_NOT_FOUND';
    throw error;
  }

  if (attempt.studentId !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return gradeAttempt(attemptId, answers, false);
}

export async function getAttemptReview(attemptId, user) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          quizQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
      answers: true,
      proctorEvents: true,
    },
  });

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    error.code = 'ATTEMPT_NOT_FOUND';
    throw error;
  }

  if (attempt.studentId !== user.id && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const answerMap = new Map();
  for (const a of attempt.answers) {
    answerMap.set(a.questionId, a);
  }

  const reviewQuestions = attempt.quiz.quizQuestions.map((qq) => {
    const q = qq.question;
    const ans = answerMap.get(q.id);
    const selectedOptions = ans ? JSON.parse(ans.selectedOptions || '[]') : [];

    return {
      questionId: q.id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      pointsPossible: qq.points,
      pointsAwarded: ans ? ans.pointsAwarded : 0,
      isCorrect: ans ? ans.isCorrect : false,
      studentSelectedOptions: selectedOptions,
      studentTextAnswer: ans ? ans.textAnswer : null,
      explanation: q.explanation,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    };
  });

  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    student: attempt.student,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage: attempt.percentage,
    passPercentage: attempt.quiz.passPercentage,
    isPassed: attempt.isPassed,
    status: attempt.status,
    startTime: attempt.startTime,
    submittedAt: attempt.submittedAt,
    proctorViolationsCount: attempt.proctorEvents.length,
    proctorEvents: attempt.proctorEvents,
    questions: reviewQuestions,
  };
}

export async function getStudentHistory(userId) {
  const attempts = await prisma.attempt.findMany({
    where: {
      studentId: userId,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passPercentage: true,
          timeLimitMinutes: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return attempts.map((a) => ({
    attemptId: a.id,
    quizId: a.quiz.id,
    quizTitle: a.quiz.title,
    score: a.score,
    totalPoints: a.totalPoints,
    percentage: a.percentage,
    passPercentage: a.quiz.passPercentage,
    isPassed: a.isPassed,
    status: a.status,
    submittedAt: a.submittedAt,
  }));
}
