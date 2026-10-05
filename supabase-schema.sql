/* =========================================================================
   RPH KRIAN — Supabase Schema
   Jalankan SEMUA isi file ini di: Supabase Dashboard -> SQL Editor -> Run
   ========================================================================= */

-- 1) TABEL: pengaturan konten website (satu baris, id = 1)
create table if not exists public.site_settings (
  id               int primary key default 1,
  hero_title       text default 'Selamat Datang di RPH Krian',
  hero_subtitle    text default 'Layanan pemotongan hewan yang higienis, aman, dan sesuai standar.',
  hero_image       text default 'galeri/1 (27).jpeg',
  about_title      text default 'Tentang Kami',
  about_text       text default 'UPTD RPH Dan Pasar Hewan adalah unit Pelaksana Teknis Daerah yang bergerak di bidang jasa pelayanan tempat pemotongan hewan dan jasa pelataran jual beli ternak. UPTD RPH dan Pasar Hewan Krian berperan di bawah naungan Dinas Pangan dan Pertanian Kabupaten Sidoarjo, berlokasi di Jalan Ki Hajar Dewantara, Dusun Ngingas, Kelurahan Krian, Kecamatan Krian, Kabupaten Sidoarjo.',
  contact_address  text default 'Jl. Ki Hajar Dewantara, Dusun Ngingas, Kel. Krian, Kec. Krian, Kab. Sidoarjo, Jawa Timur',
  contact_phone    text default '0812-3456-7890',
  contact_email    text default 'rphkrian@sidoarjokab.go.id',
  operating_hours  text default 'Senin – Sabtu, 07.00 – 16.00 WIB',
  updated_at       timestamptz default now()
);

-- 2) TABEL: layanan
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  icon        text default 'cow',       -- cow | goat | trade | truck
  sort_order  int  default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- 3) TABEL: galeri (foto yang diunggah disimpan di Storage bucket "galeri")
create table if not exists public.gallery (
  id           uuid primary key default gen_random_uuid(),
  title        text default '',
  image_path   text not null,            -- URL publik, atau path lokal "galeri/...."
  storage_path text,                     -- nama objek di bucket (hanya untuk foto upload)
  sort_order   int  default 0,
  created_at   timestamptz default now()
);

-- 4) TABEL: pesan dari form kontak
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text default '',
  phone      text default '',
  message    text not null,
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- 5) SEED: baris pengaturan awal
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- 6) SEED: layanan awal (hanya sekali, kalau tabel masih kosong)
insert into public.services (title, description, icon, sort_order)
select v.title, v.description, v.icon, v.sort_order
from (values
  ('Pemotongan Sapi',        'Layanan penyembelihan sapi dengan prosedur higienis dan sesuai standar.', 'cow',   1),
  ('Pemotongan Kambing',     'Layanan penyembelihan kambing/domba untuk kebutuhan qurban dan konsumsi.', 'goat',  2),
  ('Jual Beli Hewan Ternak', 'Jasa pelataran jual beli hewan ternak dengan harga yang kompetitif.',      'trade', 3),
  ('Pengolahan & Distribusi','Pemotongan, pencacahan, dan penyiapan daging siap edar untuk kebutuhan pasar.', 'truck', 4)
) as v(title, description, icon, sort_order)
where not exists (select 1 from public.services);

-- 7) SEED: 69 foto yang sudah ada di folder galeri/ (ditampilkan langsung di website)
insert into public.gallery (title, image_path, sort_order)
select 'Dokumentasi RPH Krian ' || g, 'galeri/1 (' || g || ').jpeg', g
from generate_series(1, 69) as g
where not exists (select 1 from public.gallery);

-- =========================================================================
--  ROW LEVEL SECURITY (RLS)
--  Publik boleh MEMBACA konten & MENGIRIM pesan.
--  Hanya user login (admin) yang boleh MENAMBAH / MENGUBAH / MENGHAPUS.
-- =========================================================================
alter table public.site_settings enable row level security;
alter table public.services      enable row level security;
alter table public.gallery       enable row level security;
alter table public.messages      enable row level security;

-- site_settings
drop policy if exists "public read settings"   on public.site_settings;
drop policy if exists "admin write settings"   on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
create policy "admin write settings" on public.site_settings
  for all to authenticated using (true) with check (true);

-- services
drop policy if exists "public read services"   on public.services;
drop policy if exists "admin write services"   on public.services;
create policy "public read services" on public.services for select using (true);
create policy "admin write services" on public.services
  for all to authenticated using (true) with check (true);

-- gallery
drop policy if exists "public read gallery"    on public.gallery;
drop policy if exists "admin write gallery"    on public.gallery;
create policy "public read gallery" on public.gallery for select using (true);
create policy "admin write gallery" on public.gallery
  for all to authenticated using (true) with check (true);

-- messages: publik INSERT, login saja yang boleh baca/ubah/hapus
drop policy if exists "public send messages"   on public.messages;
drop policy if exists "admin read messages"    on public.messages;
drop policy if exists "admin manage messages"  on public.messages;
drop policy if exists "admin manage delete messages" on public.messages;
create policy "public send messages" on public.messages
  for insert with check (true);
create policy "admin read messages" on public.messages
  for select to authenticated using (true);
create policy "admin manage messages" on public.messages
  for update to authenticated using (true) with check (true);
create policy "admin manage delete messages" on public.messages
  for delete to authenticated using (true);

-- =========================================================================
--  STORAGE: bucket publik "galeri"
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('galeri', 'galeri', true)
on conflict (id) do nothing;

drop policy if exists "public read galeri"  on storage.objects;
drop policy if exists "admin upload galeri" on storage.objects;
drop policy if exists "admin delete galeri" on storage.objects;

create policy "public read galeri" on storage.objects
  for select using (bucket_id = 'galeri');

create policy "admin upload galeri" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeri');

create policy "admin delete galeri" on storage.objects
  for delete to authenticated using (bucket_id = 'galeri');

/* =========================================================================
   SELESAI. Langkah berikutnya:
   1. Authentication -> Users -> Add user  (buat akun admin)
   2. Isi supabase-config.js (URL + anon key)
   3. Buka admin.html dan login
   ========================================================================= */
