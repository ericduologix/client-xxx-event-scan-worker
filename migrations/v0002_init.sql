-- 0001_init.sql
-- Clean initial schema for validation tracking

-- ============================================================
-- 1) VALIDATION ATTEMPTS (denominator for KPIs)
-- ============================================================

CREATE TABLE IF NOT EXISTS validation_attempts (
  id TEXT PRIMARY KEY,                       -- UUID generated in Worker
  attempt_id TEXT NOT NULL UNIQUE,           -- stable ID per validation attempt (from client)

  created_at TEXT NOT NULL,                  -- server insert timestamp (ISO)

  -- Dimensions
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,

  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,

  session_id TEXT NOT NULL,

  -- Validation context
  page_url TEXT NOT NULL,
  validated_event_name TEXT NOT NULL,        -- e.g. "link.click"

  validation_result TEXT NOT NULL CHECK (
    validation_result IN ('success', 'failure')
  ),

  event_timestamp TEXT NOT NULL,             -- timestamp from client payload
  event_date TEXT NOT NULL,                  -- YYYY-MM-DD (for slicing)

  browser_name TEXT NOT NULL,
  browser_version TEXT NOT NULL,

  validation_duration_ms INTEGER             -- optional performance tracking
);

-- Indexes optimized for your future reporting queries

CREATE INDEX IF NOT EXISTS idx_attempts_event_date
  ON validation_attempts (event_date);

CREATE INDEX IF NOT EXISTS idx_attempts_property_event_date
  ON validation_attempts (property_id, event_date);

CREATE INDEX IF NOT EXISTS idx_attempts_session
  ON validation_attempts (session_id);

CREATE INDEX IF NOT EXISTS idx_attempts_result_event_date
  ON validation_attempts (validation_result, event_date);

CREATE INDEX IF NOT EXISTS idx_attempts_event_name_event_date
  ON validation_attempts (validated_event_name, event_date);


-- ============================================================
-- 2) VALIDATION ISSUES (0..N per attempt)
-- ============================================================

CREATE TABLE IF NOT EXISTS validation_issues (
  id TEXT PRIMARY KEY,                       -- UUID generated in Worker

  attempt_id TEXT NOT NULL,                  -- logical FK to validation_attempts.attempt_id

  created_at TEXT NOT NULL,                  -- server insert timestamp

  -- Repeated dimensions (denormalized intentionally for simpler reporting)
  client_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  session_id TEXT NOT NULL,

  validated_event_name TEXT NOT NULL,

  issue_type TEXT NOT NULL,                  -- e.g. schema | enum | type | missing
  key_name TEXT NOT NULL,                    -- failing key

  event_timestamp TEXT NOT NULL,
  event_date TEXT NOT NULL
);

-- Indexes for issue analysis

CREATE INDEX IF NOT EXISTS idx_issues_attempt_id
  ON validation_issues (attempt_id);

CREATE INDEX IF NOT EXISTS idx_issues_property_event_date
  ON validation_issues (property_id, event_date);

CREATE INDEX IF NOT EXISTS idx_issues_event_name_event_date
  ON validation_issues (validated_event_name, event_date);

CREATE INDEX IF NOT EXISTS idx_issues_issue_type_event_date
  ON validation_issues (issue_type, event_date);

CREATE INDEX IF NOT EXISTS idx_issues_session
  ON validation_issues (session_id);