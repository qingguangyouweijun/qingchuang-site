CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register')),
  code_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMP WITH TIME ZONE,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(email, purpose)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_purpose_expires ON email_verification_codes(purpose, expires_at DESC);

DROP TRIGGER IF EXISTS email_verification_codes_updated_at ON email_verification_codes;
CREATE TRIGGER email_verification_codes_updated_at
  BEFORE UPDATE ON email_verification_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();