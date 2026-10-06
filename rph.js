/* =========================================================================
   RPH KRIAN — logika halaman publik
   ========================================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ------------------------------ ICONS ---------------------------------- */
const ICONS = {
  cow: '<path d="M4 7c0-1.5 1-2.5 2.5-2.5C7 3 7.5 3 8 3.5c1 .3 2 .5 4 .5s3-.2 4-.5c.5-.5 1-.5 1.5-.5C19 4.5 20 5.5 20 7c0 1-.5 1.5-1 2v4c0 3-2 6-7 6s-7-3-7-6V9c-.5-.5-1-1-1-2Z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M9 16h6"/>',
  goat: '<path d="M5 6.5C5 5 6 4 7.5 4c.8 0 1.4.4 1.8.9M19 6.5C19 5 18 4 16.5 4c-.8 0-1.4.4-1.8.9"/><path d="M7 9c0-2 2.2-3.5 5-3.5S17 7 17 9v3c0 3.5-2 6.5-5 6.5S7 15.5 7 12V9Z"/><circle cx="10" cy="11" r=".9"/><circle cx="14" cy="11" r=".9"/><path d="M10.5 15h3"/>',
  trade: '<path d="M3 9h18l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 9Z"/><path d="M8 9V6.5A3.5 3.5 0 0 1 11.5 3h1A3.5 3.5 0 0 1 16 6.5V9"/><path d="M9 13v3M15 13v3"/>',
  truck: '<path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
};
const iconSvg = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.cow}</svg>`;
/* ikon dari sprite SVG (menggantikan emoji) */
const ic = (name) => `<svg class="ic"><use href="#i-${name}"></use></svg>`;

/* ------------------------------ TOAST ---------------------------------- */
let toastTimer;
function toast(msg, type = "ok") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast show" + (type === "error" ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3400);
}

/* ----------------------------- NAV / UI -------------------------------- */
const header = $("#header");
const menu = $("#menu");
const hamburger = $("#hamburger");

function setMenu(open) {
  menu.classList.toggle("active", open);
  hamburger.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  document.body.classList.toggle("nav-open", open);
}
hamburger.addEventListener("click", () => setMenu(!menu.classList.contains("active")));
$$(".nav-link, .menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("active")) setMenu(false);
});

window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 40), { passive: true });

/* --------------------- PROGRESS BAR + KEMBALI KE ATAS ------------------ */
const progressEl = $("#scrollProgress");
const toTopBtn = $("#toTop");

function onScrollFx() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressEl.style.width = pct + "%";
  toTopBtn.hidden = window.scrollY < 480;

  /* parallax halus pada hero */
  if (window.scrollY < window.innerHeight) {
    const orbs = $(".hero-orbs");
    const content = $(".hero-content");
    if (orbs) orbs.style.transform = `translate3d(0, ${window.scrollY * 0.28}px, 0)`;
    if (content) {
      content.style.transform = `translate3d(0, ${window.scrollY * 0.1}px, 0)`;
      content.style.opacity = String(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.85)));
    }
  }
}
window.addEventListener("scroll", onScrollFx, { passive: true });
window.addEventListener("resize", onScrollFx);
onScrollFx();

toTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------------------------- HITUNG MUNDUR ---------------------------- */
/* Angka animasi untuk pita statistik */
function animateCount(el, target, dur = 1400) {
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString("id-ID");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Jumlah hari operasional dari teks jam (mis. "Senin–Sabtu, 08.00–16.00") */
function parseOpenDays(text) {
  const t = String(text || "").toLowerCase();
  const days = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
  const range = t.match(/([a-z]+)\s*[–-]\s*([a-z]+)/);
  if (range) {
    const i = days.indexOf(range[1]);
    const j = days.indexOf(range[2]);
    if (i > -1 && j > -1) return ((j - i + days.length) % days.length) + 1;
  }
  const found = days.filter((d) => t.includes(d));
  if (found.length) return found.length;
  const num = t.match(/(\d+)\s*hari/);
  if (num) return Number(num[1]);
  return 6; /* default: Senin–Sabtu */
}

function runCounters() {
  $$(".count").forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    animateCount(el, Number(el.dataset.count) || 0);
  });
}

const statsBand = $(".stats-band");
if (statsBand) {
  const statsIo = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        runCounters();
        statsIo.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  statsIo.observe(statsBand);
}

/* Efek aktif pada menu saat scroll */
const sections = $$("section[id]");
window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY + 140;
    let current = "home";
    sections.forEach((s) => y >= s.offsetTop && (current = s.id));
    $$(".nav-link").forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + current));
  },
  { passive: true }
);

/* ---------------------------- DARK MODE -------------------------------- */
function applyTheme(dark) {
  document.body.classList.toggle("dark-mode", dark);
  $("#themeBtn").innerHTML = dark ? ic("sun") : ic("moon");
  localStorage.setItem("theme", dark ? "dark" : "light");
}
applyTheme(localStorage.getItem("theme") === "dark");
$("#themeBtn").addEventListener("click", () => applyTheme(!document.body.classList.contains("dark-mode")));

/* --------------------------- SCROLL REVEAL ----------------------------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
  { threshold: 0.12 }
);
$$(".reveal").forEach((el) => io.observe(el));

/* =========================== RENDER KONTEN ============================= */
let settings = {};

async function loadSettings() {
  settings = await RPH.getSettings();
  $("#heroTitle").textContent = settings.hero_title || "";
  $("#heroSubtitle").textContent = settings.hero_subtitle || "";
  $("#aboutTitle").textContent = settings.about_title || "Tentang Kami";
  $("#aboutText").textContent = settings.about_text || "";
  $("#stripAddress").textContent = settings.contact_address || "—";
  $("#stripHours").textContent = settings.operating_hours || "—";
  $("#stripPhone").textContent = settings.contact_phone || "—";
  $("#contactAddress").textContent = settings.contact_address || "—";
  $("#contactPhone").textContent = settings.contact_phone || "—";
  $("#contactEmail").textContent = settings.contact_email || "—";
  $("#footerAddress").textContent = settings.contact_address || "—";
  $("#footerPhone").textContent = settings.contact_phone || "—";

  /* tombol telepon pada pita CTA */
  const phone = String(settings.contact_phone || "").trim();
  const cta = $("#ctaPhone");
  if (cta && phone) {
    cta.href = "tel:" + phone.replace(/[^\d+]/g, "");
    $("span", cta).textContent = phone;
  }
  $("#cntDays").dataset.count = parseOpenDays(settings.operating_hours);
  syncStats();

  if (settings.hero_image) $(".hero-bg").style.backgroundImage = `url("${settings.hero_image}")`;
}

/* Perbarui angka statistik lalu jalankan animasi bila pita sudah terlihat */
function syncStats() {
  const svc = $$("#serviceCards .card").length;
  if (svc) $("#cntServices").dataset.count = svc;
  if (galleryData.length) $("#cntGallery").dataset.count = galleryData.length;
  $$(".count").forEach((el) => delete el.dataset.done);
  if (statsBand && statsBand.getBoundingClientRect().top < window.innerHeight * 0.9) runCounters();
}

async function loadServices() {
  const list = await RPH.getServices();
  const wrap = $("#serviceCards");
  wrap.innerHTML = list.length
    ? list
        .map(
          (s, i) => `
      <article class="card reveal" style="transition-delay:${i * 60}ms">
        <div class="card-icon">${iconSvg(s.icon)}</div>
        <h3>${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.description || "")}</p>
      </article>`
        )
        .join("")
    : `<p class="muted">Belum ada layanan.</p>`;
  $$(".reveal", wrap).forEach((el) => io.observe(el));
}

/* ------------------------------ GALERI --------------------------------- */
let galleryData = [];
let visibleCount = 12;
const PAGE = 12;

async function loadGallery() {
  galleryData = await RPH.getGallery();
  renderGallery();
}

function renderGallery() {
  const wrap = $("#gallery");
  const slice = galleryData.slice(0, visibleCount);
  if (!slice.length) {
    wrap.innerHTML = `<div class="gallery-empty">Belum ada foto. Tambahkan lewat <a href="admin.html">Admin Panel</a>.</div>`;
    $("#loadMore").style.display = "none";
    return;
  }
  wrap.innerHTML = slice
    .map(
      (g, i) => `
    <figure data-index="${i}" tabindex="0" role="button" aria-label="Buka foto ${i + 1}">
      <img src="${g.url || g.image_path}" alt="${escapeHtml(g.title || "Dokumentasi RPH Krian")}" loading="lazy">
      <figcaption>${escapeHtml(g.title || "RPH Krian")}</figcaption>
    </figure>`
    )
    .join("");

  $$("#gallery figure").forEach((fig) => {
    const open = () => openLightbox(Number(fig.dataset.index));
    fig.addEventListener("click", open);
    fig.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
  });

  $("#loadMore").style.display = galleryData.length > visibleCount ? "" : "none";
}

$("#loadMore").addEventListener("click", () => {
  visibleCount += PAGE;
  renderGallery();
});

/* ----------------------------- LIGHTBOX -------------------------------- */
let lbIndex = 0;
const lb = $("#lightbox");

function openLightbox(i) {
  lbIndex = i;
  updateLightbox();
  lb.hidden = false;
  document.body.style.overflow = "hidden";
}
function updateLightbox() {
  const item = galleryData[lbIndex];
  if (!item) return;
  $("#lbImg").src = item.url || item.image_path;
  $("#lbCap").textContent = item.title || `Foto ${lbIndex + 1} / ${galleryData.length}`;
}
function closeLightbox() {
  lb.hidden = true;
  document.body.style.overflow = "";
}
function moveLightbox(step) {
  lbIndex = (lbIndex + step + galleryData.length) % galleryData.length;
  updateLightbox();
}

$("#lbClose").addEventListener("click", closeLightbox);
$("#lbPrev").addEventListener("click", (e) => (e.stopPropagation(), moveLightbox(-1)));
$("#lbNext").addEventListener("click", (e) => (e.stopPropagation(), moveLightbox(1)));
lb.addEventListener("click", (e) => e.target === lb && closeLightbox());
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") moveLightbox(1);
  if (e.key === "ArrowLeft") moveLightbox(-1);
});

/* ----------------------------- KONTAK ---------------------------------- */
$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#sendBtn");
  const payload = {
    name: $("#cName").value.trim(),
    email: $("#cEmail").value.trim(),
    phone: $("#cPhone").value.trim(),
    message: $("#cMessage").value.trim(),
  };
  if (!payload.name || !payload.message) return toast("Nama dan pesan wajib diisi.", "error");

  btn.disabled = true;
  btn.textContent = "Mengirim...";
  try {
    await RPH.sendMessage(payload);
    e.target.reset();
    toast("Pesan terkirim. Terima kasih!");
  } catch (err) {
    toast(err.message || "Gagal mengirim pesan.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim Pesan";
  }
});

/* ------------------------------ HELPERS -------------------------------- */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------- INIT ---------------------------------- */
$("#year").textContent = new Date().getFullYear();

(async function init() {
  try {
    await Promise.all([loadSettings(), loadServices(), loadGallery()]);
    syncStats();
  } catch (err) {
    console.error(err);
    toast("Gagal memuat konten: " + err.message, "error");
  }
})();
