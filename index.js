/**
 * Entry point aplikasi.
 *
 * - Lokal  : dijalankan dengan `npm run dev` / `npm start`, server listen di PORT.
 * - Vercel : file ini dideteksi otomatis (zero-config Express) dan app
 *            di-export sebagai Vercel Function, sehingga tidak perlu listen.
 */

// Muat variabel dari file .env (hanya ada di lokal; di Vercel pakai Environment Variables).
try {
  process.loadEnvFile();
} catch {
  // .env tidak ditemukan -> abaikan.
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./src/config/env');
const indexRoutes = require('./src/routes/index.routes');
const loanRoutes = require('./src/routes/loan.routes');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.set('json spaces', 2);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '100kb' }));
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

app.use('/', indexRoutes);
app.use('/loans', loanRoutes);

app.use(notFound);
app.use(errorHandler);

if (!process.env.VERCEL && require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server berjalan di http://localhost:${config.port}`);
  });
}

module.exports = app;
