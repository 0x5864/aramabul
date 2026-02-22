CREATE TABLE IF NOT EXISTS venues (
  id BIGSERIAL PRIMARY KEY,
  dedupe_key TEXT NOT NULL,
  source_place_id TEXT,
  source TEXT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  cuisine TEXT,
  budget TEXT,
  rating NUMERIC(3, 2),
  user_rating_count INTEGER,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  maps_url TEXT,
  photo_uri TEXT,
  gallery_photo_uris JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_snippets JSONB NOT NULL DEFAULT '[]'::jsonb,
  menu_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  atmosphere_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  editorial_summary TEXT,
  google_details_fetched_at TIMESTAMPTZ,
  google_photo_fetched_at TIMESTAMPTZ,
  instagram_fetched_at TIMESTAMPTZ,
  instagram_manual_override_at TIMESTAMPTZ,
  instagram_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS venues_dedupe_key_unique
  ON venues (dedupe_key);

CREATE UNIQUE INDEX IF NOT EXISTS venues_source_place_id_unique
  ON venues (source_place_id)
  WHERE source_place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS venues_city_idx
  ON venues (city);

CREATE INDEX IF NOT EXISTS venues_city_district_idx
  ON venues (city, district);

CREATE INDEX IF NOT EXISTS venues_city_district_cuisine_idx
  ON venues (city, district, cuisine);

CREATE INDEX IF NOT EXISTS venues_rating_idx
  ON venues (rating DESC, user_rating_count DESC);

CREATE INDEX IF NOT EXISTS venues_name_idx
  ON venues (name);

CREATE INDEX IF NOT EXISTS venues_name_lower_idx
  ON venues ((LOWER(name)));

CREATE OR REPLACE FUNCTION set_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_venues_updated_at ON venues;

CREATE TRIGGER trg_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION set_venues_updated_at();
