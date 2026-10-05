# 🐄 Website RPH Krian

Situs statis **UPTD RPH & Pasar Hewan Krian — Kabupaten Sidoarjo**.
HTML + CSS + JavaScript murni, tanpa build step, tanpa framework. Tinggal upload ke GitHub Pages / Netlify / hosting apa pun.

---

## 📁 Struktur File

```
webrph/
├── index.html            ← Halaman publik
├── rph.css               ← Gaya halaman publik
├── rph.js                ← Interaksi halaman publik
│
├── admin.html            ← Panel admin
├── admin.css             ← Gaya panel admin
├── admin.js              ← Logika panel admin
│
├── rph-data.js           ← Lapisan data (demo mode / Supabase)
├── supabase-config.js    ← Isi kredensial Supabase (masih kosong = mode demo)
├── supabase-schema.sql   ← Script SQL untuk dijalankan di Supabase
│
└── galeri/               ← 69 foto galeri (seed)
```

---

## ▶️ Menjalankan Lokal

Tidak perlu install apa pun. Cukup jalankan server statis:

```bash
# pakai Node (npx)
npx serve .

# atau pakai Python
python -m http.server 8000
```

Lalu buka `http://localhost:3000` (atau port yang muncul di terminal).

> **Kenapa harus lewat server?** Halaman memuat beberapa file JS. Buka lewat `file://`
> bisa diblokir browser. Gunakan server statis.

### Mode Demo (otomatis)

Selama `supabase-config.js` masih kosong, website berjalan dalam **mode demo**:

- Semua data disimpan di `localStorage` browser
- Galeri memakai foto lokal di folder `galeri/`
- Login admin:

  | | |
  |---|---|
  | **Email** | `admin@rphkrian.id` |
  | **Sandi** | `admin123` |

> ⚠️ Mode demo hanya untuk pratinjau. Data tidak akan terlihat oleh pengunjung lain.

---

## ☁️ Mengaktifkan Mode Supabase (Production)

### 1. Buat project Supabase

Buka [supabase.com](https://supabase.com) → **New project** → catat:
- **Project URL**
- **anon public key** (bukan `service_role`)

### 2. Jalankan script database

Buka **SQL Editor** di Supabase → tempel seluruh isi `supabase-schema.sql` → **Run**.

Script ini membuat:

| Tabel | Fungsi |
|---|---|
| `site_settings` | Teks Tentang, Layanan, Kontak |
| `services` | Daftar layanan |
| `gallery` | Foto galeri |
| `messages` | Pesan / testimoni pengunjung |

Plus **Storage bucket** `galeri` dan aturan **RLS**:
publik boleh **baca** + **kirim pesan**, hanya *authenticated* yang boleh **ubah/hapus**.

### 3. Isi kredensial

Buka `supabase-config.js` lalu isi dua baris ini:

```js
url: "ISI_PROJECT_URL_ANDA",
anonKey: "ISI_ANON_PUBLIC_KEY_ANDA",
```

Simpan, lalu **hapus data browser** (atau buka jendela incognito) agar mode demo tidak tersimpan.

### 4. Verifikasi

- Buka halaman publik → foto galeri dan teks harus tetap tampil
- Login panel admin → **Pesan**, **Galeri**, dan **Konten Situs** harus menampilkan data Supabase
- Jika masih memakai data lama berarti masih dalam mode demo

---

## 🔐 Panel Admin

Akses: `/admin.html`

| Fitur | Keterangan |
|---|---|
| **Ringkasan** | Statistik singkat situs |
| **Konten Situs** | Ubah teks Tentang, Layanan, Kontak |
| **Layanan** | Tambah / edit / hapus layanan |
| **Galeri** | Upload & hapus foto |
| **Pesan** | Inbox pesan & testimoni pengunjung |
| **Keamanan** | Ganti kata sandi (min. 8 karakter) |

---

## 🎨 Kustomisasi

### Warna

Semua warna terpusat di `rph.css` — cari blok `:root`:

```css
:root {
  --green-600: #2e7d32;   /* warna utama */
  --accent: var(--green-600);
  /* ... */
}
```

Mode gelap ada di selector `body.dark-mode`.

### Ikon

Ikon memakai **SVG sprite inline** yang didefinisikan di awal `<body>` pada
`index.html` dan `admin.html` (masing-masing punya salinan sendiri).

Cara pakai di HTML:

```html
<svg class="ic"><use href="#i-clock"></use></svg>
```

Cara pakai di JS:

```js
ic("clock")   // menghasilkan <svg class="ic"><use href="#i-clock"></use></svg>
```

Daftar ikon: `i-lock`, `i-clock`, `i-phone`, `i-pin`, `i-mail`, `i-cow`, `i-cut`,
`i-basket`, `i-truck`, `i-check`, `i-x`, `i-shield`, `i-image`, `i-grid`,
`i-edit`, `i-trash`, `i-save`, `i-upload`, `i-refresh`, `i-inbox`, `i-user`,
`i-eye`, `i-menu`, `i-chevron-down`, `i-arrow-up`, `i-sun`, `i-moon`, dll.

### Ikon Layanan

Ikon per layanan diatur lewat `iconSvg(ICONS.*)` di `rph-data.js`.

---

## 📱 Responsiveness

Website diuji pada lebar **360, 390, 768, 1024, 1280, dan 1440 px**:

- ✅ Tidak ada *horizontal scroll* di semua lebar
- ✅ Navigasi berubah dari menu drawer (mobile) ke menu inline (desktop)
- ✅ Grid layanan & galeri menyesuaikan jumlah kolom
- ✅ Panel admin memakai sidebar drawer di layar kecil

---

## 🚀 Upload ke GitHub

### Langkah 1 — Buat repository

Buka [github.com/new](https://github.com/new):

- **Repository name**: `webrph` (atau bebas)
- Pilih **Public** (agar GitHub Pages gratis jalan)
- **Jangan** centang `Add a README file` (kita sudah punya)
- Klik **Create repository**

### Langkah 2 — Push dari terminal

Pastikan terminal dibuka di folder project, lalu jalankan:

```bash
git init
git add .
git commit -m "feat: website RPH Krian"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Ganti `USERNAME/REPO` dengan nama user dan repository kamu.

### Langkah 3 — Aktifkan GitHub Pages

1. Buka tab **Settings → Pages**
2. **Source**: *Deploy from a branch*
3. **Branch**: `main` / `(root)` → **Save**
4. Tunggu 1–2 menit, situs live di:
   `https://USERNAME.github.io/REPO/`

### Langkah 4 — Update setelah perubahan

```bash
git add .
git commit -m "fix: deskripsi perubahan"
git push
```

> **Catatan:**
> - Pastikan folder `galeri/` ikut ter-commit (69 file gambar).
> - Isi `supabase-config.js` sebelum memakai website di production,
>   kalau tidak website tetap berjalan dalam mode demo (data lokal).
