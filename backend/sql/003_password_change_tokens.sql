CREATE TABLE IF NOT EXISTS account_password_change_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  request_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_password_change_tokens_email_idx
  ON account_password_change_tokens (email);

CREATE INDEX IF NOT EXISTS account_password_change_tokens_created_at_idx
  ON account_password_change_tokens (created_at DESC);

CREATE INDEX IF NOT EXISTS account_password_change_tokens_active_idx
  ON account_password_change_tokens (email, expires_at)
  WHERE consumed_at IS NULL;
