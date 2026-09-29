-- =====================================================================
--  Schema Database - REST API Peminjaman Buku Perpustakaan
--  Responsi Praktikum PBB - Handoyo (21120124120040) - Kelompok 42 Shift 6
--
--  Cara pakai:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel seluruh isi
--  file ini -> klik "Run". Aman dijalankan ulang (idempotent), tetapi
--  bagian SEED akan menambah data contoh lagi jika dijalankan dua kali.
-- =====================================================================

-- 1. Tabel utama -------------------------------------------------------
create table if not exists public.loans (
  id           bigint generated always as identity primary key,
  member_id    varchar(20)  not null,
  member_name  varchar(100) not null,
  book_isbn    varchar(20),
  book_title   varchar(200) not null,
  book_author  varchar(100),
  loan_date    date         not null default current_date,
  due_date     date         not null,
  return_date  date,
  status       varchar(20)  not null default 'Dipinjam',
  notes        text,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now(),

  constraint loans_status_check
    check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  constraint loans_due_date_check
    check (due_date >= loan_date),
  constraint loans_return_date_check
    check (return_date is null or return_date >= loan_date),
  constraint loans_returned_status_check
    check ((return_date is null and status <> 'Dikembalikan')
        or (return_date is not null and status = 'Dikembalikan'))
);

comment on table  public.loans             is 'Data peminjaman buku perpustakaan oleh anggota';
comment on column public.loans.member_id   is 'Nomor anggota perpustakaan';
comment on column public.loans.due_date    is 'Tanggal jatuh tempo pengembalian';
comment on column public.loans.return_date is 'Tanggal buku dikembalikan (null = belum kembali)';
comment on column public.loans.status      is 'Dipinjam | Dikembalikan | Terlambat';

-- 2. Index untuk mempercepat filter -----------------------------------
create index if not exists loans_status_idx    on public.loans (status);
create index if not exists loans_member_id_idx on public.loans (member_id);
create index if not exists loans_due_date_idx  on public.loans (due_date);

-- 3. Trigger: updated_at otomatis diperbarui --------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists loans_set_updated_at on public.loans;
create trigger loans_set_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

-- 4. Keamanan: aktifkan Row Level Security ----------------------------
-- Tanpa policy, tabel TIDAK bisa diakses dengan publishable/anon key.
-- API ini memakai Secret key (service_role) yang hanya disimpan di server.
alter table public.loans enable row level security;

-- 5. SEED: data contoh (tanggal relatif terhadap hari ini) -------------
insert into public.loans
  (member_id, member_name, book_isbn, book_title, book_author, loan_date, due_date, return_date, status, notes)
values
  ('AGT-001', 'Budi Santoso',     '978-602-03-3295-6', 'Laskar Pelangi',                    'Andrea Hirata',          current_date - 3,  current_date + 11, null,              'Dipinjam',     null),
  ('AGT-002', 'Siti Rahmawati',   '978-979-22-4861-6', 'Bumi Manusia',                      'Pramoedya Ananta Toer',  current_date - 20, current_date - 6,  null,              'Terlambat',    'Sudah dihubungi via WhatsApp'),
  ('AGT-003', 'Rizky Pratama',    '978-0-13-235088-4', 'Clean Code',                        'Robert C. Martin',       current_date - 30, current_date - 16, current_date - 18, 'Dikembalikan', null),
  ('AGT-001', 'Budi Santoso',     '978-0-262-03384-8', 'Introduction to Algorithms',        'Thomas H. Cormen',       current_date - 25, current_date - 11, current_date - 8,  'Dikembalikan', 'Dikembalikan terlambat 3 hari'),
  ('AGT-004', 'Dewi Lestari',     '978-0-13-468599-1', 'Computer Networking: A Top-Down Approach', 'James F. Kurose', current_date - 16, current_date - 2,  null,              'Terlambat',    null),
  ('AGT-005', 'Andi Wijaya',      '978-0-12-812275-7', 'Computer Organization and Design',  'David A. Patterson',     current_date - 1,  current_date + 13, null,              'Dipinjam',     'Buku referensi Arsitektur Komputer');

-- Cek hasil:
-- select * from public.loans order by id;
