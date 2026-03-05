(() => {
  const current = window.ARAMABUL_ADS_CONFIG && typeof window.ARAMABUL_ADS_CONFIG === "object"
    ? window.ARAMABUL_ADS_CONFIG
    : {};

  window.ARAMABUL_ADS_CONFIG = {
    ...current,
    categoryRootAdEnabled: true,
    categoryRootAdSlot: "REPLACE_WITH_CATEGORY_ROOT_SLOT_ID",
    districtInlineEnabled: true,
    districtInlineAdAfter: 6,
    adsenseClient: "ca-pub-REPLACE_WITH_YOUR_CLIENT_ID",
    districtInlineAdSlot: "REPLACE_WITH_DISTRICT_INLINE_SLOT_ID",
  };
})();
