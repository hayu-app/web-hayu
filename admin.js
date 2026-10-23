// Ganti dua nilai ini dengan Project URL dan Publishable key Supabase.
const SUPABASE_URL = "TEMPEL_PROJECT_URL_DI_SINI";
const SUPABASE_KEY = "TEMPEL_PUBLISHABLE_KEY_DI_SINI";

const statusEl = document.getElementById("status");
const loginForm = document.getElementById("login-form");
const releaseForm = document.getElementById("release-form");
const warning = document.getElementById("config-warning");

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("https://supabase.com/dashboard/project/motqsbtyspznvlucsipe") &&
  SUPABASE_KEY &&
  !SUPABASE_KEY.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdHFzYnR5c3B6bnZsdWNzaXBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjI2MzA2MCwiZXhwIjoyMTA3ODM5MDYwfQ.Ri6IBetUnjOsEMBZElJJQg1wvV-EOKkCSuv63T0r7bU");

let client = null;

if (!configured) {
  warning.hidden = false;
  warning.textContent =
    "Isi SUPABASE_URL dan SUPABASE_KEY di admin.js sebelum digunakan.";
  loginForm.hidden = true;
} else if (!window.supabase) {
  warning.hidden = false;
  warning.textContent = "Library Supabase gagal dimuat. Periksa koneksi internet.";
  loginForm.hidden = true;
} else {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function showStatus(message) {
  statusEl.textContent = message;
}

async function loadRelease() {
  const { data, error } = await client
    .from("app_release")
    .select("version,download_url,notes")
    .eq("id", 1)
    .single();

  if (error) {
    showStatus("Gagal membaca data rilis: " + error.message);
    return;
  }

  document.getElementById("version").value = data.version || "";
  document.getElementById("download-url").value = data.download_url || "";
  document.getElementById("notes").value = data.notes || "";
}

async function showSession(session) {
  const signedIn = Boolean(session);
  loginForm.hidden = signedIn;
  releaseForm.hidden = !signedIn;

  if (signedIn) {
    document.getElementById("signed-in").textContent =
      session.user.email || "Admin";
    await loadRelease();
  }
}

if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => showSession(session), 0);
  });

  client.auth.getSession().then(({ data }) => showSession(data.session));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return;

  showStatus("Sedang login...");
  const { error } = await client.auth.signInWithPassword({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  });

  showStatus(error ? "Login gagal: " + error.message : "Login berhasil.");
});

document.getElementById("logout").addEventListener("click", async () => {
  if (!client) return;
  const { error } = await client.auth.signOut();
  showStatus(error ? "Gagal logout: " + error.message : "Kamu sudah logout.");
});

releaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return;

  const version = document.getElementById("version").value.trim();
  const downloadUrl = document.getElementById("download-url").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!/^https:\/\/\S+$/i.test(downloadUrl)) {
    showStatus("URL APK harus menggunakan HTTPS.");
    return;
  }

  const saveButton = document.getElementById("save");
  saveButton.disabled = true;
  showStatus("Menyimpan rilis...");

  const { data: authData } = await client.auth.getUser();
  const { error } = await client
    .from("app_release")
    .update({
      version,
      download_url: downloadUrl,
      notes,
      updated_at: new Date().toISOString(),
      updated_by: authData.user.id
    })
    .eq("id", 1);

  saveButton.disabled = false;
  showStatus(error
    ? "Gagal menyimpan: " + error.message
    : "Rilis berhasil disimpan.");
});
