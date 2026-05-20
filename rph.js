// HAMBURGER
function toggleMenu() {
  document.getElementById("menu").classList.toggle("active");
}

// GALERI + LIGHTBOX FIX
const gallery = document.getElementById("gallery");

for (let i = 1; i <= 69; i++) {
  const img = document.createElement("img");
  img.src = `galeri/1 (${i}).jpeg`;
  img.loading = "lazy";

  img.addEventListener("click", () => {
    const popup = document.createElement("div");

    popup.style.position = "fixed";
    popup.style.top = 0;
    popup.style.left = 0;
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.background = "rgba(0,0,0,0.8)";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    popup.style.zIndex = "2000";
    popup.style.opacity = "0";
    popup.style.transition = "0.3s";

    const bigImg = document.createElement("img");
    bigImg.src = img.src;
    bigImg.style.maxWidth = "90%";
    bigImg.style.maxHeight = "90%";
    bigImg.style.borderRadius = "10px";

    popup.appendChild(bigImg);
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = "1";
    }, 10);

    popup.addEventListener("click", () => popup.remove());
  });

  gallery.appendChild(img);
}