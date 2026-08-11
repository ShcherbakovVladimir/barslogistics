-- Sync «Наши площадки» (internal contour) — актуальный список из data/sites/Барс_Наши площадки.csv
--
-- NOT applied on deploy — run manually when the CSV changes:
--   npm run import:our-sites
-- WARNING: resets is_ours on all factories and overwrites the 5 internal sites.

UPDATE factories SET is_ours = FALSE WHERE is_ours = TRUE;

UPDATE factories SET
  name = 'Чусовой',
  type = 'steel_mill',
  holding = '',
  country = 'РФ',
  region = 'Пермский край',
  latitude = 58.2991,
  longitude = 57.8165,
  is_ours = TRUE,
  description = 'скрап',
  address = 'Пермский край, Чусовой, Вильвенская улица, 64Б',
  is_active = TRUE,
  sort_order = 1,
  updated_at = NOW()
WHERE id = '7dur8DgcU9QQdM3ZKyb0marke';

UPDATE factories SET
  name = 'Липецк',
  type = 'steel_mill',
  holding = '',
  country = 'РФ',
  region = 'Липецкая область',
  latitude = 52.549604,
  longitude = 39.598924,
  is_ours = TRUE,
  description = 'Скрап, щебенка',
  address = 'г. Липецк улица чехова, 2а',
  is_active = TRUE,
  sort_order = 2,
  updated_at = NOW()
WHERE id = 'aQOWlcH4hpZYSUfRL1M0marke';

UPDATE factories SET
  name = 'Волжский',
  type = 'steel_mill',
  holding = '',
  country = 'РФ',
  region = 'Волгоградская область',
  latitude = 48.81982,
  longitude = 44.841249,
  is_ours = TRUE,
  description = 'скрап',
  address = 'г. Волжский, 7-я Автодорога д. 28',
  is_active = TRUE,
  sort_order = 3,
  updated_at = NOW()
WHERE id = 'MioQrLLLMc7fgv9s0f10marke';

UPDATE factories SET
  name = 'Красный октябрь',
  type = 'steel_mill',
  holding = '',
  country = 'РФ',
  region = 'Волгоградская область',
  latitude = 48.776444,
  longitude = 44.38318,
  is_ours = TRUE,
  description = 'скрап',
  address = 'г. Волгоград, ул. Ленина 117',
  is_active = TRUE,
  sort_order = 4,
  updated_at = NOW()
WHERE id = 'pVk4KrasnOktbr1170marke';

UPDATE factories SET
  name = 'БМЗ Транзит',
  type = 'steel_mill',
  holding = '',
  country = 'РФ',
  region = 'Жлобин',
  latitude = 52.892256,
  longitude = 30.037822,
  is_ours = TRUE,
  description = 'скрап',
  address = 'г. Жлобин',
  is_active = TRUE,
  sort_order = 5,
  updated_at = NOW()
WHERE id = 'zBm5TranzitZhlob0marke';

INSERT INTO factories (
  id, name, type, holding, country, region, latitude, longitude,
  is_ours, description, code, address, is_active, sort_order, updated_at
)
SELECT
  v.id, v.name, v.type, v.holding, v.country, v.region, v.latitude, v.longitude,
  v.is_ours, v.description, '', v.address, TRUE, v.sort_order, NOW()
FROM (VALUES
  ('7dur8DgcU9QQdM3ZKyb0marke', 'Чусовой', 'steel_mill', '', 'РФ', 'Пермский край', 58.2991::double precision, 57.8165::double precision, TRUE, 'скрап', 'Пермский край, Чусовой, Вильвенская улица, 64Б', 1),
  ('aQOWlcH4hpZYSUfRL1M0marke', 'Липецк', 'steel_mill', '', 'РФ', 'Липецкая область', 52.549604::double precision, 39.598924::double precision, TRUE, 'Скрап, щебенка', 'г. Липецк улица чехова, 2а', 2),
  ('MioQrLLLMc7fgv9s0f10marke', 'Волжский', 'steel_mill', '', 'РФ', 'Волгоградская область', 48.81982::double precision, 44.841249::double precision, TRUE, 'скрап', 'г. Волжский, 7-я Автодорога д. 28', 3),
  ('pVk4KrasnOktbr1170marke', 'Красный октябрь', 'steel_mill', '', 'РФ', 'Волгоградская область', 48.776444::double precision, 44.38318::double precision, TRUE, 'скрап', 'г. Волгоград, ул. Ленина 117', 4),
  ('zBm5TranzitZhlob0marke', 'БМЗ Транзит', 'steel_mill', '', 'РФ', 'Жлобин', 52.892256::double precision, 30.037822::double precision, TRUE, 'скрап', 'г. Жлобин', 5)
) AS v(id, name, type, holding, country, region, latitude, longitude, is_ours, description, address, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM factories f WHERE f.id = v.id);
