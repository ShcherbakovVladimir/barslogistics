-- Kanban task boards

CREATE TABLE IF NOT EXISTS kanban_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    board_type TEXT NOT NULL
        CHECK (board_type IN ('classic', 'personal', 'team', 'process', 'project', 'swimlanes')),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_boards_owner
    ON kanban_boards (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS kanban_board_members (
    board_id TEXT NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kanban_board_members_user
    ON kanban_board_members (user_id);

CREATE TABLE IF NOT EXISTS kanban_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    wip_limit INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_columns_board
    ON kanban_columns (board_id, position);

CREATE TABLE IF NOT EXISTS kanban_swimlanes (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_swimlanes_board
    ON kanban_swimlanes (board_id, position);

CREATE TABLE IF NOT EXISTS kanban_tasks (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    swimlane_id TEXT REFERENCES kanban_swimlanes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    class_of_service TEXT NOT NULL DEFAULT 'standard'
        CHECK (class_of_service IN ('expedite', 'fixed_date', 'standard', 'intangible')),
    assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE,
    priority INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_column
    ON kanban_tasks (board_id, column_id, position);

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assignee
    ON kanban_tasks (assignee_id)
    WHERE assignee_id IS NOT NULL;
