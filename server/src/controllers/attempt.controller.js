const attemptService = require('../services/attempt.service');
const { sendSuccess } = require('../utils/response');

async function startAttempt(req, res, next) {
  try {
    const { accessCode } = req.body || {};
    const result = await attemptService.startAttempt(req.params.quizId, req.user, accessCode);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function getAttemptById(req, res, next) {
  try {
    const result = await attemptService.getAttemptById(req.params.id, req.user);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function saveDraft(req, res, next) {
  try {
    const result = await attemptService.saveDraft(req.params.id, req.user, req.body.answers);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function submitAttempt(req, res, next) {
  try {
    const result = await attemptService.submitAttempt(req.params.id, req.user, req.body?.answers);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function logProctorEvent(req, res, next) {
  try {
    const result = await attemptService.logProctorEvent(req.params.id, req.user, req.body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function getAttemptReview(req, res, next) {
  try {
    const result = await attemptService.getAttemptReview(req.params.id, req.user);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getStudentHistory(req, res, next) {
  try {
    const result = await attemptService.getStudentHistory(req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startAttempt,
  getAttemptById,
  saveDraft,
  submitAttempt,
  logProctorEvent,
  getAttemptReview,
  getStudentHistory,
};
