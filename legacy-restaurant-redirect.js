(() => {
  const DISTRICT_ROUTE_PAGE_BASES = new Set([
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const CITY_ROUTE_PAGE_BASES = new Set([
    "kuafor",
    "veteriner",
    "eczane",
    "keyif",
    "otel",
    "atm",
    "kargo",
    "noter",
    "asm",
    "dis-klinikleri",
    "duraklar",
    "gezi",
    "otopark",
  ]);
  const turkishCharMap = {
    ç: "c",
    ğ: "g",
    ı: "i",
    i: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };

  function safeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeForSearch(value) {
    return String(value || "")
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toSlug(value) {
    return String(value || "")
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (char) => turkishCharMap[char] || char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function firstParam(params, ...keys) {
    for (const key of keys) {
      const value = safeText(params.get(key));
      if (value) {
        return value;
      }
    }
    return "";
  }

  function hasAnyKeyword(searchable, keywords) {
    return keywords.some((keyword) => searchable.includes(keyword));
  }

  function inferPageBase(record) {
    const searchable = normalizeForSearch([record?.cuisine, record?.name].filter(Boolean).join(" "));

    if (!searchable) {
      return "keyif";
    }

    if (hasAnyKeyword(searchable, ["eczane", "pharmacy"])) {
      return "eczane";
    }
    if (hasAnyKeyword(searchable, ["veteriner", "vet"])) {
      return "veteriner";
    }
    if (hasAnyKeyword(searchable, ["kuafor", "berber", "guzellik"])) {
      return "kuafor";
    }
    if (hasAnyKeyword(searchable, ["atm"])) {
      return "atm";
    }
    if (hasAnyKeyword(searchable, ["kargo", "cargo"])) {
      return "kargo";
    }
    if (hasAnyKeyword(searchable, ["noter", "notary"])) {
      return "noter";
    }
    if (hasAnyKeyword(searchable, ["aile sagligi", "aile hekimi", "asm"])) {
      return "asm";
    }
    if (hasAnyKeyword(searchable, ["dentist", "dental", "dis klinigi", "agiz dis"])) {
      return "dis-klinikleri";
    }
    if (hasAnyKeyword(searchable, ["otopark", "parking"])) {
      return "otopark";
    }
    if (hasAnyKeyword(searchable, ["otel", "hotel", "hostel", "resort", "pansiyon", "bungalov", "apart"])) {
      return "otel";
    }
    if (hasAnyKeyword(searchable, ["benzin", "petrol", "akaryakit", "istasyon"])) {
      return "gezi";
    }
    if (hasAnyKeyword(searchable, ["durak", "metro", "tramvay", "otobus", "station"])) {
      return "duraklar";
    }
    if (hasAnyKeyword(searchable, ["market", "supermarket", "bakkal"])) {
      return "market";
    }
    if (hasAnyKeyword(searchable, ["banka", "bank"])) {
      return "banka";
    }
    if (hasAnyKeyword(searchable, ["hastane", "hospital"])) {
      return "hastane";
    }

    return "keyif";
  }

  async function readVenueRecord(params) {
    const sourcePlaceId = firstParam(params, "pid");
    const city = firstParam(params, "il", "sehir");
    const district = firstParam(params, "ilce");
    const venueName = firstParam(params, "mekan", "venue");
    if (!sourcePlaceId && !venueName) {
      return null;
    }

    try {
      const response = await fetch("data/venues.json", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        return null;
      }

      if (sourcePlaceId) {
        const placeMatch = payload.find((record) => {
          return safeText(record?.sourcePlaceId || record?.placeId) === sourcePlaceId;
        });
        if (placeMatch) {
          return placeMatch;
        }
      }

      const normalizedName = normalizeForSearch(venueName);
      const normalizedCity = normalizeForSearch(city);
      const normalizedDistrict = normalizeForSearch(district);

      return payload.find((record) => {
        if (normalizeForSearch(record?.name) !== normalizedName) {
          return false;
        }
        if (normalizedCity && normalizeForSearch(record?.city) !== normalizedCity) {
          return false;
        }
        if (normalizedDistrict && normalizeForSearch(record?.district) !== normalizedDistrict) {
          return false;
        }
        return true;
      }) || null;
    } catch (_error) {
      return null;
    }
  }

  function buildTargetUrl(params, record) {
    const city = safeText(record?.city) || firstParam(params, "il", "sehir");
    const district = safeText(record?.district) || firstParam(params, "ilce");
    const venueName = safeText(record?.name) || firstParam(params, "mekan", "venue");
    const sourcePlaceId = safeText(record?.sourcePlaceId || record?.placeId) || firstParam(params, "pid");
    const pageBase = inferPageBase(record || { name: venueName });

    if (city && district && DISTRICT_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-district.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(city));
      targetUrl.searchParams.set("ilce", toSlug(district));
      if (venueName) {
        targetUrl.searchParams.set("mekan", venueName);
      }
      if (sourcePlaceId) {
        targetUrl.searchParams.set("pid", sourcePlaceId);
      }
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    if (city && CITY_ROUTE_PAGE_BASES.has(pageBase)) {
      const targetUrl = new URL(`${pageBase}-city.html`, window.location.href);
      targetUrl.searchParams.set("sehir", toSlug(city));
      if (venueName) {
        targetUrl.searchParams.set("mekan", venueName);
      }
      if (sourcePlaceId) {
        targetUrl.searchParams.set("pid", sourcePlaceId);
      }
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    if (pageBase) {
      return `${pageBase}.html`;
    }

    if (city) {
      const targetUrl = new URL("city.html", window.location.href);
      targetUrl.searchParams.set("il", toSlug(city));
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    const fallbackName = venueName;
    if (fallbackName) {
      const targetUrl = new URL("search.html", window.location.href);
      targetUrl.searchParams.set("q", fallbackName);
      return `${targetUrl.pathname}${targetUrl.search}`;
    }

    return "search.html";
  }

  async function redirectLegacyRestaurantPage() {
    const params = new URLSearchParams(window.location.search);
    const record = await readVenueRecord(params);
    const targetUrl = buildTargetUrl(params, record);
    window.location.replace(targetUrl);
  }

  redirectLegacyRestaurantPage();
})();
