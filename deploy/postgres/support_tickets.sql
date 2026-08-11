-- Employee feedback / tech support requests

CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('bug', 'question', 'suggestion', 'other')),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    page_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created
    ON support_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
    ON support_tickets (status, created_at DESC);
