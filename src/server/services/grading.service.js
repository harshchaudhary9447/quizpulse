import prisma from '../../lib/prisma';

export function evaluateQuestion(question, studentAnswer, maxPoints = 1.0) {
  const { type, options, explanation } = question;
  const correctOptions = options.filter((o) => o.isCorrect);
  const correctOptionIds = correctOptions.map((o) => o.id);

  let isCorrect = false;
  const selectedOptionIds = studentAnswer?.selectedOptionIds || [];
  const textAnswer = (studentAnswer?.textAnswer || '').trim().toLowerCase();

  switch (type) {
    case 'SINGLE_CHOICE':
    case 'TRUE_FALSE': {
      if (selectedOptionIds.length === 1 && correctOptionIds.length === 1) {
        isCorrect = selectedOptionIds[0] === correctOptionIds[0];
      }
      break;
    }

    case 'MULTI_SELECT': {
      const selectedSet = new Set(selectedOptionIds);
      const correctSet = new Set(correctOptionIds);

      if (selectedSet.size === correctSet.size) {
        isCorrect = [...correctSet].every((id) => selectedSet.has(id));
      }
      break;
    }

    case 'SHORT_ANSWER': {
      const acceptedAnswers = options.map((o) => o.text.trim().toLowerCase());
      isCorrect = acceptedAnswers.some((ans) => ans === textAnswer);
      break;
    }

    default:
      isCorrect = false;
  }

  const pointsAwarded = isCorrect ? maxPoints : 0;

  return {
    isCorrect,
    pointsAwarded,
    correctOptionIds,
    explanation,
  };
}

export async function gradeAttempt(attemptId, submittedAnswers = null, isTimeout = false) {
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
                  options: true,
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

  if (attempt.status !== 'IN_PROGRESS') {
    const error = new Error('Attempt has already been finalized and graded');
    error.statusCode = 400;
    error.code = 'ATTEMPT_ALREADY_SUBMITTED';
    throw error;
  }

  const answerMap = new Map();

  for (const a of attempt.answers) {
    answerMap.set(a.questionId, {
      selectedOptionIds: JSON.parse(a.selectedOptions || '[]'),
      textAnswer: a.textAnswer,
    });
  }

  if (submittedAnswers && Array.isArray(submittedAnswers)) {
    for (const a of submittedAnswers) {
      answerMap.set(a.questionId, {
        selectedOptionIds: a.selectedOptionIds || [],
        textAnswer: a.textAnswer || null,
      });
    }
  }

  let totalScore = 0;
  let totalMaxPoints = 0;
  const gradedQuestionsReview = [];

  await prisma.$transaction(async (tx) => {
    for (const qq of attempt.quiz.quizQuestions) {
      const question = qq.question;
      const points = qq.points || 1.0;
      totalMaxPoints += points;

      const studentAns = answerMap.get(question.id) || { selectedOptionIds: [], textAnswer: null };
      const evaluation = evaluateQuestion(question, studentAns, points);

      totalScore += evaluation.pointsAwarded;

      await tx.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: question.id,
          },
        },
        create: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptions: JSON.stringify(studentAns.selectedOptionIds),
          textAnswer: studentAns.textAnswer,
          isCorrect: evaluation.isCorrect,
          pointsAwarded: evaluation.pointsAwarded,
        },
        update: {
          selectedOptions: JSON.stringify(studentAns.selectedOptionIds),
          textAnswer: studentAns.textAnswer,
          isCorrect: evaluation.isCorrect,
          pointsAwarded: evaluation.pointsAwarded,
        },
      });

      gradedQuestionsReview.push({
        questionId: question.id,
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
        category: question.category,
        pointsPossible: points,
        pointsAwarded: evaluation.pointsAwarded,
        isCorrect: evaluation.isCorrect,
        studentSelectedOptions: studentAns.selectedOptionIds,
        studentTextAnswer: studentAns.textAnswer,
        correctOptionIds: evaluation.correctOptionIds,
        explanation: evaluation.explanation,
        options: question.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    const percentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;
    const isPassed = percentage >= attempt.quiz.passPercentage;
    const finalStatus = isTimeout ? 'TIMED_OUT' : 'SUBMITTED';

    await tx.attempt.update({
      where: { id: attempt.id },
      data: {
        score: totalScore,
        totalPoints: totalMaxPoints,
        percentage: Math.round(percentage * 10) / 10,
        isPassed,
        status: finalStatus,
        submittedAt: new Date(),
      },
    });
  });

  const percentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;

  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    score: totalScore,
    totalPoints: totalMaxPoints,
    percentage: Math.round(percentage * 10) / 10,
    isPassed: percentage >= attempt.quiz.passPercentage,
    passPercentage: attempt.quiz.passPercentage,
    status: isTimeout ? 'TIMED_OUT' : 'SUBMITTED',
    submittedAt: new Date(),
    review: gradedQuestionsReview,
  };
}
