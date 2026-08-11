-- Product catalog (TZ §2.3) — dynamic CRUD for manager/admin

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order, name_ru);

INSERT INTO products (id, name_ru, name_en, sort_order) VALUES
  ('slag_met', 'Шлаки мет. пр.', 'Metallurgical slag', 1),
  ('slag_blast', 'Шлаки домен.', 'Blast-furnace slag', 2),
  ('slag_eaf', 'Шлаки электрпеч.', 'EAF slag', 3),
  ('conc_fe', 'Концентрат жлру', 'Iron ore concentrate', 4),
  ('ore_fe', 'Руда желез. пр.', 'Iron ore (processed)', 5),
  ('ore_fe_dom', 'Руда желез. дом.', 'Iron ore (domestic)', 6),
  ('scrap_steel', 'Лом чермет пр.', 'Ferrous scrap (processed)', 7),
  ('scrap_steel_dp', 'Лом чермет д/п', 'Ferrous scrap (direct)', 8),
  ('scraps', 'Скрапы', 'Scrap', 9),
  ('gravel', 'Щебенка', 'Gravel', 10),
  ('pig_iron', 'Чугун пер. ряд.', 'Pig iron (regular)', 11),
  ('pig_iron_hi', 'Чугун пер. выск.', 'Pig iron (high-grade)', 12),
  ('flux_blast', 'Присад. домен.', 'Blast-furnace flux', 13),
  ('scale', 'Окалина чермет.', 'Mill scale', 14),
  ('sponge_iron', 'Железо губчат.', 'Sponge iron', 15),
  ('swarf_steel', 'Стружка чмет пр.', 'Steel swarf', 16),
  ('swarf_coil', 'Стружка ст. вьюн.', 'Coil swarf', 17),
  ('briquettes', 'Огарки желруд.', 'Iron ore briquettes', 18),
  ('briq_steel', 'Брикеты ст. стр.', 'Steel briquettes', 19),
  ('hematite', 'Гематит', 'Hematite', 20)
ON CONFLICT (id) DO NOTHING;
