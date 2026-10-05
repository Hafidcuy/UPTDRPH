/* =========================================================================
   RPH DATA LAYER
   Menyediakan API tunggal untuk membaca/menulis data.
   - MODE CLOUD : terhubung ke Supabase (kalau config diisi)
   - MODE DEMO  : data disimpan di browser (localStorage), jalan tanpa Supabase
   ========================================================================= */

const RPH = (() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const CLOUD =
    Boolean(cfg.SUPABASE_URL) &&
    Boolean(cfg.SUPABASE_ANON_KEY) &&
    !String(cfg.SUPABASE_URL).includes("ISI_");

  let db = null;
  let auth = null;
  if (CLOUD && window.supabase) {
    db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    auth = db.auth;
  }

  /* ----------------------------- util lokal ----------------------------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: "Penyimpanan browser penuh (kuota localStorage)." };
      }
    },
  };

  const uid = () =>
    (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now());

  /* --------------------------- data default ----------------------------- */
  const DEFAULT_SETTINGS = {
    hero_title: "Selamat Datang di RPH Krian",
    hero_subtitle:
      "Layanan pemotongan hewan yang higienis, aman, dan sesuai standar syariat — dikelola UPTD RPH & Pasar Hewan Krian.",
    about_title: "Tentang Kami",
    about_text:
      "UPTD RPH Dan Pasar Hewan adalah unit Pelaksana Teknis Daerah yang bergerak di bidang jasa pelayanan tempat pemotongan hewan dan jasa pelataran jual beli ternak. UPTD RPH dan Pasar Hewan Krian berperan di bawah naungan Dinas Pangan dan Pertanian Kabupaten Sidoarjo, berlokasi di Jalan Ki Hajar Dewantara, Dusun Ngingas, Kelurahan Krian, Kecamatan Krian, Kabupaten Sidoarjo.",
    contact_address:
      "Jl. Ki Hajar Dewantara, Dusun Ngingas, Kel. Krian, Kec. Krian, Kab. Sidoarjo, Jawa Timur",
    contact_phone: "0812-3456-7890",
    contact_email: "rphkrian@sidoarjokab.go.id",
    operating_hours: "Senin – Sabtu, 07.00 – 16.00 WIB",
    hero_image: "galeri/1 (27).jpeg",
  };

  const DEFAULT_SERVICES = [
    { title: "Pemotongan Sapi", description: "Layanan penyembelihan sapi dengan prosedur higienis dan sesuai standar.", icon: "cow", sort_order: 1 },
    { title: "Pemotongan Kambing", description: "Layanan penyembelihan kambing/domba untuk kebutuhan qurban dan konsumsi.", icon: "goat", sort_order: 2 },
    { title: "Jual Beli Hewan Ternak", description: "Jasa pelataran jual beli hewan ternak dengan harga yang kompetitif.", icon: "trade", sort_order: 3 },
    { title: "Pengolahan & Distribusi", description: "Pemotongan, pencacahan, dan penyiapan daging siap edar untuk kebutuhan pasar.", icon: "truck", sort_order: 4 },
  ];

  // Ubah image_path menjadi URL siap pakai:
  //  - "http..."           -> dipakai langsung (URL publik lama)
  //  - "galeri/..."        -> file lokal di folder galeri/ (foto seed, jalan di hosting mana pun)
  //  - "nama-objek.jpg"    -> objek di bucket Supabase Storage
  function resolveImageUrl(path) {
    const p = String(path || "");
    if (!p) return "";
    if (p.startsWith("http")) return p;
    if (p.startsWith("galeri/") || p.startsWith("data:")) return p;
    return `${cfg.SUPABASE_URL}/storage/v1/object/public/${cfg.STORAGE_BUCKET}/${p}`;
  }

  const seedGallery = () =>
    Array.from({ length: 69 }, (_, i) => ({
      id: "seed-" + (i + 1),
      title: "",
      image_path: `galeri/1 (${i + 1}).jpeg`,
      is_seed: true,
      sort_order: i + 1,
    }));

  /* --------------------------- API: SETTINGS ---------------------------- */
  async function getSettings() {
    if (CLOUD) {
      const { data, error } = await db
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data) return { ...DEFAULT_SETTINGS, ...(data || {}), _mode: "cloud" };
      return { ...DEFAULT_SETTINGS, ...data, _mode: "cloud" };
    }
    return { ...DEFAULT_SETTINGS, ...store.get("rph_settings", {}), _mode: "demo" };
  }

  async function saveSettings(patch) {
    if (CLOUD) {
      const { error } = await db
        .from("site_settings")
        .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      return;
    }
    const next = { ...store.get("rph_settings", {}), ...patch };
    const res = store.set("rph_settings", next);
    if (!res.ok) throw new Error(res.error);
  }

  /* ---------------------------- API: SERVICES --------------------------- */
  async function getServices() {
    if (CLOUD) {
      const { data, error } = await db
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) return DEFAULT_SERVICES.map((s) => ({ ...s, id: uid() }));
      if (!data || !data.length) return DEFAULT_SERVICES.map((s) => ({ ...s, id: uid() }));
      return data;
    }
    return store.get("rph_services", null) || DEFAULT_SERVICES.map((s) => ({ ...s, id: uid() }));
  }

  async function getAllServices() {
    if (CLOUD) {
      const { data } = await db.from("services").select("*").order("sort_order");
      return data || [];
    }
    return store.get("rph_services", null) || DEFAULT_SERVICES.map((s) => ({ ...s, id: uid() }));
  }

  async function saveService(svc) {
    const payload = {
      title: svc.title,
      description: svc.description || "",
      icon: svc.icon || "cow",
      sort_order: Number(svc.sort_order || 0),
      active: svc.active !== false,
    };
    if (CLOUD) {
      const { error } = svc.id
        ? await db.from("services").update(payload).eq("id", svc.id)
        : await db.from("services").insert(payload);
      if (error) throw new Error(error.message);
      return;
    }
    const list = await getAllServices();
    if (svc.id) {
      const i = list.findIndex((x) => x.id === svc.id);
      if (i > -1) list[i] = { ...list[i], ...payload };
    } else {
      list.push({ id: uid(), ...payload });
    }
    store.set("rph_services", list);
  }

  async function deleteService(id) {
    if (CLOUD) {
      const { error } = await db.from("services").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    store.set("rph_services", (await getAllServices()).filter((s) => s.id !== id));
  }

  /* ---------------------------- API: GALLERY ---------------------------- */
  async function getGallery() {
    const hidden = new Set(getHiddenSeeds());
    const hide = (list) => list.filter((g) => !hidden.has(g.id));
    if (CLOUD) {
      const { data, error } = await db
        .from("gallery")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error || !data || !data.length) return hide(seedGallery());
      return hide(
        data.map((g) => ({
          ...g,
          url: resolveImageUrl(g.image_path),
        }))
      );
    }
    const local = store.get("rph_gallery", null);
    if (local && local.length) return local;
    return hide(seedGallery());
  }

  async function addGalleryImages(files, onProgress) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (onProgress) onProgress(i + 1, files.length, file.name);
      const compressed = await compressImage(file);
      if (CLOUD) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, "-")}`;
        const { error } = await db.storage
          .from(cfg.STORAGE_BUCKET)
          .upload(path, compressed.blob, { contentType: compressed.blob.type, upsert: false });
        if (error) throw new Error(error.message);
        const { error: insErr } = await db.from("gallery").insert({
          title: file.name.replace(/\.[^.]+$/, ""),
          image_path: path,
          storage_path: path,
          sort_order: 0,
        });
        if (insErr) throw new Error(insErr.message);
        results.push(path);
      } else {
        const dataUrl = await blobToDataURL(compressed.blob);
        const list = store.get("rph_gallery", []);
        const res = store.set("rph_gallery", [
          { id: uid(), title: file.name, image_path: dataUrl, url: dataUrl, created_at: new Date().toISOString(), sort_order: 0 },
          ...list,
        ]);
        if (!res.ok) throw new Error(res.error);
        results.push(dataUrl);
      }
    }
    return results;
  }

  async function deleteGalleryItem(item) {
    // Foto seed (folder galeri/ lokal) tidak bisa dihapus permanen — sembunyikan saja
    if (item.is_seed) {
      const hidden = store.get("rph_hidden_seeds", []);
      hidden.push(item.id);
      store.set("rph_hidden_seeds", hidden);
      return;
    }
    if (CLOUD) {
      const { error } = await db.from("gallery").delete().eq("id", item.id);
      if (error) throw new Error(error.message);
      // Hapus file di Storage hanya untuk hasil upload (ada storage_path)
      if (item.storage_path) {
        await db.storage.from(cfg.STORAGE_BUCKET).remove([item.storage_path]);
      }
      return;
    }
    const list = store.get("rph_gallery", []);
    store.set(
      "rph_gallery",
      list.filter((g) => g.id !== item.id)
    );
  }

  function getHiddenSeeds() {
    return store.get("rph_hidden_seeds", []);
  }

  /* ---------------------------- API: MESSAGES --------------------------- */
  async function getMessages() {
    if (CLOUD) {
      const { data, error } = await db
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return store.get("rph_messages", []);
  }

  async function sendMessage({ name, email, phone, message }) {
    const payload = { name, email: email || "", phone: phone || "", message };
    if (CLOUD) {
      const { error } = await db.from("messages").insert(payload);
      if (error) throw new Error(error.message);
      return;
    }
    const list = store.get("rph_messages", []);
    list.unshift({ id: uid(), ...payload, is_read: false, created_at: new Date().toISOString() });
    store.set("rph_messages", list);
  }

  async function markMessage(id, isRead) {
    if (CLOUD) {
      const { error } = await db.from("messages").update({ is_read: isRead }).eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    store.set(
      "rph_messages",
      (await getMessages()).map((m) => (m.id === id ? { ...m, is_read: isRead } : m))
    );
  }

  async function deleteMessage(id) {
    if (CLOUD) {
      const { error } = await db.from("messages").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    store.set("rph_messages", (await getMessages()).filter((m) => m.id !== id));
  }

  /* ------------------------------- AUTH --------------------------------- */
  const MIN_PASSWORD = 8;

  // Mode demo: sandi bisa diganti admin -> disimpan lokal (rph_demo_password).
  function demoPassword() {
    return store.get("rph_demo_password", null) || cfg.DEMO_ADMIN_PASSWORD;
  }

  function getDemoHint() {
    return { email: cfg.DEMO_ADMIN_EMAIL, password: demoPassword() };
  }

  async function signIn(email, password) {
    if (CLOUD) {
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data.user;
    }
    const ok =
      email.trim().toLowerCase() === String(cfg.DEMO_ADMIN_EMAIL).toLowerCase() &&
      password === demoPassword();
    if (!ok) throw new Error("Email atau kata sandi salah.");
    store.set("rph_demo_session", { email, at: Date.now() });
    return { email };
  }

  /**
   * Ganti kata sandi admin.
   * CLOUD : verifikasi sandi lama via signInWithPassword, lalu updateUser().
   * DEMO  : verifikasi sandi lama, simpan sandi baru di browser ini.
   */
  async function changePassword(currentPassword, newPassword) {
    if (!currentPassword) throw new Error("Kata sandi saat ini wajib diisi.");
    if (!newPassword || newPassword.length < MIN_PASSWORD)
      throw new Error(`Kata sandi baru minimal ${MIN_PASSWORD} karakter.`);
    if (newPassword === currentPassword)
      throw new Error("Kata sandi baru tidak boleh sama dengan yang lama.");

    if (CLOUD) {
      const { data: cu, error: uErr } = await auth.getUser();
      const email = cu?.user?.email;
      if (uErr || !email) throw new Error("Sesi admin tidak valid. Silakan keluar dan masuk kembali.");

      // Verifikasi sandi lama lebih dulu (sekaligus memperbarui sesi).
      const { error: verifyErr } = await auth.signInWithPassword({ email, password: currentPassword });
      if (verifyErr) throw new Error("Kata sandi saat ini salah.");

      const { error } = await auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return;
    }

    if (currentPassword !== demoPassword()) throw new Error("Kata sandi saat ini salah.");
    const res = store.set("rph_demo_password", newPassword);
    if (!res.ok) throw new Error(res.error);
  }

  /** Kirim email reset kata sandi (hanya mode cloud / Supabase Auth). */
  async function sendPasswordReset(email) {
    if (!CLOUD)
      throw new Error("Fitur reset email aktif setelah Supabase terhubung. Mode demo: sandi default ada di panel bawah.");
    const { error } = await auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}`,
    });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    if (CLOUD) await auth.signOut();
    else localStorage.removeItem("rph_demo_session");
  }

  async function getUser() {
    if (CLOUD) {
      const { data } = await auth.getSession();
      return data?.session?.user || null;
    }
    return store.get("rph_demo_session", null);
  }

  onAuthChange();

  function onAuthChange() {
    if (CLOUD && auth) auth.onAuthStateChange(() => {});
  }

  /* --------------------------- util: gambar ----------------------------- */
  function compressImage(file, maxSize = 1400, quality = 0.8) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve({ blob: file });
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve({ blob: blob || file });
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ blob: file });
      };
      img.src = url;
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  return {
    isCloud: CLOUD,
    bucket: cfg.STORAGE_BUCKET,
    getSettings,
    saveSettings,
    getServices,
    getAllServices,
    saveService,
    deleteService,
    getGallery,
    addGalleryImages,
    deleteGalleryItem,
    getHiddenSeeds,
    getMessages,
    sendMessage,
    markMessage,
    deleteMessage,
    signIn,
    signOut,
    getUser,
    changePassword,
    sendPasswordReset,
    getDemoHint,
    MIN_PASSWORD,
    compressImage,
    blobToDataURL,
  };
})();
