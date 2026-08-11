-- Sales managers directory — linked to shipments (supply_links)

CREATE TABLE IF NOT EXISTS sales_managers (
  id TEXT PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_managers_active ON sales_managers(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_managers_sort ON sales_managers(sort_order, last_name, first_name);

ALTER TABLE supply_links ADD COLUMN IF NOT EXISTS sales_manager_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supply_links_sales_manager_id_fkey'
  ) THEN
    ALTER TABLE supply_links
      ADD CONSTRAINT supply_links_sales_manager_id_fkey
      FOREIGN KEY (sales_manager_id) REFERENCES sales_managers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_supply_links_sales_manager ON supply_links(sales_manager_id);

INSERT INTO sales_managers (id, last_name, first_name, middle_name, position, full_name, sort_order) VALUES
  (
    'mgr_nosov_dv',
    'Носов',
    'Дмитрий',
    'Викторович',
    'Старший менеджер по работе с ключевыми клиентами',
    'Носов Дмитрий Викторович',
    1
  ),
  (
    'mgr_butkhuzi_gb',
    'Бутхузи',
    'Гиоргий',
    'Бежанович',
    'Менеджер по работе с ключевыми клиентами',
    'Бутхузи Гиоргий Бежанович',
    2
  ),
  (
    'mgr_obolenskiy_ni',
    'Оболенский',
    'Никита',
    'Игоревич',
    'Менеджер по работе с ключевыми клиентами',
    'Оболенский Никита Игоревич',
    3
  ),
  (
    'mgr_sherer_ad',
    'Шерер',
    'Алексей',
    'Дмитриевич',
    'Менеджер по работе с ключевыми клиентами',
    'Шерер Алексей Дмитриевич',
    4
  )
ON CONFLICT (id) DO UPDATE SET
  last_name = EXCLUDED.last_name,
  first_name = EXCLUDED.first_name,
  middle_name = EXCLUDED.middle_name,
  position = EXCLUDED.position,
  full_name = EXCLUDED.full_name,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
