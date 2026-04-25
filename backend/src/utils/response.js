/**
 * Standardised API response helpers
 */

const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data, message = 'Created') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const tooManyRequests = (res, message = 'Too many requests') => {
  return error(res, message, 429);
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest, tooManyRequests };
