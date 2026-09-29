const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Middleware penanganan error terpusat.
 * Semua error (termasuk dari handler async) berakhir di sini
 * dan dikembalikan dalam format JSON yang konsisten.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Body JSON rusak / tidak valid
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Format JSON pada body request tidak valid.' });
  }
  // Body terlalu besar
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Ukuran body request terlalu besar.' });
  }

  if (err instanceof ApiError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
    ...(config.isProduction ? {} : { error: err.message }),
  });
}

module.exports = errorHandler;
