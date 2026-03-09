CREATE TABLE IF NOT EXISTS account_email_verification_status (
  email TEXT PRIMARY KEY,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_email_verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  request_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_email_verification_tokens_email_idx
  ON account_email_verification_tokens (email);

CREATE INDEX IF NOT EXISTS account_email_verification_tokens_created_at_idx
  ON account_email_verification_tokens (created_at DESC);

CREATE INDEX IF NOT EXISTS account_email_verification_tokens_active_idx
  ON account_email_verification_tokens (email, expires_at)
  WHERE consumed_at IS NULL;

CREATE OR REPLACE FUNCTION set_account_email_verification_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_account_email_verification_status_updated_at ON account_email_verification_status;

CREATE TRIGGER trg_account_email_verification_status_updated_at
BEFORE UPDATE ON account_email_verification_status
FOR EACH ROW
EXECUTE FUNCTION set_account_email_verification_status_updated_at();
