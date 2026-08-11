-- Task workspace: correspondence, milestones/approvals, document attachments
-- Files live on disk under TASK_FILES_DIR; metadata + messages in PostgreSQL.

ALTER TABLE kanban_tasks
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE kanban_tasks
SET started_at = COALESCE(started_at, created_at)
WHERE started_at IS NULL;

CREATE TABLE IF NOT EXISTS kanban_task_participants (
    task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'contributor'
        CHECK (role IN ('assignee', 'watcher', 'approver', 'contributor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kanban_task_participants_user
    ON kanban_task_participants (user_id);

CREATE TABLE IF NOT EXISTS kanban_task_milestones (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'awaiting_approval', 'approved', 'rejected')),
    due_date DATE,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_task_milestones_task
    ON kanban_task_milestones (task_id, position);

CREATE TABLE IF NOT EXISTS kanban_task_messages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL DEFAULT '',
    milestone_id TEXT REFERENCES kanban_task_milestones(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_task_messages_task
    ON kanban_task_messages (task_id, created_at);

CREATE TABLE IF NOT EXISTS kanban_task_attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
    message_id TEXT REFERENCES kanban_task_messages(id) ON DELETE SET NULL,
    milestone_id TEXT REFERENCES kanban_task_milestones(id) ON DELETE SET NULL,
    uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_task_attachments_task
    ON kanban_task_attachments (task_id, created_at DESC);

-- Backfill participants from existing assignees / creators
INSERT INTO kanban_task_participants (task_id, user_id, role)
SELECT id, creator_id, 'contributor'
FROM kanban_tasks
ON CONFLICT DO NOTHING;

INSERT INTO kanban_task_participants (task_id, user_id, role)
SELECT id, assignee_id, 'assignee'
FROM kanban_tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO UPDATE SET role = EXCLUDED.role;
