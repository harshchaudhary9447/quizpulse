const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/response');

async function getQuizAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getQuizAnalytics(req.params.quizId, req.user);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function exportQuizCsv(req, res, next) {
  try {
    const csvData = await analyticsService.exportQuizCsv(req.params.quizId, req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="quiz-${req.params.quizId}-analytics.csv"`);
    return res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
}

async function getPlatformAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getPlatformAnalytics(req.user);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuizAnalytics,
  exportQuizCsv,
  getPlatformAnalytics,
};
