"use strict";

const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { createPool } = require("./db");

const HOST = process.env.API_HOST || "127.0.0.1";
const PORT = Number(process.env.API_PORT || process.env.PORT || 8787);
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_LIMIT = 100_000;
const STATIC_ROOT = path.resolve(__dirname, "..");
const HTML_PREVIEW_TIMEOUT_MS = 8000;
const HTML_PREVIEW_MAX_LENGTH = 750_000;

const pool = createPool();
const app = express();

function parseOriginList(rawValue) {
  if (typeof rawValue !== "string") {
    return new Set();
  }

  return new Set(
    rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

const configuredOrigins = parseOriginList(
  process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || "",
);

const devOrigins = new Set([
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:8787",
  "http://localhost:8787",
]);

function isLocalhostOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch (_error) {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (NODE_ENV !== "production" && origin === "null") {
    return true;
  }

  if (configuredOrigins.has(origin)) {
    return true;
  }

  if (NODE_ENV !== "production" && devOrigins.has(origin)) {
    return true;
  }

  if (NODE_ENV !== "production" && isLocalhostOrigin(origin)) {
    return true;
  }

  return false;
}

const corsMiddleware = cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("cors_not_allowed"));
  },
  credentials: false,
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"],
  maxAge: 600,
});

app.disable("x-powered-by");
app.set("trust proxy", NODE_ENV === "production");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()") ;
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: https:",
      [
        "script-src 'self'",
        "https://pagead2.googlesyndication.com",
        "https://googleads.g.doubleclick.net",
        "https://tpc.googlesyndication.com",
        "https://partner.googleadservices.com",
      ].join(" "),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      [
        "connect-src 'self'",
        "https://nominatim.openstreetmap.org",
        "https://pagead2.googlesyndication.com",
        "https://googleads.g.doubleclick.net",
        "https://tpc.googlesyndication.com",
        "https://partner.googleadservices.com",
      ].join(" "),
      [
        "frame-src 'self'",
        "https://www.google.com",
        "https://maps.google.com",
        "https://googleads.g.doubleclick.net",
        "https://tpc.googlesyndication.com",
      ].join(" "),
      "form-action 'self'",
    ].join("; "),
  );
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use("/api", corsMiddleware);
app.options("/api/*", corsMiddleware);

function parseBoundedInt(rawValue, fallbackValue, minValue, maxValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  const rounded = Math.floor(parsed);
  if (rounded < minValue) {
    return minValue;
  }

  if (rounded > maxValue) {
    return maxValue;
  }

  return rounded;
}

function cleanText(value, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return "";
  }

  return cleaned.slice(0, maxLength);
}

function normalizeCategory(value) {
  const category = cleanText(value, 40).toLocaleLowerCase("tr");

  if (!category) {
    return "restoran";
  }

  if (category === "kuafor" || category === "kuaför" || category === "berber") {
    return "kuafor";
  }

  if (category === "veteriner" || category === "veterinary") {
    return "veteriner";
  }

  return category;
}

function firstTextPart(value) {
  const source = cleanText(value, 300);
  if (!source) {
    return "";
  }

  return cleanText(source.split(",")[0] || "", 200);
}

function buildGoogleMapsSearchUrl(queryText) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", cleanText(queryText, 500));
  return mapsUrl.toString();
}

function buildGoogleMapsPlaceLookupUrl(placeId, queryText) {
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", cleanText(queryText || "restoran", 500));
  const safePlaceId = cleanText(placeId, 200);
  if (safePlaceId) {
    mapsUrl.searchParams.set("query_place_id", safePlaceId);
  }
  return mapsUrl.toString();
}

function isPrivateIpv4Host(hostname) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }

  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) {
    return true;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isBlockedHostName(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) {
    return true;
  }

  if (host === "localhost" || host.endsWith(".local")) {
    return true;
  }

  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  return isPrivateIpv4Host(host);
}

function normalizeExternalHttpUrl(rawValue) {
  const raw = cleanText(rawValue, 1200);
  if (!raw) {
    return "";
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_error) {
    return "";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "";
  }

  if (isBlockedHostName(parsed.hostname)) {
    return "";
  }

  return parsed.toString();
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractImageCandidatesFromHtml(html) {
  const source = String(html || "");
  if (!source) {
    return [];
  }

  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/gi,
    /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']image["'][^>]*>/gi,
    /"image"\s*:\s*"([^"]+)"/gi,
    /"thumbnailUrl"\s*:\s*"([^"]+)"/gi,
  ];

  const results = [];
  const seen = new Set();

  patterns.forEach((pattern) => {
    let match = pattern.exec(source);
    while (match) {
      const rawCandidate = decodeHtmlEntities(match[1] || "");
      if (rawCandidate && !seen.has(rawCandidate)) {
        seen.add(rawCandidate);
        results.push(rawCandidate);
      }
      match = pattern.exec(source);
    }
  });

  return results;
}

async function fetchHtmlPreview(pageUrl) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), HTML_PREVIEW_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(pageUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "arama-bul/1.0 (preview-image)",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    return "";
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    return "";
  }

  const html = await response.text();
  return html.slice(0, HTML_PREVIEW_MAX_LENGTH);
}

function resolveAbsoluteImageUrl(rawImageUrl, basePageUrl) {
  const candidate = cleanText(rawImageUrl, 1500);
  if (!candidate) {
    return "";
  }

  let parsed;
  try {
    parsed = new URL(candidate, basePageUrl);
  } catch (_error) {
    return "";
  }

  return normalizeExternalHttpUrl(parsed.toString());
}

function normalizeLookupKey(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
}

function includesLookup(haystack, needle) {
  const normalizedHaystack = normalizeLookupKey(haystack);
  const normalizedNeedle = normalizeLookupKey(needle);
  return Boolean(normalizedHaystack && normalizedNeedle && normalizedHaystack.includes(normalizedNeedle));
}

async function searchPlacesWithNominatim(textQuery, limit) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", textQuery);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "tr");
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "arama-bul/1.0 (local)",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  const seen = new Set();

  return payload
    .map((item) => {
      const displayName = cleanText(item.display_name || "", 300);
      const name = cleanText(item.name || "", 200) || firstTextPart(displayName);
      const uniqueKey = cleanText(item.place_id ? String(item.place_id) : "", 200) || name.toLocaleLowerCase("tr");
      const mapsQuery = cleanText(`${name} ${displayName}`.trim(), 500);
      const locationContext = cleanText(JSON.stringify(item.address || {}), 500);

      return {
        uniqueKey,
        placeId: cleanText(item.place_id ? String(item.place_id) : "", 200),
        name,
        address: displayName,
        locationContext,
        mapsUrl: buildGoogleMapsSearchUrl(mapsQuery || name),
        rating: null,
        userRatingCount: null,
      };
    })
    .filter((place) => {
      if (!place.name || !place.uniqueKey || seen.has(place.uniqueKey)) {
        return false;
      }

      seen.add(place.uniqueKey);
      return true;
    })
    .map(({ uniqueKey: _uniqueKey, ...place }) => place);
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toVenuePayload(row) {
  return {
    sourcePlaceId: row.sourcePlaceId || "",
    source: row.source || "",
    name: row.name || "",
    city: row.city || "",
    district: row.district || "",
    cuisine: row.cuisine || "",
    budget: row.budget || "",
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    userRatingCount:
      row.userRatingCount === null || row.userRatingCount === undefined
        ? null
        : Number(row.userRatingCount),
    address: row.address || "",
    phone: row.phone || "",
    email: row.email || "",
    website: row.website || "",
    instagram: row.instagram || "",
    mapsUrl: row.mapsUrl || "",
    photoUri: row.photoUri || "",
    galleryPhotoUris: Array.isArray(row.galleryPhotoUris) ? row.galleryPhotoUris : [],
    photoReferences: Array.isArray(row.photoReferences) ? row.photoReferences : [],
    reviewSnippets: Array.isArray(row.reviewSnippets) ? row.reviewSnippets : [],
    menuCapabilities: Array.isArray(row.menuCapabilities) ? row.menuCapabilities : [],
    serviceCapabilities: Array.isArray(row.serviceCapabilities) ? row.serviceCapabilities : [],
    atmosphereCapabilities: Array.isArray(row.atmosphereCapabilities)
      ? row.atmosphereCapabilities
      : [],
    editorialSummary: row.editorialSummary || "",
    googleDetailsFetchedAt: toIsoOrNull(row.googleDetailsFetchedAt),
    googlePhotoFetchedAt: toIsoOrNull(row.googlePhotoFetchedAt),
    instagramFetchedAt: toIsoOrNull(row.instagramFetchedAt),
    instagramManualOverrideAt: toIsoOrNull(row.instagramManualOverrideAt),
    instagramSource: row.instagramSource || "",
  };
}

function buildVenueWhereClause(query) {
  const whereParts = [];
  const values = [];

  const city = cleanText(query.il || query.city || "", 80);
  const district = cleanText(query.ilce || query.district || "", 80);
  const cuisine = cleanText(query.kategori || query.category || "", 80);
  const search = cleanText(query.q || "", 120);

  if (city) {
    values.push(city);
    whereParts.push(`city ILIKE $${values.length}`);
  }

  if (district) {
    values.push(district);
    whereParts.push(`district ILIKE $${values.length}`);
  }

  if (cuisine) {
    values.push(cuisine);
    whereParts.push(`cuisine ILIKE $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;
    whereParts.push(
      `(name ILIKE ${placeholder} OR cuisine ILIKE ${placeholder} OR district ILIKE ${placeholder} OR city ILIKE ${placeholder})`,
    );
  }

  return {
    whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "",
    values,
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, message: "database_unreachable", detail: error.message });
  }
});

app.get("/health", (_req, res) => {
  res.redirect(302, "/api/health");
});

app.get("/api/venues", async (req, res, next) => {
  try {
    const page = parseBoundedInt(req.query.page, 1, 1, 1_000_000);
    const limit = parseBoundedInt(req.query.limit, 5_000, 1, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const { whereClause, values } = buildVenueWhereClause(req.query);

    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    const sql = `
      SELECT
        source_place_id AS "sourcePlaceId",
        source,
        name,
        city,
        district,
        cuisine,
        budget,
        rating,
        user_rating_count AS "userRatingCount",
        address,
        phone,
        email,
        website,
        instagram,
        maps_url AS "mapsUrl",
        photo_uri AS "photoUri",
        gallery_photo_uris AS "galleryPhotoUris",
        photo_references AS "photoReferences",
        review_snippets AS "reviewSnippets",
        menu_capabilities AS "menuCapabilities",
        service_capabilities AS "serviceCapabilities",
        atmosphere_capabilities AS "atmosphereCapabilities",
        editorial_summary AS "editorialSummary",
        google_details_fetched_at AS "googleDetailsFetchedAt",
        google_photo_fetched_at AS "googlePhotoFetchedAt",
        instagram_fetched_at AS "instagramFetchedAt",
        instagram_manual_override_at AS "instagramManualOverrideAt",
        instagram_source AS "instagramSource"
      FROM venues
      ${whereClause}
      ORDER BY rating DESC NULLS LAST, user_rating_count DESC NULLS LAST, name ASC
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `;

    const { rows } = await pool.query(sql, values);
    res.json(rows.map(toVenuePayload));
  } catch (error) {
    next(error);
  }
});

app.get("/api/venues/search", async (req, res, next) => {
  try {
    const query = cleanText(req.query.q || "", 120);
    const limit = parseBoundedInt(req.query.limit, 20, 1, 100);

    if (!query || query.length < 2) {
      res.json([]);
      return;
    }

    const sql = `
      SELECT
        source_place_id AS "sourcePlaceId",
        source,
        name,
        city,
        district,
        cuisine,
        budget,
        rating,
        user_rating_count AS "userRatingCount",
        address,
        phone,
        email,
        website,
        instagram,
        maps_url AS "mapsUrl",
        photo_uri AS "photoUri",
        gallery_photo_uris AS "galleryPhotoUris",
        photo_references AS "photoReferences",
        review_snippets AS "reviewSnippets",
        menu_capabilities AS "menuCapabilities",
        service_capabilities AS "serviceCapabilities",
        atmosphere_capabilities AS "atmosphereCapabilities",
        editorial_summary AS "editorialSummary",
        google_details_fetched_at AS "googleDetailsFetchedAt",
        google_photo_fetched_at AS "googlePhotoFetchedAt",
        instagram_fetched_at AS "instagramFetchedAt",
        instagram_manual_override_at AS "instagramManualOverrideAt",
        instagram_source AS "instagramSource"
      FROM venues
      WHERE name ILIKE $1 OR cuisine ILIKE $1
      ORDER BY user_rating_count DESC NULLS LAST, rating DESC NULLS LAST, name ASC
      LIMIT $2
    `;

    const { rows } = await pool.query(sql, [`%${query}%`, limit]);
    res.json(rows.map(toVenuePayload));
  } catch (error) {
    next(error);
  }
});

app.get("/api/districts", async (_req, res, next) => {
  try {
    const sql = `
      SELECT city, district
      FROM venues
      WHERE city IS NOT NULL AND district IS NOT NULL
      ORDER BY city ASC, district ASC
    `;

    const { rows } = await pool.query(sql);
    const cityDistrictMap = {};

    for (const row of rows) {
      const city = cleanText(row.city, 80);
      const district = cleanText(row.district, 80);
      if (!city || !district) {
        continue;
      }

      if (!Array.isArray(cityDistrictMap[city])) {
        cityDistrictMap[city] = [];
      }

      if (!cityDistrictMap[city].includes(district)) {
        cityDistrictMap[city].push(district);
      }
    }

    res.json(cityDistrictMap);
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/search", async (req, res, next) => {
  try {
    const placesApiKey = cleanText(process.env.PLACES_API_KEY || "", 256);
    if (!placesApiKey) {
      res.status(503).json({
        ok: false,
        message: "places_api_key_missing",
        places: [],
      });
      return;
    }

    const city = cleanText(req.query.city || req.query.il || "", 80);
    const district = cleanText(req.query.district || req.query.ilce || "", 80);
    const category = normalizeCategory(req.query.category || "");
    const limit = parseBoundedInt(req.query.limit, 60, 1, 60);

    const rawKeyword = cleanText(req.query.keyword || "restoran", 80);
    const keywordCandidates =
      category === "kuafor"
        ? ["kuaför salonu", "kuaför", "berber", "güzellik salonu", "erkek kuaförü", "kadın kuaförü", "hair salon"]
        : category === "veteriner"
          ? [
              "veteriner kliniği",
              "veteriner",
              "hayvan hastanesi",
              "veteriner hekim",
              "veterinary clinic",
              "pet clinic",
              "pet vet",
            ]
          : [rawKeyword];

    const districtQueries = keywordCandidates
      .map((keyword) => [district, city, keyword].filter(Boolean).join(" ").trim())
      .filter((query) => query.length >= 2);

    const cityQueries = keywordCandidates
      .map((keyword) => [city, keyword].filter(Boolean).join(" ").trim())
      .filter((query) => query.length >= 2);

    const hasDistrict = Boolean(district);
    const queries = hasDistrict
      ? [...new Set([...districtQueries, ...cityQueries])]
      : [...new Set(cityQueries)];

    if (queries.length === 0) {
      res.json({ ok: true, places: [], query: "" });
      return;
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.rating",
      "places.userRatingCount",
      "places.googleMapsUri",
    ].join(",");

    let normalizedPlaces = [];
    let selectedQuery = queries[0];
    let upstreamError = null;
    let source = "none";
    const mergedPlaces = [];
    const seenPlaceKeys = new Set();

    function matchesLocation(place) {
      const text = `${place.name || ""} ${place.address || ""} ${place.locationContext || ""}`;

      if (hasDistrict) {
        return includesLookup(text, district);
      }

      if (city) {
        return includesLookup(text, city);
      }

      return true;
    }

    function mergePlaces(places) {
      for (const place of places) {
        const key =
          cleanText(place.placeId || "", 200) ||
          cleanText(`${place.name}|${place.address}`.toLocaleLowerCase("tr"), 500);

        if (!place.name || !key || seenPlaceKeys.has(key)) {
          continue;
        }

        seenPlaceKeys.add(key);
        mergedPlaces.push(place);

        if (mergedPlaces.length >= limit) {
          return true;
        }
      }

      return false;
    }

    if (placesApiKey) {
      for (const textQuery of queries) {
        const requestBody = {
          textQuery,
          languageCode: "tr",
          regionCode: "TR",
          maxResultCount: Math.min(limit, 20),
        };

        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), 10000);

        let response;
        try {
          response = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": placesApiKey,
              "X-Goog-FieldMask": fieldMask,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutHandle);
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          upstreamError = {
            status: response.status,
            detail: errorText.slice(0, 500),
          };
          continue;
        }

        const payload = await response.json();
        const places = Array.isArray(payload.places) ? payload.places : [];

        const currentPlaces = places
          .map((place) => ({
            placeId: cleanText(place.id || "", 200),
            name: cleanText(place.displayName && place.displayName.text ? place.displayName.text : "", 200),
            address: cleanText(place.formattedAddress || "", 240),
            mapsUrl: cleanText(place.googleMapsUri || "", 1000),
            rating: Number.isFinite(place.rating) ? Number(place.rating) : null,
            userRatingCount: Number.isFinite(place.userRatingCount) ? Number(place.userRatingCount) : null,
          }))
          .filter((place) => place.name)
          .filter(matchesLocation);

        if (currentPlaces.length > 0) {
          selectedQuery = textQuery;
          source = "google";
          const isFull = mergePlaces(currentPlaces);
          if (isFull) {
            break;
          }
        }
      }
    }

    normalizedPlaces = mergedPlaces;

    if (normalizedPlaces.length === 0 && upstreamError) {
      res.status(502).json({
        ok: false,
        message: "places_upstream_error",
        status: upstreamError.status,
        detail: upstreamError.detail,
        places: [],
      });
      return;
    }

    res.json({
      ok: true,
      category,
      query: selectedQuery,
      source,
      upstream: null,
      places: normalizedPlaces,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/places/preview-image", async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    const websiteUrl = normalizeExternalHttpUrl(req.query.website || "");
    const rawMapsUrl = normalizeExternalHttpUrl(req.query.mapsUrl || "");
    const placeId = cleanText(req.query.sourcePlaceId || req.query.placeId || "", 200);
    const name = cleanText(req.query.name || "", 120);
    const district = cleanText(req.query.district || req.query.ilce || "", 80);
    const city = cleanText(req.query.city || req.query.il || "", 80);
    const queryText = cleanText([name, district, city].filter(Boolean).join(" "), 500);

    const pageCandidates = [];
    const seenPages = new Set();
    let websiteIconFallback = "";
    const pushPage = (urlValue) => {
      const pageUrl = normalizeExternalHttpUrl(urlValue);
      if (!pageUrl || seenPages.has(pageUrl)) {
        return;
      }
      seenPages.add(pageUrl);
      pageCandidates.push(pageUrl);
    };

    pushPage(websiteUrl);
    if (websiteUrl) {
      try {
        const iconUrl = new URL("/favicon.ico", websiteUrl).toString();
        websiteIconFallback = normalizeExternalHttpUrl(iconUrl);
      } catch (_error) {
        websiteIconFallback = "";
      }
    }

    if (rawMapsUrl) {
      try {
        const parsed = new URL(rawMapsUrl);
        const host = parsed.hostname.toLowerCase();
        if (host === "www.google.com" || host === "google.com" || host === "maps.google.com") {
          pushPage(rawMapsUrl);
        }
      } catch (_error) {
        // Ignore invalid map URLs.
      }
    }

    if (placeId || queryText) {
      pushPage(buildGoogleMapsPlaceLookupUrl(placeId, queryText));
    }

    for (const pageUrl of pageCandidates) {
      const html = await fetchHtmlPreview(pageUrl);
      if (!html) {
        continue;
      }

      const imageCandidates = extractImageCandidatesFromHtml(html);
      for (const rawImageUrl of imageCandidates) {
        const imageUrl = resolveAbsoluteImageUrl(rawImageUrl, pageUrl);
        if (imageUrl) {
          res.json({
            ok: true,
            imageUrl,
            sourceUrl: pageUrl,
          });
          return;
        }
      }
    }

    if (websiteIconFallback) {
      res.json({
        ok: true,
        imageUrl: websiteIconFallback,
        sourceUrl: websiteUrl,
      });
      return;
    }

    res.json({
      ok: true,
      imageUrl: "",
      sourceUrl: "",
    });
  } catch (error) {
    next(error);
  }
});

const staticCacheMaxAge = NODE_ENV === "production" ? "1h" : 0;
app.use(
  express.static(STATIC_ROOT, {
    index: false,
    maxAge: staticCacheMaxAge,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".json")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  }),
);

app.get("/", (_req, res) => {
  res.sendFile(path.join(STATIC_ROOT, "index.html"));
});

app.get("/city.html", (_req, res) => {
  res.sendFile(path.join(STATIC_ROOT, "city.html"));
});

app.get("/restaurant.html", (_req, res) => {
  res.sendFile(path.join(STATIC_ROOT, "restaurant.html"));
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.status(404).type("text/plain").send("Sayfa bulunamadı");
});

app.use((error, _req, res, _next) => {
  if (error && error.message === "cors_not_allowed") {
    res.status(403).json({ ok: false, message: "cors_blocked" });
    return;
  }

  console.error("[api-error]", error);
  res.status(500).json({
    ok: false,
    message: "unexpected_error",
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[app] env=${NODE_ENV} listening on http://${HOST}:${PORT}`);
});

async function shutdown(signalName) {
  console.log(`[app] ${signalName} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
