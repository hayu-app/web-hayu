"use strict";

// Gunakan Project URL dan Publishable key.
// JANGAN gunakan service_role atau secret key di frontend.
const SUPABASE_URL =
  "https://motqsbtyspznvlucsipe.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdHFzYnR5c3B6bnZsdWNzaXBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjI2MzA2MCwiZXhwIjoyMTA3ODM5MDYwfQ.Ri6IBetUnjOsEMBZElJJQg1wvV-EOKkCSuv63T0r7bU";

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const loginSection = $("login-section");
const loginForm = $("login-form");
const panel = $("panel");
const releaseForm = $("release-form");
const loginButton = $("login-button");
const saveButton = $("save-button");

let client = null;
let loadingRelease = false;

function showStatus(message) {
  statusEl.textContent = message;
}

function setSignedIn(signedIn) {
  loginSection.hidden = signedIn;
  panel.hidden = !signedIn;
}

function validConfig() {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
    /^sb_publishable_[A-Za-z0-9_-]+$/.test(SUPABASE_KEY);
}

async function loadRelease() {
  if (!client || loadingRelease) return;

  loadingRelease = true;
  showStatus("Memuat informasi rilis...");

  try {
    const { data, error } = await client
      .from("app_release")
      .select("version, download_url, storage_path, notes")
      .eq("id", 1)
      .single();

    if (error) throw error;

    $("version").value = data.version ?? "";
    $("download_url").value = data.download_url ?? "";
    $("storage_path").value = data.storage_path ?? "";
    $("notes").value = data.notes ?? "";

    showStatus("Informasi rilis berhasil dimuat.");
  } catch (error) {
    showStatus("Gagal memuat rilis: " + error.message);
  } finally {
    loadingRelease = false;
  }
}

async function checkSession() {
  try {
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    const signedIn = Boolean(data.session);
    setSignedIn(signedIn);

    if (signedIn) {
      await loadRelease();
    } else {
      showStatus("Silakan masuk dengan akun admin.");
    }
  } catch (error) {
    setSignedIn(false);
    showStatus("Gagal memeriksa sesi: " + error.message);
  }
}

if (!validConfig()) {
  setSignedIn(false);
  loginButton.disabled = true;
  showStatus(
    "Konfigurasi belum lengkap. Isi Publishable key Supabase " +
    "yang diawali sb_publishable_. Jangan gunakan secret/service_role key."
  );
} else if (!window.supabase?.createClient) {
  setSignedIn(false);
  loginButton.disabled = true;
  showStatus(
    "Library Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang."
  );
} else {
  client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginButton.disabled = true;
    showStatus("Sedang masuk...");

    try {
      const { error } = await client.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("password").value
      });

      if (error) throw error;

      loginForm.reset();
      setSignedIn(true);
      await loadRelease();
    } catch (error) {
      showStatus("Login gagal: " + error.message);
    } finally {
      loginButton.disabled = false;
    }
  });

  $("logout").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();

    if (error) {
      showStatus("Gagal keluar: " + error.message);
      return;
    }

    setSignedIn(false);
    showStatus("Kamu sudah keluar.");
  });

  releaseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    showStatus("Menyimpan perubahan...");

    try {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        setSignedIn(false);
        throw new Error("Sesi berakhir. Silakan masuk kembali.");
      }

      const version = $("version").value.trim();
      const downloadUrl = $("download_url").value.trim();

      if (!version) throw new Error("Versi aplikasi wajib diisi.");

      let parsedUrl;
      try {
        parsedUrl = new URL(downloadUrl);
      } catch {
        throw new Error("URL unduhan tidak valid.");
      }

      if (parsedUrl.protocol !== "https:") {
        throw new Error("URL unduhan harus menggunakan HTTPS.");
      }

      const { data, error } = await client
        .from("app_release")
        .update({
          version,
          download_url: downloadUrl,
          storage_path: $("storage_path").value.trim() || null,
          notes: $("notes").value.trim(),
          updated_at: new Date().toISOString(),
          updated_by: sessionData.session.user.id
        })
        .eq("id", 1)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Tidak ada baris yang diperbarui. Periksa kebijakan RLS " +
          "dan pastikan akunmu terdaftar sebagai admin."
        );
      }

      showStatus("Perubahan rilis berhasil disimpan.");
    } catch (error) {
      showStatus("Gagal menyimpan: " + error.message);
    } finally {
      saveButton.disabled = false;
    }
  });

  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      setSignedIn(false);
      showStatus("Kamu sudah keluar.");
    }
  });

  checkSession();
}
