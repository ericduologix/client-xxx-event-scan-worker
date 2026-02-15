-- 0001_init.sql
-- Initial schema for Event Scan logs

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,                     -- UUID (generated in Worker)
  created_at TEXT NOT NULL,                -- ISO timestamp when the row was inserted

  -- Hierarchical identifiers
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,

  -- Payload fields
  page_url TEXT NOT NULL,
  event_name TEXT NOT NULL,
  key_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,

  event_timestamp TEXT NOT NULL,           -- timestamp from client payload (ISO or epoch-as-string)
  event_date TEXT NOT NULL,                -- YYYY-MM-DD (for deletion / partitioning)
  session_id TEXT NOT NULL,                -- your testing session id

  browser_name TEXT NOT NULL,
  browser_version TEXT NOT NULL
);

-- Indexes for the queries you said you need (by property, plus deletion slices)
CREATE INDEX IF NOT EXISTS idx_logs_property_id_created_at
  ON logs (property_id, created_at);

CREATE INDEX IF NOT EXISTS idx_logs_session_id
  ON logs (session_id);

CREATE INDEX IF NOT EXISTS idx_logs_event_date
  ON logs (event_date);

CREATE INDEX IF NOT EXISTS idx_logs_property_id_session_id
  ON logs (property_id, session_id);

CREATE INDEX IF NOT EXISTS idx_logs_property_id_event_date
  ON logs (property_id, event_date);
