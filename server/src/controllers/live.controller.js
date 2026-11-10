const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

function generateJoinCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createLiveSession(req, res, next) {
  try {
    const { quizId } = req.body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        quizQuestions: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return sendError(res, 'Quiz not found', 404, 'QUIZ_NOT_FOUND');
    }

    if (quiz.quizQuestions.length === 0) {
      return sendError(res, 'Quiz has no questions', 400, 'EMPTY_QUIZ');
    }

    // Generate unique 6-digit code
    let joinCode = generateJoinCode();
    let exists = await prisma.liveSession.findUnique({ where: { joinCode } });
    while (exists) {
      joinCode = generateJoinCode();
      exists = await prisma.liveSession.findUnique({ where: { joinCode } });
    }

    const session = await prisma.liveSession.create({
      data: {
        quizId: quiz.id,
        hostId: req.user.id,
        joinCode,
        status: 'WAITING',
      },
      include: {
        quiz: {
          select: { id: true, title: true },
        },
      },
    });

    return sendSuccess(res, session, 201);
  } catch (err) {
    next(err);
  }
}

async function getSessionByCode(req, res, next) {
  try {
    const { joinCode } = req.params;

    const session = await prisma.liveSession.findUnique({
      where: { joinCode },
      include: {
        quiz: {
          select: { id: true, title: true, description: true },
        },
        host: {
          select: { id: true, name: true },
        },
      },
    });

    if (!session) {
      return sendError(res, 'Live session not found. Please verify the 6-digit PIN.', 404, 'SESSION_NOT_FOUND');
    }

    return sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLiveSession,
  getSessionByCode,
};
