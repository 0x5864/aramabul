(() => {
  const CATEGORY_ROOT_PAGES = new Set([
    "hizmetler.html",
    "kuafor.html",
    "veteriner.html",
    "saglik.html",
    "market.html",
    "keyif.html",
    "hastane.html",
    "banka.html",
    "otel.html",
    "gezi.html",
    "atm.html",
    "kargo.html",
    "noter.html",
    "asm.html",
    "dis-klinikleri.html",
    "duraklar.html",
    "otopark.html",
  ]);

  function hideTopLayerForCategoryPages(options = {}) {
    const { currentPageName } = options;
    if (typeof currentPageName !== "function") {
      return;
    }

    const categoryPage = String(document.body?.dataset?.categoryPage || "").toLocaleLowerCase("tr");
    const pageName = currentPageName();
    const shouldHideHeader =
      categoryPage === "city" ||
      categoryPage === "district" ||
      pageName === "city.html" ||
      pageName.endsWith("-city.html") ||
      pageName.endsWith("-district.html") ||
      CATEGORY_ROOT_PAGES.has(pageName);

    if (!shouldHideHeader) {
      return;
    }

    const headers = document.querySelectorAll(".city-header");
    headers.forEach((headerElement) => {
      if (!(headerElement instanceof HTMLElement)) {
        return;
      }
      headerElement.style.display = "none";
      headerElement.hidden = true;
    });
  }

  window.ARAMABUL_HEADER_SHELL = {
    hideTopLayerForCategoryPages,
  };
})();
