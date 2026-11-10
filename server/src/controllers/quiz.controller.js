const quizService = require('../services/quiz.service');
const { sendSuccess } = require('../utils/response');

async function listQuizzes(req, res, next) {
  try {
    const { search, isPublished, page, limit } = req.query;
    const result = await quizService.listQuizzes(req.user, {
      search,
      isPublished,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getQuizById(req, res, next) {
  try {
    const quiz = await quizService.getQuizById(req.params.id, req.user);
    return sendSuccess(res, quiz);
  } catch (err) {
    next(err);
  }
}

async function createQuiz(req, res, next) {
  try {
    const quiz = await quizService.createQuiz(req.body, req.user.id);
    return sendSuccess(res, quiz, 201);
  } catch (err) {
    next(err);
  }
}

async function updateQuiz(req, res, next) {
  try {
    const quiz = await quizService.updateQuiz(req.params.id, req.body, req.user);
    return sendSuccess(res, quiz);
  } catch (err) {
    next(err);
  }
}

async function deleteQuiz(req, res, next) {
  try {
    const result = await quizService.deleteQuiz(req.params.id, req.user);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function togglePublish(req, res, next) {
  try {
    const quiz = await quizService.togglePublish(req.params.id, req.user);
    return sendSuccess(res, quiz);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublish,
};
