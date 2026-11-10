const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // Client discards tokens; could also maintain token blacklist if needed
    return sendSuccess(res, { message: 'Successfully logged out' }, 200);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, { user }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
