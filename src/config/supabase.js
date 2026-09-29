const { createClient } = require('@supabase/supabase-js');
const config = require('./env');
const ApiError = require('../utils/ApiError');

let client = null;

/**
 * Mengembalikan instance Supabase client (dibuat sekali, lalu dipakai ulang).
 * Dibuat secara lazy agar endpoint `/` dan `/health` tetap bisa diakses
 * walaupun environment variable Supabase belum diatur.
 */
function getSupabase() {
  if (client) return client;

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new ApiError(
      500,
      'Konfigurasi database belum lengkap. Atur SUPABASE_URL dan SUPABASE_KEY pada environment variables.'
    );
  }

  client = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

module.exports = { getSupabase };
