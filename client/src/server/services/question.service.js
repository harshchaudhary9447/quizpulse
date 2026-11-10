import prisma from '../../lib/prisma';

export async function listQuestions({ search, category, type, difficulty, page = 1, limit = 50 }) {
  const where = {};

  if (search) {
    where.text = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }
  if (type) {
    where.type = type;
  }
  if (difficulty) {
    where.difficulty = difficulty;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.question.count({ where }),
  ]);

  const parsedQuestions = questions.map((q) => ({
    ...q,
    tags: typeof q.tags === 'string' ? JSON.parse(q.tags || '[]') : q.tags,
  }));

  return {
    questions: parsedQuestions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export async function getQuestionById(id) {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: { order: 'asc' },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  return {
    ...question,
    tags: typeof question.tags === 'string' ? JSON.parse(question.tags || '[]') : question.tags,
  };
}

export async function createQuestion(data, userId) {
  const { options = [], tags = [], ...questionData } = data;

  const question = await prisma.question.create({
    data: {
      ...questionData,
      tags: JSON.stringify(tags),
      createdById: userId,
      options: {
        create: options.map((opt, idx) => ({
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
          order: opt.order ?? idx,
        })),
      },
    },
    include: {
      options: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return {
    ...question,
    tags,
  };
}

export async function updateQuestion(id, data, user) {
  const existing = await prisma.question.findUnique({
    where: { id },
    include: { options: true },
  });

  if (!existing) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only edit questions you authored');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const { options, tags, ...questionData } = data;

  const updated = await prisma.$transaction(async (tx) => {
    if (options && options.length > 0) {
      await tx.option.deleteMany({ where: { questionId: id } });
      await tx.option.createMany({
        data: options.map((opt, idx) => ({
          questionId: id,
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
          order: opt.order ?? idx,
        })),
      });
    }

    return tx.question.update({
      where: { id },
      data: {
        ...questionData,
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      },
      include: {
        options: { orderBy: { order: 'asc' } },
      },
    });
  });

  return {
    ...updated,
    tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : updated.tags,
  };
}

export async function deleteQuestion(id, user) {
  const existing = await prisma.question.findUnique({ where: { id } });

  if (!existing) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only delete questions you authored');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  await prisma.question.delete({ where: { id } });
  return { message: 'Question deleted successfully' };
}

export async function getCategories() {
  const questions = await prisma.question.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return questions.map((q) => q.category);
}
