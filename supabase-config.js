/* =========================================================================
   KONFIGURASI SUPABASE — RPH KRIAN
   =========================================================================
   1. Buat project di https://supabase.com  (Gratis)
   2. Buka menu "Project Settings" -> "API"
   3. Salin "Project URL"  ->  tempel ke SUPABASE_URL
   4. Salin "anon public" key -> tempel ke SUPABASE_ANON_KEY
   5. Jalankan file `supabase-schema.sql` di menu "SQL Editor"
   6. Buat akun admin di menu "Authentication" -> "Add user"
      (email & password bebas, nanti dipakai login di /admin.html)

   SELAMA KOSONG / BELUM DIISI -> website tetap jalan dengan MODE DEMO
   (data disimpan di browser / localStorage).
   ========================================================================= */

window.SUPABASE_CONFIG = {
  // Contoh: "https://abcdefghij.supabase.co"
  SUPABASE_URL: "https://cuocaypwgwhidzsoywpu.supabase.co",

  // Contoh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1b2NheXB3Z3doaWR6c295d3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjY5NzAsImV4cCI6MjEwNjgwMjk3MH0.7XfLvR6mKL4arZn0UCF2dZy4TKsIBdhqKQcSOTD4yRc",

  // Nama bucket penyimpanan foto (sudah dibuat oleh supabase-schema.sql)
  STORAGE_BUCKET: "galeri",

  // Nama admin saat MODE DEMO (belum ada Supabase)
  DEMO_ADMIN_EMAIL: "admin@rphkrian.id",
  DEMO_ADMIN_PASSWORD: "admin123",
};
