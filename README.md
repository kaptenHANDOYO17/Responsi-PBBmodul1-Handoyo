# 📚 Library Loan REST API

REST API sederhana untuk **layanan pencatatan peminjaman buku perpustakaan**, dibangun dengan **Node.js**, **Express.js**, dan **Supabase (PostgreSQL)**, serta di-deploy ke **Vercel**.

![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.12-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

> 🌐 **Base URL Deployment:** https://responsi-pb-bmodul1-handoyo.vercel.app/

---

## 👤 Identitas

| Keterangan    | Data                                   |
| ------------- | -------------------------------------- |
| Nama          | Handoyo                                |
| NIM           | 21120124120040                         |
| Kelompok      | 42                                     |
| Shift         | 6                                      |
| Praktikum     | PBB — Responsi Modul 1                 |
| Program Studi | Teknik Komputer                        |
| Universitas   | Universitas Diponegoro                 |

---

## 📑 Daftar Isi

1. [Deskripsi & Tujuan Proyek](#-deskripsi--tujuan-proyek)
2. [Fitur](#-fitur)
3. [Teknologi](#-teknologi)
4. [Struktur Folder](#-struktur-folder)
5. [Struktur Data / Schema](#-struktur-data--schema)
6. [Daftar Endpoint](#-daftar-endpoint)
7. [Contoh Request & Response](#-contoh-request--response)
8. [Format Error](#-format-error)
9. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
10. [Deployment ke Vercel](#-deployment-ke-vercel)
11. [Link Deployment](#-link-deployment)

---

## 📖 Deskripsi & Tujuan Proyek

**Library Loan REST API** adalah layanan backend untuk mencatat transaksi peminjaman buku oleh anggota perpustakaan. Setiap transaksi menyimpan data anggota, data buku, tanggal pinjam, tanggal jatuh tempo, tanggal pengembalian, dan status peminjaman.

**Tujuan proyek:**

- Menerapkan konsep **REST API** dengan operasi **CRUD** (Create, Read, Update, Delete) menggunakan Express.js.
- Mengintegrasikan backend dengan database cloud **Supabase** (PostgreSQL).
- Menyediakan **filter query** agar data dapat dicari secara spesifik, misalnya `GET /loans?status=Terlambat`.
- Menerapkan validasi input, penanganan error yang konsisten, dan format response JSON yang seragam.
- Melakukan **deployment** ke **Vercel** sehingga API dapat diakses secara publik.

---

## ✨ Fitur

- **CRUD lengkap** data peminjaman buku (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- **Filter query**: `status`, `member_id`, `member_name`, `book_title`, rentang `loan_date`.
- **Sorting** (`sort_by`, `order`) dan **pagination** (`page`, `limit`) dengan metadata.
- **Status otomatis** berdasarkan tanggal:
  - `Dikembalikan` → jika `return_date` terisi,
  - `Terlambat` → jika belum dikembalikan dan `due_date` sudah lewat,
  - `Dipinjam` → selain kondisi di atas.
  Status `Dipinjam` yang sudah melewati jatuh tempo diperbarui menjadi `Terlambat` setiap kali data dibaca, sehingga filter `?status=Terlambat` selalu akurat.
- **Endpoint khusus pengembalian buku** (`PATCH /loans/:id/return`).
- Kolom turunan **`days_late`** (jumlah hari keterlambatan) pada setiap response.
- **Validasi input** (kolom wajib, format tanggal `YYYY-MM-DD`, ISBN, panjang teks, kolom tak dikenal, konsistensi tanggal & status).
- **Error handling terpusat** dengan response JSON yang konsisten.
- **Health check** (`GET /health`) untuk memeriksa koneksi database.
- Keamanan dasar: `helmet`, `cors`, Row Level Security aktif di Supabase, secret key hanya di environment variable.

---

## 🛠 Teknologi

| Kategori  | Teknologi                                            |
| --------- | ---------------------------------------------------- |
| Runtime   | Node.js ≥ 20.12                                      |
| Framework | Express.js 5                                         |
| Database  | Supabase (PostgreSQL) via `@supabase/supabase-js`    |
| Middleware| helmet, cors, morgan                                 |
| Deployment| Vercel (zero-configuration Express)                  |

---

## 📂 Struktur Folder

```
responsi-pbb-perpustakaan-api/
├── database/
│   └── schema.sql              # DDL tabel, index, trigger, RLS, dan data contoh
├── src/
│   ├── config/
│   │   ├── env.js              # Konfigurasi dari environment variables
│   │   └── supabase.js         # Inisialisasi Supabase client
│   ├── controllers/
│   │   └── loan.controller.js  # Logika request/response endpoint /loans
│   ├── middlewares/
│   │   ├── errorHandler.js     # Penanganan error terpusat
│   │   └── notFound.js         # Handler 404
│   ├── routes/
│   │   ├── index.routes.js     # Route / dan /health
│   │   └── loan.routes.js      # Route /loans
│   ├── services/
│   │   └── loan.service.js     # Akses database (query Supabase)
│   ├── utils/
│   │   ├── ApiError.js         # Class error dengan HTTP status
│   │   ├── date.js             # Helper tanggal (zona waktu Asia/Jakarta)
│   │   └── response.js         # Format response sukses
│   └── validators/
│       └── loan.validator.js   # Validasi body, query, dan aturan status
├── .env.example                # Contoh environment variables
├── .gitignore
├── index.js                    # Entry point (lokal & Vercel)
├── LICENSE
├── package.json
├── README.md
└── requests.http               # Koleksi request untuk ekstensi REST Client
```

Arsitektur berlapis: **routes → controllers → validators/services → Supabase**.

---

## 🗄 Struktur Data / Schema

Tabel: **`loans`** (lihat lengkapnya di [`database/schema.sql`](database/schema.sql))

| Kolom         | Tipe           | Wajib | Keterangan                                                        |
| ------------- | -------------- | :---: | ----------------------------------------------------------------- |
| `id`          | `bigint`       | auto  | Primary key, identity (auto increment)                            |
| `member_id`   | `varchar(20)`  |  ✅   | Nomor anggota perpustakaan, contoh `AGT-001`                      |
| `member_name` | `varchar(100)` |  ✅   | Nama anggota                                                      |
| `book_isbn`   | `varchar(20)`  |   –   | ISBN-10 / ISBN-13 buku                                            |
| `book_title`  | `varchar(200)` |  ✅   | Judul buku                                                        |
| `book_author` | `varchar(100)` |   –   | Penulis buku                                                      |
| `loan_date`   | `date`         |   –   | Tanggal pinjam (default: hari ini)                                |
| `due_date`    | `date`         |  ✅   | Tanggal jatuh tempo, harus ≥ `loan_date`                          |
| `return_date` | `date`         |   –   | Tanggal kembali, `null` = belum dikembalikan                      |
| `status`      | `varchar(20)`  | auto  | `Dipinjam` \| `Dikembalikan` \| `Terlambat` (ditentukan otomatis) |
| `notes`       | `text`         |   –   | Catatan tambahan (maks. 500 karakter)                             |
| `created_at`  | `timestamptz`  | auto  | Waktu data dibuat                                                 |
| `updated_at`  | `timestamptz`  | auto  | Waktu data terakhir diubah (trigger)                              |

**Constraint di database:**

- `status` hanya boleh `Dipinjam`, `Dikembalikan`, atau `Terlambat`.
- `due_date >= loan_date` dan `return_date >= loan_date`.
- `status = 'Dikembalikan'` **jika dan hanya jika** `return_date` terisi.

**Contoh objek (response API):**

```json
{
  "id": 1,
  "member_id": "AGT-001",
  "member_name": "Budi Santoso",
  "book_isbn": "978-602-03-3295-6",
  "book_title": "Laskar Pelangi",
  "book_author": "Andrea Hirata",
  "loan_date": "2026-09-26",
  "due_date": "2026-10-10",
  "return_date": null,
  "status": "Dipinjam",
  "notes": null,
  "created_at": "2026-09-29T03:10:11.577+00:00",
  "updated_at": "2026-09-29T03:10:11.577+00:00",
  "days_late": 0
}
```

> `days_late` adalah kolom turunan (tidak disimpan di database): jumlah hari keterlambatan dihitung dari `due_date` sampai `return_date` (atau hari ini jika belum kembali).

---

## 🔗 Daftar Endpoint

| Method   | Endpoint             | Deskripsi                                         |
| -------- | -------------------- | ------------------------------------------------- |
| `GET`    | `/`                  | Informasi API & daftar endpoint                   |
| `GET`    | `/health`            | Cek status API dan koneksi database               |
| `GET`    | `/loans`             | Ambil semua peminjaman (filter, sort, pagination) |
| `GET`    | `/loans/:id`         | Ambil detail peminjaman berdasarkan id            |
| `POST`   | `/loans`             | Tambah peminjaman baru                            |
| `PUT`    | `/loans/:id`         | Perbarui **seluruh** data peminjaman              |
| `PATCH`  | `/loans/:id`         | Perbarui **sebagian** data peminjaman             |
| `PATCH`  | `/loans/:id/return`  | Catat pengembalian buku                           |
| `DELETE` | `/loans/:id`         | Hapus data peminjaman                             |

### Query Parameter `GET /loans`

| Parameter        | Contoh                    | Keterangan                                                    |
| ---------------- | ------------------------- | ------------------------------------------------------------- |
| `status`         | `Terlambat`               | `Dipinjam` / `Dikembalikan` / `Terlambat` (tidak case-sensitive) |
| `member_id`      | `AGT-001`                 | Pencocokan persis nomor anggota                               |
| `member_name`    | `budi`                    | Pencarian sebagian nama (tidak case-sensitive)                |
| `book_title`     | `laskar`                  | Pencarian sebagian judul buku (tidak case-sensitive)          |
| `loan_date_from` | `2026-09-01`              | Tanggal pinjam mulai (inklusif)                               |
| `loan_date_to`   | `2026-09-30`              | Tanggal pinjam sampai (inklusif)                              |
| `sort_by`        | `due_date`                | `id`, `member_id`, `member_name`, `book_title`, `loan_date`, `due_date`, `return_date`, `status`, `created_at`, `updated_at` (default `id`) |
| `order`          | `desc`                    | `asc` (default) / `desc`                                      |
| `page`           | `1`                       | Halaman, default `1`                                          |
| `limit`          | `10`                      | Jumlah data per halaman, `1`–`100`, default `10`              |

Semua parameter dapat dikombinasikan, contoh:
`GET /loans?status=Dipinjam&member_name=budi&sort_by=due_date&order=asc&page=1&limit=5`

---

## 🧪 Contoh Request & Response

> Ganti `BASE_URL` dengan `http://localhost:3000` (lokal) atau URL Vercel.
> Pengguna Windows PowerShell: gunakan `curl.exe` (bukan `curl`). Alternatif lain: Postman, Thunder Client, atau file [`requests.http`](requests.http) dengan ekstensi VS Code **REST Client**.

### 1. Ambil semua peminjaman — `GET /loans`

```bash
curl BASE_URL/loans
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Data peminjaman berhasil diambil.",
  "data": [
    {
      "id": 1,
      "member_id": "AGT-001",
      "member_name": "Budi Santoso",
      "book_isbn": "978-602-03-3295-6",
      "book_title": "Laskar Pelangi",
      "book_author": "Andrea Hirata",
      "loan_date": "2026-09-26",
      "due_date": "2026-10-10",
      "return_date": null,
      "status": "Dipinjam",
      "notes": null,
      "created_at": "2026-09-29T03:10:11.577+00:00",
      "updated_at": "2026-09-29T03:10:11.577+00:00",
      "days_late": 0
    }
  ],
  "meta": {
    "total": 6,
    "page": 1,
    "limit": 10,
    "total_pages": 1,
    "sort_by": "id",
    "order": "asc",
    "filters": {}
  }
}
```

### 2. Filter berdasarkan status — `GET /loans?status=Terlambat`

```bash
curl "BASE_URL/loans?status=Terlambat"
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Data peminjaman berhasil diambil.",
  "data": [
    {
      "id": 2,
      "member_id": "AGT-002",
      "member_name": "Siti Rahmawati",
      "book_isbn": "978-979-22-4861-6",
      "book_title": "Bumi Manusia",
      "book_author": "Pramoedya Ananta Toer",
      "loan_date": "2026-09-09",
      "due_date": "2026-09-23",
      "return_date": null,
      "status": "Terlambat",
      "notes": "Sudah dihubungi via WhatsApp",
      "created_at": "2026-09-29T03:10:11.577+00:00",
      "updated_at": "2026-09-29T03:10:11.577+00:00",
      "days_late": 6
    },
    {
      "id": 5,
      "member_id": "AGT-004",
      "member_name": "Dewi Lestari",
      "book_isbn": "978-0-13-468599-1",
      "book_title": "Computer Networking: A Top-Down Approach",
      "book_author": "James F. Kurose",
      "loan_date": "2026-09-13",
      "due_date": "2026-09-27",
      "return_date": null,
      "status": "Terlambat",
      "notes": null,
      "created_at": "2026-09-29T03:10:11.577+00:00",
      "updated_at": "2026-09-29T03:10:11.577+00:00",
      "days_late": 2
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "total_pages": 1,
    "sort_by": "id",
    "order": "asc",
    "filters": { "status": "Terlambat" }
  }
}
```

### 3. Detail peminjaman — `GET /loans/:id`

```bash
curl BASE_URL/loans/1
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Detail peminjaman berhasil diambil.",
  "data": {
    "id": 1,
    "member_id": "AGT-001",
    "member_name": "Budi Santoso",
    "book_title": "Laskar Pelangi",
    "loan_date": "2026-09-26",
    "due_date": "2026-10-10",
    "return_date": null,
    "status": "Dipinjam",
    "days_late": 0
  }
}
```

*(beberapa kolom disingkat pada contoh ini)*

### 4. Tambah peminjaman — `POST /loans`

```bash
curl -X POST BASE_URL/loans \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "AGT-006",
    "member_name": "Handoyo",
    "book_isbn": "978-0-596-51774-8",
    "book_title": "JavaScript: The Good Parts",
    "book_author": "Douglas Crockford",
    "loan_date": "2026-09-29",
    "due_date": "2026-10-13",
    "notes": "Referensi praktikum PBB"
  }'
```

| Kolom body    | Wajib | Keterangan                                        |
| ------------- | :---: | ------------------------------------------------- |
| `member_id`   |  ✅   | teks, maks. 20 karakter                           |
| `member_name` |  ✅   | teks, maks. 100 karakter                          |
| `book_title`  |  ✅   | teks, maks. 200 karakter                          |
| `due_date`    |  ✅   | `YYYY-MM-DD`, ≥ `loan_date`                       |
| `loan_date`   |   –   | `YYYY-MM-DD`, default hari ini                    |
| `book_isbn`   |   –   | ISBN-10/13                                        |
| `book_author` |   –   | teks, maks. 100 karakter                          |
| `return_date` |   –   | `YYYY-MM-DD` atau `null`                          |
| `status`      |   –   | opsional; jika dikirim harus sesuai dengan tanggal |
| `notes`       |   –   | teks, maks. 500 karakter                          |

**Response `201 Created`** (header `Location: /loans/7`)

```json
{
  "success": true,
  "message": "Data peminjaman berhasil ditambahkan.",
  "data": {
    "id": 7,
    "member_id": "AGT-006",
    "member_name": "Handoyo",
    "book_isbn": "978-0-596-51774-8",
    "book_title": "JavaScript: The Good Parts",
    "book_author": "Douglas Crockford",
    "loan_date": "2026-09-29",
    "due_date": "2026-10-13",
    "return_date": null,
    "status": "Dipinjam",
    "notes": "Referensi praktikum PBB",
    "created_at": "2026-09-29T03:16:11.577+00:00",
    "updated_at": "2026-09-29T03:16:11.577+00:00",
    "days_late": 0
  }
}
```

### 5. Perbarui seluruh data — `PUT /loans/:id`

Semua kolom wajib (`member_id`, `member_name`, `book_title`, `loan_date`, `due_date`) harus dikirim. Kolom opsional yang tidak dikirim akan dikosongkan (`null`).

```bash
curl -X PUT BASE_URL/loans/1 \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "AGT-001",
    "member_name": "Budi Santoso",
    "book_isbn": "978-602-03-3295-6",
    "book_title": "Laskar Pelangi (Edisi Revisi)",
    "book_author": "Andrea Hirata",
    "loan_date": "2026-09-26",
    "due_date": "2026-10-17",
    "notes": "Perpanjangan masa pinjam"
  }'
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Data peminjaman berhasil diperbarui.",
  "data": {
    "id": 1,
    "book_title": "Laskar Pelangi (Edisi Revisi)",
    "due_date": "2026-10-17",
    "status": "Dipinjam",
    "notes": "Perpanjangan masa pinjam",
    "days_late": 0
  }
}
```

*(beberapa kolom disingkat pada contoh ini)*

### 6. Perbarui sebagian data — `PATCH /loans/:id`

```bash
curl -X PATCH BASE_URL/loans/1 \
  -H "Content-Type: application/json" \
  -d '{ "due_date": "2026-10-20", "notes": "Diperpanjang 3 hari" }'
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Data peminjaman berhasil diperbarui.",
  "data": {
    "id": 1,
    "due_date": "2026-10-20",
    "status": "Dipinjam",
    "notes": "Diperpanjang 3 hari",
    "days_late": 0
  }
}
```

*(beberapa kolom disingkat pada contoh ini)*

### 7. Catat pengembalian buku — `PATCH /loans/:id/return`

Body opsional. Jika `return_date` tidak dikirim, otomatis diisi tanggal hari ini.

```bash
curl -X PATCH BASE_URL/loans/2/return \
  -H "Content-Type: application/json" \
  -d '{ "return_date": "2026-09-29" }'
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Buku berhasil dikembalikan (terlambat 6 hari).",
  "data": {
    "id": 2,
    "member_name": "Siti Rahmawati",
    "book_title": "Bumi Manusia",
    "due_date": "2026-09-23",
    "return_date": "2026-09-29",
    "status": "Dikembalikan",
    "days_late": 6
  }
}
```

*(beberapa kolom disingkat pada contoh ini)*

### 8. Hapus peminjaman — `DELETE /loans/:id`

```bash
curl -X DELETE BASE_URL/loans/7
```

**Response `200 OK`** (mengembalikan data yang dihapus)

```json
{
  "success": true,
  "message": "Data peminjaman berhasil dihapus.",
  "data": {
    "id": 7,
    "member_name": "Handoyo",
    "book_title": "JavaScript: The Good Parts",
    "status": "Dipinjam",
    "days_late": 0
  }
}
```

*(beberapa kolom disingkat pada contoh ini)*

### 9. Health check — `GET /health`

```json
{
  "success": true,
  "message": "API dan database berjalan normal.",
  "data": {
    "api": "up",
    "database": "connected",
    "uptime_seconds": 42,
    "timestamp": "2026-09-29T03:20:00.000Z"
  }
}
```

---

## ⚠️ Format Error

Semua error memakai format yang sama:

```json
{
  "success": false,
  "message": "Validasi gagal. Periksa kembali data yang dikirim.",
  "errors": [
    { "field": "member_id", "message": "wajib diisi" },
    { "field": "member_name", "message": "tidak boleh kosong" },
    { "field": "book_title", "message": "wajib diisi" },
    { "field": "due_date", "message": "harus berupa tanggal valid dengan format YYYY-MM-DD" }
  ]
}
```

| Status | Kapan terjadi                                                          |
| :----: | ---------------------------------------------------------------------- |
| `400`  | Validasi gagal, JSON rusak, query parameter / id tidak valid           |
| `404`  | Data peminjaman atau endpoint tidak ditemukan                          |
| `409`  | Buku sudah dikembalikan sebelumnya (`PATCH /loans/:id/return`)         |
| `413`  | Body request terlalu besar                                             |
| `500`  | Kesalahan server / database                                            |
| `503`  | `GET /health` saat database tidak dapat diakses                        |

---

## 💻 Instalasi & Menjalankan Lokal

### Prasyarat

- [Node.js](https://nodejs.org/) versi **20.12 atau lebih baru** (disarankan LTS)
- [Git](https://git-scm.com/)
- Akun [Supabase](https://supabase.com/) (gratis)

### Langkah-langkah

**1. Clone repository**

```bash
git clone https://github.com/USERNAME/responsi-pbb-perpustakaan-api.git
cd responsi-pbb-perpustakaan-api
```

**2. Install dependencies**

```bash
npm install
```

**3. Siapkan database Supabase**

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor → New query**, salin seluruh isi [`database/schema.sql`](database/schema.sql), lalu klik **Run**.
3. Buka **Project Settings → API Keys**, salin **Secret key** (`sb_secret_...`) — atau key legacy `service_role`.
4. Salin **Project URL** (`https://xxxx.supabase.co`) dari **Project Settings → Data API** atau tombol **Connect**.

**4. Buat file `.env`**

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Isi nilainya:

```env
PORT=3000
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxx
APP_TIMEZONE=Asia/Jakarta
```

**5. Jalankan server**

```bash
npm run dev     # mode development (auto-restart saat file berubah)
# atau
npm start       # mode biasa
```

Server berjalan di **http://localhost:3000**. Coba buka:

- http://localhost:3000/
- http://localhost:3000/health
- http://localhost:3000/loans
- http://localhost:3000/loans?status=Terlambat

---

## 🚀 Deployment ke Vercel

1. Push project ke GitHub (repository publik).
2. Masuk ke [vercel.com](https://vercel.com/) → **Add New… → Project** → **Import** repository ini.
3. Vercel otomatis mendeteksi **Express** dari `index.js` (tanpa `vercel.json`).
4. Pada bagian **Environment Variables**, tambahkan:

   | Name           | Value                                  |
   | -------------- | -------------------------------------- |
   | `SUPABASE_URL` | Project URL Supabase                   |
   | `SUPABASE_KEY` | Secret key Supabase                    |
   | `APP_TIMEZONE` | `Asia/Jakarta` (opsional)              |

5. Klik **Deploy**, tunggu sampai selesai, lalu buka `https://NAMA-PROJECT.vercel.app/health` untuk memastikan database terhubung.

> Jika environment variable diubah setelah deploy, lakukan **Redeploy** agar perubahan terbaca.

---

## 🌐 Link Deployment

| Keterangan         | Link                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| Base URL (Vercel)  | https://NAMA-PROJECT.vercel.app                                      |
| Contoh endpoint    | https://NAMA-PROJECT.vercel.app/loans?status=Terlambat               |
| Health check       | https://NAMA-PROJECT.vercel.app/health                               |
| Repository GitHub  | https://github.com/USERNAME/responsi-pbb-perpustakaan-api            |

<!-- GANTI "NAMA-PROJECT" dan "USERNAME" di atas dengan milikmu -->

---

## 📄 Lisensi

Dirilis di bawah lisensi [MIT](LICENSE).

---

<p align="center">
  Dibuat oleh <b>Handoyo</b> (21120124120040) — Kelompok 42, Shift 6<br>
  Praktikum PBB · Teknik Komputer · Universitas Diponegoro · 2026
</p>
