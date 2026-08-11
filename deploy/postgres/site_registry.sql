-- Site directory / registry (5 categories of map objects)

CREATE TABLE IF NOT EXISTS site_categories (
    id TEXT PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO site_categories (id, name_ru, name_en, sort_order) VALUES
    ('gok', 'ГОК', 'Mining & processing plant (GOK)', 1),
    ('port', 'Порты', 'Ports', 2),
    ('steel_mill', 'Сталелитейка', 'Steel mill', 3),
    ('coal_mine', 'Угольные шахты', 'Coal mines', 4),
    ('slag_dump', 'Шлакоотвалы', 'Slag dumps', 5)
ON CONFLICT (id) DO UPDATE SET
    name_ru = EXCLUDED.name_ru,
    name_en = EXCLUDED.name_en,
    sort_order = EXCLUDED.sort_order;

ALTER TABLE factories ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';
ALTER TABLE factories ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE factories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE factories ADD COLUMN IF NOT EXISTS kladr_id TEXT DEFAULT '';
ALTER TABLE factories ADD COLUMN IF NOT EXISTS geocode_source TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_factories_type ON factories(type);
CREATE INDEX IF NOT EXISTS idx_factories_active ON factories(is_active);
CREATE INDEX IF NOT EXISTS idx_factories_type_active ON factories(type, is_active);
