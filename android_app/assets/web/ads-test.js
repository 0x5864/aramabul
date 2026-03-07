(() => {
  const logNode = document.getElementById("statusLog");
  const adNode = document.getElementById("adsenseTestUnit");

  if (!logNode || !adNode) {
    return;
  }

  const write = (line) => {
    const now = new Date().toLocaleTimeString("tr-TR");
    logNode.textContent += `\n[${now}] ${line}`;
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get("adtest") === "on") {
    adNode.setAttribute("data-adtest", "on");
    write("data-adtest=on etkin.");
  }

  window.addEventListener("error", (event) => {
    const message = event?.message ? String(event.message) : "bilinmeyen_hata";
    write(`window error: ${message}`);
  });

  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
    write("adsbygoogle.push({}) çağrıldı.");
  } catch (error) {
    write(`adsbygoogle.push hatası: ${error && error.message ? error.message : String(error)}`);
  }

  const observer = new MutationObserver(() => {
    const status = adNode.getAttribute("data-ad-status") || "(yok)";
    write(`data-ad-status değişti: ${status}`);
  });
  observer.observe(adNode, { attributes: true, attributeFilter: ["data-ad-status"] });

  setTimeout(() => {
    const status = adNode.getAttribute("data-ad-status") || "(yok)";
    write(`5sn sonra final data-ad-status: ${status}`);
  }, 5000);
})();
