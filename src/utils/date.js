const config = require('../config/env');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Tanggal hari ini (YYYY-MM-DD) sesuai zona waktu aplikasi. */
function today() {
  // Locale en-CA menghasilkan format YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Validasi string tanggal format YYYY-MM-DD dan tanggalnya benar-benar ada. */
function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Selisih hari (b - a) untuk dua tanggal YYYY-MM-DD. */
function diffDays(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY);
}

module.exports = { today, isValidDate, diffDays };
