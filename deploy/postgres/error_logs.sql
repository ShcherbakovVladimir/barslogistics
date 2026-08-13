-- Application error / exception log for admin diagnostics

CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL DEFAULT 'error'
        CHECK (level IN ('error', 'warn', 'fatal')),
    source TEXT NOT NULL DEFAULT 'http'
        CHECK (source IN ('http', 'unhandled', 'process')),
    message TEXT NOT NULL,
    stack TEXT,
    route TEXT,
    status_code INTEGER,
    user_id TEXT,
    username TEXT,
    ip_address TEXT,
    meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp
    ON error_logs (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp
    ON error_logs (level, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_source_timestamp
    ON error_logs (source, timestamp DESC);
