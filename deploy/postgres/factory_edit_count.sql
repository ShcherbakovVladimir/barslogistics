ALTER TABLE factories ADD COLUMN IF NOT EXISTS edit_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_factories_edit_count ON factories(edit_count);
