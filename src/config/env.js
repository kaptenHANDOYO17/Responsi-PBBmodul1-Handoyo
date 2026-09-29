/**
 * Konfigurasi terpusat yang dibaca dari environment variables.
 */
const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production' || Boolean(process.env.VERCEL),
  port: Number(process.env.PORT) || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  // Zona waktu untuk menentukan "hari ini" (status Terlambat).
  timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
};
