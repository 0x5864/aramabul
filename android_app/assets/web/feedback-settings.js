(() => {
  const AUTH_SESSION_KEY = "neredeyenir.auth.session.v1";
  const THEME_STORAGE_KEY = "neredeyenir.theme.v1";
  const FEEDBACK_TARGETS = Object.freeze({
    destek: {
      address: "destek@aramabul.com",
      subject: "Genel Konular",
    },
    ortaklik: {
      address: "ortaklik@aramabul.com",
      subject: "İş Birliği Talebi",
    },
    icerik: {
      address: "icerik@aramabul.com",
      subject: "İçerik Düzeltmeleri",
    },
  });

  const feedbackForm = document.querySelector("#settingsFeedbackForm");
  const feedbackName = document.querySelector("#settingsFeedbackName");
  const feedbackEmail = document.querySelector("#settingsFeedbackEmail");
  const feedbackSubject = document.querySelector("#settingsFeedbackSubject");
  const feedbackPhoneAreaCode = document.querySelector("#settingsFeedbackPhoneAreaCode");
  const feedbackPhoneNumber = document.querySelector("#settingsFeedbackPhoneNumber");
  const feedbackMessage = document.querySelector("#settingsFeedbackMessage");
  const feedbackStatus = document.querySelector("#settingsFeedbackStatus");

  function normalizeEmail(value) {
    return String(value || "").trim().toLocaleLowerCase("en-US");
  }

  function setFeedbackStatus(text) {
    if (!feedbackStatus) {
      return;
    }
    feedbackStatus.textContent = text;
    feedbackStatus.classList.toggle("is-ok", !text || text.startsWith("Mesajın "));
  }

  function readTheme() {
    try {
      const raw = String(window.localStorage.getItem(THEME_STORAGE_KEY) || "").trim().toLowerCase();
      return raw === "light" ? "light" : "dark";
    } catch (_error) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    if (typeof window.NEREDEYENIR_SET_THEME === "function") {
      window.NEREDEYENIR_SET_THEME(nextTheme);
      return;
    }
    document.body.classList.toggle("theme-dark", nextTheme === "dark");
    document.body.classList.toggle("theme-light", nextTheme === "light");
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  function readSession() {
    try {
      const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
      const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
      if (!name || !email) {
        return null;
      }
      return { name, email };
    } catch (_error) {
      return null;
    }
  }

  function prefillSession() {
    const session = readSession();
    if (!session) {
      return;
    }

    if (feedbackName instanceof HTMLInputElement && !feedbackName.value.trim()) {
      feedbackName.value = session.name;
    }
    if (feedbackEmail instanceof HTMLInputElement && !feedbackEmail.value.trim()) {
      feedbackEmail.value = session.email;
    }
  }

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = String(feedbackName instanceof HTMLInputElement ? feedbackName.value : "").trim();
      const email = normalizeEmail(feedbackEmail instanceof HTMLInputElement ? feedbackEmail.value : "");
      const subject = String(feedbackSubject instanceof HTMLSelectElement ? feedbackSubject.value : "").trim();
      const areaCode = String(feedbackPhoneAreaCode instanceof HTMLInputElement ? feedbackPhoneAreaCode.value : "").trim();
      const phoneNumber = String(feedbackPhoneNumber instanceof HTMLInputElement ? feedbackPhoneNumber.value : "").trim();
      const message = String(feedbackMessage instanceof HTMLTextAreaElement ? feedbackMessage.value : "").trim();
      const selectedTarget = FEEDBACK_TARGETS[subject];

      if (!name || !email || !selectedTarget || !message) {
        if (feedbackForm instanceof HTMLFormElement) {
          feedbackForm.reportValidity();
        }
        setFeedbackStatus("Lütfen ad, e-posta, konu ve mesaj alanlarını doldur.");
        return;
      }

      const messageLines = [
        `Ad Soyad: ${name}`,
        `E-posta: ${email}`,
      ];

      if (areaCode || phoneNumber) {
        messageLines.push(`Telefon: +90 ${areaCode} ${phoneNumber}`.trim());
      }

      messageLines.push("", message);

      const mailtoHref =
        `mailto:${selectedTarget.address}`
        + `?subject=${encodeURIComponent(selectedTarget.subject)}`
        + `&body=${encodeURIComponent(messageLines.join("\n"))}`;

      setFeedbackStatus("Mesajın seçilen konuya göre hazırlandı.");
      window.location.href = mailtoHref;
    });
  }

  applyTheme(readTheme());
  prefillSession();
})();
