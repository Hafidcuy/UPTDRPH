/* =========================================================================
   RPH KRIAN — Admin Panel logic
   ========================================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const ICONS = {
  cow: '<path d="M4 7c0-1.5 1-2.5 2.5-2.5C7 3 7.5 3 8 3.5c1 .3 2 .5 4 .5s3-.2 4-.5c.5-.5 1-.5 1.5-.5C19 4.5 20 5.5 20 7c0 1-.5 1.5-1 2v4c0 3-2 6-7 6s-7-3-7-6V9c-.5-.5-1-1-1-2Z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/>',
  goat: '<path d="M7 9c0-2 2.2-3.5 5-3.5S17 7 17 9v3c0 3.5-2 6.5-5 6.5S7 15.5 7 12V9Z"/><circle cx="10" cy="11" r=".9"/><circle cx="14" cy="11" r=".9"/><path d="M10.5 15h3"/>',
  trade: '<path d="M3 9h18l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 9Z"/><path d="M8 9V6.5A3.5 3.5 0 0 1 11.5 3h1A3.5 3.5 0 0 1 16 6.5V9"/>',
  truck: '<path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
};
const iconSvg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ICONS.cow}</svg>`;
/* ikon dari sprite SVG (menggantikan emoji) */
const ic = (name) => `<svg class="ic"><use href="#i-${name}"></use></svg>`;

/* ------------------------------- helpers -------------------------------- */
let toastTimer;
function toast(msg, type = "ok") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast show" + (type === "error" ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3400);
}
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (d) =>
  new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* ================================ AUTH ================================== */
async function boot() {
  const user = await RPH.getUser();
  if (user) showApp();
  else showAuth();

  $("#authMode").textContent = RPH.isCloud
    ? "Masuk dengan akun admin Supabase Anda."
    : "Mode Demo aktif — Supabase belum dikonfigurasi.";
  $("#demoHint").hidden = RPH.isCloud;
  if (!RPH.isCloud) renderDemoHint();
  const pill = $("#modePill");
  pill.textContent = RPH.isCloud ? "● Terhubung Supabase" : "● Mode Demo (lokal)";
  pill.classList.toggle("cloud", RPH.isCloud);
  $("#setupPanel").hidden = RPH.isCloud;
  $("#uploadNote").textContent = RPH.isCloud
    ? "Foto dikompres otomatis lalu disimpan di Supabase Storage bucket “galeri”."
    : "Mode Demo: foto dikompres dan disimpan di browser ini. Hubungkan Supabase agar tersimpan permanen.";
}

/* Tampilkan petunjuk akun demo yang selalu up-to-date (sandi bisa diganti admin). */
function renderDemoHint() {
  if (RPH.isCloud) return;
  const hint = RPH.getDemoHint();
  $("#demoEmail").textContent = hint.email;
  $("#demoPass").textContent = hint.password;
  $("#loginEmail").value = hint.email;
}

function showAuth() {
  $("#authView").hidden = false;
  $("#appView").hidden = true;
  renderDemoHint();
}
function showApp() {
  $("#authView").hidden = true;
  $("#appView").hidden = false;
  refreshAll();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn");
  btn.disabled = true;
  btn.textContent = "Memeriksa...";
  try {
    await RPH.signIn($("#loginEmail").value.trim(), $("#loginPass").value);
    toast("Berhasil masuk!");
    showApp();
    switchView("overview"); // selalu mulai dari Ringkasan setelah masuk
  } catch (err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk";
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  await RPH.signOut();
  toast("Anda telah keluar.");
  showAuth();
  switchView("overview"); // login berikutnya selalu mulai bersih
});

/* ============================== NAVIGATION ============================== */
const TITLES = {
  overview: "Ringkasan",
  content: "Konten Situs",
  services: "Layanan",
  gallery: "Galeri",
  messages: "Pesan Masuk",
  security: "Keamanan Akun",
};
/** Tampilkan satu view + sinkronkan nav aktif + muat datanya. */
function switchView(view) {
  if (!TITLES[view]) view = "overview";
  $$(".side-link").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
  $("#viewTitle").textContent = TITLES[view];
  setDrawer(false);
  if (view === "messages") loadMessages();
  if (view === "gallery") loadGalleryAdmin();
  if (view === "services") loadServices();
  if (view === "content") loadSettings();
  if (view === "security") loadAccount();
}
$$(".side-link").forEach((btn) =>
  btn.addEventListener("click", () => switchView(btn.dataset.view))
);

/* --------------------------- drawer (mobile) ---------------------------- */
function setDrawer(open) {
  $("#sidebar").classList.toggle("open", open);
  $("#sidebarBackdrop").hidden = !open;
  document.body.classList.toggle("drawer-open", open);
}
$("#menuToggle").addEventListener("click", () =>
  setDrawer(!$("#sidebar").classList.contains("open"))
);
$("#sidebarBackdrop").addEventListener("click", () => setDrawer(false));
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) setDrawer(false);
});

/* ============================== REFRESH ALL ============================= */
async function refreshAll() {
  try {
    await Promise.all([loadStats(), loadSettings(), loadServices(), loadGalleryAdmin(), loadMessages(), loadAccount()]);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function loadStats() {
  const [gallery, services, messages] = await Promise.all([
    RPH.getGallery(),
    RPH.getAllServices(),
    RPH.getMessages(),
  ]);
  $("#statGallery").textContent = gallery.length;
  $("#statServices").textContent = services.length;
  $("#statMessages").textContent = messages.length;
  const unread = messages.filter((m) => !m.is_read).length;
  $("#statUnread").textContent = unread;
  const badge = $("#msgBadge");
  badge.hidden = unread === 0;
  badge.textContent = unread;
  renderMessageList($("#recentMessages"), messages.slice(0, 3), true);
}

/* ================================ SETTINGS ============================== */
const FIELDS = [
  "hero_title", "hero_subtitle", "hero_image", "about_title", "about_text",
  "contact_address", "contact_phone", "contact_email", "operating_hours",
];

async function loadSettings() {
  const s = await RPH.getSettings();
  FIELDS.forEach((f) => {
    const el = $("#s_" + f);
    if (el) el.value = s[f] ?? "";
  });
}

$("#settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const patch = {};
  FIELDS.forEach((f) => {
    const el = $("#s_" + f);
    if (el) patch[f] = el.value.trim();
  });
  try {
    await RPH.saveSettings(patch);
    toast("Konten situs berhasil disimpan.");
  } catch (err) {
    toast(err.message, "error");
  }
});

$("#resetSettings").addEventListener("click", async () => {
  if (!confirm("Kembalikan semua konten ke teks default bawaan?")) return;
  try {
    localStorage.removeItem("rph_settings");
    await loadSettings();
    toast("Konten dikembalikan ke default.");
  } catch (err) {
    toast(err.message, "error");
  }
});

/* ================================ SERVICES ============================== */
async function loadServices() {
  const list = await RPH.getAllServices();
  const wrap = $("#serviceList");
  if (!list.length) {
    wrap.innerHTML = `<div class="empty">Belum ada layanan. Klik “+ Tambah Layanan”.</div>`;
    return;
  }
  wrap.innerHTML = list
    .map(
      (s) => `
    <div class="list-item">
      <div class="li-ico">${iconSvg(s.icon)}</div>
      <div class="li-body">
        <strong>${esc(s.title)} <span class="pill ${s.active === false ? "off" : ""}">${s.active === false ? "Nonaktif" : "Aktif"}</span></strong>
        <p>${esc(s.description || "—")}</p>
      </div>
      <div class="li-actions">
        <button class="btn btn-outline btn-sm" data-edit="${s.id}">${ic("edit")}Edit</button>
        <button class="btn btn-danger btn-sm" data-del="${s.id}">${ic("trash")}Hapus</button>
      </div>
    </div>`
    )
    .join("");

  $$("[data-edit]", wrap).forEach((b) =>
    b.addEventListener("click", () => openServiceModal(list.find((x) => x.id === b.dataset.edit)))
  );
  $$("[data-del]", wrap).forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus layanan ini?")) return;
      try {
        await RPH.deleteService(b.dataset.del);
        toast("Layanan dihapus.");
        loadServices();
        loadStats();
      } catch (err) {
        toast(err.message, "error");
      }
    })
  );
}

function openServiceModal(svc) {
  $("#svcModalTitle").textContent = svc ? "Edit Layanan" : "Tambah Layanan";
  $("#svcId").value = svc?.id || "";
  $("#svcTitle").value = svc?.title || "";
  $("#svcDesc").value = svc?.description || "";
  $("#svcIcon").value = svc?.icon || "cow";
  $("#svcOrder").value = svc?.sort_order ?? 1;
  $("#svcActive").checked = svc ? svc.active !== false : true;
  $("#serviceModal").hidden = false;
}
const closeServiceModal = () => ($("#serviceModal").hidden = true);

$("#addService").addEventListener("click", () => openServiceModal(null));
$("#svcClose").addEventListener("click", closeServiceModal);
$("#svcCancel").addEventListener("click", closeServiceModal);
$("#serviceModal").addEventListener("click", (e) => e.target.id === "serviceModal" && closeServiceModal());

$("#serviceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await RPH.saveService({
      id: $("#svcId").value || null,
      title: $("#svcTitle").value.trim(),
      description: $("#svcDesc").value.trim(),
      icon: $("#svcIcon").value,
      sort_order: $("#svcOrder").value,
      active: $("#svcActive").checked,
    });
    closeServiceModal();
    toast("Layanan tersimpan.");
    loadServices();
    loadStats();
  } catch (err) {
    toast(err.message, "error");
  }
});

/* ================================= GALLERY ============================== */
async function loadGalleryAdmin() {
  const items = await RPH.getGallery();
  $("#galleryCount").textContent = items.length + " foto";
  const wrap = $("#adminGallery");
  if (!items.length) {
    wrap.innerHTML = `<div class="empty">Belum ada foto.</div>`;
    return;
  }
  wrap.innerHTML = items
    .map(
      (g, i) => `
    <div class="ag-item">
      <img src="${g.url || g.image_path}" alt="${esc(g.title || "Foto")}" loading="lazy">
      <button class="ag-del" data-i="${i}" title="Hapus foto">${ic("trash")}</button>
    </div>`
    )
    .join("");

  $$(".ag-del", wrap).forEach((btn) =>
    btn.addEventListener("click", async () => {
      const item = items[Number(btn.dataset.i)];
      if (!confirm("Hapus foto ini?")) return;
      try {
        await RPH.deleteGalleryItem(item);
        toast("Foto dihapus.");
        loadGalleryAdmin();
        loadStats();
      } catch (err) {
        toast(err.message, "error");
      }
    })
  );
}

const fileInput = $("#fileInput");
const dropzone = $("#dropzone");

$("#dropzone").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => uploadFiles([...fileInput.files]));

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add("drag");
  })
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag");
  })
);
dropzone.addEventListener("drop", (e) => {
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
  if (files.length) uploadFiles(files);
});

async function uploadFiles(files) {
  if (!files.length) return;
  const progress = $("#progress");
  const bar = $("#progressBar");
  progress.hidden = false;
  bar.style.width = "0%";
  try {
    await RPH.addGalleryImages(files, (i, total, name) => {
      bar.style.width = Math.round((i / total) * 100) + "%";
      toast(`Mengunggah ${i}/${total}: ${name}`);
    });
    bar.style.width = "100%";
    toast(`${files.length} foto berhasil ditambahkan.`);
    fileInput.value = "";
    setTimeout(() => (progress.hidden = true), 900);
    loadGalleryAdmin();
    loadStats();
  } catch (err) {
    progress.hidden = true;
    toast(err.message, "error");
  }
}

/* ================================ MESSAGES ============================== */
async function loadMessages() {
  const messages = await RPH.getMessages();
  renderMessageList($("#messageList"), messages, false);
  const unread = messages.filter((m) => !m.is_read).length;
  const badge = $("#msgBadge");
  badge.hidden = unread === 0;
  badge.textContent = unread;
  $("#statMessages").textContent = messages.length;
  $("#statUnread").textContent = unread;
}

function renderMessageList(container, messages, compact) {
  if (!messages.length) {
    container.innerHTML = `<div class="empty">Belum ada pesan masuk.</div>`;
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
    <article class="msg ${m.is_read ? "" : "unread"}">
      <div class="msg-head">
        <strong>${esc(m.name)}</strong>
        ${m.is_read ? "" : '<span class="pill">Baru</span>'}
        <time>${fmtDate(m.created_at)}</time>
      </div>
      <div class="msg-meta">
        ${m.email ? `${ic("mail")}<a href="mailto:${esc(m.email)}">${esc(m.email)}</a> · ` : ""}
        ${m.phone ? `${ic("phone")}<a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ""}
      </div>
      <p class="msg-body">${esc(m.message)}</p>
      ${
        compact
          ? ""
          : `<div class="msg-actions">
        <button class="btn btn-outline btn-sm" data-read="${m.id}" data-state="${m.is_read}">
          ${m.is_read ? ic("undo") + "Tandai belum dibaca" : ic("check") + "Tandai sudah dibaca"}
        </button>
        <button class="btn btn-danger btn-sm" data-del="${m.id}">${ic("trash")}Hapus</button>
      </div>`
      }
    </article>`
    )
    .join("");

  $$("[data-read]", container).forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await RPH.markMessage(b.dataset.read, b.dataset.state !== "true");
        loadMessages();
      } catch (err) {
        toast(err.message, "error");
      }
    })
  );
  $$("[data-del]", container).forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus pesan ini?")) return;
      try {
        await RPH.deleteMessage(b.dataset.del);
        toast("Pesan dihapus.");
        loadMessages();
        loadStats();
      } catch (err) {
        toast(err.message, "error");
      }
    })
  );
}

$("#refreshMsg").addEventListener("click", () => {
  loadMessages().then(() => toast("Pesan dimuat ulang."));
});

/* ================================ KEAMANAN ============================== */
async function loadAccount() {
  const user = await RPH.getUser();
  const email = user?.email || (RPH.isCloud ? "—" : RPH.getDemoHint().email);
  $("#accEmail").textContent = email;
  const pill = $("#accMode");
  pill.textContent = RPH.isCloud ? "● Terhubung Supabase" : "● Mode Demo (lokal)";
  pill.classList.toggle("cloud", RPH.isCloud);
  $("#pwNote").textContent = RPH.isCloud
    ? "Kata sandi disimpan di Supabase Auth dan berlaku untuk semua perangkat."
    : "Mode Demo: kata sandi disimpan di browser ini saja. Hubungkan Supabase agar berlaku global.";
  $("#tipMode").textContent = RPH.isCloud
    ? "Saat ini: perubahan sandi diproses oleh Supabase Auth."
    : "Saat ini: mode demo — ganti sandi agar akun demo tidak memakai sandi bawaan.";
}

/* kekuatan sandi: 0..4 */
function pwScore(v) {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^\w\s]/.test(v) || v.length >= 12) s++;
  return Math.min(s, 4);
}
const PW_LABELS = ["—", "Lemah", "Cukup", "Kuat", "Sangat kuat"];
const PW_COLORS = ["transparent", "#e53935", "#fb8c00", "#43a047", "#2e7d32"];

function updateStrength() {
  const v = $("#pwNew").value;
  const s = pwScore(v);
  const bar = $("#pwBar");
  bar.style.width = (s / 4) * 100 + "%";
  bar.style.background = PW_COLORS[s];
  $("#pwHint").textContent = v
    ? `Kekuatan: ${PW_LABELS[s]} — minimal ${RPH.MIN_PASSWORD} karakter.`
    : `Gunakan minimal ${RPH.MIN_PASSWORD} karakter, kombinasi huruf & angka.`;

  const repeat = $("#pwRepeat").value;
  const hint = $("#pwMatch");
  if (!repeat) {
    hint.textContent = "—";
    hint.className = "pw-hint";
  } else if (repeat === v) {
    hint.innerHTML = ic("check-circle") + "Sandi baru cocok.";
    hint.className = "pw-hint ok";
  } else {
    hint.innerHTML = ic("x") + "Sandi baru belum sama.";
    hint.className = "pw-hint bad";
  }
}
["#pwNew", "#pwRepeat"].forEach((sel) => $(sel).addEventListener("input", updateStrength));

$$(".pw-eye").forEach((btn) =>
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.toggle);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.classList.toggle("on", show);
    btn.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  })
);

$("#pwForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cur = $("#pwCurrent").value;
  const next = $("#pwNew").value;
  const rep = $("#pwRepeat").value;

  if (next !== rep) return toast("Konfirmasi kata sandi baru belum sama.", "error");
  if (next.length < RPH.MIN_PASSWORD)
    return toast(`Kata sandi baru minimal ${RPH.MIN_PASSWORD} karakter.`, "error");
  if (pwScore(next) < 2)
    return toast("Kata sandi terlalu lemah. Tambahkan angka atau huruf kapital.", "error");

  const btn = $("#pwBtn");
  btn.disabled = true;
  btn.textContent = "Menyimpan...";
  try {
    await RPH.changePassword(cur, next);
    $("#pwForm").reset();
    updateStrength();
    toast("Kata sandi berhasil diganti. Gunakan sandi baru saat login berikutnya.");
    loadAccount();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = ic("save") + "Simpan Kata Sandi";
  }
});

/* lupa sandi (hanya mode cloud) */
$("#forgotBtn").addEventListener("click", async () => {
  if (!RPH.isCloud) {
    toast("Mode Demo: lihat sandi default di panel bawah, lalu ganti lewat menu Keamanan.", "error");
    return;
  }
  const email = $("#loginEmail").value.trim();
  if (!email) return toast("Isi email admin terlebih dahulu.", "error");
  try {
    await RPH.sendPasswordReset(email);
    toast("Email reset kata sandi sudah dikirim. Periksa kotak masuk Anda.");
  } catch (err) {
    toast(err.message, "error");
  }
});

/* ================================= INIT ================================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeServiceModal();
    setDrawer(false);
  }
});
boot();
