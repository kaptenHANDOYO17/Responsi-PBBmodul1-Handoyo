const loanService = require('../services/loan.service');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { today, diffDays, isValidDate } = require('../utils/date');
const {
  validateLoanBody,
  resolveLoan,
  parseId,
  parseListQuery,
} = require('../validators/loan.validator');

const EDITABLE_FIELDS = [
  'member_id',
  'member_name',
  'book_isbn',
  'book_title',
  'book_author',
  'loan_date',
  'due_date',
  'return_date',
  'status',
  'notes',
];

/** Ambil hanya kolom yang boleh disimpan ke database. */
function pickEditable(loan) {
  return Object.fromEntries(EDITABLE_FIELDS.map((key) => [key, loan[key] ?? null]));
}

/** Tambahkan kolom turunan `days_late` (jumlah hari keterlambatan). */
function serialize(loan) {
  const endDate = loan.return_date || today();
  return { ...loan, days_late: Math.max(0, diffDays(loan.due_date, endDate)) };
}

async function getOrFail(id) {
  const loan = await loanService.findById(id);
  if (!loan) throw new ApiError(404, `Data peminjaman dengan id ${id} tidak ditemukan.`);
  return loan;
}

/** GET /loans */
async function list(req, res) {
  const filters = parseListQuery(req.query);
  await loanService.syncOverdueStatus();
  const { rows, total } = await loanService.findAll(filters);

  const appliedFilters = Object.fromEntries(
    ['status', 'member_id', 'member_name', 'book_title', 'loan_date_from', 'loan_date_to']
      .filter((key) => filters[key] !== undefined)
      .map((key) => [key, filters[key]])
  );

  return success(res, {
    message: total > 0 ? 'Data peminjaman berhasil diambil.' : 'Tidak ada data peminjaman yang sesuai.',
    data: rows.map(serialize),
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.ceil(total / filters.limit),
      sort_by: filters.sort_by,
      order: filters.order,
      filters: appliedFilters,
    },
  });
}

/** GET /loans/:id */
async function detail(req, res) {
  const id = parseId(req.params.id);
  await loanService.syncOverdueStatus();
  const loan = await getOrFail(id);
  return success(res, { message: 'Detail peminjaman berhasil diambil.', data: serialize(loan) });
}

/** POST /loans */
async function create(req, res) {
  const body = validateLoanBody(req.body, 'create');
  const draft = {
    book_isbn: null,
    book_author: null,
    return_date: null,
    notes: null,
    loan_date: today(),
    ...body,
  };
  const loan = resolveLoan(draft, body.status);
  const created = await loanService.create(pickEditable(loan));

  res.location(`${req.baseUrl}/${created.id}`);
  return success(res, {
    statusCode: 201,
    message: 'Data peminjaman berhasil ditambahkan.',
    data: serialize(created),
  });
}

/** PUT /loans/:id  (mengganti seluruh data) */
async function replace(req, res) {
  const id = parseId(req.params.id);
  const body = validateLoanBody(req.body, 'replace');
  const draft = {
    book_isbn: null,
    book_author: null,
    return_date: null,
    notes: null,
    ...body,
  };
  const loan = resolveLoan(draft, body.status);
  const updated = await loanService.update(id, pickEditable(loan));
  if (!updated) throw new ApiError(404, `Data peminjaman dengan id ${id} tidak ditemukan.`);

  return success(res, { message: 'Data peminjaman berhasil diperbarui.', data: serialize(updated) });
}

/** PATCH /loans/:id  (mengubah sebagian data) */
async function patch(req, res) {
  const id = parseId(req.params.id);
  const body = validateLoanBody(req.body, 'patch');
  const existing = await getOrFail(id);

  const loan = resolveLoan({ ...existing, ...body }, body.status);
  const updated = await loanService.update(id, pickEditable(loan));
  if (!updated) throw new ApiError(404, `Data peminjaman dengan id ${id} tidak ditemukan.`);

  return success(res, { message: 'Data peminjaman berhasil diperbarui.', data: serialize(updated) });
}

/** PATCH /loans/:id/return  (mencatat pengembalian buku) */
async function markReturned(req, res) {
  const id = parseId(req.params.id);
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const returnDate = body.return_date ?? today();

  if (!isValidDate(returnDate)) {
    throw new ApiError(400, 'Validasi gagal.', [
      { field: 'return_date', message: 'harus berupa tanggal valid dengan format YYYY-MM-DD' },
    ]);
  }

  const existing = await getOrFail(id);
  if (existing.return_date) {
    throw new ApiError(409, `Buku pada peminjaman id ${id} sudah dikembalikan pada ${existing.return_date}.`);
  }

  const loan = resolveLoan({ ...existing, return_date: returnDate }, 'Dikembalikan');
  const updated = await loanService.update(id, pickEditable(loan));
  const result = serialize(updated);

  return success(res, {
    message: result.days_late > 0
      ? `Buku berhasil dikembalikan (terlambat ${result.days_late} hari).`
      : 'Buku berhasil dikembalikan tepat waktu.',
    data: result,
  });
}

/** DELETE /loans/:id */
async function destroy(req, res) {
  const id = parseId(req.params.id);
  const deleted = await loanService.remove(id);
  if (!deleted) throw new ApiError(404, `Data peminjaman dengan id ${id} tidak ditemukan.`);

  return success(res, { message: 'Data peminjaman berhasil dihapus.', data: serialize(deleted) });
}

module.exports = {
  list,
  detail,
  create,
  replace,
  patch,
  markReturned,
  destroy,
};
