import prisma from '../../lib/prisma';

export async function listQuizzes(user, { search, isPublished, page = 1, limit = 20 }) {
  const where = {};
  const isTeacherOrAdmin = user && (user.role === 'TEACHER' || user.role === 'ADMIN');

  if (!isTeacherOrAdmin) {
    where.isPublished = true;
  } else {
    if (user.role === 'TEACHER') {
      where.createdById = user.id;
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true' || isPublished === true;
    }
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            quizQuestions: true,
            attempts: true,
            liveSessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.quiz.count({ where }),
  ]);

  let attemptsByQuiz = {};
  if (user && user.role === 'STUDENT') {
    const studentAttempts = await prisma.attempt.findMany({
      where: {
        studentId: user.id,
        quizId: { in: quizzes.map((q) => q.id) },
      },
      select: {
        quizId: true,
        percentage: true,
        isPassed: true,
        status: true,
      },
    });

    for (const att of studentAttempts) {
      if (!attemptsByQuiz[att.quizId]) {
        attemptsByQuiz[att.quizId] = {
          count: 0,
          highestPercentage: 0,
          passed: false,
          hasActiveAttempt: false,
        };
      }
      attemptsByQuiz[att.quizId].count += 1;
      if (att.percentage > attemptsByQuiz[att.quizId].highestPercentage) {
        attemptsByQuiz[att.quizId].highestPercentage = att.percentage;
      }
      if (att.isPassed) {
        attemptsByQuiz[att.quizId].passed = true;
      }
      if (att.status === 'IN_PROGRESS') {
        attemptsByQuiz[att.quizId].hasActiveAttempt = true;
      }
    }
  }

  const sanitized = quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    timeLimitMinutes: q.timeLimitMinutes,
    passPercentage: q.passPercentage,
    shuffleQuestions: q.shuffleQuestions,
    shuffleOptions: q.shuffleOptions,
    isPublished: q.isPublished,
    requiresAccessCode: Boolean(q.accessCode),
    maxAttempts: q.maxAttempts,
    scheduledStartTime: q.scheduledStartTime,
    scheduledEndTime: q.scheduledEndTime,
    questionCount: q._count.quizQuestions,
    attemptsCount: q._count.attempts || 0,
    liveSessionsCount: q._count.liveSessions || 0,
    totalAttempts: (q._count.attempts || 0) + (q._count.liveSessions || 0),
    createdBy: q.createdBy,
    createdAt: q.createdAt,
    studentStats: user && user.role === 'STUDENT' ? (attemptsByQuiz[q.id] || { count: 0, highestPercentage: 0, passed: false, hasActiveAttempt: false }) : null,
  }));

  return {
    quizzes: sanitized,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export async function getQuizById(id, user) {
  const isTeacherOrAdmin = user && (user.role === 'TEACHER' || user.role === 'ADMIN');

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      quizQuestions: {
        orderBy: { order: 'asc' },
        include: {
          question: {
            include: {
              options: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  text: true,
                  order: true,
                  isCorrect: isTeacherOrAdmin,
                },
              },
            },
          },
        },
      },
      _count: {
        select: { attempts: true },
      },
    },
  });

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (!isTeacherOrAdmin && !quiz.isPublished) {
    const error = new Error('Quiz is not currently available');
    error.statusCode = 403;
    error.code = 'QUIZ_UNAVAILABLE';
    throw error;
  }

  const questions = quiz.quizQuestions.map((qq) => {
    const q = qq.question;
    return {
      id: q.id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      points: qq.points,
      order: qq.order,
      explanation: isTeacherOrAdmin ? q.explanation : null,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
        ...(isTeacherOrAdmin ? { isCorrect: opt.isCorrect } : {}),
      })),
    };
  });

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    passPercentage: quiz.passPercentage,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    isPublished: quiz.isPublished,
    accessCode: isTeacherOrAdmin ? quiz.accessCode : undefined,
    requiresAccessCode: Boolean(quiz.accessCode),
    maxAttempts: quiz.maxAttempts,
    scheduledStartTime: quiz.scheduledStartTime,
    scheduledEndTime: quiz.scheduledEndTime,
    createdBy: quiz.createdBy,
    createdAt: quiz.createdAt,
    questions,
  };
}

export async function createQuiz(data, userId) {
  const { questions, ...quizData } = data;

  const quiz = await prisma.quiz.create({
    data: {
      ...quizData,
      createdById: userId,
      quizQuestions: {
        create: (questions || []).map((q, idx) => ({
          questionId: q.questionId,
          order: q.order ?? idx,
          points: q.points ?? 1.0,
        })),
      },
    },
    include: {
      quizQuestions: {
        include: { question: true },
      },
    },
  });

  return quiz;
}

export async function updateQuiz(id, data, user) {
  const existing = await prisma.quiz.findUnique({ where: { id } });

  if (!existing) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only edit quizzes you created');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const { questions, ...quizData } = data;

  const updated = await prisma.$transaction(async (tx) => {
    if (questions && questions.length > 0) {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });
      await tx.quizQuestion.createMany({
        data: questions.map((q, idx) => ({
          quizId: id,
          questionId: q.questionId,
          order: q.order ?? idx,
          points: q.points ?? 1.0,
        })),
      });
    }

    return tx.quiz.update({
      where: { id },
      data: quizData,
      include: {
        quizQuestions: {
          include: { question: true },
        },
      },
    });
  });

  return updated;
}

export async function deleteQuiz(id, user) {
  const existing = await prisma.quiz.findUnique({ where: { id } });

  if (!existing) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only delete quizzes you created');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  await prisma.quiz.delete({ where: { id } });
  return { message: 'Quiz deleted successfully' };
}

export async function togglePublish(id, user) {
  const existing = await prisma.quiz.findUnique({ where: { id } });

  if (!existing) {
    const error = new Error('Quiz not found');
    error.statusCode = 404;
    error.code = 'QUIZ_NOT_FOUND';
    throw error;
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only modify quizzes you created');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const updated = await prisma.quiz.update({
    where: { id },
    data: { isPublished: !existing.isPublished },
  });

  return updated;
}
