const ApiError = require('../utils/ApiError');
const { isValidDate, today } = require('../utils/date');

const LOAN_STATUS = Object.freeze(['Dipinjam', 'Dikembalikan', 'Terlambat']);

const SORTABLE_FIELDS = Object.freeze([
  'id',
  'member_id',
  'member_name',
  'book_title',
  'loan_date',
  'due_date',
  'return_date',
  'status',
  'created_at',
  'updated_at',
]);

/**
 * Aturan setiap kolom yang boleh dikirim client.
 * required  : wajib pada POST dan PUT
 * nullable  : boleh bernilai null (untuk mengosongkan kolom)
 */
const FIELD_RULES = Object.freeze({
  member_id: { type: 'string', max: 20, required: true },
  member_name: { type: 'string', max: 100, required: true },
  book_isbn: { type: 'string', max: 20, nullable: true, pattern: /^[0-9Xx-]{10,17}$/, patternMessage: 'harus berupa ISBN-10/ISBN-13 (angka, boleh memakai tanda "-")' },
  book_title: { type: 'string', max: 200, required: true },
  book_author: { type: 'string', max: 100, nullable: true },
  loan_date: { type: 'date', requiredOnPut: true },
  due_date: { type: 'date', required: true },
  return_date: { type: 'date', nullable: true },
  status: { type: 'status' },
  notes: { type: 'string', max: 500, nullable: true },
});

/** Mengubah "terlambat" / "TERLAMBAT" menjadi "Terlambat". Mengembalikan null jika tidak valid. */
function normalizeStatus(value) {
  if (typeof value !== 'string') return null;
  const match = LOAN_STATUS.find((s) => s.toLowerCase() === value.trim().toLowerCase());
  return match || null;
}

/**
 * Validasi & bersihkan body request.
 * @param {object} body
 * @param {'create'|'replace'|'patch'} mode
 * @returns {object} data yang sudah bersih
 */
function validateLoanBody(body, mode) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Body request harus berupa objek JSON.');
  }

  const errors = [];
  const data = {};

  const unknown = Object.keys(body).filter((key) => !(key in FIELD_RULES));
  if (unknown.length > 0) {
    errors.push({
      field: unknown.join(', '),
      message: `Kolom tidak dikenal. Kolom yang diizinkan: ${Object.keys(FIELD_RULES).join(', ')}`,
    });
  }

  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    const present = Object.prototype.hasOwnProperty.call(body, field);
    let value = body[field];

    const isRequired = (mode !== 'patch' && rule.required) || (mode === 'replace' && rule.requiredOnPut);

    if (!present || value === undefined) {
      if (isRequired) errors.push({ field, message: 'wajib diisi' });
      continue;
    }

    if (value === null) {
      if (rule.nullable) {
        data[field] = null;
      } else {
        errors.push({ field, message: 'tidak boleh null' });
      }
      continue;
    }

    if (rule.type === 'string') {
      if (typeof value !== 'string') {
        errors.push({ field, message: 'harus berupa teks' });
        continue;
      }
      value = value.trim();
      if (value.length === 0) {
        if (rule.nullable) {
          data[field] = null;
        } else {
          errors.push({ field, message: 'tidak boleh kosong' });
        }
        continue;
      }
      if (value.length > rule.max) {
        errors.push({ field, message: `maksimal ${rule.max} karakter` });
        continue;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({ field, message: rule.patternMessage });
        continue;
      }
      data[field] = value;
    } else if (rule.type === 'date') {
      if (!isValidDate(value)) {
        errors.push({ field, message: 'harus berupa tanggal valid dengan format YYYY-MM-DD' });
        continue;
      }
      data[field] = value;
    } else if (rule.type === 'status') {
      const status = normalizeStatus(value);
      if (!status) {
        errors.push({ field, message: `harus salah satu dari: ${LOAN_STATUS.join(', ')}` });
        continue;
      }
      data[field] = status;
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validasi gagal. Periksa kembali data yang dikirim.', errors);
  }

  if (mode === 'patch' && Object.keys(data).length === 0) {
    throw new ApiError(400, 'Tidak ada data yang diubah. Kirim minimal satu kolom.');
  }

  return data;
}

/**
 * Validasi antar-kolom dan menentukan status akhir.
 * Status mengikuti tanggal:
 *   - return_date terisi                 -> Dikembalikan
 *   - belum kembali & due_date < hari ini -> Terlambat
 *   - selain itu                          -> Dipinjam
 * Jika client mengirim status "Dikembalikan" tanpa return_date,
 * return_date otomatis diisi tanggal hari ini.
 *
 * @param {object} loan data peminjaman lengkap (hasil gabungan data lama + baru)
 * @param {string|undefined} requestedStatus status yang dikirim client (opsional)
 * @returns {object} loan dengan status final
 */
function resolveLoan(loan, requestedStatus) {
  const result = { ...loan };
  const errors = [];

  if (requestedStatus === 'Dikembalikan' && !result.return_date) {
    result.return_date = today();
  }

  if (result.due_date < result.loan_date) {
    errors.push({ field: 'due_date', message: 'tidak boleh lebih awal dari loan_date' });
  }
  if (result.return_date && result.return_date < result.loan_date) {
    errors.push({ field: 'return_date', message: 'tidak boleh lebih awal dari loan_date' });
  }

  let expected;
  if (result.return_date) expected = 'Dikembalikan';
  else if (result.due_date < today()) expected = 'Terlambat';
  else expected = 'Dipinjam';

  if (requestedStatus && requestedStatus !== expected) {
    errors.push({
      field: 'status',
      message: `status "${requestedStatus}" tidak sesuai dengan data tanggal (seharusnya "${expected}"). `
        + 'Status ditentukan dari return_date dan due_date.',
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validasi gagal. Periksa kembali data yang dikirim.', errors);
  }

  result.status = expected;
  return result;
}

/** Validasi parameter :id */
function parseId(raw) {
  const id = Number(raw);
  if (!/^\d+$/.test(String(raw)) || !Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(400, 'Parameter id harus berupa bilangan bulat positif.');
  }
  return id;
}

/** Validasi & normalisasi query string untuk GET /loans */
function parseListQuery(query) {
  const errors = [];
  const result = {
    status: undefined,
    member_id: undefined,
    member_name: undefined,
    book_title: undefined,
    loan_date_from: undefined,
    loan_date_to: undefined,
    sort_by: 'id',
    order: 'asc',
    page: 1,
    limit: 10,
  };

  const single = (key) => {
    const value = query[key];
    if (value === undefined || value === '') return undefined;
    if (Array.isArray(value) || typeof value !== 'string') {
      errors.push({ field: key, message: 'hanya boleh dikirim satu kali' });
      return undefined;
    }
    return value.trim();
  };

  const status = single('status');
  if (status !== undefined) {
    result.status = normalizeStatus(status);
    if (!result.status) errors.push({ field: 'status', message: `harus salah satu dari: ${LOAN_STATUS.join(', ')}` });
  }

  for (const key of ['member_id', 'member_name', 'book_title']) {
    const value = single(key);
    if (value !== undefined) {
      if (value.length > 200) errors.push({ field: key, message: 'terlalu panjang' });
      else result[key] = value;
    }
  }

  for (const key of ['loan_date_from', 'loan_date_to']) {
    const value = single(key);
    if (value !== undefined) {
      if (!isValidDate(value)) errors.push({ field: key, message: 'harus berformat YYYY-MM-DD' });
      else result[key] = value;
    }
  }

  const sortBy = single('sort_by');
  if (sortBy !== undefined) {
    if (!SORTABLE_FIELDS.includes(sortBy)) errors.push({ field: 'sort_by', message: `harus salah satu dari: ${SORTABLE_FIELDS.join(', ')}` });
    else result.sort_by = sortBy;
  }

  const order = single('order');
  if (order !== undefined) {
    if (!['asc', 'desc'].includes(order.toLowerCase())) errors.push({ field: 'order', message: 'harus "asc" atau "desc"' });
    else result.order = order.toLowerCase();
  }

  const page = single('page');
  if (page !== undefined) {
    if (!/^\d+$/.test(page) || Number(page) < 1) errors.push({ field: 'page', message: 'harus bilangan bulat >= 1' });
    else result.page = Number(page);
  }

  const limit = single('limit');
  if (limit !== undefined) {
    if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100) errors.push({ field: 'limit', message: 'harus bilangan bulat antara 1 sampai 100' });
    else result.limit = Number(limit);
  }

  if (result.loan_date_from && result.loan_date_to && result.loan_date_from > result.loan_date_to) {
    errors.push({ field: 'loan_date_from', message: 'tidak boleh lebih besar dari loan_date_to' });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Parameter query tidak valid.', errors);
  }
  return result;
}

module.exports = {
  LOAN_STATUS,
  SORTABLE_FIELDS,
  validateLoanBody,
  resolveLoan,
  parseId,
  parseListQuery,
};
