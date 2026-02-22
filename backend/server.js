"use strict";

const express = require("express");
const cors = require("cors");
const { createPool } = require("./db");

const HOST = process.env.API_HOST || "127.0.0.1";
const PORT = Number(process.env.API_PORT || process.env.PORT || 8787);
const MAX_LIMIT = 100_000;

const pool = createPool();
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

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
        name,
        city,
        district,
        cuisine,
        rating,
        user_rating_count AS "userRatingCount"
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

app.use((error, _req, res, _next) => {
  console.error("[api-error]", error);
  res.status(500).json({
    ok: false,
    message: "unexpected_error",
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST}:${PORT}`);
});

async function shutdown(signalName) {
  console.log(`[api] ${signalName} received, shutting down...`);
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
