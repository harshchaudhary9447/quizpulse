function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function sendError(res, message = 'An unexpected error occurred', statusCode = 400, code = 'BAD_REQUEST', details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
