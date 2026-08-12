# Деплой BarsLogistics

Production-сервер: **https://barslogistics.almaz-t.ru**  
Embed в портал: **https://portal.almaz-t.ru/bars/logistics/** → `index-portal.html`

## Быстрый старт

```bash
cd ~/BarsLogistics
sudo bash deploy/deploy.sh
```

Скрипт нужно запускать **от root** (`sudo`). Исходники лежат в `~/BarsLogistics`, приложение в продакшене — в `/opt/barslogistics`.

## Что делает `deploy.sh`

| Шаг | Описание |
|-----|----------|
| 1 | Установка пакетов (Node.js 22, nginx, PostgreSQL, rsync, …) |
| 2 | Запись `requestchainrestproxy.almaz-t.ru` в `/etc/hosts` (внутренний auth proxy) |
| 3 | **rsync** исходников `SOURCE_DIR` → `APP_DIR` (без `.git`, `.env`, `node_modules`, и без runtime `data/avatars|chat-files|task-files|shipment-files|transport|backups`) |
| 4 | Создание/дополнение `.env` в `/opt/barslogistics` |
| 5 | `npm ci` + `npm run build:all` (standalone + portal embed) |
| 6 | Генерация VAPID-ключей для Web Push (если нет в `.env`) |
| 7 | PostgreSQL: пользователь, БД, миграции |
| 8 | SSL-сертификаты → `/etc/ssl/barslogistics/` |
| 9 | nginx + systemd (`barslogistics.service`) |
| 10 | Проверка health API |
| 11 | **Git: commit + push** из `SOURCE_DIR` (см. ниже) |

Повторный деплой после правок кода — та же команда. Полная переустановка ОС не нужна.

## Два каталога

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `SOURCE_DIR` | `~/BarsLogistics` | Git-репозиторий, откуда правите код |
| `APP_DIR` | `/opt/barslogistics` | Рабочая копия для nginx/systemd |

`rsync` **не копирует** `.git` — репозиторий живёт только в `SOURCE_DIR`. Git push выполняется из исходников, не из `/opt`.

**Важно:** каталоги загрузок (`data/avatars`, `data/chat-files`, `data/task-files`, `data/shipment-files`, `data/transport`, `data/backups`) **исключены** из `rsync --delete`, иначе каждый деплой стирает файлы на диске, пока в БД остаются ссылки.

## Git после деплоя

После успешного деплоя скрипт автоматически:

1. `git add -A` в `SOURCE_DIR`
2. коммит, если есть изменения (сообщение по умолчанию: `deploy: production sync <дата>`)
3. `git push -u origin <текущая-ветка>`

Операции выполняются от пользователя `APP_USER` (`user`), не от root. Нужен настроенный SSH-доступ к GitHub для этого пользователя.

### Примеры

```bash
# Обычный деплой + push
sudo bash deploy/deploy.sh

# Свой текст коммита
DEPLOY_COMMIT_MSG='fix: mobile bottom dock' sudo bash deploy/deploy.sh

# Деплой без отправки в Git
GIT_PUSH=0 sudo bash deploy/deploy.sh

# Падать с ошибкой, если push не удался (по умолчанию — только предупреждение)
GIT_PUSH_STRICT=1 sudo bash deploy/deploy.sh
```

### Переменные Git

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `GIT_PUSH` | `1` | `0` — не коммитить и не пушить |
| `GIT_REMOTE` | `origin` | Имя remote |
| `DEPLOY_COMMIT_MSG` | `deploy: production sync …` | Сообщение коммита |
| `GIT_COMMIT_USER_NAME` | `BarsLogistics Deploy` | Имя автора (только для этого коммита) |
| `GIT_COMMIT_USER_EMAIL` | `deploy@<DOMAIN>` | Email автора (только для этого коммита) |
| `GIT_PUSH_STRICT` | `0` | `1` — прервать деплой при ошибке push |

В репозиторий **не попадают** файлы из `.gitignore`: `.env`, `node_modules/`, `dist/`, `dist-embed/`, логи и т.д.

### Первичная настройка Git на сервере

```bash
cd ~/BarsLogistics
git remote -v
ssh -T git@github.com   # проверка SSH-ключа пользователя user
git push -u origin main # один раз вручную, дальше — через deploy.sh
```

## Переменные окружения деплоя

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `DOMAIN` | `barslogistics.almaz-t.ru` | Домен сайта |
| `APP_USER` | `user` | Unix-пользователь приложения |
| `APP_DIR` | `/opt/barslogistics` | Каталог prod-приложения |
| `SOURCE_DIR` | каталог над `deploy/` | Исходники для rsync |
| `CERTS_DIR` | `/home/user/Сертификаты` | `almaz-t.ru.crt`, `.key`, intermediate |
| `DB_NAME` | `barslogistics` | Имя БД PostgreSQL |
| `DB_USER` | `barslogistics` | Пользователь БД |
| `PORT` | `3000` | Порт Node.js (за nginx) |
| `NODE_MAJOR` | `22` | Версия Node.js |

Пример с переопределением:

```bash
DOMAIN=barslogistics.almaz-t.ru SOURCE_DIR=/home/user/BarsLogistics sudo bash deploy/deploy.sh
```

## Полезные команды

```bash
# Статус и логи
sudo systemctl status barslogistics
sudo journalctl -u barslogistics -f

# nginx
sudo nginx -t
sudo systemctl reload nginx

# PostgreSQL
sudo -u postgres psql -d barslogistics

# Health check
curl -fsS http://127.0.0.1:3000/api/health
curl -kfsS https://127.0.0.1/api/health -H 'Host: barslogistics.almaz-t.ru'
```

## Портал (WordPress embed)

После `npm run build:all` в `dist/` появляется **`index-portal.html`**.  
URL для плагина портала:

```
https://barslogistics.almaz-t.ru/index-portal.html
```

Подробнее: [docs/PORTAL_INTEGRATION.md](../docs/PORTAL_INTEGRATION.md).

## Ручные импорты данных

На деплое **не выполняются** автоматически:

```bash
cd /opt/barslogistics
npm run import:our-sites    # только при изменении CSV «Наши площадки»
```

Каталог площадок в PostgreSQL обновляется миграциями (`seed_sites_catalog.sql`, `ON CONFLICT DO NOTHING`).

## Структура `deploy/`

```
deploy/
├── deploy.sh                 # основной скрипт деплоя
├── apply-postgres-migrations.ts
├── nginx/
│   ├── barslogistics.conf
│   └── 00-websocket-map.conf
├── systemd/
│   └── barslogistics.service
├── postgres/                 # SQL-миграции и seed
└── …                         # утилиты импорта, geocode и т.д.
```

## Устранение неполадок

**`postgresql not running` / `Transport endpoint is not connected`**  
Часто ложная ошибка `systemctl` сразу после restart. Скрипт дополнительно проверяет `pg_isready` и `psql`. Если БД жива — деплой продолжается.

**Git push failed**  
- Проверьте `ssh -T git@github.com` под пользователем `user`
- Убедитесь, что `git remote -v` указывает на `github.com:…`
- При необходимости: `GIT_PUSH=0` для деплоя без push, затем `git push` вручную

**App API check failed**  
```bash
sudo systemctl restart barslogistics
sudo journalctl -u barslogistics -n 50
```

**HTTPS proxy check failed**  
DNS может ещё не указывать на сервер; локально проверяйте с заголовком `Host: barslogistics.almaz-t.ru`.

## Учётные записи по умолчанию

Пароль — в `/opt/barslogistics/.env` → `DEFAULT_USER_PASSWORD` (только при первом создании `.env`).

| Логин | Роль |
|-------|------|
| `admin` | Администратор |
| `keyperson` | Ключевое лицо |
| `manager` | Менеджер |
| `sitemanager` | Руководитель площадки |
| `employee` | Локальный сотрудник |
