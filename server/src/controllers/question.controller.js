const questionService = require('../services/question.service');
const aiService = require('../services/ai.service');
const { sendSuccess } = require('../utils/response');

async function listQuestions(req, res, next) {
  try {
    const { search, category, type, difficulty, page, limit } = req.query;
    const result = await questionService.listQuestions({
      search,
      category,
      type,
      difficulty,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getQuestionById(req, res, next) {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    return sendSuccess(res, question);
  } catch (err) {
    next(err);
  }
}

async function createQuestion(req, res, next) {
  try {
    const question = await questionService.createQuestion(req.body, req.user.id);
    return sendSuccess(res, question, 201);
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
    return sendSuccess(res, question);
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const result = await questionService.deleteQuestion(req.params.id, req.user);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await questionService.getCategories();
    return sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

async function aiGenerate(req, res, next) {
  try {
    const questions = await aiService.generateQuestions(req.body);
    return sendSuccess(res, questions);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getCategories,
  aiGenerate,
};
