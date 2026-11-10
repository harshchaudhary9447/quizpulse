const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter limit for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many authentication attempts, please try again later.', 429, 'AUTH_RATE_LIMIT_EXCEEDED');
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
