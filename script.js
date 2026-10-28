"use strict";

const SUPABASE_URL = "https://motqsbtyspznvlucsipe.supabase.co";
const SUPABASE_KEY = "sb_publishable_cJfIMuL0El4p7RxcZkgjUA_uJmz5CWm";
const RELEASES_URL = "https://github.com/hayu-app/web-hayu/releases";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const hint = document.getElementById("download-hint");
let apkUrl = "";
let releaseLoaded = false;
let releasePromise = null;

function setHint(message, warning = false) {
  if (!hint) return;
  hint.textContent = message;
  hint.classList.toggle("hint-warning", warning);
}

async function loadLatestRelease() {
  if (releaseLoaded) return apkUrl;
  if (releasePromise) return releasePromise;

  releasePromise = (async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/app_release?select=version,download_url,notes&id=eq.1`,
        { headers: { apikey: SUPABASE_KEY, Accept: "application/json" }, cache: "no-store" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      const release = rows[0];
      if (!release || !release.download_url) throw new Error("URL APK belum diatur di admin.");

      const parsedUrl = new URL(release.download_url);
      if (parsedUrl.protocol !== "https:") throw new Error("URL APK harus menggunakan HTTPS.");

      apkUrl = parsedUrl.href;
      releaseLoaded = true;
      setHint(release.version ? `Versi terbaru: ${release.version}` : "Link unduhan siap.");
      return apkUrl;
    } catch (error) {
      console.error("Gagal memuat rilis terbaru:", error);
      setHint("Link versi terbaru belum tersedia. Buka halaman rilis Hayu untuk memilih APK.", true);
      return "";
    } finally {
      releasePromise = null;
    }
  })();
  return releasePromise;
}

document.querySelectorAll("[data-download]").forEach((button) => {
  // GitHub Releases remains a working fallback if JavaScript or Supabase fails.
  button.href = RELEASES_URL;
  button.addEventListener("click", (event) => {
    if (releaseLoaded && apkUrl) {
      event.preventDefault();
      window.location.assign(apkUrl);
      return;
    }
    // Do not block the first tap; open Releases while checking the latest URL.
    setHint("Membuka halaman rilis Hayu…");
    loadLatestRelease();
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
