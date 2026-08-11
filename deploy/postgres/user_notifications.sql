-- In-app bell notifications (per user, soft-delete)

CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info'
        CHECK (type IN ('info', 'warning', 'alert', 'success')),
    link_type TEXT,
    link_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
    ON user_notifications (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
    ON user_notifications (user_id)
    WHERE deleted_at IS NULL AND read_at IS NULL;
