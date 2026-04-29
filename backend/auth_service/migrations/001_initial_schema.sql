-- ============================================================
--  Forensic Facial Reconstruction System
--  Auth Microservice — Full SQL Schema
--  Compatible with PostgreSQL 14+ and Supabase
--
--  Run once on a fresh database, or apply manually via
--  Supabase SQL Editor or psql.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- Table: users
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        UNIQUE NOT NULL,
    hashed_password TEXT        NOT NULL,
    role            TEXT        NOT NULL DEFAULT 'officer',
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by email (used on every login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─────────────────────────────────────────
-- Table: sessions
--   Stores per-user facial reconstruction sessions.
--   z_current, parameters stored as JSON text.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    z_current   TEXT,                          -- JSON latent vector
    parameters  TEXT,                          -- JSON param dict
    preset      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- Table: audit_logs
--   Immutable audit trail; rows are never updated.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID        REFERENCES sessions (id) ON DELETE SET NULL,
    user_id       UUID        REFERENCES users    (id) ON DELETE SET NULL,
    action        TEXT        NOT NULL,          -- e.g. 'param_change', 'export_image'
    params_before TEXT,                          -- JSON snapshot before change
    params_after  TEXT,                          -- JSON snapshot after change
    image_url     TEXT,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp  ON audit_logs (timestamp DESC);
