(() => {
  const current = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};

  window.ARAMABUL_ADS_CONFIG = {
    ...current,
    categoryRootAdEnabled: false,
    categoryRootAdSlot: "3244140507",
    districtInlineEnabled: false,
    districtInlineAdAfter: 6,
    adsenseClient: "ca-pub-3016888060216617",
    districtInlineAdSlot: "3244140507",
  };
})();
