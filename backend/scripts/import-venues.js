"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { createPool } = require("../db");

const VENUES_JSON_PATH = path.resolve(__dirname, "../../data/venues.json");

const turkishCharMap = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

const UPSERT_SQL = `
  INSERT INTO venues (
    dedupe_key,
    source_place_id,
    source,
    name,
    city,
    district,
    cuisine,
    budget,
    rating,
    user_rating_count,
    address,
    phone,
    email,
    website,
    instagram,
    maps_url,
    photo_uri,
    gallery_photo_uris,
    photo_references,
    review_snippets,
    menu_capabilities,
    service_capabilities,
    atmosphere_capabilities,
    editorial_summary,
    google_details_fetched_at,
    google_photo_fetched_at,
    instagram_fetched_at,
    instagram_manual_override_at,
    instagram_source
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20::jsonb,
    $21::jsonb, $22::jsonb, $23::jsonb, $24, $25, $26, $27, $28, $29
  )
  ON CONFLICT (dedupe_key)
  DO UPDATE SET
    source_place_id = EXCLUDED.source_place_id,
    source = EXCLUDED.source,
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    cuisine = EXCLUDED.cuisine,
    budget = EXCLUDED.budget,
    rating = EXCLUDED.rating,
    user_rating_count = EXCLUDED.user_rating_count,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    instagram = EXCLUDED.instagram,
    maps_url = EXCLUDED.maps_url,
    photo_uri = EXCLUDED.photo_uri,
    gallery_photo_uris = EXCLUDED.gallery_photo_uris,
    photo_references = EXCLUDED.photo_references,
    review_snippets = EXCLUDED.review_snippets,
    menu_capabilities = EXCLUDED.menu_capabilities,
    service_capabilities = EXCLUDED.service_capabilities,
    atmosphere_capabilities = EXCLUDED.atmosphere_capabilities,
    editorial_summary = EXCLUDED.editorial_summary,
    google_details_fetched_at = EXCLUDED.google_details_fetched_at,
    google_photo_fetched_at = EXCLUDED.google_photo_fetched_at,
    instagram_fetched_at = EXCLUDED.instagram_fetched_at,
    instagram_manual_override_at = EXCLUDED.instagram_manual_override_at,
    instagram_source = EXCLUDED.instagram_source,
    updated_at = NOW()
  RETURNING (xmax = 0) AS inserted
`;

function normalizeForKey(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/gu, (char) => turkishCharMap[char] || char)
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function textOrNull(value, maxLength = 5000) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function numberOrNull(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

function intOrNull(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric);
}

function datetimeOrNull(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function arrayOfTexts(value, maxItems = 20, maxLength = 320) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => textOrNull(String(item || ""), maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function venueRowFromRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const city = textOrNull(record.city, 120);
  const district = textOrNull(record.district, 120) || "Merkez";
  const name = textOrNull(record.name, 220);

  if (!city || !name) {
    return null;
  }

  const sourcePlaceId = textOrNull(record.sourcePlaceId, 180);
  const dedupeKeyParts = sourcePlaceId
    ? ["pid", normalizeForKey(sourcePlaceId)]
    : ["name", normalizeForKey(city), normalizeForKey(district), normalizeForKey(name)];
  const dedupeKey = dedupeKeyParts.join(":");

  return {
    dedupeKey,
    sourcePlaceId,
    source: textOrNull(record.source, 80),
    name,
    city,
    district,
    cuisine: textOrNull(record.cuisine, 120),
    budget: textOrNull(record.budget, 16),
    rating: numberOrNull(record.rating),
    userRatingCount: intOrNull(record.userRatingCount),
    address: textOrNull(record.address, 1200),
    phone: textOrNull(record.phone, 80),
    email: textOrNull(record.email, 180),
    website: textOrNull(record.website, 2000),
    instagram: textOrNull(record.instagram, 2000),
    mapsUrl: textOrNull(record.mapsUrl, 2000),
    photoUri: textOrNull(record.photoUri, 2000),
    galleryPhotoUris: arrayOfTexts(record.galleryPhotoUris, 16, 2200),
    photoReferences: arrayOfTexts(record.photoReferences, 30, 320),
    reviewSnippets: arrayOfTexts(record.reviewSnippets, 10, 1200),
    menuCapabilities: arrayOfTexts(record.menuCapabilities, 25, 140),
    serviceCapabilities: arrayOfTexts(record.serviceCapabilities, 25, 140),
    atmosphereCapabilities: arrayOfTexts(record.atmosphereCapabilities, 25, 140),
    editorialSummary: textOrNull(record.editorialSummary, 5000),
    googleDetailsFetchedAt: datetimeOrNull(record.googleDetailsFetchedAt),
    googlePhotoFetchedAt: datetimeOrNull(record.googlePhotoFetchedAt),
    instagramFetchedAt: datetimeOrNull(record.instagramFetchedAt),
    instagramManualOverrideAt: datetimeOrNull(record.instagramManualOverrideAt),
    instagramSource: textOrNull(record.instagramSource, 80),
  };
}

function valuesFromVenueRow(row) {
  return [
    row.dedupeKey,
    row.sourcePlaceId,
    row.source,
    row.name,
    row.city,
    row.district,
    row.cuisine,
    row.budget,
    row.rating,
    row.userRatingCount,
    row.address,
    row.phone,
    row.email,
    row.website,
    row.instagram,
    row.mapsUrl,
    row.photoUri,
    JSON.stringify(row.galleryPhotoUris),
    JSON.stringify(row.photoReferences),
    JSON.stringify(row.reviewSnippets),
    JSON.stringify(row.menuCapabilities),
    JSON.stringify(row.serviceCapabilities),
    JSON.stringify(row.atmosphereCapabilities),
    row.editorialSummary,
    row.googleDetailsFetchedAt,
    row.googlePhotoFetchedAt,
    row.instagramFetchedAt,
    row.instagramManualOverrideAt,
    row.instagramSource,
  ];
}

function recordsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.venues)) {
      return payload.venues;
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  return [];
}

async function run() {
  const rawJson = await fs.readFile(VENUES_JSON_PATH, "utf8");
  const payload = JSON.parse(rawJson);
  const records = recordsFromPayload(payload);

  if (records.length === 0) {
    console.log("[import] no records found");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    await client.query("BEGIN");

    for (let index = 0; index < records.length; index += 1) {
      const venueRow = venueRowFromRecord(records[index]);

      if (!venueRow) {
        skippedCount += 1;
        continue;
      }

      const result = await client.query(UPSERT_SQL, valuesFromVenueRow(venueRow));
      const inserted = result.rows[0] && result.rows[0].inserted === true;

      if (inserted) {
        insertedCount += 1;
      } else {
        updatedCount += 1;
      }

      if ((index + 1) % 1000 === 0) {
        console.log(`[import] processed ${index + 1}/${records.length}`);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(
    `[import] done inserted=${insertedCount} updated=${updatedCount} skipped=${skippedCount} total=${records.length}`,
  );
}

run().catch((error) => {
  console.error("[import] failed", error);
  process.exit(1);
});
