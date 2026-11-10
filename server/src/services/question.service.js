const prisma = require('../config/db');

async function listQuestions({ search, category, type, difficulty, page = 1, limit = 50 }) {
  const where = {};

  if (search) {
    where.text = { contains: search };
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

  const skip = (page - 1) * limit;

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
      take: limit,
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
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getQuestionById(id) {
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

async function createQuestion(data, userId) {
  const { options, tags = [], ...questionData } = data;

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

async function updateQuestion(id, data, user) {
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

  // Allow update if author or admin
  if (existing.createdById !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Forbidden: You can only edit questions you authored');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const { options, tags, ...questionData } = data;

  // Use transaction to update question and recreate options if provided
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

async function deleteQuestion(id, user) {
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

async function getCategories() {
  const questions = await prisma.question.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  return questions.map((q) => q.category);
}

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getCategories,
};
