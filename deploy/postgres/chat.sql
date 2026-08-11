-- Internal user-to-user chat (messages + attachments metadata)

CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chat_conversations_users_ordered CHECK (user_a_id < user_b_id),
    UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_attachments (
    id TEXT PRIMARY KEY,
    uploader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL DEFAULT '',
    attachment_id TEXT REFERENCES chat_attachments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created
    ON chat_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
    ON chat_messages (conversation_id, read_at)
    WHERE read_at IS NULL;
