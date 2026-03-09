(() => {
  const statusNode = document.querySelector("#emailVerifyPageStatus");

  function setStatus(text, isError = false) {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = text;
    statusNode.classList.toggle("is-ok", !isError);
  }

  function readTokenFromLocation() {
    const hashParams = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const fromHash = String(hashParams.get("token") || "").trim();
    if (fromHash) {
      return fromHash;
    }
    return String(searchParams.get("token") || "").trim();
  }

  async function confirmEmailToken(token) {
    const response = await fetch("/api/auth/email-verification/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      throw new Error("invalid_or_expired");
    }
  }

  async function run() {
    const token = readTokenFromLocation();
    if (!token) {
      setStatus("Doğrulama bağlantısı eksik veya hatalı.", true);
      return;
    }

    setStatus("E-posta doğrulanıyor...", false);
    try {
      await confirmEmailToken(token);
      setStatus("E-posta adresin doğrulandı. Artık hesabını güvenle kullanabilirsin.", false);
    } catch (_error) {
      setStatus("Bağlantı geçersiz veya süresi dolmuş. Hesap sayfasından yeni bağlantı gönder.", true);
    }
  }

  void run();
})();
