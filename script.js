// Tempel URL APK langsung milikmu di antara tanda kutip.
// Contoh format: https://domain-kamu.com/aplikasi.apk
const APK_URL = "";

document.getElementById("year").textContent = new Date().getFullYear();

const hint = document.getElementById("download-hint");

document.querySelectorAll("[data-download]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (!APK_URL.trim()) {
      hint.textContent = "Link APK belum dipasang. Hubungkan URL APK di script.js.";
      hint.classList.add("hint-warning");
      document.getElementById("download").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }

    if (!/^https:\/\/\S+$/i.test(APK_URL.trim())) {
      hint.textContent = "URL APK harus menggunakan HTTPS dan valid.";
      return;
    }

    window.location.href = APK_URL.trim();
  });
});

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
