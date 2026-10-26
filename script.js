"use strict";

const SUPABASE_URL = "https://motqsbtyspznvlucsipe.supabase.co";
const SUPABASE_KEY = "sb_publishable_cJfIMuL0El4p7RxcZkgjUA_uJmz5CWm";

document.getElementById("year").textContent = new Date().getFullYear();

const hint = document.getElementById("download-hint");
let apkUrl = "";
let releaseLoaded = false;

async function loadLatestRelease() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/app_release?select=version,download_url,notes&id=eq.1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rows = await response.json();
    const release = rows[0];

    if (!release || !release.download_url) {
      throw new Error("URL APK belum diatur di admin.");
    }

    const parsedUrl = new URL(release.download_url);

    if (parsedUrl.protocol !== "https:") {
      throw new Error("URL APK harus menggunakan HTTPS.");
    }

    apkUrl = parsedUrl.href;
    releaseLoaded = true;

    if (hint) {
      hint.textContent = release.version
        ? `Versi terbaru: ${release.version}`
        : "Informasi unduhan siap.";
      hint.classList.remove("hint-warning");
    }
  } catch (error) {
    console.error("Gagal memuat rilis terbaru:", error);

    if (hint) {
      hint.textContent =
        "Informasi unduhan gagal dimuat. Coba muat ulang halaman.";
      hint.classList.add("hint-warning");
    }
  }
}

document.querySelectorAll("[data-download]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!releaseLoaded) {
      if (hint) {
        hint.textContent = "Memuat link APK terbaru, tunggu sebentar...";
        hint.classList.remove("hint-warning");
      }

      await loadLatestRelease();
    }

    if (!apkUrl) {
      window.location.href = "https://github.com/hayu-app/web-hayu/releases";
      return;
    }

    window.location.href = apkUrl;
  });
});

loadLatestRelease();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}
