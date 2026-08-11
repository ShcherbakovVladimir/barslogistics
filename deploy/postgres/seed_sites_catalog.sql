-- Site catalog seed (generated from data/sites/*.csv). Source of truth: PostgreSQL factories table.
-- Regenerate: npx tsx deploy/generate-sites-seed-sql.ts

INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_1',
          'Баимский ГОК',
          'gok',
          '',
          'РФ',
          'Чукотский АО',
          68,
          166,
          FALSE,
          'Медь',
          '1',
          'Чукотский АО, г. Билибино, ул. Курчатова, 6',
          TRUE,
          1,
          'never',
          'gok|баимский гок|чукотский ао, г. билибино, ул. курчатова, 6',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_2',
          'Тырныаузский ГОК',
          'gok',
          '',
          'РФ',
          'Кабардино-Балкарская Респ.',
          43.3939,
          42.9172,
          FALSE,
          'Вольфрам',
          '2',
          'Кабардино-Балкарская Респ., г. Тырныауз, Эльбрусский пр-кт, д. 19',
          TRUE,
          2,
          'never',
          'gok|тырныаузский гок|кабардино-балкарская респ., г. тырныауз, эльбрусский пр-кт, д. 19',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_3',
          'Сусуманзолото',
          'gok',
          '',
          'РФ',
          'Магаданская обл.',
          62.7833,
          148.1533,
          FALSE,
          'Золото',
          '3',
          'Магаданская обл., г. Магадан, пр-кт Карла Маркса, д. 19/17',
          TRUE,
          3,
          'never',
          'gok|сусуманзолото|магаданская обл., г. магадан, пр-кт карла маркса, д. 19/17',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_4',
          'Михайловский ГОК',
          'gok',
          'Металлинвест',
          'РФ',
          'Курская обл.',
          52.3387,
          35.3629,
          FALSE,
          'Железная руда',
          '4',
          'Курская обл., г. Железногорск, ул. Ленина, д. 21',
          TRUE,
          4,
          'never',
          'gok|михайловский гок|курская обл., г. железногорск, ул. ленина, д. 21',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_5',
          'Лебединский ГОК',
          'gok',
          'ЛГОК',
          'РФ',
          'Белгородская обл.',
          51.2616,
          37.6546,
          FALSE,
          'Железная руда',
          '5',
          'Белгородская обл., г. Губкин, промзона, промплощадка ЛГОКа',
          TRUE,
          5,
          'never',
          'gok|лебединский гок|белгородская обл., г. губкин, промзона, промплощадка лгока',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_6',
          'Стойленский ГОК',
          'gok',
          'Стойленский',
          'РФ',
          'Белгородская обл.',
          51.2976,
          37.8415,
          FALSE,
          'Железная руда',
          '6',
          'Белгородская обл., г. Старый Оскол, площадка Фабричная, пр-д-4',
          TRUE,
          6,
          'never',
          'gok|стойленский гок|белгородская обл., г. старый оскол, площадка фабричная, пр-д-4',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_7',
          'Ковдогский ГОК',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          67.5667,
          30.4833,
          FALSE,
          'Железная руда',
          '7',
          'Мурманская обл., г. Ковдор, ул. Сухачева, д. 5',
          TRUE,
          7,
          'never',
          'gok|ковдогский гок|мурманская обл., г. ковдор, ул. сухачева, д. 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_8',
          'Качканарский ГОК',
          'gok',
          'Евраз',
          'РФ',
          'Свердловская обл.',
          58.7048,
          59.4824,
          FALSE,
          'Железная руда',
          '8',
          'Свердловская обл., г. Качканар, ул. Свердлова, д. 2',
          TRUE,
          8,
          'never',
          'gok|качканарский гок|свердловская обл., г. качканар, ул. свердлова, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_9',
          'Костомукшский ГОК',
          'gok',
          'Северсталь',
          'РФ',
          'Республика Карелия',
          64.5833,
          30.6,
          FALSE,
          'Железная руда',
          '9',
          'Республика Карелия, г. Костомукша',
          TRUE,
          9,
          'never',
          'gok|костомукшский гок|республика карелия, г. костомукша',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_10',
          'Золото Якутии',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          62,
          127,
          FALSE,
          'Золото',
          '10',
          'Республика Саха (Якутия)',
          TRUE,
          10,
          'never',
          'gok|золото якутии|республика саха (якутия)',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_11',
          'Высокогорский ГОК',
          'gok',
          'НПРО «Урал»',
          'РФ',
          'Свердловская обл.',
          57.9052,
          59.9645,
          FALSE,
          'Железная руда, концентрат, агломерат, известняк, дунит, щебень',
          '11',
          'Свердловская обл., г. Нижний Тагил, ул. Фрунзе, д. 17',
          TRUE,
          11,
          'never',
          'gok|высокогорский гок|свердловская обл., г. нижний тагил, ул. фрунзе, д. 17',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_12',
          'Оленегорский ГОК',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          68.1395,
          33.2727,
          FALSE,
          'Железная руда',
          '12',
          'Мурманская обл., г. Оленегорск, пр-кт Ленинградский, д. 2',
          TRUE,
          12,
          'never',
          'gok|оленегорский гок|мурманская обл., г. оленегорск, пр-кт ленинградский, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_13',
          'Быстринский ГОК',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          52,
          117,
          FALSE,
          'Магнетитовый, медный, золотосодержащий концентраты',
          '13',
          'Забайкальский край, г. Чита, ул. Шилова, д. 99Г',
          TRUE,
          13,
          'never',
          'gok|быстринский гок|забайкальский край, г. чита, ул. шилова, д. 99г',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_14',
          'Коршуновский ГОК',
          'gok',
          '',
          'РФ',
          'Иркутская обл.',
          56.5844,
          104.0878,
          FALSE,
          'Железная руда',
          '14',
          'Иркутская обл., г. Железногорск-Илимский, ул. Иващенко, д. 9А/1',
          TRUE,
          14,
          'never',
          'gok|коршуновский гок|иркутская обл., г. железногорск-илимский, ул. иващенко, д. 9а/1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_15',
          'Туганский ГОК',
          'gok',
          '',
          'РФ',
          'Томская обл.',
          56.4,
          85.2,
          FALSE,
          'Ильменитовый, лейкоксеновый, цирконовый концентраты, кварцевые пески',
          '15',
          'Томская обл., Томский р-н, с. Октябрьское, ул. Заводская, д. 100',
          TRUE,
          15,
          'never',
          'gok|туганский гок|томская обл., томский р-н, с. октябрьское, ул. заводская, д. 100',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_16',
          'Гайский ГОК',
          'gok',
          '',
          'РФ',
          'Оренбургская обл.',
          51.4667,
          58.45,
          FALSE,
          'Медный, цинковый концентраты',
          '16',
          'Оренбургская обл., г. Гай, ул. Промышленная, д. 1',
          TRUE,
          16,
          'never',
          'gok|гайский гок|оренбургская обл., г. гай, ул. промышленная, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_17',
          'Сорский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Хакасия',
          54,
          90,
          FALSE,
          'Медный и молибденовый концентраты',
          '17',
          'Республика Хакасия, г. Сорск, тер. Промплощадка',
          TRUE,
          17,
          'never',
          'gok|сорский гок|республика хакасия, г. сорск, тер. промплощадка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_18',
          'Янгелевский ГОК',
          'gok',
          '',
          'РФ',
          'Иркутская обл.',
          56.8,
          104.1,
          FALSE,
          'Кварцевый песок',
          '18',
          'Иркутская обл., г. Иркутск, ул. Ангарская, стр. 16',
          TRUE,
          18,
          'never',
          'gok|янгелевский гок|иркутская обл., г. иркутск, ул. ангарская, стр. 16',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_19',
          'Ловозерский ГОК',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          67.9372,
          34.5647,
          FALSE,
          'Натрий, калий, рубидий, цезий и их соединения',
          '19',
          'Мурманская обл., Ловозерский р-н, пгт Ревда, ул. Комсомольская, д. 23',
          TRUE,
          19,
          'never',
          'gok|ловозерский гок|мурманская обл., ловозерский р-н, пгт ревда, ул. комсомольская, д. 23',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_20',
          'Уральский асбестовый ГОК',
          'gok',
          '',
          'РФ',
          'Свердловская обл.',
          57,
          61.45,
          FALSE,
          'Хризотил',
          '20',
          'Свердловская обл., г. Асбест, ул. Уральская, д. 66',
          TRUE,
          20,
          'never',
          'gok|уральский асбестовый гок|свердловская обл., г. асбест, ул. уральская, д. 66',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_21',
          'Айхальский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          65.9336,
          111.4833,
          FALSE,
          'Алмазы',
          '21',
          'Республика Саха (Якутия), Мирнинский р-н, п. Айхал, ул. Корнилова, д. 3',
          TRUE,
          21,
          'never',
          'gok|айхальский гок|республика саха (якутия), мирнинский р-н, п. айхал, ул. корнилова, д. 3',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_22',
          'Балашейский ГОК',
          'gok',
          '',
          'РФ',
          'Самарская обл.',
          53.2813,
          48.0897,
          FALSE,
          'Кварцевые пески, стекольные пески',
          '22',
          'Самарская обл., Сызранский р-н, пгт Балашейка',
          TRUE,
          22,
          'never',
          'gok|балашейский гок|самарская обл., сызранский р-н, пгт балашейка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_23',
          'Гаринский ГОК',
          'gok',
          '',
          'РФ',
          'Амурская обл.',
          52.581,
          129.1267,
          FALSE,
          'Железная руда',
          '23',
          'Амурская обл., Мазановский р-н',
          TRUE,
          23,
          'never',
          'gok|гаринский гок|амурская обл., мазановский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_24',
          'Бурибаевский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Башкортостан',
          51.9667,
          58.15,
          FALSE,
          'Медь',
          '24',
          'Республика Башкортостан, Хайбуллинский р-н, с. Бурибай, ул. Горького, д. 49',
          TRUE,
          24,
          'never',
          'gok|бурибаевский гок|республика башкортостан, хайбуллинский р-н, с. бурибай, ул. горького, д. 49',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_25',
          'Вишневогорский ГОК',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          55.9875,
          60.6486,
          FALSE,
          'Ниобиевые, циркониевые, титановые, полешпатовые концентраты',
          '25',
          'Челябинская обл., Каслинский р-н, пгт Вишневогорск, ул. Ленина, д. 61',
          TRUE,
          25,
          'never',
          'gok|вишневогорский гок|челябинская обл., каслинский р-н, пгт вишневогорск, ул. ленина, д. 61',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_26',
          'Горевский ГОК',
          'gok',
          '',
          'РФ',
          'Красноярский край',
          58.1167,
          93.1167,
          FALSE,
          'Свинцовый и цинковый концентраты',
          '26',
          'Красноярский край, Мотыгинский р-н, п. Новоангарск, ул. Набережная, д. 5',
          TRUE,
          26,
          'never',
          'gok|горевский гок|красноярский край, мотыгинский р-н, п. новоангарск, ул. набережная, д. 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_27',
          'Жирекенский ГОК',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          52.85,
          117.35,
          FALSE,
          'Концентрат меди, ферромолибден',
          '27',
          'Забайкальский край, Чернышевский р-н, пгт Жирекен',
          TRUE,
          27,
          'never',
          'gok|жирекенский гок|забайкальский край, чернышевский р-н, пгт жирекен',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_28',
          'Киембаевский ГОК',
          'gok',
          '',
          'РФ',
          'Оренбургская обл.',
          50.8836,
          59.9321,
          FALSE,
          'Хризотил, щебень',
          '28',
          'Оренбургская обл., г. Ясный, ул. Ленина, д. 7',
          TRUE,
          28,
          'never',
          'gok|киембаевский гок|оренбургская обл., г. ясный, ул. ленина, д. 7',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_29',
          'Кимкано-Сутарский ГОК',
          'gok',
          '',
          'РФ',
          'Еврейская АО',
          48.7833,
          132.9333,
          FALSE,
          'Железорудный концентрат',
          '29',
          'Еврейская АО, г. Биробиджан, пр-кт 60-летия СССР, д. 22Б',
          TRUE,
          29,
          'never',
          'gok|кимкано сутарский гок|еврейская ао, г. биробиджан, пр-кт 60-летия ссср, д. 22б',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_30',
          'Кичигинский ГОК',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          54.5004,
          61.2654,
          FALSE,
          'Формовочный песок, сухие строительные смеси',
          '30',
          'Челябинская обл., Увельский р-н',
          TRUE,
          30,
          'never',
          'gok|кичигинский гок|челябинская обл., увельский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_31',
          'Миллеровский ГОК',
          'gok',
          '',
          'РФ',
          'Ростовская обл.',
          48.9297,
          40.4147,
          FALSE,
          'Кварцевые пески, глинопорошок, шамот',
          '31',
          'Ростовская обл., г. Миллерово, ул. 3 Интернационала, д. 105',
          TRUE,
          31,
          'never',
          'gok|миллеровский гок|ростовская обл., г. миллерово, ул. 3 интернационала, д. 105',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_32',
          'Кыштымский ГОК',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          55.706,
          60.5559,
          FALSE,
          'Кварцевые концентраты',
          '32',
          'Челябинская обл., г. Кыштым',
          TRUE,
          32,
          'never',
          'gok|кыштымский гок|челябинская обл., г. кыштым',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_33',
          'Томинский ГОК',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          54.8,
          61.2,
          FALSE,
          'Медный концентрат',
          '33',
          'Челябинская обл., с. Томинское',
          TRUE,
          33,
          'never',
          'gok|томинский гок|челябинская обл., с. томинское',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_34',
          'Михеевский ГОК',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          54.2,
          61.2,
          FALSE,
          'Концентрат меди',
          '34',
          'Челябинская обл., п. Красноармейский',
          TRUE,
          34,
          'never',
          'gok|михеевский гок|челябинская обл., п. красноармейский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_35',
          'Мирнинско-Нюрбинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          62.5333,
          113.9667,
          FALSE,
          'Алмазы',
          '35',
          'Республика Саха (Якутия), г. Мирный',
          TRUE,
          35,
          'never',
          'gok|мирнинско нюрбинский гок|республика саха (якутия), г. мирный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_36',
          'Новоангарский ГОК',
          'gok',
          '',
          'РФ',
          'Красноярский край',
          58.1167,
          93.1167,
          FALSE,
          'Свинцовый и цинковый концентраты',
          '36',
          'Красноярский край, п. Новоангарск',
          TRUE,
          36,
          'never',
          'gok|новоангарский гок|красноярский край, п. новоангарск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_37',
          'Новоорловский ГОК',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          51.0333,
          116.3,
          FALSE,
          'Вольфрам',
          '37',
          'Забайкальский край, пгт Новоорловск',
          TRUE,
          37,
          'never',
          'gok|новоорловский гок|забайкальский край, пгт новоорловск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_38',
          'Олёкминский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          56,
          122,
          FALSE,
          'Ильменитовый, титаномагнетитовый концентраты',
          '38',
          'Республика Саха (Якутия), с. Олекма',
          TRUE,
          38,
          'never',
          'gok|олекминский гок|республика саха (якутия), с. олекма',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_39',
          'Солнечный ГОК',
          'gok',
          '',
          'РФ',
          'Хабаровский край',
          50.7167,
          136.6333,
          FALSE,
          'Концентрат олова',
          '39',
          'Хабаровский край, п. Солнечный',
          TRUE,
          39,
          'never',
          'gok|солнечный гок|хабаровский край, п. солнечный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_40',
          'Удачнинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          66.4,
          112.3167,
          FALSE,
          'Алмазы',
          '40',
          'Республика Саха (Якутия), г. Мирный',
          TRUE,
          40,
          'never',
          'gok|удачнинский гок|республика саха (якутия), г. мирный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_41',
          'Урупский ГОК',
          'gok',
          '',
          'РФ',
          'Карачаево-Черкесская Респ.',
          44.2,
          41.1,
          FALSE,
          'Медный концентрат',
          '41',
          'Карачаево-Черкесская Респ., п. Медногорский',
          TRUE,
          41,
          'never',
          'gok|урупский гок|карачаево-черкесская респ., п. медногорский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_42',
          'Учалинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Башкортостан',
          54.3167,
          59.3833,
          FALSE,
          'Медный, цинковый концентраты',
          '42',
          'Республика Башкортостан, г. Учалы',
          TRUE,
          42,
          'never',
          'gok|учалинский гок|республика башкортостан, г. учалы',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_43',
          'ГОК Олений ручей',
          'gok',
          'Группа Акрон',
          'РФ',
          'Мурманская обл.',
          67.6,
          33.6,
          FALSE,
          'Апатитовый концентрат',
          '43',
          'Мурманская обл., г. Кировск',
          TRUE,
          43,
          'never',
          'gok|гок олений ручей|мурманская обл., г. кировск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_44',
          'Байкало-Амурская горнорудная корпорация',
          'gok',
          '',
          'РФ',
          'Амурская обл.',
          55,
          124,
          FALSE,
          'Титаномагнетитовые руды',
          '44',
          'Амурская обл., Тындинский р-н',
          TRUE,
          44,
          'never',
          'gok|байкало амурская горнорудная корпорация|амурская обл., тындинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_45',
          'Комбинат «Пионер»',
          'gok',
          '',
          'РФ',
          'Амурская обл.',
          53.7,
          126,
          FALSE,
          'Золото',
          '45',
          'Амурская обл., с. Тыгда',
          TRUE,
          45,
          'never',
          'gok|комбинат пионер|амурская обл., с. тыгда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_46',
          'Дальнегорский ГОК',
          'gok',
          '',
          'РФ',
          'Приморский край',
          44.55,
          135.5667,
          FALSE,
          'Боросодержащая продукция',
          '46',
          'Приморский край, г. Дальнегорск',
          TRUE,
          46,
          'never',
          'gok|дальнегорский гок|приморский край, г. дальнегорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_47',
          'Березовский рудник',
          'gok',
          '',
          'РФ',
          'Свердловская обл.',
          56.9,
          60.8,
          FALSE,
          'Золото-серебросодержащие сульфидные руды',
          '47',
          'Свердловская обл., г. Березовский',
          TRUE,
          47,
          'never',
          'gok|березовский рудник|свердловская обл., г. березовский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_48',
          'Норильский комбинат',
          'gok',
          '',
          'РФ',
          'Красноярский край',
          69.3333,
          88.2167,
          FALSE,
          'Медно-никелевые руды',
          '48',
          'Красноярский край, г. Норильск',
          TRUE,
          48,
          'never',
          'gok|норильский комбинат|красноярский край, г. норильск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_49',
          'АО «Прииск Соловьёвский»',
          'gok',
          '',
          'РФ',
          'Амурская обл.',
          51,
          126,
          FALSE,
          'Золото',
          '49',
          'Амурская обл., с. Соловьевск',
          TRUE,
          49,
          'never',
          'gok|ао прииск соловьевский|амурская обл., с. соловьевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_50',
          '«Эльконский ГМК»',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          56.8,
          124.3,
          FALSE,
          'Минеральный порошок',
          '50',
          'Республика Саха (Якутия), п. Каменномостский',
          TRUE,
          50,
          'never',
          'gok|эльконский гмк|республика саха (якутия), п. каменномостский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_51',
          'ЕвроХим-ВолгаКалий',
          'gok',
          'Еврохим',
          'РФ',
          'Волгоградская обл.',
          47.6333,
          43.1333,
          FALSE,
          'Калийная руда',
          '51',
          'Волгоградская обл., г. Котельниково',
          TRUE,
          51,
          'never',
          'gok|еврохим волгакалий|волгоградская обл., г. котельниково',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_52',
          'Ковдорский ГОК',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          67.5667,
          30.4833,
          FALSE,
          'Магнетит-апатит-бадделеитовые руды',
          '52',
          'Мурманская обл., г. Ковдор',
          TRUE,
          52,
          'never',
          'gok|ковдорский гок|мурманская обл., г. ковдор',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_53',
          'Пуровский ЗПК',
          'gok',
          'НОВАТЭК',
          'РФ',
          'Ямало-Ненецкий АО',
          64.9167,
          77.7667,
          FALSE,
          'Природный газ и газовый конденсат',
          '53',
          'Ямало-Ненецкий АО, г. Тарко-Сале',
          TRUE,
          53,
          'never',
          'gok|пуровский зпк|ямало-ненецкий ао, г. тарко-сале',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_54',
          'АО «Олкон»',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          68.1395,
          33.2727,
          FALSE,
          'Железорудное сырье',
          '54',
          'Мурманская обл., г. Оленегорск',
          TRUE,
          54,
          'never',
          'gok|ао олкон|мурманская обл., г. оленегорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_55',
          'Яковлевский ГОК',
          'gok',
          'Северсталь',
          'РФ',
          'Белгородская обл.',
          51.0167,
          37.4333,
          FALSE,
          'Железная руда',
          '55',
          'Белгородская обл., п. Яковлево',
          TRUE,
          55,
          'never',
          'gok|яковлевский гок|белгородская обл., п. яковлево',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_56',
          'Бурятзолото',
          'gok',
          '',
          'РФ',
          'Республика Бурятия',
          51.8333,
          107.6,
          FALSE,
          'Золото',
          '56',
          'Республика Бурятия, г. Улан-Удэ',
          TRUE,
          56,
          'never',
          'gok|бурятзолото|республика бурятия, г. улан-удэ',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_57',
          'Мангазея Золото',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          52,
          117,
          FALSE,
          'Золото',
          '57',
          'Забайкальский край, г. Чита',
          TRUE,
          57,
          'never',
          'gok|мангазея золото|забайкальский край, г. чита',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_58',
          'Янглевский ГОК',
          'gok',
          '',
          'РФ',
          'Иркутская обл.',
          56.8,
          104.1,
          FALSE,
          'Кварцевый песок',
          '58',
          'Иркутская обл., р.п. Янгель',
          TRUE,
          58,
          'never',
          'gok|янглевский гок|иркутская обл., р.п. янгель',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_59',
          'Карельский окатыш',
          'gok',
          '',
          'РФ',
          'Республика Карелия',
          64.5833,
          30.6,
          FALSE,
          'Железорудное сырье',
          '59',
          'Республика Карелия, г. Костомукша',
          TRUE,
          59,
          'never',
          'gok|карельский окатыш|республика карелия, г. костомукша',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_60',
          'Евразруда',
          'gok',
          'Евраз Груп',
          'РФ',
          'Кемеровская обл.',
          52.7833,
          87.8667,
          FALSE,
          'Железная руда',
          '60',
          'Кемеровская обл., г. Таштагол',
          TRUE,
          60,
          'never',
          'gok|евразруда|кемеровская обл., г. таштагол',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_61',
          'ООО «ГРК «Быстринское»',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          52,
          117,
          FALSE,
          'Медный, магнетитовый, золотосодержащий концентраты',
          '61',
          'Забайкальский край, г. Чита',
          TRUE,
          61,
          'never',
          'gok|ооо грк быстринское|забайкальский край, г. чита',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_62',
          'Жипхегенский щебеночный завод (ЖЩЗ)',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          51.2,
          112,
          FALSE,
          'Гранитный щебень',
          '62',
          'Забайкальский край, п. Жипхеген',
          TRUE,
          62,
          'never',
          'gok|жипхегенский щебеночный завод жщз|забайкальский край, п. жипхеген',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_63',
          'Раменский ГОК (РГОК)',
          'gok',
          '',
          'РФ',
          'Московская обл.',
          55.55,
          38.2,
          FALSE,
          'Кварциты, кварцевая мука, песок',
          '63',
          'Московская обл., с. Еганово',
          TRUE,
          63,
          'never',
          'gok|раменский гок ргок|московская обл., с. еганово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_64',
          'Quarzwerke Russia',
          'gok',
          '',
          'РФ',
          'Ульяновск',
          54.3167,
          48.4,
          FALSE,
          'Кварцевый песок',
          '64',
          'г. Ульяновск',
          TRUE,
          64,
          'never',
          'gok|quarzwerke russia|г. ульяновск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_65',
          'ГОК Наседкино',
          'gok',
          '',
          'РФ',
          'Кемеровская обл.',
          54,
          88,
          FALSE,
          'Золотоносная руда, золото',
          '65',
          'Кемеровская обл., с. Широкая',
          TRUE,
          65,
          'never',
          'gok|гок наседкино|кемеровская обл., с. широкая',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_66',
          'Торговый дом Бест Гранит',
          'gok',
          '',
          'РФ',
          'Екатеринбург',
          56.8,
          60.6,
          FALSE,
          'Щебень',
          '66',
          'г. Екатеринбург',
          TRUE,
          66,
          'never',
          'gok|торговый дом бест гранит|г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_67',
          'Северский гранитный карьер',
          'gok',
          '',
          'РФ',
          'Екатеринбург',
          56.8,
          60.6,
          FALSE,
          'Щебень',
          '67',
          'г. Екатеринбург',
          TRUE,
          67,
          'never',
          'gok|северский гранитный карьер|г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_68',
          'АЛРОСА',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          62.5333,
          113.9667,
          FALSE,
          'Алмазы',
          '68',
          'Республика Саха (Якутия), г. Мирный',
          TRUE,
          68,
          'never',
          'gok|алроса|республика саха (якутия), г. мирный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_69',
          'Апатит',
          'gok',
          '',
          'РФ',
          'Москва',
          55.75,
          37.6,
          FALSE,
          'Руда',
          '69',
          'г. Москва',
          TRUE,
          69,
          'never',
          'gok|апатит|г. москва',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_70',
          'Студеновская акционерная горнодобывающая компания (Стагдок)',
          'gok',
          '',
          'РФ',
          'Липецкая обл.',
          52.8,
          39,
          FALSE,
          'Флюсовые известняки',
          '70',
          'Липецкая обл., с. Ильино',
          TRUE,
          70,
          'never',
          'gok|студеновская акционерная горнодобывающая компания стагдок|липецкая обл., с. ильино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_71',
          'Комбинат КМАруда',
          'gok',
          '',
          'РФ',
          'Белгородская обл.',
          51.2833,
          37.55,
          FALSE,
          'Коксующийся уголь, железная руда, чугун',
          '71',
          'Белгородская обл., г. Губкин',
          TRUE,
          71,
          'never',
          'gok|комбинат кмаруда|белгородская обл., г. губкин',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_72',
          'Кварц',
          'gok',
          '',
          'РФ',
          'Ульяновская обл.',
          54.3167,
          48.4,
          FALSE,
          'Кварц',
          '72',
          'Ульяновская обл., рп Силикатный',
          TRUE,
          72,
          'never',
          'gok|кварц|ульяновская обл., рп силикатный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_73',
          'Полярный кварц',
          'gok',
          '',
          'РФ',
          'ХМАО-Югра',
          62.1333,
          65.3833,
          FALSE,
          'Кварц',
          '73',
          'ХМАО-Югра, г. Нягань',
          TRUE,
          73,
          'never',
          'gok|полярный кварц|хмао-югра, г. нягань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_74',
          'Сибирцевский щебеночный завод',
          'gok',
          '',
          'РФ',
          'Приморский край',
          44.2,
          132.3,
          FALSE,
          'Щебень',
          '74',
          'Приморский край, п. Сибирцево',
          TRUE,
          74,
          'never',
          'gok|сибирцевский щебеночный завод|приморский край, п. сибирцево',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_75',
          'Балахнинский горно-обогатительный комбинат (Балкум)',
          'gok',
          '',
          'РФ',
          'Нижегородская обл.',
          56.45,
          43.6,
          FALSE,
          'Формовочный, стекольный песок',
          '75',
          'Нижегородская обл., Балахнинский р-н, рп Гидроторф',
          TRUE,
          75,
          'never',
          'gok|балахнинский горно обогатительный комбинат балкум|нижегородская обл., балахнинский р-н, рп гидроторф',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_76',
          'Ключевская обогатительная фабрика (КОФ)',
          'gok',
          '',
          'РФ',
          'Свердловская обл.',
          56.5,
          60.65,
          FALSE,
          'Ферросплавы, лигатуры',
          '76',
          'Свердловская обл., п. Двуреченск',
          TRUE,
          76,
          'never',
          'gok|ключевская обогатительная фабрика коф|свердловская обл., п. двуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_77',
          'ООО «Кварцевые пески»',
          'gok',
          '',
          'РФ',
          'Тульская обл.',
          54,
          37,
          FALSE,
          'Формовочный, кварцевый, стекольный песок',
          '77',
          'Тульская обл., д. Березовый Овраг',
          TRUE,
          77,
          'never',
          'gok|ооо кварцевые пески|тульская обл., д. березовый овраг',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_78',
          'Уралграфит',
          'gok',
          '',
          'РФ',
          'Челябинская обл.',
          55.706,
          60.5559,
          FALSE,
          'Графит',
          '78',
          'Челябинская обл., г. Кыштым',
          TRUE,
          78,
          'never',
          'gok|уралграфит|челябинская обл., г. кыштым',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_79',
          'Режникель',
          'gok',
          '',
          'РФ',
          'Свердловская обл.',
          57.3667,
          61.3833,
          FALSE,
          'Никелевые руды',
          '79',
          'Свердловская обл., г. Реж',
          TRUE,
          79,
          'never',
          'gok|режникель|свердловская обл., г. реж',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_81',
          'Таштагольский ГОК',
          'gok',
          '',
          'РФ',
          'Кемеровская обл.',
          52.7833,
          87.8667,
          FALSE,
          'Железная руда',
          '81',
          'Кемеровская обл., г. Таштагол',
          TRUE,
          81,
          'never',
          'gok|таштагольский гок|кемеровская обл., г. таштагол',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_82',
          'Кимканский ГОК',
          'gok',
          '',
          'РФ',
          'Еврейская АО',
          49,
          132,
          FALSE,
          'Железорудный концентрат',
          '82',
          'Еврейская АО, с. Кимкан',
          TRUE,
          82,
          'never',
          'gok|кимканский гок|еврейская ао, с. кимкан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_83',
          'Сибайский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Башкортостан',
          52.7,
          58.65,
          FALSE,
          'Медный, цинковый концентраты',
          '83',
          'Республика Башкортостан, г. Сибай',
          TRUE,
          83,
          'never',
          'gok|сибайский гок|республика башкортостан, г. сибай',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_84',
          'Удоканский ГОК',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          56,
          118,
          FALSE,
          'Медный концентрат',
          '84',
          'Забайкальский край, Каларский р-н',
          TRUE,
          84,
          'never',
          'gok|удоканский гок|забайкальский край, каларский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_85',
          'Южуралникель',
          'gok',
          '',
          'РФ',
          'Оренбургская обл.',
          51.2,
          58.6167,
          FALSE,
          'Никелевый концентрат',
          '85',
          'Оренбургская обл., г. Орск',
          TRUE,
          85,
          'never',
          'gok|южуралникель|оренбургская обл., г. орск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_86',
          'ГМК «Дальполиметалл»',
          'gok',
          '',
          'РФ',
          'Приморский край',
          44.55,
          135.5667,
          FALSE,
          'Свинцовый, цинковый концентраты',
          '86',
          'Приморский край, г. Дальнегорск',
          TRUE,
          86,
          'never',
          'gok|гмк дальполиметалл|приморский край, г. дальнегорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_87',
          'Кольский Апатит',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          67.6,
          33.6,
          FALSE,
          'Апатитовый, нефелиновый концентраты',
          '87',
          'Мурманская обл., г. Кировск',
          TRUE,
          87,
          'never',
          'gok|кольский апатит|мурманская обл., г. кировск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_88',
          'Восточно-Сибирский ГОК',
          'gok',
          '',
          'РФ',
          'Иркутская обл.',
          52.75,
          103.65,
          FALSE,
          'Апатит-штаффелитовый концентрат',
          '88',
          'Иркутская обл., г. Усолье-Сибирское',
          TRUE,
          88,
          'never',
          'gok|восточно сибирский гок|иркутская обл., г. усолье-сибирское',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_89',
          'Холбинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Бурятия',
          52,
          111,
          FALSE,
          'Золотосодержащая руда',
          '89',
          'Республика Бурятия, п. Городок',
          TRUE,
          89,
          'never',
          'gok|холбинский гок|республика бурятия, п. городок',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_90',
          'Соврудник',
          'gok',
          '',
          'РФ',
          'Хабаровский край',
          49,
          140,
          FALSE,
          'Золотосодержащая руда',
          '90',
          'Хабаровский край, г. Советская Гавань',
          TRUE,
          90,
          'never',
          'gok|соврудник|хабаровский край, г. советская гавань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_91',
          'Каральвеемский ГОК',
          'gok',
          '',
          'РФ',
          'Чукотский АО',
          67,
          174,
          FALSE,
          'Золотосодержащая руда',
          '91',
          'Чукотский АО',
          TRUE,
          91,
          'never',
          'gok|каральвеемский гок|чукотский ао',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_92',
          'Многовершинный ГОК',
          'gok',
          '',
          'РФ',
          'Хабаровский край',
          50,
          140,
          FALSE,
          'Золотосодержащая руда',
          '92',
          'Хабаровский край, п. Многовершинный',
          TRUE,
          92,
          'never',
          'gok|многовершинный гок|хабаровский край, п. многовершинный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_93',
          'Нежданинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          62,
          138,
          FALSE,
          'Золотосодержащая руда',
          '93',
          'Республика Саха (Якутия)',
          TRUE,
          93,
          'never',
          'gok|нежданинский гок|республика саха (якутия)',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_94',
          'Мирнинский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          62.5333,
          113.9667,
          FALSE,
          'Алмазы',
          '94',
          'Республика Саха (Якутия), г. Мирный',
          TRUE,
          94,
          'never',
          'gok|мирнинский гок|республика саха (якутия), г. мирный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_95',
          'Архангельский ГОК',
          'gok',
          '',
          'РФ',
          'Архангельская обл.',
          65.25,
          41,
          FALSE,
          'Алмазы',
          '95',
          'Архангельская обл., п. Новый',
          TRUE,
          95,
          'never',
          'gok|архангельский гок|архангельская обл., п. новый',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_96',
          'Тельмановский ГОК',
          'gok',
          '',
          'РФ',
          'Алтайский край',
          53,
          84,
          FALSE,
          'Магнезит',
          '96',
          'Алтайский край, п. Тельмана',
          TRUE,
          96,
          'never',
          'gok|тельмановский гок|алтайский край, п. тельмана',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_97',
          'Соликамский магниевый завод',
          'gok',
          '',
          'РФ',
          'Пермский край',
          59.6333,
          56.7667,
          FALSE,
          'Магний, титановый шлак',
          '97',
          'Пермский край, г. Соликамск',
          TRUE,
          97,
          'never',
          'gok|соликамский магниевый завод|пермский край, г. соликамск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_98',
          'Ярегский нефтетитановый комбинат',
          'gok',
          '',
          'РФ',
          'Республика Коми',
          63.4167,
          53.4167,
          FALSE,
          'Титановая руда, нефть',
          '98',
          'Республика Коми, п. Ярега',
          TRUE,
          98,
          'never',
          'gok|ярегский нефтетитановый комбинат|республика коми, п. ярега',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_99',
          'Кольская ГМК',
          'gok',
          '',
          'РФ',
          'Мурманская обл.',
          67.9333,
          32.8167,
          FALSE,
          'Медь, никель, кобальт',
          '99',
          'Мурманская обл., г. Мончегорск',
          TRUE,
          99,
          'never',
          'gok|кольская гмк|мурманская обл., г. мончегорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_100',
          'Приаргунское ПХГКО',
          'gok',
          '',
          'РФ',
          'Забайкальский край',
          50.1,
          118,
          FALSE,
          'Уран',
          '100',
          'Забайкальский край, г. Краснокаменск',
          TRUE,
          100,
          'never',
          'gok|приаргунское пхгко|забайкальский край, г. краснокаменск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_101',
          'Хиагдинское ППГХО',
          'gok',
          '',
          'РФ',
          'Республика Бурятия',
          53,
          113,
          FALSE,
          'Уран',
          '101',
          'Республика Бурятия, п. Багдарин',
          TRUE,
          101,
          'never',
          'gok|хиагдинское ппгхо|республика бурятия, п. багдарин',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_102',
          'Дальневосточный ГОК «Солнечный»',
          'gok',
          '',
          'РФ',
          'Хабаровский край',
          50.7167,
          136.6333,
          FALSE,
          'Оловянный концентрат',
          '102',
          'Хабаровский край, г. Солнечный',
          TRUE,
          102,
          'never',
          'gok|дальневосточный гок солнечный|хабаровский край, г. солнечный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_103',
          'Эльконский ГОК',
          'gok',
          '',
          'РФ',
          'Республика Саха (Якутия)',
          56.8,
          124.3,
          FALSE,
          'Уран',
          '103',
          'Республика Саха (Якутия)',
          TRUE,
          103,
          'never',
          'gok|эльконский гок|республика саха (якутия)',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_104',
          'ОАО «Беларуськалий»',
          'gok',
          '',
          'Беларусь',
          'Минск',
          53.8833,
          27.55,
          FALSE,
          'Калийные (сильвинитовые) соли',
          '104',
          'г. Минск',
          TRUE,
          104,
          'never',
          'gok|оао беларуськалий|г. минск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_105',
          'ОАО «Белорусский цементный завод»',
          'gok',
          '',
          'Беларусь',
          'Могилёвская обл.',
          53.3369,
          32.0553,
          FALSE,
          'Мергель и мел',
          '105',
          'Могилёвская обл., г. Костюковичи',
          TRUE,
          105,
          'never',
          'gok|оао белорусский цементный завод|могилевская обл., г. костюковичи',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_106',
          'ОАО «Красносельскстройматериалы»',
          'gok',
          '',
          'Беларусь',
          'Гродненская обл.',
          53.2708,
          24.4292,
          FALSE,
          'Мел и мергель',
          '106',
          'Гродненская обл., Волковысский р-н, п. Красносельский',
          TRUE,
          106,
          'never',
          'gok|оао красносельскстройматериалы|гродненская обл., волковысский р-н, п. красносельский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_107',
          'ОАО «Доломит»',
          'gok',
          '',
          'Беларусь',
          'Витебск',
          55.1833,
          30.2,
          FALSE,
          'Доломитовая порода',
          '107',
          'г. Витебск',
          TRUE,
          107,
          'never',
          'gok|оао доломит|г. витебск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_108',
          'ОАО «Гранит»',
          'gok',
          '',
          'Беларусь',
          'Брестская обл.',
          52.2167,
          27.4833,
          FALSE,
          'Гранит',
          '108',
          'Брестская обл., п. Микашевичи',
          TRUE,
          108,
          'never',
          'gok|оао гранит|брестская обл., п. микашевичи',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_109',
          'РУПП «Гранит»',
          'gok',
          '',
          'Беларусь',
          'Гродненская обл.',
          53.6,
          24.5167,
          FALSE,
          'ПГС, песок, гравий',
          '109',
          'Гродненская обл., г. Щучин',
          TRUE,
          109,
          'never',
          'gok|рупп гранит|гродненская обл., г. щучин',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_110',
          'Нежинский ГОК',
          'gok',
          'ОАО «Беларуськалий»',
          'Беларусь',
          'Минская обл.',
          52.7,
          28,
          FALSE,
          'Калийная руда',
          '110',
          'Минская обл., Любанский р-н',
          TRUE,
          110,
          'never',
          'gok|нежинский гок|минская обл., любанский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_111',
          'Петриковский ГОК',
          'gok',
          'ОАО «Беларуськалий»',
          'Беларусь',
          'Солигорск',
          52.1333,
          28.5,
          FALSE,
          'Хлористый калий',
          '111',
          'г. Солигорск',
          TRUE,
          111,
          'never',
          'gok|петриковский гок|г. солигорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_112',
          'Гомельский ГОК',
          'gok',
          '',
          'Беларусь',
          'Гомельская обл.',
          52.4333,
          31,
          FALSE,
          'Кварц, стекольный песок',
          '112',
          'Гомельская обл., аг. Круговец-Калинино',
          TRUE,
          112,
          'never',
          'gok|гомельский гок|гомельская обл., аг. круговец-калинино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_113',
          'Васильковский ГОК',
          'gok',
          '',
          'Казахстан',
          'Усть-Каменогорск',
          49.9833,
          82.6,
          FALSE,
          'Золото (99,99 %)',
          '113',
          'г. Усть-Каменогорск',
          TRUE,
          113,
          'never',
          'gok|васильковский гок|г. усть-каменогорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_114',
          'Донской ГОК',
          'gok',
          '',
          'Казахстан',
          'Актобе',
          50.2834,
          57.2299,
          FALSE,
          'Хромовые концентраты',
          '114',
          'г. Актобе',
          TRUE,
          114,
          'never',
          'gok|донской гок|г. актобе',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_115',
          'Жайремский ГОК',
          'gok',
          '',
          'Казахстан',
          'Карагандинская обл.',
          47.95,
          74,
          FALSE,
          'Концентраты марганца, барита, цинка, свинца',
          '115',
          'Карагандинская обл., пгт Жайрем',
          TRUE,
          115,
          'never',
          'gok|жайремский гок|карагандинская обл., пгт жайрем',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_116',
          'Соколовско-Сарбайское ГОПО',
          'gok',
          '',
          'Казахстан',
          'Костанайская обл.',
          52.95,
          63.1167,
          FALSE,
          'Железная руда',
          '116',
          'Костанайская обл., г. Рудный',
          TRUE,
          116,
          'never',
          'gok|соколовско сарбайское гопо|костанайская обл., г. рудный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_117',
          'Лисаковский ГОК',
          'gok',
          '',
          'Казахстан',
          'Костанайская обл.',
          52.5333,
          62.5,
          FALSE,
          'Сырая руда, рудный концентрат',
          '117',
          'Костанайская обл., г. Лисаковск',
          TRUE,
          117,
          'never',
          'gok|лисаковский гок|костанайская обл., г. лисаковск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_118',
          'Нурказганский ГОК',
          'gok',
          '',
          'Казахстан',
          'Карагандинская обл.',
          49.6333,
          73.3,
          FALSE,
          'Меднорудное сырье',
          '118',
          'Карагандинская обл., Бухар-Жырауский р-н',
          TRUE,
          118,
          'never',
          'gok|нурказганский гок|карагандинская обл., бухар-жырауский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_119',
          'Карагайлинский ГОК',
          'gok',
          '',
          'Казахстан',
          'Карагандинская обл.',
          49.65,
          73.4,
          FALSE,
          'Полиметаллическое сырье',
          '119',
          'Карагандинская обл., п. Карагайлы',
          TRUE,
          119,
          'never',
          'gok|карагайлинский гок|карагандинская обл., п. карагайлы',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_120',
          'Обуховский ГОК',
          'gok',
          '',
          'Казахстан',
          'Северо-Казахстанская обл.',
          53,
          69,
          FALSE,
          'Титано-циркониевые руды',
          '120',
          'Северо-Казахстанская обл., Тайыншинский р-н',
          TRUE,
          120,
          'never',
          'gok|обуховский гок|северо-казахстанская обл., тайыншинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_121',
          'Северный ГОК',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.9,
          33.35,
          FALSE,
          'Железорудный концентрат, окатыши',
          '121',
          'Днепропетровская обл., г. Кривой Рог',
          TRUE,
          121,
          'never',
          'gok|северный гок|днепропетровская обл., г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_122',
          'Марганецкий ГОК',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.6333,
          34.6167,
          FALSE,
          'Концентраты марганцевой руды',
          '122',
          'Днепропетровская обл., г. Марганец',
          TRUE,
          122,
          'never',
          'gok|марганецкий гок|днепропетровская обл., г. марганец',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_123',
          'Просянский ГОК',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          48.1167,
          33.2167,
          FALSE,
          'Каолин, пески кварцевые',
          '123',
          'Днепропетровская обл., пгт Просяная',
          TRUE,
          123,
          'never',
          'gok|просянский гок|днепропетровская обл., пгт просяная',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_124',
          'Полтавский ГОК',
          'gok',
          '',
          'Украина',
          'Горишние Плавни',
          49,
          33.6667,
          FALSE,
          'Железорудные окатыши',
          '124',
          'г. Горишние Плавни',
          TRUE,
          124,
          'never',
          'gok|полтавский гок|г. горишние плавни',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_125',
          'Новоселовский ГОК',
          'gok',
          '',
          'Украина',
          'Харьковская обл.',
          49.5667,
          36.65,
          FALSE,
          'Песок кварцевый',
          '125',
          'Харьковская обл., с. Новоселовка',
          TRUE,
          125,
          'never',
          'gok|новоселовский гок|харьковская обл., с. новоселовка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_126',
          'ПАО «Ингулецкий ГОК» (ИнГОК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.6833,
          33.1333,
          FALSE,
          'Железная руда',
          '126',
          'Днепропетровская обл., г. Кривой Рог',
          TRUE,
          126,
          'never',
          'gok|пао ингулецкий гок ингок|днепропетровская обл., г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_127',
          'ПАО «Центральный ГОК» (ЦГОК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.95,
          33.3833,
          FALSE,
          'Железная руда',
          '127',
          'Днепропетровская обл., г. Кривой Рог',
          TRUE,
          127,
          'never',
          'gok|пао центральный гок цгок|днепропетровская обл., г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_128',
          'ПАО «Южный ГОК» (ЮГОК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.8667,
          33.3333,
          FALSE,
          'Железная руда',
          '128',
          'Днепропетровская обл., г. Кривой Рог',
          TRUE,
          128,
          'never',
          'gok|пао южный гок югок|днепропетровская обл., г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_129',
          'ПАО «Новокриворожский ГОК» (НКГОК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.9833,
          33.4167,
          FALSE,
          'Железная руда',
          '129',
          'Днепропетровская обл., г. Кривой Рог',
          TRUE,
          129,
          'never',
          'gok|пао новокриворожский гок нкгок|днепропетровская обл., г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_130',
          'ПАО «Днепровский ГОК» (ДнепрГОК)',
          'gok',
          '',
          'Украина',
          'Каменское',
          48.5167,
          34.6,
          FALSE,
          'Железная руда',
          '130',
          'г. Каменское',
          TRUE,
          130,
          'never',
          'gok|пао днепровский гок днепргок|г. каменское',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_131',
          'ПАО «Орджоникидзевский ГОК» (ОрджГОК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.6667,
          34.25,
          FALSE,
          'Марганцевая руда',
          '131',
          'Днепропетровская обл., г. Покров',
          TRUE,
          131,
          'never',
          'gok|пао орджоникидзевский гок орджгок|днепропетровская обл., г. покров',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_132',
          'ПАО «Иршанский ГОК»',
          'gok',
          '',
          'Украина',
          'Житомирская обл.',
          50.7333,
          28.8333,
          FALSE,
          'Ильменитовые руды',
          '132',
          'Житомирская обл., пгт Иршанск',
          TRUE,
          132,
          'never',
          'gok|пао иршанский гок|житомирская обл., пгт иршанск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_133',
          'ПАО «Вольногорский ГМК» (ВГМК)',
          'gok',
          '',
          'Украина',
          'Днепропетровская обл.',
          48.45,
          34.0167,
          FALSE,
          'Циркон-ильменитовые руды',
          '133',
          'Днепропетровская обл., г. Вольногорск',
          TRUE,
          133,
          'never',
          'gok|пао вольногорский гмк вгмк|днепропетровская обл., г. вольногорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_134',
          'Николаевский глиноземный завод (НГЗ)',
          'gok',
          '',
          'Украина',
          'Николаев',
          46.9667,
          32,
          FALSE,
          'Глинозем',
          '134',
          'г. Николаев',
          TRUE,
          134,
          'never',
          'gok|николаевский глиноземный завод нгз|г. николаев',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_135',
          'ЗАО «Лафарж Цемент» (Lafarge Ciment)',
          'gok',
          '',
          'Молдова',
          'Криково',
          47.0167,
          28.8333,
          FALSE,
          'Мергель и глина',
          '135',
          'г. Криково',
          TRUE,
          135,
          'never',
          'gok|зао лафарж цемент lafarge ciment|г. криково',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_136',
          'ООО «Гипс-Кнауф Молдова» (Knauf)',
          'gok',
          '',
          'Молдова',
          'Бендеры',
          46.8333,
          29.4833,
          FALSE,
          'Гипсовый камень',
          '136',
          'г. Бендеры',
          TRUE,
          136,
          'never',
          'gok|ооо гипс кнауф молдова knauf|г. бендеры',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_137',
          'Зангезурский медно-молибденовый комбинат',
          'gok',
          '',
          'Армения',
          'Сюникская обл.',
          39.15,
          46.15,
          FALSE,
          'Молибденовый и медный концентраты',
          '137',
          'Сюникская обл., г. Каджаран',
          TRUE,
          137,
          'never',
          'gok|зангезурский медно молибденовый комбинат|сюникская обл., г. каджаран',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_138',
          'Агаракский медно-молибденовый комбинат (АММК)',
          'gok',
          '',
          'Армения',
          'Сюникская обл.',
          38.8667,
          46.2,
          FALSE,
          'Медная и молибденовая руда',
          '138',
          'Сюникская обл., г. Агарак',
          TRUE,
          138,
          'never',
          'gok|агаракский медно молибденовый комбинат аммк|сюникская обл., г. агарак',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_139',
          'ГОК «Меградзор»',
          'gok',
          'Полиметалл',
          'Армения',
          'Котайкская обл.',
          40.6,
          44.65,
          FALSE,
          'Золотосодержащая руда',
          '139',
          'Котайкская обл., пос. Меградзор',
          TRUE,
          139,
          'never',
          'gok|гок меградзор|котайкская обл., пос. меградзор',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_140',
          'Золоторудное месторождение «Сотка»',
          'gok',
          '',
          'Армения',
          'Гегаркуникская обл.',
          40.1667,
          45.8333,
          FALSE,
          'Золотосодержащая руда',
          '140',
          'Гегаркуникская обл., с. Сотк',
          TRUE,
          140,
          'never',
          'gok|золоторудное месторождение сотка|гегаркуникская обл., с. сотк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_141',
          'Капанский ГОК (ЗАО “Капанский ГOK”)',
          'gok',
          '',
          'Армения',
          'Сюникская обл.',
          39.2,
          46.4,
          FALSE,
          'Полиметаллические руды',
          '141',
          'Сюникская обл., г. Капан',
          TRUE,
          141,
          'never',
          'gok|капанский гок зао капанский гok|сюникская обл., г. капан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_142',
          'Човдарский золоторудный комбинат (ГОК)',
          'gok',
          '',
          'Азербайджан',
          '',
          40.5333,
          45.8,
          FALSE,
          'Золотосодержащая руда',
          '142',
          'Кедабекский р-н, с. Човдар',
          TRUE,
          142,
          'never',
          'gok|човдарский золоторудный комбинат гок|кедабекский р-н, с. човдар',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_143',
          'Гызылбулагский золоторудный комбинат (ГОК)',
          'gok',
          '',
          'Азербайджан',
          '',
          40.5667,
          45.8167,
          FALSE,
          'Золотосодержащая руда',
          '143',
          'Кедабекский р-н, с. Гызылбулаг',
          TRUE,
          143,
          'never',
          'gok|гызылбулагский золоторудный комбинат гок|кедабекский р-н, с. гызылбулаг',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_144',
          'Кедабекский медно-золотой комбинат',
          'gok',
          '',
          'Азербайджан',
          'Кедабек',
          40.5667,
          45.8167,
          FALSE,
          'Медная и золотосодержащая руда',
          '144',
          'г. Кедабек',
          TRUE,
          144,
          'never',
          'gok|кедабекский медно золотой комбинат|г. кедабек',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_145',
          'Дашкесанский ГОК (железорудный)',
          'gok',
          '',
          'Азербайджан',
          'Дашкесан',
          40.4833,
          46.0667,
          FALSE,
          'Железная руда',
          '145',
          'г. Дашкесан',
          TRUE,
          145,
          'never',
          'gok|дашкесанский гок железорудный|г. дашкесан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_146',
          'Зайликский медно-кобальтовый комбинат',
          'gok',
          '',
          'Азербайджан',
          '',
          40.5,
          46,
          FALSE,
          'Медно-кобальтовая руда',
          '146',
          'Дашкесанский р-н, с. Зайлык',
          TRUE,
          146,
          'never',
          'gok|зайликский медно кобальтовый комбинат|дашкесанский р-н, с. зайлык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_147',
          'Гарлыкский ГОК',
          'gok',
          '',
          'Туркменистан',
          '',
          37.8,
          66.2,
          FALSE,
          'Калийные соли',
          '147',
          'Лебапский велаят, г. Гарлык',
          TRUE,
          147,
          'never',
          'gok|гарлыкский гок|лебапский велаят, г. гарлык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_148',
          'Таджикский алюминиевый завод (ТАЛКО)',
          'gok',
          '',
          'Таджикистан',
          'Турсунзаде',
          37.5,
          68.2333,
          FALSE,
          'Бокситы и нефелиновые сиениты',
          '148',
          'г. Турсунзаде',
          TRUE,
          148,
          'never',
          'gok|таджикский алюминиевый завод талко|г. турсунзаде',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_149',
          'Золоторудное месторождение «Джеруй»',
          'gok',
          '',
          'Таджикистан',
          'Согдийская обл.',
          39.5,
          67.6,
          FALSE,
          'Золото',
          '149',
          'Согдийская обл., г. Пенджикент',
          TRUE,
          149,
          'never',
          'gok|золоторудное месторождение джеруй|согдийская обл., г. пенджикент',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_150',
          'Золоторудный комбинат «Апрелевка»',
          'gok',
          '',
          'Таджикистан',
          'Истиклол',
          40.6,
          69.6667,
          FALSE,
          'Золотосодержащая руда',
          '150',
          'г. Истиклол',
          TRUE,
          150,
          'never',
          'gok|золоторудный комбинат апрелевка|г. истиклол',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_151',
          'Серебряный рудник «Кончоч»',
          'gok',
          '',
          'Таджикистан',
          'Согдийская обл.',
          39.5,
          68,
          FALSE,
          'Серебро, золото, свинец, цинк',
          '151',
          'Согдийская обл.',
          TRUE,
          151,
          'never',
          'gok|серебряный рудник кончоч|согдийская обл.',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_152',
          'Свинцово-цинковый рудник «Алтын-Топкан»',
          'gok',
          '',
          'Таджикистан',
          '',
          40.65,
          69.6667,
          FALSE,
          'Свинец, цинк, висмут, кадмий',
          '152',
          'пос. Алтын-Топкан',
          TRUE,
          152,
          'never',
          'gok|свинцово цинковый рудник алтын топкан|пос. алтын-топкан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_153',
          'Адрасманский ГОК',
          'gok',
          '',
          'Таджикистан',
          'Согдийская обл.',
          40.6333,
          69.9833,
          FALSE,
          'Свинцово-цинковый, висмутовый концентраты',
          '153',
          'Согдийская обл., пос. Адрасман',
          TRUE,
          153,
          'never',
          'gok|адрасманский гок|согдийская обл., пос. адрасман',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_154',
          'ООО СП «Зарафшон»',
          'gok',
          '',
          'Таджикистан',
          '',
          39.5,
          67.6,
          FALSE,
          'Золото',
          '154',
          'Пенджекентский р-н, пос. Согдиана',
          TRUE,
          154,
          'never',
          'gok|ооо сп зарафшон|пенджекентский р-н, пос. согдиана',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_155',
          'Алмалыкский ГМК (АГМК)',
          'gok',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.8307,
          69.6007,
          FALSE,
          'Медь, золото, серебро, цинк',
          '155',
          'Ташкентская обл., г. Алмалык',
          TRUE,
          155,
          'never',
          'gok|алмалыкский гмк агмк|ташкентская обл., г. алмалык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_156',
          'Навоийский ГМК (НГМК)',
          'gok',
          '',
          'Узбекистан',
          'Навои',
          40.0833,
          65.3833,
          FALSE,
          'Золото',
          '156',
          'г. Навои',
          TRUE,
          156,
          'never',
          'gok|навоийский гмк нгмк|г. навои',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_157',
          'Акташское ГМП (проект «Актау»)',
          'gok',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.7333,
          69,
          FALSE,
          'Вольфрам, молибден, медь',
          '157',
          'Ташкентская обл., г. Акташ',
          TRUE,
          157,
          'never',
          'gok|акташское гмп проект актау|ташкентская обл., г. акташ',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_158',
          'Нурабадский горно-химический комплекс',
          'gok',
          '',
          'Узбекистан',
          '',
          40.5333,
          65.8333,
          FALSE,
          'Уран',
          '158',
          'Нурабадский р-н',
          TRUE,
          158,
          'never',
          'gok|нурабадский горно химический комплекс|нурабадский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_159',
          'Золоторудное месторождение «Кумтор» (Kumtor Gold Mine)',
          'gok',
          '',
          'Кыргызстан',
          'Иссык-Кульская обл.',
          41.85,
          78.2,
          FALSE,
          'Золото',
          '159',
          'Иссык-Кульская обл.',
          TRUE,
          159,
          'never',
          'gok|золоторудное месторождение кумтор kumtor gold mine|иссык-кульская обл.',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_160',
          'Золоторудное месторождение «Джеруй» (Jerooy)',
          'gok',
          '',
          'Кыргызстан',
          'Таласская обл.',
          42.5,
          71,
          FALSE,
          'Золото и медь',
          '160',
          'Таласская обл.',
          TRUE,
          160,
          'never',
          'gok|золоторудное месторождение джеруй jerooy|таласская обл.',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_161',
          'Макмалзолото (Макмальское месторождение)',
          'gok',
          '',
          'Кыргызстан',
          'Джалал-Абадская обл.',
          41.4,
          71.7,
          FALSE,
          'Золото',
          '161',
          'Джалал-Абадская обл., Чаткальский р-н',
          TRUE,
          161,
          'never',
          'gok|макмалзолото макмальское месторождение|джалал-абадская обл., чаткальский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'gok_162',
          '«Кадамджайский сурьмяный комбинат»',
          'gok',
          '',
          'Кыргызстан',
          'Баткенская обл.',
          40.25,
          71.5833,
          FALSE,
          'Сурьмяные руды',
          '162',
          'Баткенская обл., г. Кадамжай',
          TRUE,
          162,
          'never',
          'gok|кадамджайский сурьмяный комбинат|баткенская обл., г. кадамжай',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_1',
          'Красноярский порт',
          'port',
          '',
          'РФ',
          'Красноярск',
          56.0094,
          92.9327,
          FALSE,
          'Речные грузы (строительные материалы, лес, зерно, уголь)',
          '1',
          '660059, г. Красноярск, ул. Коммунальная, д. 2',
          TRUE,
          1,
          'never',
          'port|красноярский порт|660059, г. красноярск, ул. коммунальная, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_2',
          'Самарский порт',
          'port',
          '',
          'РФ',
          'Самара',
          53.1746,
          50.0698,
          FALSE,
          'Речные грузы (нефтепродукты, стройматериалы, зерно)',
          '2',
          '443099, г. Самара, ул. Стрелка реки Самары, д. 3',
          TRUE,
          2,
          'never',
          'port|самарский порт|443099, г. самара, ул. стрелка реки самары, д. 3',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_3',
          'Волгоградский порт',
          'port',
          '',
          'РФ',
          'Волгоград',
          48.7003,
          44.517,
          FALSE,
          'Речные грузы (нефть, зерно, стройматериалы)',
          '3',
          '400131, г. Волгоград, наб. 62-й Армии, д. 6',
          TRUE,
          3,
          'never',
          'port|волгоградский порт|400131, г. волгоград, наб. 62-й армии, д. 6',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_4',
          'Ярославский порт',
          'port',
          '',
          'РФ',
          'Ярославль',
          57.5984,
          39.915,
          FALSE,
          'Речные грузы (лес, стройматериалы, нефтепродукты)',
          '4',
          '150022, г. Ярославль, ул. 2-я Портовая, д. 1',
          TRUE,
          4,
          'never',
          'port|ярославский порт|150022, г. ярославль, ул. 2-я портовая, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_5',
          'Осетровский порт',
          'port',
          '',
          'РФ',
          'Иркутская обл.',
          56.7886,
          105.7684,
          FALSE,
          'Речные грузы (лес, уголь, стройматериалы)',
          '5',
          '666788, Иркутская обл., г. Усть-Кут, ул. Луговая, стр. 21',
          TRUE,
          5,
          'never',
          'port|осетровский порт|666788, иркутская обл., г. усть-кут, ул. луговая, стр. 21',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_6',
          'Южный порт',
          'port',
          '',
          'РФ',
          'Москва',
          55.6985,
          37.6916,
          FALSE,
          'Речные грузы (стройматериалы, зерно)',
          '6',
          'г. Москва, Южнопортовая ул., вл. 3–15 / 2-й Южнопортовый пр-д, д. 8',
          TRUE,
          6,
          'never',
          'port|южный порт|г. москва, южнопортовая ул., вл. 3–15 / 2-й южнопортовый пр-д, д. 8',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_7',
          'Омский порт',
          'port',
          '',
          'РФ',
          'Омск',
          54.9344,
          73.3652,
          FALSE,
          'Речные грузы (нефтепродукты, стройматериалы, зерно)',
          '7',
          '644121, г. Омск, ул. 9-я Ленинская, д. 55',
          TRUE,
          7,
          'never',
          'port|омский порт|644121, г. омск, ул. 9-я ленинская, д. 55',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_8',
          'Салехардский порт',
          'port',
          '',
          'РФ',
          'Салехард',
          66.6455,
          66.5415,
          FALSE,
          'Речные грузы (стройматериалы, уголь, нефтепродукты)',
          '8',
          '629007, г. Салехард, ул. Ленина, д. 7',
          TRUE,
          8,
          'never',
          'port|салехардский порт|629007, г. салехард, ул. ленина, д. 7',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_9',
          'Чебоксарский порт',
          'port',
          '',
          'РФ',
          'Чебоксары',
          56.1491,
          47.2618,
          FALSE,
          'Речные грузы (стройматериалы, зерно)',
          '9',
          '428032, г. Чебоксары, пл. Речников, д. 5',
          TRUE,
          9,
          'never',
          'port|чебоксарский порт|428032, г. чебоксары, пл. речников, д. 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_10',
          'Архангельский порт',
          'port',
          '',
          'РФ',
          'Архангельск',
          64.5304,
          40.5364,
          FALSE,
          'Лес, уголь, нефтепродукты, контейнеры',
          '10',
          '163026, г. Архангельск, ул. Космонавта Комарова, д. 14, стр. 2',
          TRUE,
          10,
          'never',
          'port|архангельский порт|163026, г. архангельск, ул. космонавта комарова, д. 14, стр. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_11',
          'Тобольский порт',
          'port',
          '',
          'РФ',
          'Тобольск',
          58.2888,
          68.2231,
          FALSE,
          'Речные грузы (нефтепродукты, стройматериалы)',
          '11',
          '626109, г. Тобольск, тер. Северный промышленный район-квартал 1, № 1, к. 1',
          TRUE,
          11,
          'never',
          'port|тобольский порт|626109, г. тобольск, тер. северный промышленный район-квартал 1, № 1, к. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_12',
          'Уренгойский порт',
          'port',
          '',
          'РФ',
          'Новый Уренгой',
          66.0913,
          76.6833,
          FALSE,
          'Речные грузы (стройматериалы, трубы)',
          '12',
          '629320, г. Новый Уренгой, жилрайон Коротчаево, ул. Портовая, д. 1',
          TRUE,
          12,
          'never',
          'port|уренгойский порт|629320, г. новый уренгой, жилрайон коротчаево, ул. портовая, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_13',
          'Сергинский порт',
          'port',
          '',
          'РФ',
          'ХМАО-Югра',
          62.5665,
          65.5833,
          FALSE,
          'Речные грузы (нефть, стройматериалы)',
          '13',
          '628126, ХМАО-Югра, Октябрьский р-н, пгт Приобье, ул. Портовая, д. 12',
          TRUE,
          13,
          'never',
          'port|сергинский порт|628126, хмао-югра, октябрьский р-н, пгт приобье, ул. портовая, д. 12',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_14',
          'Тюменский порт',
          'port',
          '',
          'РФ',
          'Тюмень',
          57.15,
          65.5,
          FALSE,
          'Речные грузы (нефтепродукты, стройматериалы)',
          '14',
          '625002, г. Тюмень, ул. Пароходская, д. 31, пом. 712',
          TRUE,
          14,
          'never',
          'port|тюменский порт|625002, г. тюмень, ул. пароходская, д. 31, пом. 712',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_15',
          'Новороссийский порт',
          'port',
          '',
          'РФ',
          'Новороссийск',
          44.7244,
          37.7763,
          FALSE,
          'Нефть, зерно, уголь, контейнеры, металл, руда, лес',
          '15',
          '353907, г. Новороссийск, ул. Мира, д. 2',
          TRUE,
          15,
          'never',
          'port|новороссийский порт|353907, г. новороссийск, ул. мира, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_16',
          'Порт Усть-Луга',
          'port',
          '',
          'РФ',
          'Ленинградская обл.',
          59.6609,
          28.2897,
          FALSE,
          'Уголь, удобрения, руда, нефть, контейнеры',
          '16',
          '188480, Ленинградская обл., г. Кингисепп, пр. Карла Маркса, д. 25/2',
          TRUE,
          16,
          'never',
          'port|порт усть луга|188480, ленинградская обл., г. кингисепп, пр. карла маркса, д. 25/2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_17',
          'Приморский порт',
          'port',
          '',
          'РФ',
          'Ленинградская обл.',
          60.36,
          28.72,
          FALSE,
          'Нефть и нефтепродукты',
          '17',
          '188910, Ленинградская обл., Выборгский р-н, г. Приморск, Портовый проезд, д. 10',
          TRUE,
          17,
          'never',
          'port|приморский порт|188910, ленинградская обл., выборгский р-н, г. приморск, портовый проезд, д. 10',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_18',
          'Мурманский порт',
          'port',
          '',
          'РФ',
          'Мурманск',
          68.9784,
          33.0682,
          FALSE,
          'Уголь, железорудный концентрат, удобрения',
          '18',
          '183001, г. Мурманск, ул. Траловая, д. 12',
          TRUE,
          18,
          'never',
          'port|мурманский порт|183001, г. мурманск, ул. траловая, д. 12',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_19',
          'Восточный порт',
          'port',
          '',
          'РФ',
          'Приморский край',
          42.7288,
          133.0825,
          FALSE,
          'Уголь, контейнеры, нефть',
          '19',
          '692941, Приморский край, г. Находка, п. Врангель, ул. Внутрипортовая, д. 47',
          TRUE,
          19,
          'never',
          'port|восточный порт|692941, приморский край, г. находка, п. врангель, ул. внутрипортовая, д. 47',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_20',
          'Санкт-Петербургский порт',
          'port',
          '',
          'РФ',
          'Санкт-Петербург',
          59.9193,
          30.327,
          FALSE,
          'Контейнеры, ро-ро, автомобили, металлы, удобрения',
          '20',
          '199225, г. Санкт-Петербург, пр-кт Крузенштерна, д. 18, стр. 4',
          TRUE,
          20,
          'never',
          'port|санкт петербургский порт|199225, г. санкт-петербург, пр-кт крузенштерна, д. 18, стр. 4',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_21',
          'Морской порт в Махачкале',
          'port',
          '',
          'РФ',
          'Махачкала',
          42.9833,
          47.5,
          FALSE,
          'Нефть, зерно, стройматериалы',
          '21',
          '367000, г. Махачкала, ул. Порт-Петровская, зд. 24, стр. 11',
          TRUE,
          21,
          'never',
          'port|морской порт в махачкале|367000, г. махачкала, ул. порт-петровская, зд. 24, стр. 11',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_22',
          'Морской порт в Туапсе',
          'port',
          '',
          'РФ',
          'Туапсе',
          44.0953,
          39.0716,
          FALSE,
          'Металлы, руды, зерно, нефть, уголь',
          '22',
          '352800, г. Туапсе, ул. Морской бульвар, д. 2',
          TRUE,
          22,
          'never',
          'port|морской порт в туапсе|352800, г. туапсе, ул. морской бульвар, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_23',
          'Владивостокский порт',
          'port',
          '',
          'РФ',
          'Владивосток',
          43.1167,
          131.8833,
          FALSE,
          'Контейнеры, рыбопродукция, навалочные грузы, автотехника',
          '23',
          '690065, г. Владивосток, ул. Стрельникова, д. 9',
          TRUE,
          23,
          'never',
          'port|владивостокский порт|690065, г. владивосток, ул. стрельникова, д. 9',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_24',
          'Калининградский порт',
          'port',
          '',
          'РФ',
          'Калининград',
          54.7,
          20.4667,
          FALSE,
          'Контейнеры, сырье, товары',
          '24',
          '236003, г. Калининград, ул. Портовая, д. 24',
          TRUE,
          24,
          'never',
          'port|калининградский порт|236003, г. калининград, ул. портовая, д. 24',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_25',
          'Находкинский порт',
          'port',
          '',
          'РФ',
          'Находка',
          42.82,
          132.88,
          FALSE,
          'Уголь, металлопрокат, нефть, контейнеры',
          '25',
          '692900, г. Находка, ул. Портовая, д. 22',
          TRUE,
          25,
          'never',
          'port|находкинский порт|692900, г. находка, ул. портовая, д. 22',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_26',
          'Петропавловск-Камчатский порт',
          'port',
          '',
          'РФ',
          'Петропавловск-Камчатский',
          53,
          158.65,
          FALSE,
          'Рыба, контейнеры, уголь',
          '26',
          '683000, г. Петропавловск-Камчатский, пл. Г.И. Щедрина, д. 2',
          TRUE,
          26,
          'never',
          'port|петропавловск камчатский порт|683000, г. петропавловск-камчатский, пл. г.и. щедрина, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_27',
          'Геленджикский порт',
          'port',
          '',
          'РФ',
          'Геленджик',
          44.55,
          38.0833,
          FALSE,
          'Нефтепродукты, стройматериалы',
          '27',
          '353460, г. Геленджик, ул. Портовая, д. 1',
          TRUE,
          27,
          'never',
          'port|геленджикский порт|353460, г. геленджик, ул. портовая, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_28',
          'Сочинский порт',
          'port',
          '',
          'РФ',
          'Сочи',
          43.581,
          39.7183,
          FALSE,
          'Пассажирские перевозки, генеральные грузы',
          '28',
          '354000, г. Сочи, ул. Войкова, д. 1, оф. 215',
          TRUE,
          28,
          'never',
          'port|сочинский порт|354000, г. сочи, ул. войкова, д. 1, оф. 215',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_29',
          'Севастопольский порт',
          'port',
          '',
          'РФ',
          'Севастополь',
          44.6167,
          33.5333,
          FALSE,
          'Универсальный (военные и коммерческие грузы)',
          '29',
          '299014, г. Севастополь, ул. Рыбаков, д. 5 (фактический)',
          TRUE,
          29,
          'never',
          'port|севастопольский порт|299014, г. севастополь, ул. рыбаков, д. 5 (фактический)',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_30',
          'Порт-Кавказ',
          'port',
          '',
          'РФ',
          'Краснодарский край',
          45.3397,
          36.6706,
          FALSE,
          'Нефть, зерно, паромные перевозки',
          '30',
          '353545, Краснодарский край, Темрюкский р-н, п. Чушка, ул. Железнодорожная, д. 17',
          TRUE,
          30,
          'never',
          'port|порт кавказ|353545, краснодарский край, темрюкский р-н, п. чушка, ул. железнодорожная, д. 17',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_31',
          'Ванинский морской торговый порт',
          'port',
          '',
          'РФ',
          'Хабаровский край',
          49.0887,
          140.2663,
          FALSE,
          'Уголь, лес, контейнеры',
          '31',
          '682860, Хабаровский край, п. Ванино, ул. Железнодорожная, д. 1',
          TRUE,
          31,
          'never',
          'port|ванинский морской торговый порт|682860, хабаровский край, п. ванино, ул. железнодорожная, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_32',
          'Морской порт Тамань',
          'port',
          '',
          'РФ',
          'Краснодарский край',
          45.125,
          36.6833,
          FALSE,
          'Уголь, зерно, нефтепродукты, удобрения',
          '32',
          '353535, Краснодарский край, тер. Морской порт Тамань, д. 2, оф. 1',
          TRUE,
          32,
          'never',
          'port|морской порт тамань|353535, краснодарский край, тер. морской порт тамань, д. 2, оф. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_33',
          'Азовский морской порт',
          'port',
          '',
          'РФ',
          'Азов',
          47.1184,
          39.4214,
          FALSE,
          'Зерно, стройматериалы, металл',
          '33',
          '346780, г. Азов, ул. Петровская, д. 2',
          TRUE,
          33,
          'never',
          'port|азовский морской порт|346780, г. азов, ул. петровская, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_34',
          'АО «Ростовский порт»',
          'port',
          '',
          'РФ',
          'Ростов-на-Дону',
          47.2201,
          39.75,
          FALSE,
          'Зерно, уголь, металл, контейнеры',
          '34',
          '344019, г. Ростов-на-Дону, ул. Береговая, д. 30',
          TRUE,
          34,
          'never',
          'port|ао ростовский порт|344019, г. ростов-на-дону, ул. береговая, д. 30',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_35',
          'ММПК «Бронка»',
          'port',
          '',
          'РФ',
          'Санкт-Петербург',
          59.9331,
          29.6917,
          FALSE,
          'Контейнеры, ро-ро грузы',
          '35',
          '198412, г. Санкт-Петербург, г. Ломоносов, Краснофлотское шоссе, д. 49А',
          TRUE,
          35,
          'never',
          'port|ммпк бронка|198412, г. санкт-петербург, г. ломоносов, краснофлотское шоссе, д. 49а',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_36',
          'БЕЛОМОРСКИЙ МОРСКОЙ ПОРТ',
          'port',
          '',
          'РФ',
          'Республика Карелия',
          64.5747,
          35.2333,
          FALSE,
          'Лес, уголь, стройматериалы',
          '36',
          '186500, Республика Карелия, г. Беломорск, ул. Порт-Поселок, д. зд. радиостанции',
          TRUE,
          36,
          'never',
          'port|беломорский морской порт|186500, республика карелия, г. беломорск, ул. порт-поселок, д. зд. радиостанции',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_37',
          'Таганрогский морской торговый порт',
          'port',
          '',
          'РФ',
          'Таганрог',
          47.2063,
          38.9494,
          FALSE,
          'Зерно, уголь, металл',
          '37',
          '347900, г. Таганрог, ул. Комсомольский Спуск, д. 2',
          TRUE,
          37,
          'never',
          'port|таганрогский морской торговый порт|347900, г. таганрог, ул. комсомольский спуск, д. 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_38',
          'ПОРТ ВЫСОЦКИЙ',
          'port',
          '',
          'РФ',
          'Ленинградская обл.',
          60.6269,
          28.5614,
          FALSE,
          'Навалочные и генеральные грузы, нефть, зерно',
          '38',
          '188909, Ленинградская обл., Выборгский р-н, г. Высоцк, ул. Кировская, д. 3',
          TRUE,
          38,
          'never',
          'port|порт высоцкий|188909, ленинградская обл., выборгский р-н, г. высоцк, ул. кировская, д. 3',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_39',
          'Порт Оля',
          'port',
          '',
          'РФ',
          'Астраханская обл.',
          45.7806,
          47.5527,
          FALSE,
          'Зерно, стройматериалы, контейнеры',
          '39',
          '416425, Астраханская обл., Лиманский р-н, с. Оля, ул. Чкалова, зд. 29',
          TRUE,
          39,
          'never',
          'port|порт оля|416425, астраханская обл., лиманский р-н, с. оля, ул. чкалова, зд. 29',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_40',
          'Порт Байкал',
          'port',
          '',
          'РФ',
          'Иркутск',
          51.8753,
          104.8006,
          FALSE,
          'Речные грузы (стройматериалы, лес)',
          '40',
          '664047, г. Иркутск, ул. Партизанская, д. 101, кв. 64',
          TRUE,
          40,
          'never',
          'port|порт байкал|664047, г. иркутск, ул. партизанская, д. 101, кв. 64',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_41',
          'Ейский морской порт',
          'port',
          '',
          'РФ',
          'Ейск',
          46.7253,
          38.2744,
          FALSE,
          'Зерно, нефтепродукты',
          '41',
          '353685, г. Ейск, ул. Портовая аллея, д. 5',
          TRUE,
          41,
          'never',
          'port|ейский морской порт|353685, г. ейск, ул. портовая аллея, д. 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_42',
          'Темрюкский морской торговый порт',
          'port',
          '',
          'РФ',
          'Темрюк',
          45.3833,
          37.4167,
          FALSE,
          'Зерно, уголь, сера',
          '42',
          '353500, г. Темрюк, пер. Портовый',
          TRUE,
          42,
          'never',
          'port|темрюкский морской торговый порт|353500, г. темрюк, пер. портовый',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_43',
          'Астрахань (порт)',
          'port',
          '',
          'РФ',
          'Астрахань',
          46.3437,
          47.9973,
          FALSE,
          'Нефть, зерно, лес, контейнеры',
          '43',
          '414006, г. Астрахань, ул. Пушкина, д. 66',
          TRUE,
          43,
          'never',
          'port|астрахань порт|414006, г. астрахань, ул. пушкина, д. 66',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_44',
          'Махачкалинский международный морской торговый порт',
          'port',
          '',
          'РФ',
          'Махачкала',
          42.9947,
          47.4677,
          FALSE,
          'Нефть, зерно, контейнеры',
          '44',
          '367000, г. Махачкала, ул. Порт-Петровская, зд. 24, стр. 11',
          TRUE,
          44,
          'never',
          'port|махачкалинский международный морской торговый порт|367000, г. махачкала, ул. порт-петровская, зд. 24, стр. 11',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_45',
          'Корсаков (порт)',
          'port',
          '',
          'РФ',
          'Корсаков',
          46.6195,
          142.7683,
          FALSE,
          'Уголь, рыба, контейнеры',
          '45',
          '694020, г. Корсаков, ул. Портовая, д. 10',
          TRUE,
          45,
          'never',
          'port|корсаков порт|694020, г. корсаков, ул. портовая, д. 10',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_46',
          'Магадан (порт) «Ворота Колымы»',
          'port',
          '',
          'РФ',
          'Магадан',
          59.564,
          150.8479,
          FALSE,
          'Контейнеры, уголь, рыба, стройматериалы',
          '46',
          '685000, г. Магадан, ш. Портовое, зд. 211',
          TRUE,
          46,
          'never',
          'port|магадан порт ворота колымы|685000, г. магадан, ш. портовое, зд. 211',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_47',
          'Москальво (порт)',
          'port',
          '',
          'РФ',
          'Сахалинская обл.',
          53.5461,
          142.5167,
          FALSE,
          'Уголь, лес',
          '47',
          '694496, Сахалинская обл., Охинский р-н, с. Москальво, ул. Восточная, д. 1',
          TRUE,
          47,
          'never',
          'port|москальво порт|694496, сахалинская обл., охинский р-н, с. москальво, ул. восточная, д. 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_48',
          'Мыс Лазарева (порт)',
          'port',
          '',
          'РФ',
          'Хабаровский край',
          52.2167,
          141.5167,
          FALSE,
          'Лес, уголь',
          '48',
          'Хабаровский край, Николаевский р-н, рп Лазарев',
          TRUE,
          48,
          'never',
          'port|мыс лазарева порт|хабаровский край, николаевский р-н, рп лазарев',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_49',
          'Николаевский-на-Амуре морской торговый порт',
          'port',
          '',
          'РФ',
          'Николаевск-на-Амуре',
          53.1356,
          140.7175,
          FALSE,
          'Лес, уголь, рыба',
          '49',
          '682460, г. Николаевск-на-Амуре, ул. Невельского, д. 10',
          TRUE,
          49,
          'never',
          'port|николаевский на амуре морской торговый порт|682460, г. николаевск-на-амуре, ул. невельского, д. 10',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_50',
          'Охотск (порт)',
          'port',
          '',
          'РФ',
          'Хабаровский край',
          59.3513,
          143.1833,
          FALSE,
          'Рыба, лес',
          '50',
          '682480, Хабаровский край, рп Охотск, ул. Белолипского, д. 19',
          TRUE,
          50,
          'never',
          'port|охотск порт|682480, хабаровский край, рп охотск, ул. белолипского, д. 19',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_51',
          'Порт Поронайск',
          'port',
          '',
          'РФ',
          'Поронайск',
          49.2277,
          143.119,
          FALSE,
          'Уголь, лес',
          '51',
          '694240, г. Поронайск, ул. Восточная, д. 1/1',
          TRUE,
          51,
          'never',
          'port|порт поронайск|694240, г. поронайск, ул. восточная, д. 1/1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_52',
          'Морской порт бухты Троицы',
          'port',
          '',
          'РФ',
          'Приморский край',
          42.6386,
          131.1,
          FALSE,
          'Уголь, контейнеры, рыба',
          '52',
          'Приморский край, пос. Зарубино',
          TRUE,
          52,
          'never',
          'port|морской порт бухты троицы|приморский край, пос. зарубино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_53',
          'Торговый порт Посьет',
          'port',
          '',
          'РФ',
          'Приморский край',
          42.6472,
          130.8167,
          FALSE,
          'Уголь, контейнеры',
          '53',
          'Приморский край',
          TRUE,
          53,
          'never',
          'port|торговый порт посьет|приморский край',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_54',
          'Холмский Морской Торговый Порт',
          'port',
          '',
          'РФ',
          'Холмск',
          46.646,
          141.858,
          FALSE,
          'Уголь, лес, рыба',
          '54',
          'г. Холмск',
          TRUE,
          54,
          'never',
          'port|холмский морской торговый порт|г. холмск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_55',
          'Угольный морской порт Шахтерск',
          'port',
          '',
          'РФ',
          'Шахтёрск',
          49.1619,
          142.0584,
          FALSE,
          'Уголь',
          '55',
          'г. Шахтёрск',
          TRUE,
          55,
          'never',
          'port|угольный морской порт шахтерск|г. шахтерск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_56',
          'Морской порт Варандей',
          'port',
          '',
          'РФ',
          '',
          68.8,
          57.9833,
          FALSE,
          'Нефть',
          '56',
          'посёлок Варандей',
          TRUE,
          56,
          'never',
          'port|морской порт варандей|поселок варандей',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_57',
          'Морской порт Нарьян‑Мар',
          'port',
          '',
          'РФ',
          'Нарьян-Мар',
          67.6749,
          53.0849,
          FALSE,
          'Нефтепродукты, стройматериалы, уголь',
          '57',
          'г. Нарьян-Мар',
          TRUE,
          57,
          'never',
          'port|морской порт нарьян мар|г. нарьян-мар',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_59',
          'Морской порт Витино',
          'port',
          '',
          'РФ',
          'Мурманская область',
          67.0833,
          32.3333,
          FALSE,
          'Нефтепродукты, уголь',
          '59',
          'Мурманская область',
          TRUE,
          59,
          'never',
          'port|морской порт витино|мурманская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_60',
          'Кандалакшский морской торговый порт',
          'port',
          '',
          'РФ',
          'Кандалакша',
          67.1435,
          32.4071,
          FALSE,
          'Алюминий, уголь',
          '60',
          'г. Кандалакша',
          TRUE,
          60,
          'never',
          'port|кандалакшский морской торговый порт|г. кандалакша',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_61',
          'Морской порт Онега',
          'port',
          '',
          'РФ',
          'Онега',
          63.9167,
          38.0833,
          FALSE,
          'Лес, уголь, стройматериалы',
          '61',
          'г. Онега',
          TRUE,
          61,
          'never',
          'port|морской порт онега|г. онега',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_62',
          'Морской порт Певек',
          'port',
          '',
          'РФ',
          'Певек',
          69.7034,
          170.2647,
          FALSE,
          'Уголь, контейнеры, продовольствие',
          '62',
          'г. Певек',
          TRUE,
          62,
          'never',
          'port|морской порт певек|г. певек',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_63',
          'Порт Диксон',
          'port',
          '',
          'РФ',
          '',
          73.4426,
          80.7111,
          FALSE,
          'Уголь, стройматериалы, продовольствие',
          '63',
          'пгт Диксон',
          TRUE,
          63,
          'never',
          'port|порт диксон|пгт диксон',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_64',
          'Морской порт Дудинка',
          'port',
          '',
          'РФ',
          'Дудинка',
          69.3988,
          86.1792,
          FALSE,
          'Уголь, руда, контейнеры',
          '64',
          'г. Дудинка',
          TRUE,
          64,
          'never',
          'port|морской порт дудинка|г. дудинка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_65',
          'Морской порт Сабетта',
          'port',
          '',
          'РФ',
          '',
          71.2667,
          72.0667,
          FALSE,
          'Сжиженный природный газ (СПГ), газовый конденсат',
          '65',
          'пос. Сабетта',
          TRUE,
          65,
          'never',
          'port|морской порт сабетта|пос. сабетта',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_66',
          'Морской порт «Тикси»',
          'port',
          '',
          'РФ',
          '',
          71.6393,
          128.8709,
          FALSE,
          'Уголь, стройматериалы, продовольствие',
          '66',
          'посёлок Тикси',
          TRUE,
          66,
          'never',
          'port|морской порт тикси|поселок тикси',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_67',
          'Морской порт Анадырь',
          'port',
          '',
          'РФ',
          'Анадырь',
          64.7398,
          177.5053,
          FALSE,
          'Уголь, рыба, контейнеры',
          '67',
          'г. Анадырь',
          TRUE,
          67,
          'never',
          'port|морской порт анадырь|г. анадырь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_68',
          'Морской торговый порт Беринговский',
          'port',
          '',
          'РФ',
          '',
          63.0667,
          179.3667,
          FALSE,
          'Уголь',
          '68',
          'п. Беринговский',
          TRUE,
          68,
          'never',
          'port|морской торговый порт беринговский|п. беринговский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_69',
          'Морской порт Эгвекинот',
          'port',
          '',
          'РФ',
          '',
          66.3163,
          -179.1092,
          FALSE,
          'Уголь',
          '69',
          'п. Эгвекинот',
          TRUE,
          69,
          'never',
          'port|морской порт эгвекинот|п. эгвекинот',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_70',
          '"Международный свободный порт Джурджулешты"',
          'port',
          '',
          'Молдова',
          '',
          45.4817,
          28.1972,
          FALSE,
          '',
          '70',
          'Нет',
          TRUE,
          70,
          'never',
          'port|международный свободный порт джурджулешты|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_73',
          'Баку (Port of Baku)',
          'port',
          '',
          'Азербайджан',
          '',
          40.3815,
          49.8878,
          FALSE,
          '',
          '73',
          'Нет',
          TRUE,
          73,
          'never',
          'port|баку port of baku|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_74',
          'Альятьı (Port of Alat)',
          'port',
          '',
          'Азербайджан',
          '',
          39.9733,
          49.4389,
          FALSE,
          '',
          '74',
          'Нет',
          TRUE,
          74,
          'never',
          'port|альять port of alat|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_75',
          '"Порт Дюбенди (Дюбендский нефтеналивной порт)"',
          'port',
          '',
          'Азербайджан',
          '',
          40.4335,
          50.2394,
          FALSE,
          '',
          '75',
          'Нет',
          TRUE,
          75,
          'never',
          'port|порт дюбенди дюбендский нефтеналивной порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_76',
          'Порт Сангачал',
          'port',
          '',
          'Азербайджан',
          '',
          40.2013,
          49.4813,
          FALSE,
          '',
          '76',
          'Нет',
          TRUE,
          76,
          'never',
          'port|порт сангачал|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_77',
          'Евлахский речной порт',
          'port',
          '',
          'Азербайджан',
          '',
          40.6183,
          47.1501,
          FALSE,
          '',
          '77',
          'Нет',
          TRUE,
          77,
          'never',
          'port|евлахский речной порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_78',
          '"Туркменбашинский международный морской порт"',
          'port',
          '',
          'Туркменистан',
          '',
          40,
          53.028,
          FALSE,
          '',
          '78',
          'Нет',
          TRUE,
          78,
          'never',
          'port|туркменбашинский международный морской порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_79',
          'Порт Экерем (Хазар)',
          'port',
          '',
          'Туркменистан',
          '',
          39.8814,
          53.0834,
          FALSE,
          '',
          '79',
          'Нет',
          TRUE,
          79,
          'never',
          'port|порт экерем хазар|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_80',
          'Порт Гарабогаз (Кара-Богаз-Гол)',
          'port',
          '',
          'Туркменистан',
          '',
          41.5244,
          52.5725,
          FALSE,
          '',
          '80',
          'Нет',
          TRUE,
          80,
          'never',
          'port|порт гарабогаз кара богаз гол|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_82',
          '"АО «НК «Актауский международный морской торговый порт»"',
          'port',
          '',
          'Казахстан',
          '',
          43.6014,
          51.2188,
          FALSE,
          '',
          '82',
          'Нет',
          TRUE,
          82,
          'never',
          'port|ао нк актауский международный морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_83',
          'Порт Курык',
          'port',
          '',
          'Казахстан',
          '',
          43.2667,
          51.75,
          FALSE,
          '',
          '83',
          'Нет',
          TRUE,
          83,
          'never',
          'port|порт курык|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_84',
          'Порт Баутино',
          'port',
          '',
          'Казахстан',
          '',
          44.5808,
          50.2828,
          FALSE,
          '',
          '84',
          'Нет',
          TRUE,
          84,
          'never',
          'port|порт баутино|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_85',
          'Порт Жетыбай',
          'port',
          '',
          'Казахстан',
          '',
          43.5499,
          52.1667,
          FALSE,
          '',
          '85',
          'Нет',
          TRUE,
          85,
          'never',
          'port|порт жетыбай|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_86',
          'Порт Каражанбас',
          'port',
          '',
          'Казахстан',
          '',
          45.1224,
          51.4303,
          FALSE,
          '',
          '86',
          'Нет',
          TRUE,
          86,
          'never',
          'port|порт каражанбас|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_89',
          'Белгород-Днестровский морской порт, ГП',
          'port',
          '',
          'Украина',
          '',
          46.1867,
          30.3504,
          FALSE,
          '',
          '89',
          'Нет',
          TRUE,
          89,
          'never',
          'port|белгород днестровский морской порт гп|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_90',
          'Бердянский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          46.7509,
          36.7747,
          FALSE,
          '',
          '90',
          'Нет',
          TRUE,
          90,
          'never',
          'port|бердянский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_91',
          'Генический морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          '',
          46.1625,
          34.8086,
          FALSE,
          '',
          '91',
          'Нет',
          TRUE,
          91,
          'never',
          'port|генический морской торговый порт гп|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_92',
          'Евпаторийский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          45.1864,
          33.3808,
          FALSE,
          '',
          '92',
          'Нет',
          TRUE,
          92,
          'never',
          'port|евпаторийский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_93',
          'Измаильский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          45.3341,
          28.8279,
          FALSE,
          '',
          '93',
          'Нет',
          TRUE,
          93,
          'never',
          'port|измаильский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_94',
          'Керченский морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          '',
          45.3631,
          36.6694,
          FALSE,
          '',
          '94',
          'Нет',
          TRUE,
          94,
          'never',
          'port|керченский морской торговый порт гп|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_95',
          'Мариупольский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          47.0619,
          37.5065,
          FALSE,
          '',
          '95',
          'Нет',
          TRUE,
          95,
          'never',
          'port|мариупольский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_96',
          'Морской торговый порт ''Южный'', ГП',
          'port',
          '',
          'Украина',
          '',
          46.6333,
          31.5,
          FALSE,
          '',
          '96',
          'Нет',
          TRUE,
          96,
          'never',
          'port|морской торговый порт южный гп|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_97',
          'Морской торговый порт Октябрьск',
          'port',
          '',
          'Украина',
          '',
          46.8333,
          31.95,
          FALSE,
          '',
          '97',
          'Нет',
          TRUE,
          97,
          'never',
          'port|морской торговый порт октябрьск|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_98',
          'Николаевский морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          '',
          46.9483,
          31.9555,
          FALSE,
          '',
          '98',
          'Нет',
          TRUE,
          98,
          'never',
          'port|николаевский морской торговый порт гп|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_99',
          'Одесский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          46.5036,
          30.7444,
          FALSE,
          '',
          '99',
          'Нет',
          TRUE,
          99,
          'never',
          'port|одесский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_100',
          'Ренийский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          45.4164,
          28.2879,
          FALSE,
          '',
          '100',
          'Нет',
          TRUE,
          100,
          'never',
          'port|ренийский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_101',
          'Севастопольский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          44.6167,
          33.5333,
          FALSE,
          '',
          '101',
          'Нет',
          TRUE,
          101,
          'never',
          'port|севастопольский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_102',
          'Скадовский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          46.1075,
          32.9108,
          FALSE,
          '',
          '102',
          'Нет',
          TRUE,
          102,
          'never',
          'port|скадовский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_103',
          'Усть-Дунайский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          45.467,
          29.7119,
          FALSE,
          '',
          '103',
          'Нет',
          TRUE,
          103,
          'never',
          'port|усть дунайский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_104',
          'Феодосийский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          45.0262,
          35.3879,
          FALSE,
          '',
          '104',
          'Нет',
          TRUE,
          104,
          'never',
          'port|феодосийский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_105',
          'Херсонский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          46.6304,
          32.6204,
          FALSE,
          '',
          '105',
          'Нет',
          TRUE,
          105,
          'never',
          'port|херсонский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_106',
          'Ялтинский морской торговый порт',
          'port',
          '',
          'Украина',
          '',
          44.4833,
          34.1833,
          FALSE,
          '',
          '106',
          'Нет',
          TRUE,
          106,
          'never',
          'port|ялтинский морской торговый порт|нет',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_107',
          'Международный свободный порт Джурджулешты',
          'port',
          '',
          'Молдова',
          '',
          45.4817,
          28.1972,
          FALSE,
          'Нефтепродукты, зерно, контейнеры',
          '107',
          'с. Джурджулешта',
          TRUE,
          107,
          'never',
          'port|международный свободный порт джурджулешты|с. джурджулешта',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_110',
          'Баку (Port of Baku)',
          'port',
          '',
          'Азербайджан',
          'Баку',
          40.3815,
          49.8878,
          FALSE,
          'Нефть, нефтепродукты, контейнеры',
          '110',
          'г. Баку',
          TRUE,
          110,
          'never',
          'port|баку port of baku|г. баку',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_111',
          'Альятьı (Port of Alat)',
          'port',
          '',
          'Азербайджан',
          '',
          39.9733,
          49.4389,
          FALSE,
          'Контейнеры, зерно, генеральные грузы',
          '111',
          'пос. Алят',
          TRUE,
          111,
          'never',
          'port|альять port of alat|пос. алят',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_112',
          'Порт Дюбенди (Дюбендский нефтеналивной порт)',
          'port',
          '',
          'Азербайджан',
          '',
          40.4335,
          50.2394,
          FALSE,
          'Нефть, нефтепродукты',
          '112',
          'пос. Дюбенди',
          TRUE,
          112,
          'never',
          'port|порт дюбенди дюбендский нефтеналивной порт|пос. дюбенди',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_113',
          'Порт Сангачал',
          'port',
          '',
          'Азербайджан',
          '',
          40.2013,
          49.4813,
          FALSE,
          'Нефть, нефтепродукты',
          '113',
          'пос. Сангачал',
          TRUE,
          113,
          'never',
          'port|порт сангачал|пос. сангачал',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_114',
          'Евлахский речной порт',
          'port',
          '',
          'Азербайджан',
          'Евлах',
          40.6183,
          47.1501,
          FALSE,
          'Речные грузы (стройматериалы, зерно)',
          '114',
          'г. Евлах, на реке Кура',
          TRUE,
          114,
          'never',
          'port|евлахский речной порт|г. евлах, на реке кура',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_115',
          'Туркменбашинский международный морской порт',
          'port',
          '',
          'Туркменистан',
          'Туркменбаши',
          40,
          53.028,
          FALSE,
          'Нефть, нефтепродукты, контейнеры, зерно',
          '115',
          'г. Туркменбаши',
          TRUE,
          115,
          'never',
          'port|туркменбашинский международный морской порт|г. туркменбаши',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_116',
          'Порт Экерем (Хазар)',
          'port',
          '',
          'Туркменистан',
          '',
          39.8814,
          53.0834,
          FALSE,
          'Нефть',
          '116',
          'пос. Экерем',
          TRUE,
          116,
          'never',
          'port|порт экерем хазар|пос. экерем',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_117',
          'Порт Гарабогаз (Кара-Богаз-Гол)',
          'port',
          '',
          'Туркменистан',
          'арабогаз',
          41.5244,
          52.5725,
          FALSE,
          'Химическое сырье, стройматериалы',
          '117',
          'пос. Гарабогаз',
          TRUE,
          117,
          'never',
          'port|порт гарабогаз кара богаз гол|пос. гарабогаз',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_119',
          'АО «НК «Актауский международный морской торговый порт»',
          'port',
          '',
          'Казахстан',
          'Актау',
          43.6014,
          51.2188,
          FALSE,
          'Нефть, нефтепродукты, зерно, контейнеры',
          '119',
          'г. Актау',
          TRUE,
          119,
          'never',
          'port|ао нк актауский международный морской торговый порт|г. актау',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_120',
          'Порт Курык',
          'port',
          '',
          'Казахстан',
          '',
          43.2667,
          51.75,
          FALSE,
          'Нефть',
          '120',
          'пос. Курык',
          TRUE,
          120,
          'never',
          'port|порт курык|пос. курык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_121',
          'Порт Баутино',
          'port',
          '',
          'Казахстан',
          '',
          44.5808,
          50.2828,
          FALSE,
          'Нефть',
          '121',
          'пос. Баутино',
          TRUE,
          121,
          'never',
          'port|порт баутино|пос. баутино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_122',
          'Порт Жетыбай',
          'port',
          '',
          'Казахстан',
          '',
          43.5499,
          52.1667,
          FALSE,
          'Нефть',
          '122',
          'пос. Жетыбай',
          TRUE,
          122,
          'never',
          'port|порт жетыбай|пос. жетыбай',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_123',
          'Порт Каражанбас',
          'port',
          '',
          'Казахстан',
          '',
          45.1224,
          51.4303,
          FALSE,
          'Нефть',
          '123',
          'район мыса Песчаный',
          TRUE,
          123,
          'never',
          'port|порт каражанбас|район мыса песчаный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_126',
          'Белгород-Днестровский морской порт, ГП',
          'port',
          '',
          'Украина',
          'Белгород-Днестровский',
          46.1867,
          30.3504,
          FALSE,
          'Зерно, стройматериалы',
          '126',
          'г. Белгород-Днестровский',
          TRUE,
          126,
          'never',
          'port|белгород днестровский морской порт гп|г. белгород-днестровский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_127',
          'Бердянский морской торговый порт',
          'port',
          '',
          'Украина',
          'Бердянск',
          46.7509,
          36.7747,
          FALSE,
          'Зерно, металл, уголь',
          '127',
          'г. Бердянск',
          TRUE,
          127,
          'never',
          'port|бердянский морской торговый порт|г. бердянск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_128',
          'Генический морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          'Херсонская область',
          46.1625,
          34.8086,
          FALSE,
          'Зерно, стройматериалы',
          '128',
          'г. Геническ, Херсонская область',
          TRUE,
          128,
          'never',
          'port|генический морской торговый порт гп|г. геническ, херсонская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_129',
          'Евпаторийский морской торговый порт',
          'port',
          '',
          'Украина',
          'Евпатория',
          45.1864,
          33.3808,
          FALSE,
          'Стройматериалы, зерно',
          '129',
          'г. Евпатория, Крым',
          TRUE,
          129,
          'never',
          'port|евпаторийский морской торговый порт|г. евпатория, крым',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_130',
          'Измаильский морской торговый порт',
          'port',
          '',
          'Украина',
          'Одесская область',
          45.3341,
          28.8279,
          FALSE,
          'Зерно, металл, контейнеры',
          '130',
          'г. Измаил, Одесская область',
          TRUE,
          130,
          'never',
          'port|измаильский морской торговый порт|г. измаил, одесская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_131',
          'Керченский морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          'Керчь',
          45.3631,
          36.6694,
          FALSE,
          'Зерно, стройматериалы, паромные перевозки',
          '131',
          'г. Керчь, Крым',
          TRUE,
          131,
          'never',
          'port|керченский морской торговый порт гп|г. керчь, крым',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_132',
          'Мариупольский морской торговый порт',
          'port',
          '',
          'Украина',
          'Донецкая область',
          47.0619,
          37.5065,
          FALSE,
          'Уголь, металл, зерно',
          '132',
          'г. Мариуполь, Донецкая область',
          TRUE,
          132,
          'never',
          'port|мариупольский морской торговый порт|г. мариуполь, донецкая область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_133',
          'Морской торговый порт ''Южный'', ГП',
          'port',
          '',
          'Украина',
          'Одесская область',
          46.6333,
          31.5,
          FALSE,
          'Зерно, руда, контейнеры',
          '133',
          'Одесская область',
          TRUE,
          133,
          'never',
          'port|морской торговый порт южный гп|одесская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_134',
          'Морской торговый порт Октябрьск',
          'port',
          '',
          'Украина',
          'Николаев',
          46.8333,
          31.95,
          FALSE,
          'Зерно',
          '134',
          'г. Николаев',
          TRUE,
          134,
          'never',
          'port|морской торговый порт октябрьск|г. николаев',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_135',
          'Николаевский морской торговый порт, ГП',
          'port',
          '',
          'Украина',
          'Николаев',
          46.9483,
          31.9555,
          FALSE,
          'Зерно, руда, металл, контейнеры',
          '135',
          'г. Николаев',
          TRUE,
          135,
          'never',
          'port|николаевский морской торговый порт гп|г. николаев',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_136',
          'Одесский морской торговый порт',
          'port',
          '',
          'Украина',
          'Одесса',
          46.5036,
          30.7444,
          FALSE,
          'Контейнеры, зерно, металл, нефтепродукты',
          '136',
          'г. Одесса',
          TRUE,
          136,
          'never',
          'port|одесский морской торговый порт|г. одесса',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_137',
          'Ренийский морской торговый порт',
          'port',
          '',
          'Украина',
          'Одесская область',
          45.4164,
          28.2879,
          FALSE,
          'Зерно, стройматериалы',
          '137',
          'г. Рени, Одесская область',
          TRUE,
          137,
          'never',
          'port|ренийский морской торговый порт|г. рени, одесская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_138',
          'Севастопольский морской торговый порт',
          'port',
          '',
          'Украина',
          'Севастополь',
          44.6167,
          33.5333,
          FALSE,
          'Универсальный (военные и коммерческие грузы)',
          '138',
          'г. Севастополь',
          TRUE,
          138,
          'never',
          'port|севастопольский морской торговый порт|г. севастополь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_139',
          'Скадовский морской торговый порт',
          'port',
          '',
          'Украина',
          'Херсонская область',
          46.1075,
          32.9108,
          FALSE,
          'Зерно, стройматериалы',
          '139',
          'г. Скадовск, Херсонская область',
          TRUE,
          139,
          'never',
          'port|скадовский морской торговый порт|г. скадовск, херсонская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_140',
          'Усть-Дунайский морской торговый порт',
          'port',
          '',
          'Украина',
          'Одесская область',
          45.467,
          29.7119,
          FALSE,
          'Зерно, лес',
          '140',
          'г. Вилково, Одесская область',
          TRUE,
          140,
          'never',
          'port|усть дунайский морской торговый порт|г. вилково, одесская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_141',
          'Феодосийский морской торговый порт',
          'port',
          '',
          'Украина',
          'Феодосия',
          45.0262,
          35.3879,
          FALSE,
          'Нефтепродукты, зерно, стройматериалы',
          '141',
          'г. Феодосия, Крым',
          TRUE,
          141,
          'never',
          'port|феодосийский морской торговый порт|г. феодосия, крым',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_142',
          'Херсонский морской торговый порт',
          'port',
          '',
          'Украина',
          'Херсон',
          46.6304,
          32.6204,
          FALSE,
          'Зерно, стройматериалы',
          '142',
          'г. Херсон',
          TRUE,
          142,
          'never',
          'port|херсонский морской торговый порт|г. херсон',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'port_143',
          'Ялтинский морской торговый порт',
          'port',
          '',
          'Украина',
          'Ялта',
          44.4833,
          34.1833,
          FALSE,
          'Пассажирские перевозки, генеральные грузы',
          '143',
          'г. Ялта',
          TRUE,
          143,
          'never',
          'port|ялтинский морской торговый порт|г. ялта',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_1',
          'ВСМПО-Ависма',
          'steel_mill',
          '',
          'РФ',
          'Пермский край',
          59.456779,
          56.834477,
          FALSE,
          'Производство: Слитки и прокат из титановых сплавов, алюминиевые профили, полуфабрикаты из легированных сталей и никелевых сплавов | Сырьё: Титановая губка, легирующие добавки | Экспорт: 70% продукции – в 50 стран (Airbus, Boeing)',
          '1',
          '618421, Пермский край, Березники, Загородная ул., 29',
          TRUE,
          1,
          'never',
          'steel_mill|всмпо ависма|618421, пермский край, березники, загородная ул., 29',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_2',
          'Самарский завод КВОиТ',
          'steel_mill',
          '',
          'РФ',
          'Самара',
          53.1746,
          50.0698,
          FALSE,
          'Производство: Резервуары, опоры трубопроводов, детали трубопроводов, котельные модули | Сырьё: Металлопрокат (лист, трубы) | Экспорт: Продукция для ТЭС и АЭС',
          '2',
          '443022, г. Самара, проезд Мальцева, 1',
          TRUE,
          2,
          'never',
          'steel_mill|самарский завод квоит|443022, г. самара, проезд мальцева, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_3',
          'Нижегородский литейный завод',
          'steel_mill',
          '',
          'РФ',
          'Нижний Новгород',
          56.2967,
          43.9361,
          FALSE,
          'Производство: Чугунные блоки и головки цилиндров | Сырьё: Чугун, лом черных металлов | Экспорт: Продукция для автопрома (ГАЗ) | Импорт: Замещает импортные автокомпоненты',
          '3',
          '603004, г. Нижний Новгород, проспект Ленина, 95',
          TRUE,
          3,
          'never',
          'steel_mill|нижегородский литейный завод|603004, г. нижний новгород, проспект ленина, 95',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_4',
          'Амурсталь',
          'steel_mill',
          '',
          'РФ',
          'Хабаровский край',
          50.563131,
          136.976362,
          FALSE,
          'Производство: Сортовой стальной прокат (арматура, уголок, катанка) из электростали | Сырьё: Лом черных металлов | Экспорт: 60% – в страны Азии (Китай, Филиппины, Вьетнам)',
          '4',
          '681005, Хабаровский край, г. Комсомольск-на-Амуре, ул. Вагонная, 30',
          TRUE,
          4,
          'never',
          'steel_mill|амурсталь|681005, хабаровский край, г. комсомольск-на-амуре, ул. вагонная, 30',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_5',
          'Ижевский Металлургический Завод',
          'steel_mill',
          '',
          'РФ',
          'Республика Башкортостан',
          54.7434,
          55.9676,
          FALSE,
          'Производство: Прессовые и молотовые поковки, литье, штамповки, металлопрокат | Сырьё: Лом черных металлов, легирующие добавки | Экспорт: В США, Европу, Центральную Азию',
          '5',
          '450024, Республика Башкортостан, г. Уфа, ул. Центральная, 57',
          TRUE,
          5,
          'never',
          'steel_mill|ижевский металлургический завод|450024, республика башкортостан, г. уфа, ул. центральная, 57',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_6',
          'МетМашУфалей',
          'steel_mill',
          '',
          'РФ',
          'Челябинская область',
          56.0484,
          60.2318,
          FALSE,
          'Производство: Металлургические полуфабрикаты, запчасти для металлургии | Сырьё: Исходный металл (прокат) | Экспорт: В Турцию, Францию, Италию, Великобританию, Германию',
          '6',
          '456800, Челябинская область, г. Верхний Уфалей, ул. Ленина, 129',
          TRUE,
          6,
          'never',
          'steel_mill|метмашуфалей|456800, челябинская область, г. верхний уфалей, ул. ленина, 129',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_7',
          'СтальСтройТехнологии',
          'steel_mill',
          '',
          'РФ',
          'Рязань',
          54.6199,
          39.7442,
          FALSE,
          'Производство: Металлоконструкции | Сырьё: Металлопрокат | Экспорт: Участие в международных проектах (АЭС в Египте)',
          '7',
          '390010, г. Рязань, ул. Октябрьская, 61',
          TRUE,
          7,
          'never',
          'steel_mill|стальстройтехнологии|390010, г. рязань, ул. октябрьская, 61',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_8',
          'Коломенский завод порошковой металлургии (КЗПМ)',
          'steel_mill',
          '',
          'РФ',
          'Московская область',
          55.1122,
          38.7717,
          FALSE,
          'Производство: Порошковые изделия (детали двигателей, втулки) | Сырьё: Металлические порошки | Экспорт: Не является крупным экспортером | Импорт: Импорт порошков (напр., из Швеции)',
          '8',
          '140408, Московская область, г. Коломна, ул. Партизан, 42',
          TRUE,
          8,
          'never',
          'steel_mill|коломенский завод порошковой металлургии кзпм|140408, московская область, г. коломна, ул. партизан, 42',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_9',
          'Русполимет',
          'steel_mill',
          '',
          'РФ',
          'Нижегородская область',
          55.420864,
          42.534241,
          FALSE,
          'Производство: Кольцевые заготовки и диски | Сырьё: Зарубежное сырье | Экспорт: В США, Италию, Южную Корею, Канаду, Китай',
          '9',
          '607018, Нижегородская область, г. Кулебаки, ул. Восстания, 1',
          TRUE,
          9,
          'never',
          'steel_mill|русполимет|607018, нижегородская область, г. кулебаки, ул. восстания, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_10',
          'Омутнинский металлургический завод (ОМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Кировская область',
          58.6675,
          52.187,
          FALSE,
          'Производство: Стальные фасонные профили высокой точности | Сырьё: Сталь | Экспорт: Второе место в Европе по качеству. Потенциальный поставщик для КАЗ | Импорт: Замещает "серый импорт"',
          '10',
          '612740, Кировская область, г. Омутнинск, ул. Коковихина, 2',
          TRUE,
          10,
          'never',
          'steel_mill|омутнинский металлургический завод омз|612740, кировская область, г. омутнинск, ул. коковихина, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_11',
          'Ашинский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Челябинская область',
          54.99484,
          57.277548,
          FALSE,
          'Производство: Черный металлопрокат (полосы, листы, трубы) | Сырьё: Сталь | Экспорт: В страны СНГ и Азии',
          '11',
          '456010, Челябинская область, г. Аша, ул. Мира, 9',
          TRUE,
          11,
          'never',
          'steel_mill|ашинский металлургический завод|456010, челябинская область, г. аша, ул. мира, 9',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_12',
          'Челябинский электрометаллургический комбинат (ЧЭМК)',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1935,
          61.4329,
          FALSE,
          'Производство: Ферросплавы (феррохром), чугун, стальной прокат | Сырьё: Хромовая руда, марганцевая руда | Экспорт: Крупнейший экспортер феррохрома',
          '12',
          '454081, г. Челябинск, ул. Героев Танкограда, 80-п',
          TRUE,
          12,
          'never',
          'steel_mill|челябинский электрометаллургический комбинат чэмк|454081, г. челябинск, ул. героев танкограда, 80-п',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_13',
          'НЛМК-Урал',
          'steel_mill',
          '',
          'РФ',
          'Свердловская область',
          56.849666,
          59.908414,
          FALSE,
          'Производство: Непрерывнолитая квадратная заготовка, арматура, катанка | Сырьё: Лом черных металлов | Экспорт: Входит в Группу НЛМК – экспорт в 70+ стран',
          '13',
          '623280, Свердловская область, г. Ревда, ул. Карла Либкнехта, 3',
          TRUE,
          13,
          'never',
          'steel_mill|нлмк урал|623280, свердловская область, г. ревда, ул. карла либкнехта, 3',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_14',
          'Каменск-Уральский металлургический завод (КУМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Свердловская область',
          56.3539,
          61.9861,
          FALSE,
          'Производство: Алюминиевая и магниевая продукция (листы, профили, поковки) | Сырьё: Алюминий, магний | Экспорт: В США, Канаду, Европу, Китай (45% экспорта) | Импорт: Замещает импорт алюминиевых листов',
          '14',
          '623405, Свердловская область, г. Каменск-Уральский, ул. Заводская, 5',
          TRUE,
          14,
          'never',
          'steel_mill|каменск уральский металлургический завод кумз|623405, свердловская область, г. каменск-уральский, ул. заводская, 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_15',
          'Новосибирский металлургический завод им. Кузьмина',
          'steel_mill',
          '',
          'РФ',
          'Новосибирск',
          55.004695,
          82.9089,
          FALSE,
          'Производство: Листовой прокат, трубы, профили, холоднокатаная лента | Сырьё: Сталь | Экспорт: В основном на внутренний рынок',
          '15',
          '630108, г. Новосибирск, ул. Станционная, 28',
          TRUE,
          15,
          'never',
          'steel_mill|новосибирский металлургический завод им кузьмина|630108, г. новосибирск, ул. станционная, 28',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_16',
          'Красноярский металлургический завод (КраМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Красноярск',
          56.0094,
          92.9327,
          FALSE,
          'Производство: Слитки, прессованные профили, трубы, поковки из алюминиевых сплавов | Сырьё: Алюминий | Экспорт: В США, ЕС, Южную Корею, Турцию, Австралию',
          '16',
          '660111, г. Красноярск, ул. Пограничников, 42',
          TRUE,
          16,
          'never',
          'steel_mill|красноярский металлургический завод крамз|660111, г. красноярск, ул. пограничников, 42',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_17',
          'Кузнечно-механический завод «Ижора-Металл»',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.7461,
          30.5895,
          FALSE,
          'Производство: Прессовые и молотовые поковки, штамповки | Сырьё: Сталь | Экспорт: Не является крупным экспортером',
          '17',
          '196653, г. Санкт-Петербург, Колпино, ул. Карла Маркса, 13',
          TRUE,
          17,
          'never',
          'steel_mill|кузнечно механический завод ижора металл|196653, г. санкт-петербург, колпино, ул. карла маркса, 13',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_18',
          'Металлургический завод Петросталь',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Сортовой прокат, стальное литье | Сырьё: Сталь | Экспорт: Ранее 80% – экспорт, сейчас – внутренний рынок, поставки в СНГ, Европу',
          '18',
          '198097, г. Санкт-Петербург, проспект Стачек, 47',
          TRUE,
          18,
          'never',
          'steel_mill|металлургический завод петросталь|198097, г. санкт-петербург, проспект стачек, 47',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_19',
          'Абинский электрометаллургический завод (АЭМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Краснодарский край',
          44.881938,
          38.12751,
          FALSE,
          'Производство: Арматура | Сырьё: Лом черных металлов | Экспорт: Крупный экспортер в ЮФО, более чем в 50 стран | Импорт: Замещает импорт проволоки',
          '19',
          '353320, Краснодарский край, г. Абинск, ул. Промышленная, 4',
          TRUE,
          19,
          'never',
          'steel_mill|абинский электрометаллургический завод аэмз|353320, краснодарский край, г. абинск, ул. промышленная, 4',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_20',
          'УК «МЕТАЛЛОИНВЕСТ»',
          'steel_mill',
          '',
          'РФ',
          'Московская обл.',
          55.9176,
          37.817,
          FALSE,
          'Производство: Горячебрикетированное железо (ГБЖ), железорудная продукция | Сырьё: Железная руда (собственная добыча) | Экспорт: Мировой лидер по ГБЖ (50% рынка)',
          '20',
          '141090, Московская обл., г. Королёв, мкр Юбилейный, ул. Ленинская, 12',
          TRUE,
          20,
          'never',
          'steel_mill|ук металлоинвест|141090, московская обл., г. королев, мкр юбилейный, ул. ленинская, 12',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_21',
          'Тульский МеталлоПрокатный Завод (ТМПЗ)',
          'steel_mill',
          '',
          'РФ',
          'Тула',
          54.167,
          37.5691,
          FALSE,
          'Производство: Арматурный и неарматурный прокат | Сырьё: Сталь | Экспорт: Поставки в Германию (Peri)',
          '21',
          '300004, г. Тула, ул. Щегловская засека, 31',
          TRUE,
          21,
          'never',
          'steel_mill|тульский металлопрокатный завод тмпз|300004, г. тула, ул. щегловская засека, 31',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_22',
          'Тулачермет',
          'steel_mill',
          '',
          'РФ',
          'Тула',
          54.156726,
          37.725551,
          FALSE,
          'Производство: Товарный чугун | Сырьё: Железная руда, кокс | Экспорт: Крупнейший экспортер чугуна в РФ (>60% российского экспорта) – в США, Европу, Азию | Импорт: Техническое оборудование',
          '22',
          '300016, г. Тула, ул. Пржевальского, 2',
          TRUE,
          22,
          'never',
          'steel_mill|тулачермет|300016, г. тула, ул. пржевальского, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_23',
          'Косогорский металлургический завод (КМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Тула',
          57.115131,
          51.435429,
          FALSE,
          'Производство: Высокочистый чугун, ферромарганец | Сырьё: Железная руда, марганцевая руда | Экспорт: В США, Европу, Азию | Импорт: Доля импорта в сырье',
          '23',
          '300903, г. Тула, пос. Косая Гора, Орловское шоссе, 4',
          TRUE,
          23,
          'never',
          'steel_mill|косогорский металлургический завод кмз|300903, г. тула, пос. косая гора, орловское шоссе, 4',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_24',
          'Ступинская металлургическая компания (СМК)',
          'steel_mill',
          '',
          'РФ',
          'Московская обл.',
          54.904606,
          38.080799,
          FALSE,
          'Производство: Изделия из жаропрочных никелевых и титановых сплавов | Сырьё: Никель, титан | Экспорт: В США, Италию, Японию, Южную Корею | Импорт: Импортозамещение',
          '24',
          '142800, Московская обл., г. Ступино, ул. Пристанционная, 2',
          TRUE,
          24,
          'never',
          'steel_mill|ступинская металлургическая компания смк|142800, московская обл., г. ступино, ул. пристанционная, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_25',
          'Металлургический завод «Электросталь»',
          'steel_mill',
          '',
          'РФ',
          'Московская обл.',
          55.7863,
          38.4598,
          FALSE,
          'Производство: Поковки, прутки, листы, проволока | Сырьё: Сталь | Экспорт: В СНГ и Европу | Импорт: Импортозамещающая продукция',
          '25',
          '144002, Московская обл., г. Электросталь, ул. Железнодорожная, 1',
          TRUE,
          25,
          'never',
          'steel_mill|металлургический завод электросталь|144002, московская обл., г. электросталь, ул. железнодорожная, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_26',
          'Новолипецкий металлургический комбинат (НЛМК)',
          'steel_mill',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Производство: Чугун, слябы, холоднокатаная, горячекатаная, оцинкованная сталь | Сырьё: Железная руда (Стойленский ГОК) | Экспорт: 60% выручки – экспорт (ЕС, США, Турция)',
          '26',
          '398040, г. Липецк, пл. Металлургов, 2',
          TRUE,
          26,
          'never',
          'steel_mill|новолипецкий металлургический комбинат нлмк|398040, г. липецк, пл. металлургов, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_27',
          'Оскольский завод металлургического машиностроения (ОЗММ)',
          'steel_mill',
          '',
          'РФ',
          'Белгородская обл.',
          51.2959,
          37.8415,
          FALSE,
          'Производство: Запчасти для горного и металлургического оборудования | Сырьё: Сталь',
          '27',
          '309530, Белгородская обл., г. Старый Оскол, мкр. Жукова, 34',
          TRUE,
          27,
          'never',
          'steel_mill|оскольский завод металлургического машиностроения озмм|309530, белгородская обл., г. старый оскол, мкр. жукова, 34',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_28',
          'Липецкая площадка',
          'steel_mill',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Производство: Сырье для чугуна и стали, плоский прокат | Сырьё: Железная руда, кокс | Экспорт: Входит в НЛМК',
          '28',
          '398040, г. Липецк',
          TRUE,
          28,
          'never',
          'steel_mill|липецкая площадка|398040, г. липецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_29',
          'ВИЗ-Сталь',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Холоднокатаная электротехническая сталь | Сырьё: Сталь | Экспорт: Входит в НЛМК',
          '29',
          '620085, г. Екатеринбург, ул. Металлургов, 2',
          TRUE,
          29,
          'never',
          'steel_mill|виз сталь|620085, г. екатеринбург, ул. металлургов, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_30',
          'ЕВРАЗ Нижнетагильский металлургический комбинат (ЕВРАЗ НТМК)',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          57.9052,
          59.9645,
          FALSE,
          'Производство: Рельсы, балки, трубы большого диаметра | Сырьё: Железная руда, кокс, лом | Экспорт: Входит в ЕВРАЗ',
          '30',
          '622025, Свердловская обл., г. Нижний Тагил, ул. Металлургов, 1',
          TRUE,
          30,
          'never',
          'steel_mill|евраз нижнетагильский металлургический комбинат евраз нтмк|622025, свердловская обл., г. нижний тагил, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_31',
          'ЕВРАЗ Объединенный Западно-Сибирский металлургический комбинат (ЕВРАЗ ЗСМК)',
          'steel_mill',
          '',
          'РФ',
          'Кемеровская обл.',
          53.7496,
          87.1094,
          FALSE,
          'Производство: Арматура, проволока, листовой прокат | Сырьё: Железная руда, кокс, лом | Экспорт: Входит в ЕВРАЗ',
          '31',
          '654043, Кемеровская обл., г. Новокузнецк, ш. Космическое, 16',
          TRUE,
          31,
          'never',
          'steel_mill|евраз объединенный западно сибирский металлургический комбинат евраз зсмк|654043, кемеровская обл., г. новокузнецк, ш. космическое, 16',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_32',
          'Уральская Сталь',
          'steel_mill',
          '',
          'РФ',
          'Оренбургская обл.',
          51.2261,
          58.3101,
          FALSE,
          'Производство: Чугун, сталь, прокат, литье | Сырьё: Железная руда, кокс, лом',
          '32',
          '462353, Оренбургская обл., г. Новотроицк, ул. Заводская, 1',
          TRUE,
          32,
          'never',
          'steel_mill|уральская сталь|462353, оренбургская обл., г. новотроицк, ул. заводская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_33',
          'Оскольский электрометаллургический комбинат (ОЭМК)',
          'steel_mill',
          '',
          'РФ',
          'Белгородская обл.',
          51.2904,
          37.8685,
          FALSE,
          'Производство: ПВЖ, прокат, стальные мелющие шары | Сырьё: Прямовосстановленное железо (ПВЖ) | Экспорт: В Германию, Францию, США, Италию, Турцию',
          '33',
          '309530, Белгородская обл., г. Старый Оскол, мкр. Жукова, 35',
          TRUE,
          33,
          'never',
          'steel_mill|оскольский электрометаллургический комбинат оэмк|309530, белгородская обл., г. старый оскол, мкр. жукова, 35',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_34',
          'ММК-Лысьвенский металлургический завод (ММК-ЛМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Пермский край',
          58.0909,
          57.8043,
          FALSE,
          'Производство: Оцинкованный прокат и прокат с полимерным покрытием | Сырьё: Сталь | Экспорт: Входит в ММК',
          '34',
          '618900, Пермский край, г. Лысьва, ул. Коммунаров, 1',
          TRUE,
          34,
          'never',
          'steel_mill|ммк лысьвенский металлургический завод ммк лмз|618900, пермский край, г. лысьва, ул. коммунаров, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_35',
          'Магнитогорский металлургический комбинат (ММК)',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          53.3786,
          59.0356,
          FALSE,
          'Производство: Сортовой, фасонный прокат, трубы, слябы | Сырьё: Железная руда (15% самообеспечения), уголь (51%) | Экспорт: В Турцию, Иран, Италию (14% продаж) | Импорт: Оборудование из Китая и Германии',
          '35',
          '455000, Челябинская обл., г. Магнитогорск, ул. Кирова, 93',
          TRUE,
          35,
          'never',
          'steel_mill|магнитогорский металлургический комбинат ммк|455000, челябинская обл., г. магнитогорск, ул. кирова, 93',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_36',
          'Нижнесергинский метизно-металлургический завод (Нлмк-Сорт)',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          56.8497,
          59.9084,
          FALSE,
          'Производство: Заготовка и сортовой прокат | Сырьё: Сталь | Экспорт: Входит в НЛМК-Урал',
          '36',
          '623280, Свердловская обл., г. Ревда (совпадает с НЛМК-Урал)',
          TRUE,
          36,
          'never',
          'steel_mill|нижнесергинский метизно металлургический завод нлмк сорт|623280, свердловская обл., г. ревда (совпадает с нлмк-урал)',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_37',
          'Выксунский металлургический завод (ВМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Нижегородская обл.',
          55.3192,
          42.1761,
          FALSE,
          'Производство: Трубы большого диаметра, железнодорожные колеса | Сырьё: Сталь | Экспорт: Поставщик магистральных газопроводов',
          '37',
          '607060, Нижегородская обл., г. Выкса, ул. Братьев Баташевых, 1',
          TRUE,
          37,
          'never',
          'steel_mill|выксунский металлургический завод вмз|607060, нижегородская обл., г. выкса, ул. братьев баташевых, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_38',
          'Чусовской металлургический завод (ЧМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Пермский край',
          58.3069,
          57.8101,
          FALSE,
          'Производство: Трубы, арматура, прокат, железнодорожные колеса, рессоры | Сырьё: Сталь | Экспорт: В Финляндию, Италию, Германию, Китай, США',
          '38',
          '618204, Пермский край, г. Чусовой, ул. Металлургов, 1',
          TRUE,
          38,
          'never',
          'steel_mill|чусовской металлургический завод чмз|618204, пермский край, г. чусовой, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_39',
          'Щелковский металлургический завод (Щелмет)',
          'steel_mill',
          '',
          'РФ',
          'Московская обл.',
          55.9231,
          37.984,
          FALSE,
          'Производство: Сверхтонкие ленты из холоднокатаных сталей и сплавов | Сырьё: Сталь',
          '39',
          '141101, Московская обл., г. Щёлково, ул. Заречная, 105',
          TRUE,
          39,
          'never',
          'steel_mill|щелковский металлургический завод щелмет|141101, московская обл., г. щелково, ул. заречная, 105',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_40',
          'ПромСорт-Калуга',
          'steel_mill',
          '',
          'РФ',
          'Калужская обл.',
          55.1906,
          36.6347,
          FALSE,
          'Производство: Стальной прокат строительного назначения | Сырьё: Сталь',
          '40',
          '249020, Калужская обл., Боровский р-н, с. Ворсино',
          TRUE,
          40,
          'never',
          'steel_mill|промсорт калуга|249020, калужская обл., боровский р-н, с. ворсино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_41',
          'ВКМ-Сталь',
          'steel_mill',
          '',
          'РФ',
          'Республика Мордовия',
          54.183,
          45.1743,
          FALSE,
          'Производство: Литейная продукция для ж/д, автомобильной и нефтегазовой отраслей | Сырьё: Чугун, сталь',
          '41',
          '430904, Республика Мордовия, г. Саранск, ш. Александровское, 9',
          TRUE,
          41,
          'never',
          'steel_mill|вкм сталь|430904, республика мордовия, г. саранск, ш. александровское, 9',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_42',
          'Северсталь-Вторчермет',
          'steel_mill',
          '',
          'РФ',
          'Вологодская обл.',
          59.1516,
          37.9044,
          FALSE,
          'Производство: Закупка, переработка и продажа лома черных металлов | Сырьё: Лом черных металлов | Экспорт: Входит в Северсталь',
          '42',
          '162600, Вологодская обл., г. Череповец, ул. Металлургов, 1',
          TRUE,
          42,
          'never',
          'steel_mill|северсталь вторчермет|162600, вологодская обл., г. череповец, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_43',
          'Череповецкий металлургический комбинат (ЧерМК)',
          'steel_mill',
          '',
          'РФ',
          'Вологодская обл.',
          59.1516,
          37.9044,
          FALSE,
          'Производство: Сортовой, фасонный, горячекатаный, холоднокатаный прокат | Сырьё: Железная руда, кокс, лом | Экспорт: Входит в Северсталь. Экспорт практически отсутствует',
          '43',
          '162600, Вологодская обл., г. Череповец, ул. Металлургов, 1',
          TRUE,
          43,
          'never',
          'steel_mill|череповецкий металлургический комбинат чермк|162600, вологодская обл., г. череповец, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_44',
          'Надеждинский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          59.6127,
          60.5735,
          FALSE,
          'Производство: Калиброванный прокат, трубы, слитки | Сырьё: Сталь',
          '44',
          '624992, Свердловская обл., г. Серов, ул. Красноармейская, 1',
          TRUE,
          44,
          'never',
          'steel_mill|надеждинский металлургический завод|624992, свердловская обл., г. серов, ул. красноармейская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_45',
          'Уральская кузница (Уралкуз)',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          54.997,
          60.3822,
          FALSE,
          'Производство: Штамповки для машиностроения, авиации, нефтегаза | Сырьё: Сталь',
          '45',
          '456418, Челябинская обл., г. Чебаркуль, ул. Металлургов, 1',
          TRUE,
          45,
          'never',
          'steel_mill|уральская кузница уралкуз|456418, челябинская обл., г. чебаркуль, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_46',
          'Ижсталь',
          'steel_mill',
          '',
          'РФ',
          'Удмуртская Республика',
          56.8508,
          53.2154,
          FALSE,
          'Производство: Специальные марки стали, нержавеющий сортовой прокат | Сырьё: Сталь, легирующие добавки | Экспорт: В США, Европу, Центральную Азию',
          '46',
          '426006, Удмуртская Республика, г. Ижевск, ул. Новоажимова, 6',
          TRUE,
          46,
          'never',
          'steel_mill|ижсталь|426006, удмуртская республика, г. ижевск, ул. новоажимова, 6',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_47',
          'Челябинский металлургический комбинат (ЧМК)',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Производство: Металлургическая продукция для строительства | Сырьё: Сталь',
          '47',
          '454047, г. Челябинск, ул. 2-я Павелецкая, 14',
          TRUE,
          47,
          'never',
          'steel_mill|челябинский металлургический комбинат чмк|454047, г. челябинск, ул. 2-я павелецкая, 14',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_48',
          'Технотур',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          56.504,
          60.761,
          FALSE,
          'Производство: Детали для машиностроения, арматуры, дробилок | Сырьё: Сталь',
          '48',
          '624022, Свердловская обл., г. Сысерть, ул. Ленина, 54',
          TRUE,
          48,
          'never',
          'steel_mill|технотур|624022, свердловская обл., г. сысерть, ул. ленина, 54',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_49',
          'Нефтепром-Энерго',
          'steel_mill',
          '',
          'РФ',
          'Удмуртская Республика',
          56.8508,
          53.2154,
          FALSE,
          'Производство: Литейная продукция из стали и чугуна, оборудование для нефтедобычи | Сырьё: Чугун, сталь',
          '49',
          '426006, Удмуртская Республика, г. Ижевск',
          TRUE,
          49,
          'never',
          'steel_mill|нефтепром энерго|426006, удмуртская республика, г. ижевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_50',
          'НПП Метчив',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Производство: Прокат из нержавеющих, жаропрочных, специальных сталей | Сырьё: Специальные стали',
          '50',
          '454047, г. Челябинск',
          TRUE,
          50,
          'never',
          'steel_mill|нпп метчив|454047, г. челябинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_51',
          'РМ-стил',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Специальный профильный прокат для судостроения | Сырьё: Сталь',
          '51',
          '198097, г. Санкт-Петербург',
          TRUE,
          51,
          'never',
          'steel_mill|рм стил|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_52',
          'Борский Завод Металлургии и машиностроения',
          'steel_mill',
          '',
          'РФ',
          'Нижегородская обл.',
          56.3577,
          44.0716,
          FALSE,
          'Производство: Стальное и чугунное литье, поковки | Сырьё: Чугун, сталь',
          '52',
          '606440, Нижегородская обл., г. Бор, ул. Ленина, 63',
          TRUE,
          52,
          'never',
          'steel_mill|борский завод металлургии и машиностроения|606440, нижегородская обл., г. бор, ул. ленина, 63',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_53',
          'Завод Стального Проката',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Черный и оцинкованный металлопрокат | Сырьё: Сталь',
          '53',
          '620085, г. Екатеринбург',
          TRUE,
          53,
          'never',
          'steel_mill|завод стального проката|620085, г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_54',
          'Завод по производству металлических порошков (ПМП)',
          'steel_mill',
          '',
          'РФ',
          'Рязань',
          54.6199,
          39.7442,
          FALSE,
          'Производство: Порошки (оловянный, свинцовый, медный) | Сырьё: Олово, свинец, медь',
          '54',
          '390042, г. Рязань',
          TRUE,
          54,
          'never',
          'steel_mill|завод по производству металлических порошков пмп|390042, г. рязань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_55',
          'Петербургский завод прецизионных сплавов (ПЗПС)',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Холоднокатаная лента из прецизионных сплавов | Сырьё: Прецизионные сплавы',
          '55',
          '198097, г. Санкт-Петербург',
          TRUE,
          55,
          'never',
          'steel_mill|петербургский завод прецизионных сплавов пзпс|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_56',
          'Мценский завод по обработке цветных металлов (МЗОЦМ)',
          'steel_mill',
          '',
          'РФ',
          'Орловская обл.',
          53.2779,
          36.5744,
          FALSE,
          'Производство: Прокат из латуни, бронзы, меди, алюминия | Сырьё: Латунь, бронза, медь, алюминий',
          '56',
          '303030, Орловская обл., Мценский р-н, п. Воля',
          TRUE,
          56,
          'never',
          'steel_mill|мценский завод по обработке цветных металлов мзоцм|303030, орловская обл., мценский р-н, п. воля',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_57',
          'Калужский завод по обработке цветных металлов',
          'steel_mill',
          '',
          'РФ',
          'Калуга',
          54.5137,
          36.2619,
          FALSE,
          'Производство: Плакированные ленты | Сырьё: Сталь, цветные металлы',
          '57',
          '248010, г. Калуга, ул. Московская, 247',
          TRUE,
          57,
          'never',
          'steel_mill|калужский завод по обработке цветных металлов|248010, г. калуга, ул. московская, 247',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_58',
          'Германий',
          'steel_mill',
          '',
          'РФ',
          'Красноярск',
          56.0094,
          92.9327,
          FALSE,
          'Производство: Производство германия и его соединений | Сырьё: Германий',
          '58',
          '660111, г. Красноярск',
          TRUE,
          58,
          'never',
          'steel_mill|германий|660111, г. красноярск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_59',
          'Новороссийский прокатный завод',
          'steel_mill',
          '',
          'РФ',
          'Ростовская обл.',
          47.7063,
          40.2135,
          FALSE,
          'Производство: Квадратная заготовка, арматура, проволока | Сырьё: Сталь',
          '59',
          '346500, Ростовская обл., г. Шахты, ул. Мельникова, 1',
          TRUE,
          59,
          'never',
          'steel_mill|новороссийский прокатный завод|346500, ростовская обл., г. шахты, ул. мельникова, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_60',
          'Уральский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Стальные поковки | Сырьё: Сталь',
          '60',
          '620085, г. Екатеринбург',
          TRUE,
          60,
          'never',
          'steel_mill|уральский металлургический завод|620085, г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_61',
          'Металл ГОСТ',
          'steel_mill',
          '',
          'РФ',
          'Московская обл.',
          54.8759,
          37.2188,
          FALSE,
          'Производство: Арматура, балки, швеллер, лист, трубы | Сырьё: Сталь',
          '61',
          '142281, Московская обл., г. Протвино, ул. Железнодорожная, 1',
          TRUE,
          61,
          'never',
          'steel_mill|металл гост|142281, московская обл., г. протвино, ул. железнодорожная, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_62',
          'Литейно-механический завод Новый',
          'steel_mill',
          '',
          'РФ',
          'Удмуртская Респ.',
          57.0825,
          54.1601,
          FALSE,
          'Производство: Чугунные и стальные заготовки | Сырьё: Чугун, сталь',
          '62',
          '427413, Удмуртская Респ., Воткинский р-н, п. Новый',
          TRUE,
          62,
          'never',
          'steel_mill|литейно механический завод новый|427413, удмуртская респ., воткинский р-н, п. новый',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_63',
          'Березовский завод емкостей',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          56.9103,
          60.8215,
          FALSE,
          'Производство: Резервуары, емкости | Сырьё: Сталь',
          '63',
          '623700, Свердловская обл., г. Березовский, ул. Школьная, 1',
          TRUE,
          63,
          'never',
          'steel_mill|березовский завод емкостей|623700, свердловская обл., г. березовский, ул. школьная, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_64',
          'Новоалтайский литейно-механический завод',
          'steel_mill',
          '',
          'РФ',
          'Алтайский край',
          53.4114,
          83.9468,
          FALSE,
          'Производство: Стальные и чугунные изделия для горной промышленности | Сырьё: Чугун, сталь',
          '64',
          '658080, Алтайский край, г. Новоалтайск, ул. Октябрьская, 2',
          TRUE,
          64,
          'never',
          'steel_mill|новоалтайский литейно механический завод|658080, алтайский край, г. новоалтайск, ул. октябрьская, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_65',
          'Промстройметалл',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Стальной лист, металлообработка | Сырьё: Сталь',
          '65',
          '198097, г. Санкт-Петербург',
          TRUE,
          65,
          'never',
          'steel_mill|промстройметалл|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_66',
          'Оскольский завод металлических конструкций',
          'steel_mill',
          '',
          'РФ',
          'Белгородская обл.',
          51.2959,
          37.8415,
          FALSE,
          'Производство: Металлоконструкции | Сырьё: Сталь',
          '66',
          '309530, Белгородская обл., г. Старый Оскол',
          TRUE,
          66,
          'never',
          'steel_mill|оскольский завод металлических конструкций|309530, белгородская обл., г. старый оскол',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_67',
          'Думиничская производственная компания',
          'steel_mill',
          '',
          'РФ',
          'Калужская обл.',
          53.9127,
          35.1093,
          FALSE,
          'Производство: Чугунные люки, дождеприемники | Сырьё: Чугун',
          '67',
          '249310, Калужская обл., п. Думиничи, ул. Машиностроителей, 1',
          TRUE,
          67,
          'never',
          'steel_mill|думиничская производственная компания|249310, калужская обл., п. думиничи, ул. машиностроителей, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_68',
          'Уральский Арматурный Завод',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Производство: Запорная арматура, детали трубопровода | Сырьё: Сталь',
          '68',
          '454047, г. Челябинск',
          TRUE,
          68,
          'never',
          'steel_mill|уральский арматурный завод|454047, г. челябинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_69',
          'Астринсплав СК',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Изделия из бронзовых и медных сплавов | Сырьё: Бронза, медь',
          '69',
          '198097, г. Санкт-Петербург',
          TRUE,
          69,
          'never',
          'steel_mill|астринсплав ск|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_70',
          'ПСК Комстрой',
          'steel_mill',
          '',
          'РФ',
          'Нижний Новгород',
          56.2967,
          43.9361,
          FALSE,
          'Производство: Строительные металлоконструкции | Сырьё: Сталь',
          '70',
          '603004, г. Нижний Новгород',
          TRUE,
          70,
          'never',
          'steel_mill|пск комстрой|603004, г. нижний новгород',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_71',
          'АЗТЛ',
          'steel_mill',
          '',
          'РФ',
          'Барнаул',
          53.3486,
          83.7777,
          FALSE,
          'Производство: Запчасти для машиностроения, горно-шахтное оборудование | Сырьё: Сталь',
          '71',
          '656037, г. Барнаул, ул. Мало-Островская, 64',
          TRUE,
          71,
          'never',
          'steel_mill|азтл|656037, г. барнаул, ул. мало-островская, 64',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_72',
          'Уральский завод вторичных металлов',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          55.0456,
          60.1059,
          FALSE,
          'Производство: Медный гранулят | Сырьё: Медный лом',
          '72',
          '456300, Челябинская обл., г. Миасс',
          TRUE,
          72,
          'never',
          'steel_mill|уральский завод вторичных металлов|456300, челябинская обл., г. миасс',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_73',
          'Свердловский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Проволока, пруток, лист, труба | Сырьё: Сталь',
          '73',
          '620085, г. Екатеринбург',
          TRUE,
          73,
          'never',
          'steel_mill|свердловский металлургический завод|620085, г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_74',
          'ПРОМЭКЗ',
          'steel_mill',
          '',
          'РФ',
          '',
          58.0043,
          56.182,
          FALSE,
          'Производство: Пруток, проволока, труба | Сырьё: Сталь',
          '74',
          '614514, Пермский р-н, с. Фролы',
          TRUE,
          74,
          'never',
          'steel_mill|промэкз|614514, пермский р-н, с. фролы',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_75',
          'Мценскпрокат',
          'steel_mill',
          '',
          'РФ',
          'Орловская обл.',
          53.2779,
          36.5744,
          FALSE,
          'Производство: Аноды, ленты, листы, слитки | Сырьё: Цветные металлы',
          '75',
          '303030, Орловская обл., г. Мценск',
          TRUE,
          75,
          'never',
          'steel_mill|мценскпрокат|303030, орловская обл., г. мценск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_76',
          'Северный Металлоцентр',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Поковки для судостроения, металлургии, атомной отрасли | Сырьё: Сталь',
          '76',
          '198097, г. Санкт-Петербург',
          TRUE,
          76,
          'never',
          'steel_mill|северный металлоцентр|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_77',
          'Челябинский опытно-экспериментальный завод (ЧОЭЗ)',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Производство: Графитированные электроды, тигли | Сырьё: Графит',
          '77',
          '454047, г. Челябинск',
          TRUE,
          77,
          'never',
          'steel_mill|челябинский опытно экспериментальный завод чоэз|454047, г. челябинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_78',
          'Вишневогорский металлургический завод «Северный ниобий»',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          55.9813,
          60.6624,
          FALSE,
          'Производство: Ферросплавы, лигатуры, порошки металлов | Сырьё: Ниобий, ферросплавы',
          '78',
          '456835, Челябинская обл., Каслинский р-н',
          TRUE,
          78,
          'never',
          'steel_mill|вишневогорский металлургический завод северный ниобий|456835, челябинская обл., каслинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_79',
          'Староуткинский металлургический завод (СМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          57.251,
          59.3349,
          FALSE,
          'Производство: Технические дроби | Сырьё: Сталь, чугун',
          '79',
          '623102, Свердловская обл., п.г.т. Староуткинск',
          TRUE,
          79,
          'never',
          'steel_mill|староуткинский металлургический завод смз|623102, свердловская обл., п.г.т. староуткинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_80',
          'Металлургический завод Балаково',
          'steel_mill',
          '',
          'РФ',
          'Саратовская обл.',
          52.0259,
          47.7941,
          FALSE,
          'Производство: Арматура, уголок, швеллер | Сырьё: Сталь',
          '80',
          '413840, Саратовская обл., Балаковский р-н, с. Быков Отрог',
          TRUE,
          80,
          'never',
          'steel_mill|металлургический завод балаково|413840, саратовская обл., балаковский р-н, с. быков отрог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_81',
          'Волгоградский металлургический комбинат «Красный Октябрь»',
          'steel_mill',
          '',
          'РФ',
          'Волгоград',
          48.7071,
          44.5169,
          FALSE,
          'Производство: Трубная заготовка, горячекатаный и холоднокатаный прокат | Сырьё: Сталь',
          '81',
          '400007, г. Волгоград, ул. Пролетарская, 1',
          TRUE,
          81,
          'never',
          'steel_mill|волгоградский металлургический комбинат красный октябрь|400007, г. волгоград, ул. пролетарская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_82',
          'Московский металлургический завод «Серп и молот»',
          'steel_mill',
          '',
          'РФ',
          'Москва',
          55.7507,
          37.6644,
          FALSE,
          'Производство: Стальная лента из нержавеющей стали, сварные трубы | Сырьё: Нержавеющая сталь',
          '82',
          '105122, г. Москва, ул. Золоторожский Вал, 11',
          TRUE,
          82,
          'never',
          'steel_mill|московский металлургический завод серп и молот|105122, г. москва, ул. золоторожский вал, 11',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_83',
          'ИТ-Ресурс',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Холодная штамповка из листового металла | Сырьё: Листовой металл',
          '83',
          '198097, г. Санкт-Петербург',
          TRUE,
          83,
          'never',
          'steel_mill|ит ресурс|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_84',
          'Завод точного стального литья',
          'steel_mill',
          '',
          'РФ',
          'Чебоксары',
          56.1431,
          47.2488,
          FALSE,
          'Производство: Чугунное и стальное литье | Сырьё: Чугун, сталь',
          '84',
          '428022, г. Чебоксары, ул. 324-й Стрелковой Дивизии, 21',
          TRUE,
          84,
          'never',
          'steel_mill|завод точного стального литья|428022, г. чебоксары, ул. 324-й стрелковой дивизии, 21',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_85',
          'Литейно-Механический Завод Урал',
          'steel_mill',
          '',
          'РФ',
          'Алтайский край',
          52.534,
          85.2063,
          FALSE,
          'Производство: Чугунное и стальное литье | Сырьё: Чугун, сталь',
          '85',
          '659301, Алтайский край, г. Бийск',
          TRUE,
          85,
          'never',
          'steel_mill|литейно механический завод урал|659301, алтайский край, г. бийск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_86',
          'Тольяттинский ферросплавный завод',
          'steel_mill',
          '',
          'РФ',
          'Тольятти',
          53.5078,
          49.4216,
          FALSE,
          'Производство: Фланцы, фитинги, арматура, ферросплавы | Сырьё: Ферросплавы, сталь',
          '86',
          '445008, г. Тольятти, ул. Ленина, 1',
          TRUE,
          86,
          'never',
          'steel_mill|тольяттинский ферросплавный завод|445008, г. тольятти, ул. ленина, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_87',
          'Златоустовский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          55.1613,
          59.6765,
          FALSE,
          'Производство: Сортовой прокат, калиброванная сталь | Сырьё: Сталь',
          '87',
          '456200, Челябинская обл., г. Златоуст, ул. Металлургов, 1',
          TRUE,
          87,
          'never',
          'steel_mill|златоустовский металлургический завод|456200, челябинская обл., г. златоуст, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_88',
          'Купертино-Групп',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Медный порошок и пудра | Сырьё: Медь',
          '88',
          '620085, г. Екатеринбург',
          TRUE,
          88,
          'never',
          'steel_mill|купертино групп|620085, г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_89',
          'Стил Армор',
          'steel_mill',
          '',
          'РФ',
          'Челябинская обл.',
          55.706,
          60.5559,
          FALSE,
          'Производство: Стальная оснастка для мельниц | Сырьё: Сталь',
          '89',
          '456870, Челябинская обл., г. Кыштым, ул. Карла Либкнехта, 1',
          TRUE,
          89,
          'never',
          'steel_mill|стил армор|456870, челябинская обл., г. кыштым, ул. карла либкнехта, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_90',
          'ПО Завод ТехМеталл',
          'steel_mill',
          '',
          'РФ',
          'Санкт-Петербург',
          59.8906,
          30.2699,
          FALSE,
          'Производство: Гидроцилиндры | Сырьё: Сталь',
          '90',
          '198097, г. Санкт-Петербург',
          TRUE,
          90,
          'never',
          'steel_mill|по завод техметалл|198097, г. санкт-петербург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_91',
          'Русские Стальные Конструкции',
          'steel_mill',
          '',
          'РФ',
          'Тула',
          54.1937,
          37.6145,
          FALSE,
          'Производство: Металлокаркасы, фермы, колонны | Сырьё: Сталь',
          '91',
          '300041, г. Тула, ул. Советская, 1',
          TRUE,
          91,
          'never',
          'steel_mill|русские стальные конструкции|300041, г. тула, ул. советская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_92',
          'Нижнетагильский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          57.9052,
          59.9645,
          FALSE,
          'Производство: Цветной и черный металлопрокат | Сырьё: Сталь, цветные металлы',
          '92',
          '622025, Свердловская обл., г. Нижний Тагил',
          TRUE,
          92,
          'never',
          'steel_mill|нижнетагильский металлургический завод|622025, свердловская обл., г. нижний тагил',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_93',
          'Гурьевский Металлургический Завод (ГМЗ)',
          'steel_mill',
          '',
          'РФ',
          'Кемеровская обл.',
          54.2829,
          85.9295,
          FALSE,
          'Производство: Мартеновская сталь, уголок, швеллер, мелющие шары | Сырьё: Сталь',
          '93',
          '652780, Кемеровская обл., г. Гурьевск, ул. Ленина, 1',
          TRUE,
          93,
          'never',
          'steel_mill|гурьевский металлургический завод гмз|652780, кемеровская обл., г. гурьевск, ул. ленина, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_94',
          'Завод металлургических флюсов (ЗМФ)',
          'steel_mill',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Производство: Флюсы | Сырьё: Флюсы',
          '94',
          '398040, г. Липецк',
          TRUE,
          94,
          'never',
          'steel_mill|завод металлургических флюсов змф|398040, г. липецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_95',
          'Фроловская электросталь (ФЭСТ)',
          'steel_mill',
          '',
          'РФ',
          'Волгоградская обл.',
          49.7741,
          43.6582,
          FALSE,
          'Производство: Непрерывнолитая стальная заготовка | Сырьё: Сталь',
          '95',
          '403530, Волгоградская обл., г. Фролово',
          TRUE,
          95,
          'never',
          'steel_mill|фроловская электросталь фэст|403530, волгоградская обл., г. фролово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_96',
          'Аксайский металлургический комплекс',
          'steel_mill',
          '',
          'РФ',
          'Ростовская обл.',
          47.2742,
          39.873,
          FALSE,
          'Производство: Медная катанка и алюминиевые сплавы | Сырьё: Медь, алюминий',
          '96',
          '346720, Ростовская обл., г. Аксай',
          TRUE,
          96,
          'never',
          'steel_mill|аксайский металлургический комплекс|346720, ростовская обл., г. аксай',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_97',
          'Сталелитейная компания Памир',
          'steel_mill',
          '',
          'РФ',
          'Ульяновск',
          54.3219,
          48.3806,
          FALSE,
          'Производство: Детали для насосов из чугуна, запорная арматура | Сырьё: Чугун',
          '97',
          '432072, г. Ульяновск',
          TRUE,
          97,
          'never',
          'steel_mill|сталелитейная компания памир|432072, г. ульяновск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_98',
          'Нытвенский металлургический завод (Нытва)',
          'steel_mill',
          '',
          'РФ',
          'Пермский край',
          57.9329,
          55.3233,
          FALSE,
          'Производство: Биметаллические ленты и полосы | Сырьё: Латунь, алюминий, медь, сталь',
          '98',
          '617000, Пермский край, г. Нытва, ул. Ленина, 1',
          TRUE,
          98,
          'never',
          'steel_mill|нытвенский металлургический завод нытва|617000, пермский край, г. нытва, ул. ленина, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_99',
          'Уралчермет',
          'steel_mill',
          '',
          'РФ',
          'Екатеринбург',
          56.8011,
          60.585,
          FALSE,
          'Производство: Трубная продукция | Сырьё: Сталь',
          '99',
          '620085, г. Екатеринбург',
          TRUE,
          99,
          'never',
          'steel_mill|уралчермет|620085, г. екатеринбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_100',
          'ПО Бежицкая сталь',
          'steel_mill',
          '',
          'РФ',
          'Брянск',
          53.3142,
          34.3154,
          FALSE,
          'Производство: Вагонное литье | Сырьё: Чугун, сталь',
          '100',
          '241050, г. Брянск, ул. Ульянова, 1',
          TRUE,
          100,
          'never',
          'steel_mill|по бежицкая сталь|241050, г. брянск, ул. ульянова, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_101',
          'Таганрогский Металлургический Завод',
          'steel_mill',
          '',
          'РФ',
          'Ростовская обл.',
          47.2116,
          38.9044,
          FALSE,
          'Производство: Трубы обсадные, бурильные, водогазопроводные | Сырьё: Сталь',
          '101',
          '347900, Ростовская обл., г. Таганрог, ул. Металлургическая, 1',
          TRUE,
          101,
          'never',
          'steel_mill|таганрогский металлургический завод|347900, ростовская обл., г. таганрог, ул. металлургическая, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_102',
          'Металлургический завод им. А.К. Серова',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          59.6127,
          60.5735,
          FALSE,
          'Производство: Арматура, заготовка квадратная, калиброванный прокат | Сырьё: Сталь',
          '102',
          '624992, Свердловская обл., г. Серов',
          TRUE,
          102,
          'never',
          'steel_mill|металлургический завод им а к серова|624992, свердловская обл., г. серов',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_103',
          'Белорецкий металлургический комбинат',
          'steel_mill',
          '',
          'РФ',
          'Республика Башкортостан',
          53.9575,
          58.3984,
          FALSE,
          'Производство: Листовой и сортовой прокат, проволока, канаты | Сырьё: Сталь',
          '103',
          '453500, Республика Башкортостан, г. Белорецк, ул. Блюхера, 1',
          TRUE,
          103,
          'never',
          'steel_mill|белорецкий металлургический комбинат|453500, республика башкортостан, г. белорецк, ул. блюхера, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_104',
          'Ключевский завод ферросплавов',
          'steel_mill',
          '',
          'РФ',
          'Свердловская обл.',
          56.4421,
          60.8336,
          FALSE,
          'Производство: Брикеты, легирующие материалы, феррохром | Сырьё: Феррохром, хром',
          '104',
          '624022, Свердловская обл., Сысертский р-н, п. Двуреченск',
          TRUE,
          104,
          'never',
          'steel_mill|ключевский завод ферросплавов|624022, свердловская обл., сысертский р-н, п. двуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_105',
          'Волга-ФЭСТ',
          'steel_mill',
          '',
          'РФ',
          'Волгоградская обл.',
          49.7741,
          43.6582,
          FALSE,
          'Производство: Непрерывнолитая заготовка, щебень, окалина | Сырьё: Сталь',
          '105',
          '403530, Волгоградская обл., г. Фролово',
          TRUE,
          105,
          'never',
          'steel_mill|волга фэст|403530, волгоградская обл., г. фролово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_106',
          'Завод точного литья',
          'steel_mill',
          '',
          'РФ',
          'Рязань',
          54.6199,
          39.7442,
          FALSE,
          'Производство: Чугунное и стальное литье | Сырьё: Чугун, сталь',
          '106',
          '390042, г. Рязань',
          TRUE,
          106,
          'never',
          'steel_mill|завод точного литья|390042, г. рязань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_107',
          'Братский завод ферросплавов',
          'steel_mill',
          '',
          'РФ',
          'Иркутская обл.',
          56.1229,
          101.6167,
          FALSE,
          'Производство: Ферросилиций | Сырьё: Ферросилиций',
          '107',
          '665717, Иркутская обл., г. Братск',
          TRUE,
          107,
          'never',
          'steel_mill|братский завод ферросплавов|665717, иркутская обл., г. братск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_108',
          'ОАО «Доломит»',
          'steel_mill',
          '',
          'РФ',
          'Липецкая обл.',
          53.2529,
          39.1366,
          FALSE,
          'Производство: Доломит сырой, мука известняковая | Сырьё: Доломит',
          '108',
          '399850, Липецкая обл., г. Данков',
          TRUE,
          108,
          'never',
          'steel_mill|оао доломит|399850, липецкая обл., г. данков',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_109',
          'Владимирский завод прецизионных сплавов',
          'steel_mill',
          '',
          'РФ',
          'Владимир',
          56.139,
          40.4328,
          FALSE,
          'Производство: Проволока, пруток, лента из прецизионных сплавов | Сырьё: Прецизионные сплавы',
          '109',
          '600910, г. Владимир, ул. Куйбышева, 6',
          TRUE,
          109,
          'never',
          'steel_mill|владимирский завод прецизионных сплавов|600910, г. владимир, ул. куйбышева, 6',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_110',
          'ОАО «Магнит»',
          'steel_mill',
          '',
          'РФ',
          'Ростовская обл.',
          47.435,
          40.0969,
          FALSE,
          'Производство: Анодные заземлители, стальное литье | Сырьё: Сталь',
          '110',
          '346428, Ростовская обл., г. Новочеркасск',
          TRUE,
          110,
          'never',
          'steel_mill|оао магнит|346428, ростовская обл., г. новочеркасск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_111',
          'Керченский металлургический завод',
          'steel_mill',
          '',
          'РФ',
          'Республика Крым',
          45.3539,
          36.6591,
          FALSE,
          'Производство: Стальное и чугунное литье | Сырьё: Чугун, сталь',
          '111',
          '298304, Республика Крым, г. Керчь, ул. Войкова, 1',
          TRUE,
          111,
          'never',
          'steel_mill|керченский металлургический завод|298304, республика крым, г. керчь, ул. войкова, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_112',
          'Завод Промсталь',
          'steel_mill',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Производство: Металлопродукция из углеродистой и оцинкованной стали | Сырьё: Сталь',
          '112',
          '398040, г. Липецк',
          TRUE,
          112,
          'never',
          'steel_mill|завод промсталь|398040, г. липецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_113',
          'Липецкая трубная компания «Свободный сокол»',
          'steel_mill',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Производство: Трубы из ВЧШГ | Сырьё: Высокопрочный чугун',
          '113',
          '398040, г. Липецк, ул. Гагарина, 5',
          TRUE,
          113,
          'never',
          'steel_mill|липецкая трубная компания свободный сокол|398040, г. липецк, ул. гагарина, 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_114',
          'Челябинский трубопрокатный завод',
          'steel_mill',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Производство: Трубы электросварные и бесшовные | Сырьё: Сталь',
          '114',
          '454047, г. Челябинск',
          TRUE,
          114,
          'never',
          'steel_mill|челябинский трубопрокатный завод|454047, г. челябинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_115',
          'Белорусский металлургический завод (БМЗ)',
          'steel_mill',
          '',
          'Беларусь',
          'Жлобин',
          52.8921,
          30.0433,
          FALSE,
          'Производство: Арматура, катанка, бесшовные трубы, металлокорд | Сырьё: Сталь, лом',
          '115',
          '247210, г. Жлобин, ул. 50 лет Октября, 1',
          TRUE,
          115,
          'never',
          'steel_mill|белорусский металлургический завод бмз|247210, г. жлобин, ул. 50 лет октября, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_116',
          'Могилевский металлургический завод',
          'steel_mill',
          '',
          'Беларусь',
          'Могилев',
          53.8953,
          30.3255,
          FALSE,
          'Производство: Стальные трубы, чугунная дробь, люки | Сырьё: Сталь, чугун',
          '116',
          '212020, г. Могилев, ул. Гришина, 1',
          TRUE,
          116,
          'never',
          'steel_mill|могилевский металлургический завод|212020, г. могилев, ул. гришина, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_117',
          'Речицкий метизный завод',
          'steel_mill',
          '',
          'Беларусь',
          'Речица',
          52.3703,
          30.4014,
          FALSE,
          'Производство: Гвозди, шурупы, болты, гайки, проволока | Сырьё: Сталь',
          '117',
          '247500, г. Речица, ул. Советская, 1',
          TRUE,
          117,
          'never',
          'steel_mill|речицкий метизный завод|247500, г. речица, ул. советская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_118',
          'Гомельский литейный завод «ЦЕНТРОЛИТ»',
          'steel_mill',
          '',
          'Беларусь',
          'Гомель',
          52.443,
          30.9841,
          FALSE,
          'Производство: Отливки для станков, автомобилей, нефтегаза | Сырьё: Чугун, сталь',
          '118',
          '246008, г. Гомель, ул. Центролит, 1',
          TRUE,
          118,
          'never',
          'steel_mill|гомельский литейный завод центролит|246008, г. гомель, ул. центролит, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_119',
          'Молодечненский завод металлоконструкций (МЗМК)',
          'steel_mill',
          '',
          'Беларусь',
          'Молодечно',
          54.3162,
          26.857,
          FALSE,
          'Производство: Строительные металлоконструкции | Сырьё: Сталь',
          '119',
          '222310, г. Молодечно, ул. Великий Гостинец, 1',
          TRUE,
          119,
          'never',
          'steel_mill|молодечненский завод металлоконструкций мзмк|222310, г. молодечно, ул. великий гостинец, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_120',
          'Молдавский металлургический завод',
          'steel_mill',
          '',
          'Молдова',
          'Рыбница',
          47.755,
          28.975,
          FALSE,
          'Производство: Сортовой прокат, катанка, арматура | Сырьё: Сталь, лом',
          '120',
          'г. Рыбница, ул. Металлургов, 1',
          TRUE,
          120,
          'never',
          'steel_mill|молдавский металлургический завод|г. рыбница, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_121',
          'Бельцкий сталелитейный завод «Бельцы-Сталь»',
          'steel_mill',
          '',
          'Молдова',
          'Бельцы',
          47.7571,
          27.919,
          FALSE,
          'Производство: Строительная арматура, катанка | Сырьё: Лом черных металлов',
          '121',
          'г. Бельцы',
          TRUE,
          121,
          'never',
          'steel_mill|бельцкий сталелитейный завод бельцы сталь|г. бельцы',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_122',
          'Армянская металлургическая компания',
          'steel_mill',
          '',
          'Армения',
          'Ереван',
          40.1776,
          44.4996,
          FALSE,
          'Производство: Арматура, круги, уголки, катанка | Сырьё: Сталь, лом',
          '122',
          'г. Ереван',
          TRUE,
          122,
          'never',
          'steel_mill|армянская металлургическая компания|г. ереван',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_123',
          'Мегхметалл',
          'steel_mill',
          '',
          'Армения',
          'Ереван',
          40.1776,
          44.4996,
          FALSE,
          'Производство: Стальные трубы, металлоконструкции | Сырьё: Сталь',
          '123',
          'г. Ереван',
          TRUE,
          123,
          'never',
          'steel_mill|мегхметалл|г. ереван',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_124',
          'Baku Steel Company (BSC)',
          'steel_mill',
          '',
          'Азербайджан',
          'Сумгаит',
          40.5816,
          49.7022,
          FALSE,
          'Производство: Арматура, прутки, катанка, балки | Сырьё: Сталь, лом',
          '124',
          'г. Сумгаит',
          TRUE,
          124,
          'never',
          'steel_mill|baku steel company bsc|г. сумгаит',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_125',
          'Baku Pipe Mill',
          'steel_mill',
          '',
          'Азербайджан',
          'Сумгаит',
          40.5816,
          49.7022,
          FALSE,
          'Производство: Стальные трубы, обсадные трубы | Сырьё: Сталь',
          '125',
          'г. Сумгаит',
          TRUE,
          125,
          'never',
          'steel_mill|baku pipe mill|г. сумгаит',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_126',
          'Азербайджанский трубопрокатный завод',
          'steel_mill',
          '',
          'Азербайджан',
          'Сумгаит',
          40.5816,
          49.7022,
          FALSE,
          'Производство: Бесшовные трубы, арматура, уголки | Сырьё: Сталь',
          '126',
          'г. Сумгаит',
          TRUE,
          126,
          'never',
          'steel_mill|азербайджанский трубопрокатный завод|г. сумгаит',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_127',
          'Сумгаитский трубопрокатный завод',
          'steel_mill',
          '',
          'Азербайджан',
          'Сумгаит',
          40.5816,
          49.7022,
          FALSE,
          'Производство: Бесшовные трубы, чугунные трубы | Сырьё: Сталь, чугун',
          '127',
          'г. Сумгаит',
          TRUE,
          127,
          'never',
          'steel_mill|сумгаитский трубопрокатный завод|г. сумгаит',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_128',
          'Завод «Araz»',
          'steel_mill',
          '',
          'Азербайджан',
          'Сумгаит',
          40.5816,
          49.7022,
          FALSE,
          'Производство: Электросварные стальные трубы | Сырьё: Сталь',
          '128',
          'г. Сумгаит',
          TRUE,
          128,
          'never',
          'steel_mill|завод araz|г. сумгаит',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_129',
          'Туркменский трубный завод',
          'steel_mill',
          '',
          'Туркменистан',
          '',
          39.9096,
          52.9909,
          FALSE,
          'Производство: Электросварные трубы | Сырьё: Сталь',
          '129',
          'пос. Киянлы, Балканский велаят',
          TRUE,
          129,
          'never',
          'steel_mill|туркменский трубный завод|пос. киянлы, балканский велаят',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_130',
          'Завод по производству бесшовных нефтегазовых труб',
          'steel_mill',
          '',
          'Туркменистан',
          '',
          39.9096,
          52.9909,
          FALSE,
          'Производство: Бесшовные трубы для нефтегаза | Сырьё: Сталь',
          '130',
          'пос. Киянлы',
          TRUE,
          130,
          'never',
          'steel_mill|завод по производству бесшовных нефтегазовых труб|пос. киянлы',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_131',
          'Ашхабадский завод металлоконструкций и проката',
          'steel_mill',
          '',
          'Туркменистан',
          'Ашгабат',
          37.96,
          58.38,
          FALSE,
          'Производство: Металлоконструкции, сортовой прокат | Сырьё: Сталь',
          '131',
          'г. Ашгабат',
          TRUE,
          131,
          'never',
          'steel_mill|ашхабадский завод металлоконструкций и проката|г. ашгабат',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_132',
          'Таджикская металлургическая компания',
          'steel_mill',
          '',
          'Таджикистан',
          'Душанбе',
          38.5598,
          68.7818,
          FALSE,
          'Производство: Арматура, сортовой прокат | Сырьё: Сталь, лом',
          '132',
          'г. Душанбе',
          TRUE,
          132,
          'never',
          'steel_mill|таджикская металлургическая компания|г. душанбе',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_133',
          'Душанбинский завод металлоконструкций и арматуры',
          'steel_mill',
          '',
          'Таджикистан',
          'Душанбе',
          38.5598,
          68.7818,
          FALSE,
          'Производство: Металлоконструкции | Сырьё: Сталь',
          '133',
          'г. Душанбе',
          TRUE,
          133,
          'never',
          'steel_mill|душанбинский завод металлоконструкций и арматуры|г. душанбе',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_134',
          'АрселорМиттал Темиртау',
          'steel_mill',
          '',
          'Казахстан',
          'Темиртау',
          50.064,
          72.9983,
          FALSE,
          'Производство: Чугун, сталь, листовой и сортовой прокат | Сырьё: Железная руда, кокс, лом',
          '134',
          'г. Темиртау',
          TRUE,
          134,
          'never',
          'steel_mill|арселормиттал темиртау|г. темиртау',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_135',
          'Казахстанский электролизный завод (КЭЗ)',
          'steel_mill',
          '',
          'Казахстан',
          'Костанай',
          53.1502,
          63.5451,
          FALSE,
          'Производство: Слябы, блюмы, листовой и сортовой прокат | Сырьё: Сталь',
          '135',
          'г. Костанай',
          TRUE,
          135,
          'never',
          'steel_mill|казахстанский электролизный завод кэз|г. костанай',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_136',
          'Кармет',
          'steel_mill',
          '',
          'Казахстан',
          'Караганда',
          49.8222,
          73.0983,
          FALSE,
          'Производство: Слябы, горячекатаный лист, сортовой прокат | Сырьё: Сталь',
          '136',
          'г. Караганда',
          TRUE,
          136,
          'never',
          'steel_mill|кармет|г. караганда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_137',
          'Актюбинский рельсобалочный завод (АРБЗ)',
          'steel_mill',
          '',
          'Казахстан',
          'Актобе',
          50.2834,
          57.2299,
          FALSE,
          'Производство: Рельсы, уголок, швеллер, балка | Сырьё: Сталь',
          '137',
          'г. Актобе',
          TRUE,
          137,
          'never',
          'steel_mill|актюбинский рельсобалочный завод арбз|г. актобе',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_138',
          'Узбекский металлургический комбинат (Узметкомбинат)',
          'steel_mill',
          '',
          'Узбекистан',
          'Бекабад',
          40.2061,
          69.2672,
          FALSE,
          'Производство: Чугун, сталь, сортовой и листовой прокат | Сырьё: Железная руда, кокс, лом',
          '138',
          'г. Бекабад',
          TRUE,
          138,
          'never',
          'steel_mill|узбекский металлургический комбинат узметкомбинат|г. бекабад',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_139',
          'Узбекско-Корейский металлургический комплекс (Uz-Kor Met)',
          'steel_mill',
          '',
          'Узбекистан',
          'Ташкент',
          41.3108,
          69.263,
          FALSE,
          'Производство: Холоднокатаный и оцинкованный лист | Сырьё: Сталь',
          '139',
          'г. Ташкент',
          TRUE,
          139,
          'never',
          'steel_mill|узбекско корейский металлургический комплекс uz kor met|г. ташкент',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_140',
          'Алмалыкский ГМК',
          'steel_mill',
          '',
          'Узбекистан',
          'Алмалык',
          40.8307,
          69.6007,
          FALSE,
          'Производство: Сортовой прокат | Сырьё: Сталь',
          '140',
          'г. Алмалык',
          TRUE,
          140,
          'never',
          'steel_mill|алмалыкский гмк|г. алмалык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_141',
          'Кыргызская сталь',
          'steel_mill',
          '',
          'Кыргызстан',
          'Бишкек',
          42.8667,
          74.5667,
          FALSE,
          'Производство: Арматура, катанка, сортовой прокат | Сырьё: Сталь, лом',
          '141',
          'г. Бишкек',
          TRUE,
          141,
          'never',
          'steel_mill|кыргызская сталь|г. бишкек',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_142',
          'АрселорМиттал Кривой Рог (АМКР)',
          'steel_mill',
          '',
          'Украина',
          'Кривой Рог',
          47.8951,
          33.3923,
          FALSE,
          'Производство: Чугун, сталь, сортовой и листовой прокат | Сырьё: Железная руда, кокс, лом',
          '142',
          'г. Кривой Рог',
          TRUE,
          142,
          'never',
          'steel_mill|арселормиттал кривой рог амкр|г. кривой рог',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_143',
          'Запорожсталь',
          'steel_mill',
          '',
          'Украина',
          'Запорожье',
          47.8388,
          35.1384,
          FALSE,
          'Производство: Чугун, сталь, горячекатаный и холоднокатаный лист | Сырьё: Железная руда, кокс, лом',
          '143',
          'г. Запорожье',
          TRUE,
          143,
          'never',
          'steel_mill|запорожсталь|г. запорожье',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_144',
          'Азовсталь',
          'steel_mill',
          '',
          'Украина',
          'Мариуполь',
          47.1303,
          37.5841,
          FALSE,
          'Производство: Чугун, сталь, сортовой прокат, рельсы | Сырьё: Железная руда, кокс, лом',
          '144',
          'г. Мариуполь',
          TRUE,
          144,
          'never',
          'steel_mill|азовсталь|г. мариуполь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_145',
          'ММК им. Ильича',
          'steel_mill',
          '',
          'Украина',
          'Мариуполь',
          47.1303,
          37.5841,
          FALSE,
          'Производство: Чугун, сталь, листовой прокат | Сырьё: Железная руда, кокс, лом',
          '145',
          'г. Мариуполь',
          TRUE,
          145,
          'never',
          'steel_mill|ммк им ильича|г. мариуполь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_146',
          'Енакиевский металлургический завод (ЕМЗ)',
          'steel_mill',
          '',
          'Украина',
          'Енакиево',
          48.2297,
          38.2053,
          FALSE,
          'Производство: Чугун, сталь, сортовой прокат, рельсы | Сырьё: Железная руда, кокс, лом',
          '146',
          'г. Енакиево',
          TRUE,
          146,
          'never',
          'steel_mill|енакиевский металлургический завод емз|г. енакиево',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_147',
          'Алчевский металлургический комбинат (АМК)',
          'steel_mill',
          '',
          'Украина',
          'Алчевск',
          48.4671,
          38.8071,
          FALSE,
          'Производство: Чугун, сталь, сортовой прокат | Сырьё: Железная руда, кокс, лом',
          '147',
          'г. Алчевск',
          TRUE,
          147,
          'never',
          'steel_mill|алчевский металлургический комбинат амк|г. алчевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_148',
          'Макеевский металлургический комбинат (ММК)',
          'steel_mill',
          '',
          'Украина',
          'Макеевка',
          48.0554,
          37.9477,
          FALSE,
          'Производство: Чугун, сталь, сортовой прокат | Сырьё: Железная руда, кокс, лом',
          '148',
          'г. Макеевка',
          TRUE,
          148,
          'never',
          'steel_mill|макеевский металлургический комбинат ммк|г. макеевка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_149',
          'Краматорский металлургический завод «ЭСТАР»',
          'steel_mill',
          '',
          'Украина',
          'Краматорск',
          48.7409,
          37.5841,
          FALSE,
          'Производство: Литейный чугун, листовой прокат | Сырьё: Чугун, сталь',
          '149',
          'г. Краматорск',
          TRUE,
          149,
          'never',
          'steel_mill|краматорский металлургический завод эстар|г. краматорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'steel_mill_150',
          'Днепровский металлургический комбинат (ДМКД)',
          'steel_mill',
          '',
          'Украина',
          'Каменское',
          48.5158,
          34.6135,
          FALSE,
          'Производство: Чугун, сталь, сортовой и листовой прокат | Сырьё: Железная руда, кокс, лом',
          '150',
          'г. Каменское',
          TRUE,
          150,
          'never',
          'steel_mill|днепровский металлургический комбинат дмкд|г. каменское',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_1',
          'Шахта Баренцбург',
          'coal_mine',
          'ФГУП «Арктикуголь»',
          'РФ',
          'Архипелаг Шпицберген',
          78.0667,
          14.2167,
          FALSE,
          'Тип угля: каменный | Покупатели: Отгрузка морским транспортом круглый год',
          '1',
          'Архипелаг Шпицберген, пос. Баренцбург',
          TRUE,
          1,
          'never',
          'coal_mine|шахта баренцбург|архипелаг шпицберген, пос. баренцбург',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_2',
          'Шахта Восточная Денисовская',
          'coal_mine',
          'АО «ГОК «Денисовский»',
          'РФ',
          'Республика Саха (Якутия)',
          56,
          124,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок, экспорт в АТР',
          '2',
          'Республика Саха (Якутия), г. Нерюнгри',
          TRUE,
          2,
          'never',
          'coal_mine|шахта восточная денисовская|республика саха (якутия), г. нерюнгри',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_3',
          'Шахта им. В.И. Ленина',
          'coal_mine',
          'ПАО «Южный Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          53.7006,
          88.0496,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе «Мечел-Майнинг»)',
          '3',
          'Кемеровская обл., г. Междуреченск',
          TRUE,
          3,
          'never',
          'coal_mine|шахта им в и ленина|кемеровская обл., г. междуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_4',
          'Шахта Инаглинская',
          'coal_mine',
          'АО «ГОК «Инаглинский»',
          'РФ',
          'Республика Саха (Якутия)',
          56.986,
          124.774,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок, экспорт в АТР (в составе УК «Колмар»)',
          '4',
          'Республика Саха (Якутия), г. Нерюнгри',
          TRUE,
          4,
          'never',
          'coal_mine|шахта инаглинская|республика саха (якутия), г. нерюнгри',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_5',
          'Шахта Сибиргинская',
          'coal_mine',
          'ПАО «Южный Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          53.6673,
          87.8663,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе «Мечел-Майнинг»)',
          '5',
          'Кемеровская обл., г. Мыски',
          TRUE,
          5,
          'never',
          'coal_mine|шахта сибиргинская|кемеровская обл., г. мыски',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_6',
          'Шахта Денисовская',
          'coal_mine',
          'АО «ГОК «Денисовский»',
          'РФ',
          'Республика Саха (Якутия)',
          56.7689,
          124.8474,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок, экспорт в АТР',
          '6',
          'Республика Саха (Якутия), г. Нерюнгри, п. Серебряный Бор',
          TRUE,
          6,
          'never',
          'coal_mine|шахта денисовская|республика саха (якутия), г. нерюнгри, п. серебряный бор',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_7',
          'Шахта Байкаимская',
          'coal_mine',
          'АО «УК «Кузбассразрезуголь»',
          'РФ',
          'Кемеровская обл.',
          54.6167,
          86.3715,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '7',
          'Кемеровская обл., Беловский р-н, мкр. Байкаимский',
          TRUE,
          7,
          'never',
          'coal_mine|шахта байкаимская|кемеровская обл., беловский р-н, мкр. байкаимский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_8',
          'Шахта Ольжерасская-Новая',
          'coal_mine',
          'ПАО «Южный Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          53.8381,
          88.1296,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе «Мечел-Майнинг»)',
          '8',
          'Кемеровская обл., г. Междуреченск',
          TRUE,
          8,
          'never',
          'coal_mine|шахта ольжерасская новая|кемеровская обл., г. междуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_9',
          'Шахта Шерловская-Наклонная',
          'coal_mine',
          'АО «Донуголь»',
          'РФ',
          'Ростовская обл.',
          48,
          40,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (металлургические заводы Юга России)',
          '9',
          'Ростовская обл., Красносулинский р-н',
          TRUE,
          9,
          'never',
          'coal_mine|шахта шерловская наклонная|ростовская обл., красносулинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_10',
          'Шахта им. С. Д. Тихова',
          'coal_mine',
          'ООО «ММК-УГОЛЬ»',
          'РФ',
          'Кемеровская обл.',
          54,
          86.2,
          FALSE,
          'Тип угля: Коксующийся, марка 2Ж | Покупатели: ПАО «ММК»',
          '10',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          10,
          'never',
          'coal_mine|шахта им с д тихова|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_11',
          'Шахта Юбилейная',
          'coal_mine',
          'ООО «Шахта «Юбилейная»',
          'РФ',
          'Кемеровская обл.',
          54,
          87,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '11',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          11,
          'never',
          'coal_mine|шахта юбилейная|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_12',
          'Шахта Костромовская',
          'coal_mine',
          'ООО «ММК-УГОЛЬ»',
          'РФ',
          'Кемеровская обл.',
          54.584,
          86.0329,
          FALSE,
          'Тип угля: каменный | Покупатели: ПАО «ММК»',
          '12',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          12,
          'never',
          'coal_mine|шахта костромовская|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_13',
          'Шахта Спиридоновская',
          'coal_mine',
          'ООО «Шахта Спиридоновская»',
          'РФ',
          'Кемеровская обл.',
          54.4669,
          52.0985,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (статус: на грани банкротства)',
          '13',
          'Кемеровская обл., г. Киселевск',
          TRUE,
          13,
          'never',
          'coal_mine|шахта спиридоновская|кемеровская обл., г. киселевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_14',
          'Шахта Заполярная',
          'coal_mine',
          'АО «ВоркутаУголь»',
          'РФ',
          'Республика Коми',
          67.4847,
          63.7662,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (Северсталь)',
          '14',
          'Республика Коми, г. Воркута, пгт Заполярный',
          TRUE,
          14,
          'never',
          'coal_mine|шахта заполярная|республика коми, г. воркута, пгт заполярный',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_15',
          'Шахта Комсомольская',
          'coal_mine',
          'АО «ВоркутаУголь»',
          'РФ',
          'Республика Коми',
          67.5498,
          63.8067,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (Северсталь)',
          '15',
          'Республика Коми, г. Воркута, пгт Комсомольский',
          TRUE,
          15,
          'never',
          'coal_mine|шахта комсомольская|республика коми, г. воркута, пгт комсомольский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_16',
          'Шахта Воркутинская',
          'coal_mine',
          'АО «ВоркутаУголь»',
          'РФ',
          'Республика Коми',
          67.5252,
          64.0171,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (Северсталь)',
          '16',
          'Республика Коми, г. Воркута',
          TRUE,
          16,
          'never',
          'coal_mine|шахта воркутинская|республика коми, г. воркута',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_17',
          'Шахта Ерунаковская-VIII',
          'coal_mine',
          'АО «ОУК «Южкузбассуголь»',
          'РФ',
          'Кемеровская обл.',
          53.9,
          87.3,
          FALSE,
          'Тип угля: каменный | Покупатели: Металлургические и коксохимические предприятия РФ и на экспорт',
          '17',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          17,
          'never',
          'coal_mine|шахта ерунаковская viii|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_18',
          'Шахта Осинниковская',
          'coal_mine',
          'ООО «Шахта Осинниковская»',
          'РФ',
          'Кемеровская обл.',
          53.6673,
          87.3329,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе ЕВРАЗа)',
          '18',
          'Кемеровская обл., г. Осинники',
          TRUE,
          18,
          'never',
          'coal_mine|шахта осинниковская|кемеровская обл., г. осинники',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_19',
          'Шахта Есаульская',
          'coal_mine',
          'ООО «Шахта Есаульская»',
          'РФ',
          'Кемеровская обл.',
          53.925,
          87.41,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '19',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          19,
          'never',
          'coal_mine|шахта есаульская|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_20',
          'Шахта Распадская-Коксовая',
          'coal_mine',
          'АО «Распадская-Коксовая»',
          'РФ',
          'Кемеровская обл.',
          53.8,
          88.1,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе ЕВРАЗа)',
          '20',
          'Кемеровская обл., г. Междуреченск',
          TRUE,
          20,
          'never',
          'coal_mine|шахта распадская коксовая|кемеровская обл., г. междуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_21',
          'Шахта Воргашорская',
          'coal_mine',
          'АО «ВоркутаУголь»',
          'РФ',
          'Республика Коми',
          67.592,
          63.6242,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (Северсталь)',
          '21',
          'Республика Коми, г. Воркута, пгт Воргашор',
          TRUE,
          21,
          'never',
          'coal_mine|шахта воргашорская|республика коми, г. воркута, пгт воргашор',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_22',
          'Шахта им. В.Д. Ялевского',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54,
          86.5,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '22',
          'Кемеровская обл., Прокопьевский р-н, с. Котино',
          TRUE,
          22,
          'never',
          'coal_mine|шахта им в д ялевского|кемеровская обл., прокопьевский р-н, с. котино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_23',
          'Шахта им. А.Д. Рубана',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.6849,
          86.1824,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '23',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          23,
          'never',
          'coal_mine|шахта им а д рубана|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_24',
          'Шахта Распадская',
          'coal_mine',
          'ПАО «Распадская»',
          'РФ',
          'Кемеровская обл.',
          53.7291,
          88.0846,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе ЕВРАЗа)',
          '24',
          'Кемеровская обл., г. Междуреченск',
          TRUE,
          24,
          'never',
          'coal_mine|шахта распадская|кемеровская обл., г. междуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_25',
          'Шахта Талдинская-Западная 2',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.1506,
          87.1162,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '25',
          'Кемеровская обл., Прокопьевский р-н',
          TRUE,
          25,
          'never',
          'coal_mine|шахта талдинская западная 2|кемеровская обл., прокопьевский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_26',
          'Шахта УК «Межегейуголь»',
          'coal_mine',
          'ООО «УК «Межегейуголь»',
          'РФ',
          'Республика Тыва',
          51.5,
          94.5,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе «Распадской»)',
          '26',
          'Республика Тыва',
          TRUE,
          26,
          'never',
          'coal_mine|шахта ук межегейуголь|республика тыва',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_27',
          'Шахта Южная',
          'coal_mine',
          'АО «Черниговец»',
          'РФ',
          'Кемеровская обл.',
          55.6006,
          86.0972,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '27',
          'Кемеровская обл., г. Берёзовский',
          TRUE,
          27,
          'never',
          'coal_mine|шахта южная|кемеровская обл., г. березовский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_28',
          'Шахта Березовская',
          'coal_mine',
          'АО «УК «Северный Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          55.6,
          86.1,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '28',
          'Кемеровская обл., г. Берёзовский',
          TRUE,
          28,
          'never',
          'coal_mine|шахта березовская|кемеровская обл., г. березовский',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_29',
          'Шахта Листвяжная',
          'coal_mine',
          'ООО «Шахта «Листвяжная»',
          'РФ',
          'Кемеровская обл.',
          54.5209,
          86.3946,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '29',
          'Кемеровская обл., пгт Грамотеино',
          TRUE,
          29,
          'never',
          'coal_mine|шахта листвяжная|кемеровская обл., пгт грамотеино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_30',
          'Шахта Талдинская-Западная 1',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.1773,
          87.1036,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '30',
          'Кемеровская обл., Прокопьевский р-н',
          TRUE,
          30,
          'never',
          'coal_mine|шахта талдинская западная 1|кемеровская обл., прокопьевский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_31',
          'Шахта Увальная',
          'coal_mine',
          'АО «Угольная компания Сибирская»',
          'РФ',
          'Кемеровская обл.',
          54.0953,
          87.5603,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '31',
          'Кемеровская обл., Новокузнецкий р-н, пос. Увал',
          TRUE,
          31,
          'never',
          'coal_mine|шахта увальная|кемеровская обл., новокузнецкий р-н, пос. увал',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_32',
          'Шахта Первомайская',
          'coal_mine',
          'АО «УК «Северный Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          55.7211,
          86.172,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '32',
          'Кемеровская обл., Кемеровский р-н, п. Разведчик',
          TRUE,
          32,
          'never',
          'coal_mine|шахта первомайская|кемеровская обл., кемеровский р-н, п. разведчик',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_33',
          'Шахта № 12',
          'coal_mine',
          'ООО «Шахта №12»',
          'РФ',
          'Кемеровская обл.',
          54.0053,
          86.671,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (в составе «Стройсервис»)',
          '33',
          'Кемеровская обл., г. Киселевск',
          TRUE,
          33,
          'never',
          'coal_mine|шахта 12|кемеровская обл., г. киселевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_34',
          'Шахта Полысаевская',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.534,
          86.2162,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '34',
          'Кемеровская обл., г. Полысаево',
          TRUE,
          34,
          'never',
          'coal_mine|шахта полысаевская|кемеровская обл., г. полысаево',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_35',
          'Шахта Антоновская',
          'coal_mine',
          'АО «Шахта «Антоновская»',
          'РФ',
          'Кемеровская обл.',
          53.877,
          87.3117,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '35',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          35,
          'never',
          'coal_mine|шахта антоновская|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_36',
          'Шахта Большевик',
          'coal_mine',
          'АО «Шахта «Большевик»',
          'РФ',
          'Кемеровская обл.',
          53.9,
          87.35,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '36',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          36,
          'never',
          'coal_mine|шахта большевик|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_37',
          'Шахта Полосухинская',
          'coal_mine',
          'АО «Шахта «Полосухинская»',
          'РФ',
          'Кемеровская обл.',
          53.9218,
          87.3243,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '37',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          37,
          'never',
          'coal_mine|шахта полосухинская|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_38',
          'Шахта Чертинская-Коксовая',
          'coal_mine',
          'ООО «ММК-УГОЛЬ»',
          'РФ',
          'Кемеровская обл.',
          54.3217,
          86.3348,
          FALSE,
          'Тип угля: каменный | Покупатели: ПАО «ММК»',
          '38',
          'Кемеровская обл., г. Белово',
          TRUE,
          38,
          'never',
          'coal_mine|шахта чертинская коксовая|кемеровская обл., г. белово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_39',
          'Шахта «Северная»',
          'coal_mine',
          'АО «ВоркутаУголь»',
          'РФ',
          'Республика Коми',
          67.5867,
          64.0983,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (Северсталь)',
          '39',
          'Республика Коми, г. Воркута',
          TRUE,
          39,
          'never',
          'coal_mine|шахта северная|республика коми, г. воркута',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_40',
          'Шахта «Интинская»',
          'coal_mine',
          'ОАО Шахта «Интауголь»',
          'РФ',
          'Республика Коми',
          66.0173,
          60.1313,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '40',
          'Республика Коми, г. Инта',
          TRUE,
          40,
          'never',
          'coal_mine|шахта интинская|республика коми, г. инта',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_41',
          'Шахта «Восточная»',
          'coal_mine',
          'ПО «Гуковуголь»',
          'РФ',
          'Ростовская обл.',
          48.06,
          39.94,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '41',
          'Ростовская обл., г. Гуково',
          TRUE,
          41,
          'never',
          'coal_mine|шахта восточная|ростовская обл., г. гуково',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_42',
          'Шахта «Антрацит»',
          'coal_mine',
          'ООО «Шахта «Антрацит»',
          'РФ',
          'Ростовская обл.',
          47.78,
          39.95,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок',
          '42',
          'Ростовская обл.',
          TRUE,
          42,
          'never',
          'coal_mine|шахта антрацит|ростовская обл.',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_43',
          'Шахта «Ростовская»',
          'coal_mine',
          'ООО «Кингкоул»',
          'РФ',
          'Ростовская обл.',
          48.0166,
          39.8318,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок',
          '43',
          'Ростовская обл., г. Гуково',
          TRUE,
          43,
          'never',
          'coal_mine|шахта ростовская|ростовская обл., г. гуково',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_44',
          'Шахта «Садкинская»',
          'coal_mine',
          'ООО «Южная угольная компания»',
          'РФ',
          'Ростовская обл.',
          47.85,
          40.8318,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок',
          '44',
          'Ростовская обл., Белокалитвинский р-н',
          TRUE,
          44,
          'never',
          'coal_mine|шахта садкинская|ростовская обл., белокалитвинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_45',
          'Шахта «Обуховская»',
          'coal_mine',
          'ДТЭК',
          'РФ',
          'Ростовская обл.',
          48,
          40,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (металлургические заводы)',
          '45',
          'Ростовская обл., г. Зверево',
          TRUE,
          45,
          'never',
          'coal_mine|шахта обуховская|ростовская обл., г. зверево',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_46',
          'Шахта «Дальняя»',
          'coal_mine',
          'ДТЭК',
          'РФ',
          'Ростовская обл.',
          47.7096,
          40.2158,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '46',
          'Ростовская обл., Красносулинский р-н',
          TRUE,
          46,
          'never',
          'coal_mine|шахта дальняя|ростовская обл., красносулинский р-н',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_47',
          'Шахта № 410',
          'coal_mine',
          'ДТЭК',
          'РФ',
          'Ростовская обл.',
          47.7122,
          40.2058,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (в режиме консервации)',
          '47',
          'Ростовская обл.',
          TRUE,
          47,
          'never',
          'coal_mine|шахта 410|ростовская обл.',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_48',
          'Шахта «Алардинская»',
          'coal_mine',
          'ОАО ОУК «Южкузбассуголь»',
          'РФ',
          'Кемеровская обл.',
          53.3839,
          87.3663,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '48',
          'Кемеровская обл., г. Калтан, пос. Малиновка',
          TRUE,
          48,
          'never',
          'coal_mine|шахта алардинская|кемеровская обл., г. калтан, пос. малиновка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_49',
          'Шахта «Усковская»',
          'coal_mine',
          'ОАО ОУК «Южкузбассуголь»',
          'РФ',
          'Кемеровская обл.',
          53.7544,
          87.1071,
          FALSE,
          'Тип угля: коксующийся марки ГЖ | Покупатели: Внутренний рынок (в составе «Распадской»)',
          '49',
          'Кемеровская обл., г. Новокузнецк',
          TRUE,
          49,
          'never',
          'coal_mine|шахта усковская|кемеровская обл., г. новокузнецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_50',
          'Шахта «Томусинская 5-6»',
          'coal_mine',
          'Распадская Угольная Компания',
          'РФ',
          'Кемеровская обл.',
          53.6866,
          88.0704,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок (в составе ЕВРАЗа)',
          '50',
          'Кемеровская обл., г. Междуреченск',
          TRUE,
          50,
          'never',
          'coal_mine|шахта томусинская 5 6|кемеровская обл., г. междуреченск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_51',
          'Шахта «Бутовская»',
          'coal_mine',
          'ПАО «КОКС»',
          'РФ',
          'Кемеровская обл.',
          55.4787,
          86.0809,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок',
          '51',
          'Кемеровская обл., г. Кемерово',
          TRUE,
          51,
          'never',
          'coal_mine|шахта бутовская|кемеровская обл., г. кемерово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_52',
          'Шахта Кыргайская',
          'coal_mine',
          'АО «Шахтоуправление Талдинское-Кыргайское»',
          'РФ',
          'Кемеровская обл.',
          54.134,
          87.1663,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '52',
          'Кемеровская обл., Прокопьевский р-н, с. Большая Талда',
          TRUE,
          52,
          'never',
          'coal_mine|шахта кыргайская|кемеровская обл., прокопьевский р-н, с. большая талда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_53',
          'Шахта «Грамотеинская»',
          'coal_mine',
          'ООО УК «ЗапСибУголь»',
          'РФ',
          'Кемеровская обл.',
          54.5673,
          86.4162,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '53',
          'Кемеровская обл., пгт Грамотеино',
          TRUE,
          53,
          'never',
          'coal_mine|шахта грамотеинская|кемеровская обл., пгт грамотеино',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_54',
          'Шахта имени С.М. Кирова',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.6523,
          86.1526,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '54',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          54,
          'never',
          'coal_mine|шахта имени с м кирова|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_55',
          'Шахта имени 7 Ноября-Новая',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.5711,
          86.3838,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '55',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          55,
          'never',
          'coal_mine|шахта имени 7 ноября новая|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_56',
          'Шахта «Котинская»',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54,
          86.4,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '56',
          'Кемеровская обл., г. Киселёвск',
          TRUE,
          56,
          'never',
          'coal_mine|шахта котинская|кемеровская обл., г. киселевск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_57',
          'Шахта «Алексиевская»',
          'coal_mine',
          'АО «СУЭК-Кузбасс»',
          'РФ',
          'Кемеровская обл.',
          54.1,
          86.2,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок и экспорт (в составе СУЭК)',
          '57',
          'Кемеровская обл., г. Ленинск-Кузнецкий',
          TRUE,
          57,
          'never',
          'coal_mine|шахта алексиевская|кемеровская обл., г. ленинск-кузнецкий',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_58',
          'Чырагское месторождение',
          'coal_mine',
          '',
          'Азербайджан',
          '',
          40.8,
          45.5,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '58',
          'Товузский район',
          TRUE,
          58,
          'never',
          'coal_mine|чырагское месторождение|товузский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_59',
          'Гушчу-Мехманинское месторождение',
          'coal_mine',
          '',
          'Азербайджан',
          '',
          40.8,
          45.5,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '59',
          'Товузский район',
          TRUE,
          59,
          'never',
          'coal_mine|гушчу мехманинское месторождение|товузский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_60',
          'Шамкир-Чандахбинское месторождение',
          'coal_mine',
          '',
          'Азербайджан',
          '',
          40.8,
          46,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '60',
          'село Чандахбина',
          TRUE,
          60,
          'never',
          'coal_mine|шамкир чандахбинское месторождение|село чандахбина',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_61',
          'Зуванд-Ярдымлинское месторождение',
          'coal_mine',
          '',
          'Азербайджан',
          '',
          38.9,
          48.2,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок',
          '61',
          'Ярдымлинский район',
          TRUE,
          61,
          'never',
          'coal_mine|зуванд ярдымлинское месторождение|ярдымлинский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_62',
          'Шахта Фан-Ягноб',
          'coal_mine',
          '',
          'Таджикистан',
          '',
          39,
          69,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '62',
          'Раштская долина, п. Наугарзан',
          TRUE,
          62,
          'never',
          'coal_mine|шахта фан ягноб|раштская долина, п. наугарзан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_63',
          'Зиддинское угольное месторождение',
          'coal_mine',
          '',
          'Таджикистан',
          '',
          40.2,
          69.7,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '63',
          'Бабоджан-Гафуровский район',
          TRUE,
          63,
          'never',
          'coal_mine|зиддинское угольное месторождение|бабоджан-гафуровский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_64',
          'Назарайлокское угольное месторождение',
          'coal_mine',
          '',
          'Таджикистан',
          '',
          38.6,
          68.3,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок',
          '64',
          'Шахринауский район',
          TRUE,
          64,
          'never',
          'coal_mine|назарайлокское угольное месторождение|шахринауский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_65',
          'Шахта «Шураб»',
          'coal_mine',
          '',
          'Таджикистан',
          'Шураб',
          40,
          70.5,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок',
          '65',
          'г. Шураб',
          TRUE,
          65,
          'never',
          'coal_mine|шахта шураб|г. шураб',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_66',
          'Мионаду (Миёнаду)',
          'coal_mine',
          '',
          'Таджикистан',
          'Хатлонская область',
          37.5,
          69,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок',
          '66',
          'Хатлонская область',
          TRUE,
          66,
          'never',
          'coal_mine|мионаду миенаду|хатлонская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_67',
          'Сарвати-и Боло',
          'coal_mine',
          '',
          'Таджикистан',
          '',
          38.5,
          70,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок',
          '67',
          'Нурабадский район',
          TRUE,
          67,
          'never',
          'coal_mine|сарвати и боло|нурабадский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_68',
          'Шахта «Степная» (Казахстан)',
          'coal_mine',
          '',
          'Казахстан',
          'Шахтинск',
          49.7,
          72.6,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '68',
          'г. Шахтинск',
          TRUE,
          68,
          'never',
          'coal_mine|шахта степная казахстан|г. шахтинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_69',
          'Шахта «Абайская»',
          'coal_mine',
          '',
          'Казахстан',
          'Караганда',
          49.8,
          73.1,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '69',
          'г. Караганда',
          TRUE,
          69,
          'never',
          'coal_mine|шахта абайская|г. караганда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_70',
          'Шахта «Шахтинская»',
          'coal_mine',
          '',
          'Казахстан',
          'Шахтинск',
          49.7,
          72.6,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '70',
          'г. Шахтинск',
          TRUE,
          70,
          'never',
          'coal_mine|шахта шахтинская|г. шахтинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_71',
          'Шахта «Тентекская»',
          'coal_mine',
          '',
          'Казахстан',
          'Шахтинск',
          49.7,
          72.6,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '71',
          'г. Шахтинск',
          TRUE,
          71,
          'never',
          'coal_mine|шахта тентекская|г. шахтинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_72',
          'Шахта «Кузнецкая»',
          'coal_mine',
          '',
          'Казахстан',
          'Сарань',
          49.8,
          72.8,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '72',
          'г. Сарань',
          TRUE,
          72,
          'never',
          'coal_mine|шахта кузнецкая|г. сарань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_73',
          'Шахта «Саранская»',
          'coal_mine',
          '',
          'Казахстан',
          'Сарань',
          49.8,
          72.8,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок, экспорт',
          '73',
          'г. Сарань',
          TRUE,
          73,
          'never',
          'coal_mine|шахта саранская|г. сарань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_74',
          'Майкубенский разрез',
          'coal_mine',
          'АО «БРК»',
          'Казахстан',
          'Павлодарская область',
          51.5,
          75.8,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок (энергетика)',
          '74',
          'Павлодарская область, пос. Майкаин',
          TRUE,
          74,
          'never',
          'coal_mine|майкубенский разрез|павлодарская область, пос. майкаин',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_75',
          'Шахта имени Костенко',
          'coal_mine',
          'Qarmet',
          'Казахстан',
          'Караганда',
          49.8,
          73.1,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (металлургия)',
          '75',
          'г. Караганда',
          TRUE,
          75,
          'never',
          'coal_mine|шахта имени костенко|г. караганда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_76',
          'Шахта имени Кузембаева',
          'coal_mine',
          '',
          'Казахстан',
          'Сарань',
          49.8,
          72.8,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок, экспорт',
          '76',
          'г. Сарань',
          TRUE,
          76,
          'never',
          'coal_mine|шахта имени кузембаева|г. сарань',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_77',
          'Шахта Казахстанская',
          'coal_mine',
          'Qarmet',
          'Казахстан',
          'Караганда',
          49.8,
          73.1,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок (металлургия)',
          '77',
          'г. Караганда',
          TRUE,
          77,
          'never',
          'coal_mine|шахта казахстанская|г. караганда',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_78',
          'Шахта имени Ленина',
          'coal_mine',
          '',
          'Казахстан',
          'Шахтинск',
          49.7,
          72.6,
          FALSE,
          'Тип угля: коксующиеся и энергетические | Покупатели: Внутренний рынок, экспорт',
          '78',
          'г. Шахтинск',
          TRUE,
          78,
          'never',
          'coal_mine|шахта имени ленина|г. шахтинск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_79',
          'Шахта «Ангренская»',
          'coal_mine',
          '',
          'Узбекистан',
          'Ангрен',
          41,
          70.1,
          FALSE,
          'Тип угля: бурый | Покупатели: Внутренний рынок (энергетика)',
          '79',
          'г. Ангрен',
          TRUE,
          79,
          'never',
          'coal_mine|шахта ангренская|г. ангрен',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_80',
          'Шахта «Шаргуньская»',
          'coal_mine',
          '',
          'Узбекистан',
          'Шаргунь',
          38,
          67,
          FALSE,
          'Тип угля: антрациты, тощие, коксующиеся | Покупатели: Внутренний рынок',
          '80',
          'г. Шаргунь',
          TRUE,
          80,
          'never',
          'coal_mine|шахта шаргуньская|г. шаргунь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_81',
          'Шахта «Байсунская»',
          'coal_mine',
          '',
          'Узбекистан',
          '',
          38.2,
          67.2,
          FALSE,
          'Тип угля: каменный | Покупатели: Внутренний рынок',
          '81',
          'Байсунский район',
          TRUE,
          81,
          'never',
          'coal_mine|шахта байсунская|байсунский район',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_82',
          'Шахта «Самсоновская-Западная»',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48.1,
          37.3,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (до 2014)',
          '82',
          'Донецкая обл., г. Селидово',
          TRUE,
          82,
          'never',
          'coal_mine|шахта самсоновская западная|донецкая обл., г. селидово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_83',
          'Шахта «Кураховская»',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          47.9,
          37.3,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок (до 2014)',
          '83',
          'Донецкая обл., г. Курахово',
          TRUE,
          83,
          'never',
          'coal_mine|шахта кураховская|донецкая обл., г. курахово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_84',
          'Шахта Новодружевская',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48.9,
          38.3,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок (до 2014)',
          '84',
          'Донецкая обл., г. Курахово',
          TRUE,
          84,
          'never',
          'coal_mine|шахта новодружевская|донецкая обл., г. курахово',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_85',
          'Шахта «Днепровская»',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48.3,
          36.4,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (до 2014)',
          '85',
          'Донецкая обл., г. Першотравенск',
          TRUE,
          85,
          'never',
          'coal_mine|шахта днепровская|донецкая обл., г. першотравенск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_86',
          'Шахта «Павлоградская»',
          'coal_mine',
          '',
          'Украина',
          'Павлоград',
          48.5,
          35.9,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок (до 2014)',
          '86',
          'г. Павлоград',
          TRUE,
          86,
          'never',
          'coal_mine|шахта павлоградская|г. павлоград',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_87',
          'Шахта «Южнодонбасская №1»',
          'coal_mine',
          '',
          'Украина',
          'Павлоград',
          48.5,
          35.9,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок (до 2014)',
          '87',
          'г. Павлоград',
          TRUE,
          87,
          'never',
          'coal_mine|шахта южнодонбасская 1|г. павлоград',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_88',
          'Шахта имени Героев Космоса',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48,
          37,
          FALSE,
          'Тип угля: антрацит | Покупатели: Внутренний рынок (до 2014)',
          '88',
          'Донецкая обл., пгт Юрьевка',
          TRUE,
          88,
          'never',
          'coal_mine|шахта имени героев космоса|донецкая обл., пгт юрьевка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_89',
          'Шахта «Межиреченская»',
          'coal_mine',
          '',
          'Украина',
          'Львовская обл.',
          50.2,
          24,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок',
          '89',
          'Львовская обл., г. Сосновка',
          TRUE,
          89,
          'never',
          'coal_mine|шахта межиреченская|львовская обл., г. сосновка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_90',
          'Шахта «Степная»',
          'coal_mine',
          '',
          'Украина',
          'Львовская обл.',
          50.4,
          24.2,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок',
          '90',
          'Львовская обл., г. Червоноград',
          TRUE,
          90,
          'never',
          'coal_mine|шахта степная|львовская обл., г. червоноград',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_91',
          'Шахта «Великомостовская»',
          'coal_mine',
          '',
          'Украина',
          'Львовская обл.',
          50.2,
          24.1,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок',
          '91',
          'Львовская обл., г. Великие Мосты',
          TRUE,
          91,
          'never',
          'coal_mine|шахта великомостовская|львовская обл., г. великие мосты',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_92',
          'Шахта «Лиственская»',
          'coal_mine',
          '',
          'Украина',
          'Волынская обл.',
          50.7,
          24.6,
          FALSE,
          'Тип угля: газовый | Покупатели: Внутренний рынок',
          '92',
          'Волынская обл., г. Нововолынск',
          TRUE,
          92,
          'never',
          'coal_mine|шахта лиственская|волынская обл., г. нововолынск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_93',
          'Шахта «им. А.Ф. Засядько»',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48,
          37.8,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок (до 2014)',
          '93',
          'Донецкая обл., г. Донецк',
          TRUE,
          93,
          'never',
          'coal_mine|шахта им а ф засядько|донецкая обл., г. донецк',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'coal_mine_94',
          'Шахта «Краснолиманская»',
          'coal_mine',
          '',
          'Украина',
          'Донецкая обл.',
          48.4,
          37.8,
          FALSE,
          'Тип угля: коксующийся | Покупатели: Внутренний рынок (до 2014)',
          '94',
          'Донецкая обл., г. Родинское',
          TRUE,
          94,
          'never',
          'coal_mine|шахта краснолиманская|донецкая обл., г. родинское',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_1',
          'Магнитогорский металлургический комбинат (ММК)',
          'slag_dump',
          '',
          'РФ',
          'Магнитогорск',
          53.3786,
          59.0356,
          FALSE,
          'Доменные шлаки',
          '1',
          '455000, г. Магнитогорск, ул. Кирова, 93',
          TRUE,
          1,
          'never',
          'slag_dump|магнитогорский металлургический комбинат ммк|455000, г. магнитогорск, ул. кирова, 93',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_2',
          'Челябинский металлургический комбинат (ЧМК)',
          'slag_dump',
          '',
          'РФ',
          'Челябинск',
          55.1039,
          61.4086,
          FALSE,
          'Доменные шлаки',
          '2',
          '454047, г. Челябинск, ул. 2-я Павелецкая, 14',
          TRUE,
          2,
          'never',
          'slag_dump|челябинский металлургический комбинат чмк|454047, г. челябинск, ул. 2-я павелецкая, 14',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_3',
          'Новолипецкий металлургический комбинат (НЛМК)',
          'slag_dump',
          '',
          'РФ',
          'Липецк',
          52.6162,
          39.6005,
          FALSE,
          'Доменные шлаки',
          '3',
          '398040, г. Липецк, пл. Металлургов, 2',
          TRUE,
          3,
          'never',
          'slag_dump|новолипецкий металлургический комбинат нлмк|398040, г. липецк, пл. металлургов, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_4',
          'Череповецкий металлургический комбинат («Северсталь»)',
          'slag_dump',
          '',
          'РФ',
          'Вологодская обл.',
          59.144,
          37.863,
          FALSE,
          'Доменные шлаки',
          '4',
          '162600, Вологодская обл., г. Череповец, ул. Мира, 30',
          TRUE,
          4,
          'never',
          'slag_dump|череповецкий металлургический комбинат северсталь|162600, вологодская обл., г. череповец, ул. мира, 30',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_5',
          'Нижнетагильский металлургический комбинат (НТМК)',
          'slag_dump',
          '',
          'РФ',
          'Свердловская обл.',
          57.9052,
          59.9645,
          FALSE,
          'Доменные шлаки',
          '5',
          '622025, Свердловская обл., г. Нижний Тагил, ул. Металлургов, 1',
          TRUE,
          5,
          'never',
          'slag_dump|нижнетагильский металлургический комбинат нтмк|622025, свердловская обл., г. нижний тагил, ул. металлургов, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_6',
          'Новокузнецкий металлургический комбинат',
          'slag_dump',
          '',
          'РФ',
          'Кемеровская обл.',
          53.7496,
          87.1094,
          FALSE,
          'Доменные шлаки',
          '6',
          'Кемеровская обл., г. Новокузнецк, ш. Космическое, 16',
          TRUE,
          6,
          'never',
          'slag_dump|новокузнецкий металлургический комбинат|кемеровская обл., г. новокузнецк, ш. космическое, 16',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_7',
          'АО «Кировградский медеплавильный комбинат»',
          'slag_dump',
          '',
          'РФ',
          'Свердловская обл.',
          57.4333,
          60.0667,
          FALSE,
          'Медные шлаки',
          '7',
          '624140, Свердловская обл., г. Кировград, ул. Энгельса, 19',
          TRUE,
          7,
          'never',
          'slag_dump|ао кировградский медеплавильный комбинат|624140, свердловская обл., г. кировград, ул. энгельса, 19',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_8',
          'Среднеуральский медеплавильный завод',
          'slag_dump',
          '',
          'РФ',
          'Свердловская обл.',
          56.8011,
          59.9084,
          FALSE,
          'Медные шлаки',
          '8',
          '623270, Свердловская обл., г. Ревда, ул. Среднеуральская, 1',
          TRUE,
          8,
          'never',
          'slag_dump|среднеуральский медеплавильный завод|623270, свердловская обл., г. ревда, ул. среднеуральская, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_9',
          'Норильский горно-металлургический комбинат',
          'slag_dump',
          '',
          'РФ',
          'Красноярский край',
          69.3333,
          88.2167,
          FALSE,
          'Никелевые шлаки',
          '9',
          '663300, Красноярский край, г. Норильск, пл. Гвардейская, 2',
          TRUE,
          9,
          'never',
          'slag_dump|норильский горно металлургический комбинат|663300, красноярский край, г. норильск, пл. гвардейская, 2',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_10',
          'Комбинат «Североникель»',
          'slag_dump',
          '',
          'РФ',
          'Мурманская обл.',
          67.9333,
          32.8167,
          FALSE,
          'Никелевые шлаки',
          '10',
          'Мурманская обл., г. Мончегорск',
          TRUE,
          10,
          'never',
          'slag_dump|комбинат североникель|мурманская обл., г. мончегорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_11',
          'Каменск-Уральский металлургический завод (КУЗ)',
          'slag_dump',
          '',
          'РФ',
          'Свердловская обл.',
          56.3539,
          61.9861,
          FALSE,
          'Алюминиевые шлаки («красные шламы»)',
          '11',
          '623405, Свердловская обл., г. Каменск-Уральский, ул. Заводская, 5',
          TRUE,
          11,
          'never',
          'slag_dump|каменск уральский металлургический завод куз|623405, свердловская обл., г. каменск-уральский, ул. заводская, 5',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_12',
          'Разрез «Киселевский», шахта №12, АО «СУЭК-Кузбасс»',
          'slag_dump',
          '',
          'РФ',
          'Кемеровская обл.',
          54.0053,
          86.671,
          FALSE,
          'Породный отвал',
          '12',
          '652705, Кемеровская обл., г. Киселевск, ул. Чумова, 2а',
          TRUE,
          12,
          'never',
          'slag_dump|разрез киселевский шахта 12 ао суэк кузбасс|652705, кемеровская обл., г. киселевск, ул. чумова, 2а',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_13',
          'ООО «Шахта «Аютинская»',
          'slag_dump',
          '',
          'РФ',
          'Ростовская обл.',
          47.75,
          40.1152,
          FALSE,
          'Породный отвал',
          '13',
          'Ростовская обл., г. Шахты, пос. Аютинский, ул. Кошевого, 16',
          TRUE,
          13,
          'never',
          'slag_dump|ооо шахта аютинская|ростовская обл., г. шахты, пос. аютинский, ул. кошевого, 16',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_14',
          'АО «Воркутауголь»',
          'slag_dump',
          '',
          'РФ',
          'Республика Коми',
          67.5,
          64,
          FALSE,
          'Породный отвал',
          '14',
          '169908, Республика Коми, г. Воркута, ул. Ленина',
          TRUE,
          14,
          'never',
          'slag_dump|ао воркутауголь|169908, республика коми, г. воркута, ул. ленина',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_15',
          'ПАО «Иркутскэнерго»',
          'slag_dump',
          '',
          'РФ',
          'Иркутск',
          52.2833,
          104.2833,
          FALSE,
          'Золо-шлаковый отвал',
          '15',
          '664000, г. Иркутск, ул. Сухэ-Батора, 3',
          TRUE,
          15,
          'never',
          'slag_dump|пао иркутскэнерго|664000, г. иркутск, ул. сухэ-батора, 3',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_16',
          'ООО «Свердловская ГРЭС»',
          'slag_dump',
          '',
          'РФ',
          'Свердловская область',
          56.8,
          60,
          FALSE,
          'Золо-шлаковый отвал',
          '16',
          'Свердловская область',
          TRUE,
          16,
          'never',
          'slag_dump|ооо свердловская грэс|свердловская область',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_17',
          'Новосибирская ТЭЦ-5, АО «СИБЭКО»',
          'slag_dump',
          '',
          'РФ',
          'Новосибирск',
          55,
          82.95,
          FALSE,
          'Золо-шлаковый отвал',
          '17',
          '630099, г. Новосибирск, Красный пр-кт, 25',
          TRUE,
          17,
          'never',
          'slag_dump|новосибирская тэц 5 ао сибэко|630099, г. новосибирск, красный пр-кт, 25',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_18',
          'Воскресенский производственный комплекс («Воскресенские минеральные удобрения»)',
          'slag_dump',
          '',
          'РФ',
          'Московская обл.',
          55.3241,
          38.7483,
          FALSE,
          'Фосфогипсовый отвал',
          '18',
          'Московская обл., г. Воскресенск',
          TRUE,
          18,
          'never',
          'slag_dump|воскресенский производственный комплекс воскресенские минеральные удобрения|московская обл., г. воскресенск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_19',
          'ПО «Фосфорит»',
          'slag_dump',
          '',
          'РФ',
          'Ленинградская обл.',
          59.45,
          29.4833,
          FALSE,
          'Фосфогипсовый отвал',
          '19',
          'Ленинградская обл., г. Кингисепп',
          TRUE,
          19,
          'never',
          'slag_dump|по фосфорит|ленинградская обл., г. кингисепп',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_20',
          'ОАО «Белорусский металлургический завод»',
          'slag_dump',
          '',
          'Беларусь',
          'Гомельская обл.',
          52.8921,
          30.0433,
          FALSE,
          'Сталеплавильные и доменные шлаки',
          '20',
          '247210, Гомельская обл., г. Жлобин, ул. Промышленная, 37',
          TRUE,
          20,
          'never',
          'slag_dump|оао белорусский металлургический завод|247210, гомельская обл., г. жлобин, ул. промышленная, 37',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_21',
          'ОАО «Могилёвский металлургический завод»',
          'slag_dump',
          '',
          'Беларусь',
          'Могилёв',
          53.8953,
          30.3255,
          FALSE,
          'Литейные шлаки',
          '21',
          '212030, г. Могилёв, ул. Курако, 28',
          TRUE,
          21,
          'never',
          'slag_dump|оао могилевский металлургический завод|212030, г. могилев, ул. курако, 28',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_22',
          'РУП «Гомельский литейный завод «Центролит»',
          'slag_dump',
          '',
          'Беларусь',
          'Гомель',
          52.443,
          30.9841,
          FALSE,
          'Литейные шлаки',
          '22',
          '246008, г. Гомель, ул. Центролит, 1',
          TRUE,
          22,
          'never',
          'slag_dump|руп гомельский литейный завод центролит|246008, г. гомель, ул. центролит, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_23',
          'ПАО «АрселорМиттал Кривой Рог»',
          'slag_dump',
          '',
          'Украина',
          'Днепропетровская обл.',
          47.8951,
          33.3923,
          FALSE,
          'Доменные и сталеплавильные шлаки',
          '23',
          '50095, Днепропетровская обл., г. Кривой Рог, ул. Орджоникидзе, 1',
          TRUE,
          23,
          'never',
          'slag_dump|пао арселормиттал кривой рог|50095, днепропетровская обл., г. кривой рог, ул. орджоникидзе, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_24',
          'Металлургический комбинат «Азовсталь»',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          47.1303,
          37.5841,
          FALSE,
          'Доменный шлак',
          '24',
          '87500, Донецкая обл., г. Мариуполь, ул. Лепорского, 1',
          TRUE,
          24,
          'never',
          'slag_dump|металлургический комбинат азовсталь|87500, донецкая обл., г. мариуполь, ул. лепорского, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_25',
          'Металлургический комбинат им. Ильича',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          47.1303,
          37.5841,
          FALSE,
          'Доменный шлак',
          '25',
          '87500, Донецкая обл., г. Мариуполь',
          TRUE,
          25,
          'never',
          'slag_dump|металлургический комбинат им ильича|87500, донецкая обл., г. мариуполь',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_26',
          'ПАО «Запорожсталь»',
          'slag_dump',
          '',
          'Украина',
          'Запорожье',
          47.8388,
          35.1384,
          FALSE,
          'Доменный шлак',
          '26',
          'г. Запорожье',
          TRUE,
          26,
          'never',
          'slag_dump|пао запорожсталь|г. запорожье',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_27',
          'ПАО «Днепровский металлургический комбинат им. Дзержинского» (ныне «Камет-сталь»)',
          'slag_dump',
          '',
          'Украина',
          'Каменское',
          48.5158,
          34.6135,
          FALSE,
          'Доменный шлак',
          '27',
          '51925, г. Каменское, ул. Соборная, 18Б',
          TRUE,
          27,
          'never',
          'slag_dump|пао днепровский металлургический комбинат им дзержинского ныне камет сталь|51925, г. каменское, ул. соборная, 18б',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_28',
          'Енакиевский металлургический завод',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          48.2297,
          38.2053,
          FALSE,
          'Доменный шлак',
          '28',
          '86429, Донецкая обл., г. Енакиево, пр. Металлургов, 9',
          TRUE,
          28,
          'never',
          'slag_dump|енакиевский металлургический завод|86429, донецкая обл., г. енакиево, пр. металлургов, 9',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_29',
          'Алчевский металлургический комбинат',
          'slag_dump',
          '',
          'Украина',
          'Луганская обл.',
          48.4781,
          38.8071,
          FALSE,
          'Доменный шлак',
          '29',
          'Луганская обл., г. Алчевск, ул. Шмидта, 4',
          TRUE,
          29,
          'never',
          'slag_dump|алчевский металлургический комбинат|луганская обл., г. алчевск, ул. шмидта, 4',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_30',
          'Донецкий металлургический завод',
          'slag_dump',
          '',
          'Украина',
          'Донецк',
          47.9823,
          37.8106,
          FALSE,
          'Доменный шлак',
          '30',
          '83062, г. Донецк, ул. Ивана Ткаченко, 122',
          TRUE,
          30,
          'never',
          'slag_dump|донецкий металлургический завод|83062, г. донецк, ул. ивана ткаченко, 122',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_31',
          'Макеевский металлургический завод',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          48.0554,
          37.9477,
          FALSE,
          'Доменный шлак',
          '31',
          'Донецкая обл., г. Макеевка',
          TRUE,
          31,
          'never',
          'slag_dump|макеевский металлургический завод|донецкая обл., г. макеевка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_32',
          'Константиновский металлургический завод',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          48.5333,
          37.7167,
          FALSE,
          'Доменный шлак',
          '32',
          'Донецкая обл., г. Константиновка',
          TRUE,
          32,
          'never',
          'slag_dump|константиновский металлургический завод|донецкая обл., г. константиновка',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_33',
          'ПАО «Электрометаллургический завод «Днепроспецсталь»',
          'slag_dump',
          '',
          'Украина',
          'Запорожье',
          47.8388,
          35.1384,
          FALSE,
          'Электросталеплавильный шлак',
          '33',
          'г. Запорожье',
          TRUE,
          33,
          'never',
          'slag_dump|пао электрометаллургический завод днепроспецсталь|г. запорожье',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_34',
          'ПАО «Краматорский завод «Энергомашспецсталь»',
          'slag_dump',
          '',
          'Украина',
          'Донецкая обл.',
          48.7409,
          37.5841,
          FALSE,
          'Электросталеплавильный шлак',
          '34',
          'Донецкая обл., г. Краматорск',
          TRUE,
          34,
          'never',
          'slag_dump|пао краматорский завод энергомашспецсталь|донецкая обл., г. краматорск',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_35',
          'Зангезурский медно-молибденовый комбинат (ЗММК)',
          'slag_dump',
          '',
          'Армения',
          'Сюникская обл.',
          39.15,
          46.15,
          FALSE,
          'Шламы медномолибденового обогащения',
          '35',
          'Сюникская обл., г. Каджаран, ул. Лернагорцнери, 18',
          TRUE,
          35,
          'never',
          'slag_dump|зангезурский медно молибденовый комбинат зммк|сюникская обл., г. каджаран, ул. лернагорцнери, 18',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_36',
          'Агаракский медно-молибденовый комбинат (АМК)',
          'slag_dump',
          '',
          'Армения',
          'Сюникская обл.',
          38.8667,
          46.2,
          FALSE,
          'Шламы медномолибденового обогащения',
          '36',
          'Сюникская обл., г. Агарак',
          TRUE,
          36,
          'never',
          'slag_dump|агаракский медно молибденовый комбинат амк|сюникская обл., г. агарак',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_37',
          '«Азербайджанский алюминиевый завод»',
          'slag_dump',
          '',
          'Азербайджан',
          'Гянджа',
          40.6833,
          46.3667,
          FALSE,
          'Красные шламы',
          '37',
          'г. Гянджа',
          TRUE,
          37,
          'never',
          'slag_dump|азербайджанский алюминиевый завод|г. гянджа',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_38',
          'Бакинский сталелитейный завод (Bakı Polad)',
          'slag_dump',
          '',
          'Азербайджан',
          'Баку',
          40.4333,
          49.8167,
          FALSE,
          'Электросталеплавильный шлак',
          '38',
          'г. Баку, пос. Бинагады',
          TRUE,
          38,
          'never',
          'slag_dump|бакинский сталелитейный завод bak polad|г. баку, пос. бинагады',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_39',
          'Таджикский алюминиевый завод (ТАЛКО)',
          'slag_dump',
          '',
          'Таджикистан',
          'Турсунзаде',
          37.5,
          68.2333,
          FALSE,
          'Шлаки электролиза алюминия, фторсодержащие отходы',
          '39',
          '735014, г. Турсунзаде',
          TRUE,
          39,
          'never',
          'slag_dump|таджикский алюминиевый завод талко|735014, г. турсунзаде',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_40',
          'АО «АрселорМиттал Темиртау»',
          'slag_dump',
          '',
          'Казахстан',
          'Карагандинская обл.',
          50.064,
          72.9983,
          FALSE,
          'Доменный и сталеплавильный шлак',
          '40',
          'Карагандинская обл., г. Темиртау, пр. Республики, 1',
          TRUE,
          40,
          'never',
          'slag_dump|ао арселормиттал темиртау|карагандинская обл., г. темиртау, пр. республики, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_41',
          'АО «Евраз Казахстан»',
          'slag_dump',
          '',
          'Казахстан',
          'Карагандинская обл.',
          50.064,
          72.9983,
          FALSE,
          'Доменный и конвертерный шлак',
          '41',
          'Карагандинская обл., г. Темиртау',
          TRUE,
          41,
          'never',
          'slag_dump|ао евраз казахстан|карагандинская обл., г. темиртау',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_42',
          'ТНК «Казхром»',
          'slag_dump',
          '',
          'Казахстан',
          'Актобе',
          50.2834,
          57.2299,
          FALSE,
          'Шлаки ферросплавного производства',
          '42',
          '030008, г. Актобе, ул. М. Маметовой, 4а',
          TRUE,
          42,
          'never',
          'slag_dump|тнк казхром|030008, г. актобе, ул. м. маметовой, 4а',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_43',
          'АО «Алюминий Казахстана»',
          'slag_dump',
          '',
          'Казахстан',
          'Павлодар',
          52.3,
          76.95,
          FALSE,
          'Шлаки электролиза алюминия и красные шламы',
          '43',
          'г. Павлодар',
          TRUE,
          43,
          'never',
          'slag_dump|ао алюминий казахстана|г. павлодар',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_44',
          'Корпорация «Казахмыс»',
          'slag_dump',
          '',
          'Казахстан',
          'Карагандинская обл.',
          46.85,
          74.95,
          FALSE,
          'Медные шлаки',
          '44',
          'Карагандинская обл., г. Балхаш, ул. Ленина, 1',
          TRUE,
          44,
          'never',
          'slag_dump|корпорация казахмыс|карагандинская обл., г. балхаш, ул. ленина, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_45',
          'ОАО «Узметкомбинат»',
          'slag_dump',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.2061,
          69.2672,
          FALSE,
          'Электросталеплавильный шлак',
          '45',
          'Ташкентская обл., г. Бекабад, ул. ГАЛАБА, 1',
          TRUE,
          45,
          'never',
          'slag_dump|оао узметкомбинат|ташкентская обл., г. бекабад, ул. галаба, 1',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_46',
          'АО «Узбекско-немецкое совместное предприятие BEK»',
          'slag_dump',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.2061,
          69.2672,
          FALSE,
          'Электросталеплавильный шлак',
          '46',
          'Ташкентская обл., г. Бекабад',
          TRUE,
          46,
          'never',
          'slag_dump|ао узбекско немецкое совместное предприятие bek|ташкентская обл., г. бекабад',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_47',
          'Алмалыкский горно-металлургический комбинат (АГМК)',
          'slag_dump',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.8307,
          69.6007,
          FALSE,
          'Медные шлаки',
          '47',
          'Ташкентская обл., г. Алмалык',
          TRUE,
          47,
          'never',
          'slag_dump|алмалыкский горно металлургический комбинат агмк|ташкентская обл., г. алмалык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_48',
          'Навоийский ГМК (НГМК)',
          'slag_dump',
          '',
          'Узбекистан',
          'Навоийская обл.',
          40.0833,
          65.3833,
          FALSE,
          'Медные шлаки',
          '48',
          'Навоийская обл., г. Навои',
          TRUE,
          48,
          'never',
          'slag_dump|навоийский гмк нгмк|навоийская обл., г. навои',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_49',
          'АГМК (комбинат «Узцинк»)',
          'slag_dump',
          '',
          'Узбекистан',
          'Ташкентская обл.',
          40.8307,
          69.6007,
          FALSE,
          'Шлаки свинцово-цинкового производства',
          '49',
          'Ташкентская обл., г. Алмалык',
          TRUE,
          49,
          'never',
          'slag_dump|агмк комбинат узцинк|ташкентская обл., г. алмалык',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
INSERT INTO factories (
          id, name, type, holding, country, region, latitude, longitude,
          is_ours, description, code, address, is_active, sort_order,
          enterprise_status, canonical_key, edit_count, updated_at
        ) VALUES (
          'slag_dump_50',
          'АО «Хайдарканский ртутный завод»',
          'slag_dump',
          '',
          'Кыргызстан',
          'Баткенская обл.',
          39.9,
          71.5,
          FALSE,
          'Шлаки и шламы ртутного производства, отвалы сурьмяных руд',
          '50',
          'Баткенская обл., г. Хайдаркан',
          TRUE,
          50,
          'never',
          'slag_dump|ао хайдарканский ртутный завод|баткенская обл., г. хайдаркан',
          0,
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
