const { getSupabase } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const { today } = require('../utils/date');

const TABLE = 'loans';
const COLUMNS = 'id, member_id, member_name, book_isbn, book_title, book_author, loan_date, due_date, return_date, status, notes, created_at, updated_at';

/** Menerjemahkan error Supabase/PostgreSQL menjadi ApiError yang mudah dipahami. */
function toApiError(error) {
  const detail = config.isProduction ? undefined : [{ code: error.code, message: error.message, hint: error.hint }];

  switch (error.code) {
    case '23502': // not_null_violation
    case '23514': // check_violation
    case '22P02': // invalid_text_representation
    case '22007': // invalid_datetime_format
    case '22008': // datetime_field_overflow
    case '22001': // string_data_right_truncation
      return new ApiError(400, 'Data ditolak oleh database karena tidak memenuhi aturan tabel.', detail);
    case '42P01': // undefined_table
    case 'PGRST205': // tabel tidak ada di schema cache
      return new ApiError(500, 'Tabel "loans" belum dibuat. Jalankan file database/schema.sql di Supabase SQL Editor.', detail);
    default:
      return new ApiError(500, 'Terjadi kesalahan saat mengakses database.', detail);
  }
}

/** Escape karakter wildcard agar input pengguna dicari apa adanya. */
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Memperbarui status peminjaman yang sudah lewat jatuh tempo
 * dari "Dipinjam" menjadi "Terlambat", sehingga filter status selalu akurat.
 */
async function syncOverdueStatus() {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({ status: 'Terlambat' })
    .eq('status', 'Dipinjam')
    .is('return_date', null)
    .lt('due_date', today());
  if (error) throw toApiError(error);
}

function applyFilters(query, filters) {
  let q = query;
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.member_id) q = q.eq('member_id', filters.member_id);
  if (filters.member_name) q = q.ilike('member_name', `%${escapeLike(filters.member_name)}%`);
  if (filters.book_title) q = q.ilike('book_title', `%${escapeLike(filters.book_title)}%`);
  if (filters.loan_date_from) q = q.gte('loan_date', filters.loan_date_from);
  if (filters.loan_date_to) q = q.lte('loan_date', filters.loan_date_to);
  return q;
}

async function findAll(filters) {
  const supabase = getSupabase();
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;

  let query = applyFilters(supabase.from(TABLE).select(COLUMNS, { count: 'exact' }), filters)
    .order(filters.sort_by, { ascending: filters.order === 'asc' });
  if (filters.sort_by !== 'id') query = query.order('id', { ascending: true });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    // PGRST103: halaman melebihi jumlah data -> kembalikan list kosong.
    if (error.code === 'PGRST103') {
      const countResult = await applyFilters(
        supabase.from(TABLE).select('id', { count: 'exact', head: true }),
        filters
      );
      if (countResult.error) throw toApiError(countResult.error);
      return { rows: [], total: countResult.count || 0 };
    }
    throw toApiError(error);
  }

  return { rows: data || [], total: count || 0 };
}

async function findById(id) {
  const { data, error } = await getSupabase().from(TABLE).select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw toApiError(error);
  return data;
}

async function create(payload) {
  const { data, error } = await getSupabase().from(TABLE).insert(payload).select(COLUMNS).single();
  if (error) throw toApiError(error);
  return data;
}

async function update(id, payload) {
  const { data, error } = await getSupabase().from(TABLE).update(payload).eq('id', id).select(COLUMNS).maybeSingle();
  if (error) throw toApiError(error);
  return data;
}

async function remove(id) {
  const { data, error } = await getSupabase().from(TABLE).delete().eq('id', id).select(COLUMNS).maybeSingle();
  if (error) throw toApiError(error);
  return data;
}

/** Cek koneksi database (dipakai endpoint /health). */
async function ping() {
  const { error } = await getSupabase().from(TABLE).select('id', { count: 'exact', head: true });
  if (error) throw toApiError(error);
}

module.exports = {
  syncOverdueStatus,
  findAll,
  findById,
  create,
  update,
  remove,
  ping,
};
