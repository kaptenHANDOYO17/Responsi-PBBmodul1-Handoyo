/**
 * Error dengan HTTP status code, ditangani oleh middleware errorHandler.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = ApiError;
