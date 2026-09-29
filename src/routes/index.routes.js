const { Router } = require('express');
const pkg = require('../../package.json');
const loanService = require('../services/loan.service');
const { success } = require('../utils/response');
const { LOAN_STATUS } = require('../validators/loan.validator');

const router = Router();

/** GET / - informasi API */
router.get('/', (req, res) => {
  return success(res, {
    message: 'Selamat datang di REST API Peminjaman Buku Perpustakaan.',
    data: {
      name: 'Library Loan REST API',
      version: pkg.version,
      author: {
        nama: 'Handoyo',
        nim: '21120124120040',
        kelompok: 42,
        shift: 6,
        praktikum: 'PBB',
        program_studi: 'Teknik Komputer',
        universitas: 'Universitas Diponegoro',
      },
      status_values: LOAN_STATUS,
      endpoints: [
        { method: 'GET', path: '/health', description: 'Cek status API dan koneksi database' },
        { method: 'GET', path: '/loans', description: 'Ambil semua data peminjaman (mendukung filter, sorting, pagination)' },
        { method: 'GET', path: '/loans?status=Terlambat', description: 'Contoh filter berdasarkan status' },
        { method: 'GET', path: '/loans/:id', description: 'Ambil detail peminjaman' },
        { method: 'POST', path: '/loans', description: 'Tambah data peminjaman' },
        { method: 'PUT', path: '/loans/:id', description: 'Perbarui seluruh data peminjaman' },
        { method: 'PATCH', path: '/loans/:id', description: 'Perbarui sebagian data peminjaman' },
        { method: 'PATCH', path: '/loans/:id/return', description: 'Catat pengembalian buku' },
        { method: 'DELETE', path: '/loans/:id', description: 'Hapus data peminjaman' },
      ],
      documentation: 'Lihat README.md pada repository GitHub.',
    },
  });
});

/** GET /health - cek API & database */
router.get('/health', async (req, res) => {
  let database = 'connected';
  let databaseMessage;
  try {
    await loanService.ping();
  } catch (err) {
    database = 'disconnected';
    databaseMessage = err.message;
  }

  const healthy = database === 'connected';
  return res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'API dan database berjalan normal.' : 'API berjalan, tetapi database tidak dapat diakses.',
    data: {
      api: 'up',
      database,
      ...(databaseMessage ? { database_message: databaseMessage } : {}),
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
