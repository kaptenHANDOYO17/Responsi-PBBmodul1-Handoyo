/**
 * Format response sukses yang konsisten untuk seluruh endpoint.
 */
function success(res, { statusCode = 200, message = 'Berhasil', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { success };
