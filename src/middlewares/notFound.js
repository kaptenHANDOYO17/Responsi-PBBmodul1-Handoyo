const ApiError = require('../utils/ApiError');

/** Menangani route yang tidak terdaftar. */
function notFound(req, res, next) {
  next(new ApiError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`));
}

module.exports = notFound;
