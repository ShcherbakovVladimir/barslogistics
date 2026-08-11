# Интеграция React-приложения с порталом Барса

Документ для команды **barslogistics.almaz-t.ru**: как собрать и настроить приложение, чтобы оно работало внутри портала по адресу:

**https://portal.almaz-t.ru/bars/logistics/**

Портал (WordPress, плагин `bars-portal`) уже реализует:

- шапку и футер Барса;
- вход через Active Directory (`requestchainrestproxy.almaz-t.ru`);
- httpOnly-cookie с JWT;
- подключение Vite-сборки через proxy `/bars/logistics/assets/`;
- embed-layout (`--bars-app-height`, `embed: true`) — bars-portal ≥ 1.0.11.

React-приложение остаётся на своём сервере; перенос на сервер портала **не требуется**.

---

## Архитектура

```text
portal.almaz-t.ru/bars/logistics/
├── [WordPress] Шапка / навигация / футер
├── [WordPress] Форма входа AD (если нет JWT)
├── [React]     Монтируется в #root
└── /bars/logistics/assets/*  ──proxy──►  barslogistics.almaz-t.ru/assets/*
```

```text
Авторизация:
  Браузер → requestchainrestproxy (AD login) → JWT
  JWT     → POST /bars/wp-json/bars-auth/v1/session → cookie bars_jwt
  React   → window.__BARS_PORTAL__.token или GET .../token
  API     → barslogistics.almaz-t.ru/api  +  Authorization: Bearer <jwt>
  Backend → POST requestchainrestproxy/v1/auth/validate
```

---

## Что сделано в этом репозитории

| Компонент | Файл / место |
|-----------|----------------|
| Vite standalone + embed + `index-portal.html` | `vite.config.ts`, `scripts/merge-portal-embed.sh`, `deploy.sh` → `npm run build:all` |
| `.env.production` (`VITE_API_BASE`, validate URL) | `.env.production` |
| Mount `#root` + optional `VITE_DEV_JWT` bootstrap + `portal-embed` | `src/main.tsx` |
| `window.__BARS_PORTAL__` types (`embed`, `shell`) | `src/types/portal.ts` |
| Token / apiBase / WS / `applyPortalEmbedClass` | `src/auth/portalAuth.ts` |
| ApiService: portal token + absolute API base | `src/services/api.ts` |
| Без LoginPage на портале; logout → portal logout + reload | `src/App.tsx` |
| Embed CSS + `--bars-app-height` / `--bars-viewport-height` | `src/index.css`, `src/utils/portalShell.ts` |
| Shell resize listener | `subscribePortalShellResize()` in `src/main.tsx` |
| Compact viewport учитывает высоту контейнера на портале | `src/utils/viewport.ts` |
| Dual-auth: local JWT **или** portal validate | `server/auth.ts`, `server/portalAuth.ts` |
| Auto-provision пользователя по `samaccountname` | `ensurePortalUser` в `repositories.ts` |
| CORS для `portal.almaz-t.ru` | `server/cors.ts` |
| WS: та же dual-валидация JWT | `server.ts` |

Standalone (логин/пароль, `/api`, same-origin WS) **не сломан**: portal-ветка включается только при `window.__BARS_PORTAL__`.

---

## 1. Сборка Vite

Две production-сборки:

| Команда | `base` | Выход | Куда деплоить |
|---------|--------|-------|----------------|
| `npm run build` | `/` | `dist/` | **barslogistics.almaz-t.ru** (standalone) |
| `npm run build:embed` | `/bars/logistics/` | `dist-embed/` | **origin для портала** (proxy `/bars/logistics/assets/*`) |
| `npm run build:all` | обе | `dist/` + merge embed → **`dist/index-portal.html`** |

После `build:all` в `dist/assets/` лежат **оба** набора чанков (standalone + embed). Портал должен подключать **`index-portal.html`**, не `index.html`.

### Почему нужен embed-build

На портале страница живёт по URL `/bars/logistics/`. Standalone-сборка (`base: '/'`) прошивает lazy-chunks как `/assets/*.js`. Браузер запрашивает `portal.almaz-t.ru/assets/…` → **404** → `useMemo` / `useContext` on null (React #321).

Embed-сборка прошивает пути как `/bars/logistics/assets/*.js` — proxy портала отдаёт их с origin.

**`.env.embed`:**

```env
VITE_PORTAL_BASE=/bars/logistics/
VITE_API_BASE=https://barslogistics.almaz-t.ru/api
VITE_AUTH_VALIDATE_URL=https://requestchainrestproxy.almaz-t.ru/v1/auth/validate
```

После `npm run build:embed` в `dist-embed/index.html`:

```html
<script type="module" crossorigin src="/bars/logistics/assets/index-xxxxx.js"></script>
<link rel="stylesheet" crossorigin href="/bars/logistics/assets/index-xxxxx.css">
```

Деплой: `sudo bash deploy/deploy.sh` вызывает **`npm run build:all`** (merge embed assets автоматически).

Ручной деплoy embed после standalone:

```bash
npm run build:all
# или: npm run build && npm run build:embed && bash scripts/merge-portal-embed.sh
sudo systemctl restart barslogistics
```

PWA/service worker в embed-сборке **отключены** (на портале SW всё равно снимается в runtime).

sudo systemctl restart barslogistics
```

### Standalone

**`npm run build`** — `base: '/'`, PWA включён, выход `dist/`.

**`.env.production`:**

```env
VITE_API_BASE=https://barslogistics.almaz-t.ru/api
VITE_AUTH_VALIDATE_URL=https://requestchainrestproxy.almaz-t.ru/v1/auth/validate
```

После сборки в `dist/index.html`:

```html
<script type="module" crossorigin src="/assets/index-xxxxx.js"></script>
```

### Entry для WordPress (bars-portal)

Плагин должен загружать manifest с origin:

**`https://barslogistics.almaz-t.ru/index-portal.html`**

Не `/` и не `index.html`. В embed-entry:

```html
<script type="module" crossorigin src="/bars/logistics/assets/index-xxxxx.js"></script>
<link rel="stylesheet" crossorigin href="/bars/logistics/assets/index-xxxxx.css">
```

Proxy портала: `/bars/logistics/assets/*` → `barslogistics.almaz-t.ru/assets/*`.

> **Важно:** WordPress home = `https://portal.almaz-t.ru/bars`. В плагине нельзя делать `home_url('/bars/logistics/assets/…')` — получится `/bars/bars/logistics/…`. Нужно `home_url('/logistics/assets/…')` или абсолютный `/bars/logistics/assets/…`.

---

## 2. Basename / навигация

На портале URL начинается с `/bars/logistics`. Приложение использует вкладки (Redux), не `react-router`. Абсолютных `<a href="/…">` нет. `getPortalBasename()` готов для будущего роутера.

---

## 3. Точка монтирования

Портал рендерит:

```html
<div class="bars-logistics__app" id="logistics-root">
  <div id="root">
    <div class="bars-logistics__placeholder">Загрузка карты логистики…</div>
  </div>
</div>
```

**Монтируйте в `#root`**, не в `#logistics-root`.

---

## Layout внутри оболочки портала (embed)

На standalone — весь viewport (`html, body, #root { height: 100% }`, `.app-shell { height: 100dvh }`).

На портале сверху/снизу шапка и футер WP. Если React держит `100dvh` / `min-h-screen`, страница скроллится и футер «уезжает».

### Что делает портал (bars-portal ≥ 1.0.11)

1. Блокирует прокрутку body — `height: 100dvh; overflow: hidden`.
2. Flex-цепочка `body` → `.l-canvas` → `.bars-logistics__app` → `#root`.
3. CSS-переменная `--bars-app-height` (уточнение через `js/embed-layout.js`).
4. `react-shield.css` — перебивает `.app-shell { height: 100dvh }` на `height: 100%` внутри `#root`.
5. Событие `bars-portal:shell-resize` с `{ appHeight, headerHeight?, footerHeight? }` — React слушает в `src/utils/portalShell.ts` и обновляет `--bars-app-height` / `--layout-vh`.

### Bootstrap: флаг embed

```javascript
window.__BARS_PORTAL__ = {
  // … apiBase, token, user …
  embed: true,
  shell: {
    appHeightVar: '--bars-app-height',
    headerVar: '--bars-shell-top',
    footerVar: '--bars-footer-h',
  },
};
```

### Реализация в React (сделано)

- При старте: `applyPortalEmbedClass()` → `html.portal-embed`.
- `subscribePortalShellResize()` — слушает `bars-portal:shell-resize` (debounce 50ms); layout-классы обновляются в rAF, **без ResizeObserver на `#root`**. На embed: SW отключён, `#root` очищается до mount, `ShipmentsList` без lazy.
- CSS: `.app-shell`, модалки, drawer используют `var(--bars-viewport-height)` (= `--bars-app-height` на портале, `--layout-vh` standalone).
- **Overlay-модалки** (`position: fixed` → `absolute` внутри `.app-shell` при `portal-embed`) — затемнение и sheet не выходят за слот логистики.
- `#chat-portal-root` монтируется внутри `.app-shell` (не в `body`).

| Standalone | Embed на портале |
|------------|------------------|
| `.app-shell { height: 100dvh }` | `height: var(--bars-app-height, 100%)` |
| `min-h-screen` | `h-full min-h-0` |
| `max-h` от `100dvh` | `calc(var(--bars-app-height) - …)` |

Прокрутка только внутри панелей (`.scroll-area`, модалки), не на `body` / `#root` портала.

### Событие `bars-portal:shell-resize` (для команды портала)

Портал должен диспатчить при изменении высоты слота (resize окна, смена ориентации, показ/скрытие WP chrome):

```javascript
function notifyLogisticsShellResize(appHeight, headerHeight, footerHeight) {
  window.dispatchEvent(
    new CustomEvent('bars-portal:shell-resize', {
      detail: { appHeight, headerHeight, footerHeight },
    }),
  );
}

// пример: после embed-layout.js (≥ 1.0.26) — высота .bars-logistics__app, не #root
notifyLogisticsShellResize(appShellEl.clientHeight, headerPx, footerPx);
```

React (`subscribePortalShellResize`) обновит `--bars-app-height`, `--layout-vh` и пересчитает compact/map chrome. **Не** наблюдайте `#root` через ResizeObserver — только событие от портала. `#root` должен быть пустым до `createRoot`, как на standalone.

Локальная проверка в DevTools на портале:

```javascript
window.dispatchEvent(new CustomEvent('bars-portal:shell-resize', { detail: { appHeight: 640 } }));
```

### Проверка

1. `https://portal.almaz-t.ru/bars/logistics/` — нет вертикальной прокрутки body.
2. Футер портала виден без scroll.
3. Карта и панели вписываются между шапкой и футером.
4. Standalone `https://barslogistics.almaz-t.ru/` не сломан (`portal-embed` только на портале).

---

## 4. Bootstrap от портала

```javascript
window.__BARS_PORTAL__ = {
  apiBase: "https://barslogistics.almaz-t.ru/api",
  authProxy: "/bars/wp-json/bars-auth/v1",
  authBase: "https://requestchainrestproxy.almaz-t.ru",
  basename: "/bars/logistics",
  token: "<jwt>",
  user: {
    samaccountname: "ivanov",
    role: "user",
    creator_id: "42"
  },
  embed: true,
  shell: {
    appHeightVar: "--bars-app-height",
    headerVar: "--bars-shell-top",
    footerVar: "--bars-footer-h"
  }
};
```

Типы: `src/types/portal.ts`.

---

## 5. Авторизация в React

Портал: AD-форма → session cookie → reload → `__BARS_PORTAL__.token`.

На портале **не** показывать свою LoginPage при наличии `window.__BARS_PORTAL__`.

Helpers: `src/auth/portalAuth.ts` (`getAuthToken`, `logoutFromPortal`, `getApiBase`, `getWebSocketUrl`).

HTTP: `src/services/api.ts` — Bearer + absolute `apiBase` на портале; 401 → `reload` на портале.

---

## 6. Backend API

- `Authorization: Bearer <jwt>` на защищённых маршрутах.
- Валидация: `POST …/v1/auth/validate` (`AUTH_VALIDATE_URL`).
- CORS: `CORS_ORIGINS` включает `https://portal.almaz-t.ru`.
- Dual-auth: локальный JWT или portal validate + `ensurePortalUser`.
- **Авто-регистрация портала** (это НЕ `POST /api/auth/register`):
  - Embed / plugin: `POST /api/auth/portal/sync` + `Authorization: Bearer <portal-jwt>`
  - Либо любой защищённый маршрут (`GET /api/auth/me`) с тем же Bearer — срабатывает `ensurePortalUser`
  - Standalone, вкладка «Портал»: `POST /api/auth/portal/login` `{ username, password }` → AD → JWT → provision
  - Публичный `POST /api/auth/register` — только email-регистрация; лимит **8/час** на IP

---

## 7. WebSocket

Портал WS не проксирует. `getWebSocketUrl(token)` → `wss://barslogistics.almaz-t.ru/ws?token=…`.

---

## 8. Частые ошибки

| Нельзя | Нужно |
|--------|-------|
| `base: './'` | `base: '/'`, каталог `assets/` |
| Hardcode URL assets | `/assets/...` через Vite |
| `home_url('/bars/logistics/assets/…')` | `home_url('/logistics/assets/…')` |
| Mount в `#logistics-root` | Mount в `#root` |
| Своя форма логина на портале | `__BARS_PORTAL__.token` |
| API через `/bars/logistics/api/` | `https://barslogistics.almaz-t.ru/api` + CORS |
| `.app-shell { 100dvh }` на портале | `var(--bars-app-height)` / `portal-embed` |

---

## 9. Локальная разработка

```bash
npm run dev
```

Эмуляция портала (`.env.local`, не коммитить):

```env
VITE_DEV_JWT=eyJ...
VITE_API_BASE=https://barslogistics.almaz-t.ru/api
```

При `VITE_DEV_JWT` bootstrap включает `embed: true` и `shell`.

---

## 10. Деплой

1. `npm run build` → `dist/`
2. Выложить на `barslogistics.almaz-t.ru` (`index.html`, `assets/*`)
3. Standalone + asset → 200
4. Портал: AD → карта; нет scroll body; футер виден
5. Кеш discovery assets на портале ~5 минут

---

## 11. REST API портала (справочно)

| Метод | URL | Назначение |
|-------|-----|------------|
| `POST` | `/bars/wp-json/bars-auth/v1/session` | JWT → cookie |
| `GET` | `/bars/wp-json/bars-auth/v1/token` | JWT для SPA |
| `POST` | `/bars/wp-json/bars-auth/v1/logout` | Выход |
| `POST` | `/bars/wp-json/bars-auth/v1/validate` | Прокси validate |
| `POST` | `https://barslogistics.almaz-t.ru/api/auth/portal/sync` | Auto-provision по portal JWT |
| `POST` | `https://barslogistics.almaz-t.ru/api/auth/portal/login` | AD login (standalone) |
| `GET` | `/bars/wp-json/bars-auth/v1/sso` | Kerberos SSO (stub) |

---

## 12. Apache на портале

```apache
ProxyPass        /bars/logistics/assets/  https://barslogistics.almaz-t.ru/assets/
ProxyPassReverse /bars/logistics/assets/  https://barslogistics.almaz-t.ru/assets/
```

---

## 13. Чеклист

- [x] Vite `base: '/'`, assets в `/assets/`
- [x] Mount `#root`
- [x] `Authorization: Bearer` + validate
- [x] CORS для portal
- [x] WebSocket `?token=`
- [x] Нет LoginPage на портале
- [x] Standalone работает
- [x] `portal-embed` + `var(--bars-app-height)` вместо `100dvh`
- [ ] На портале после деплоя: нет scroll body, футер виден

---

## Шпаргалка

```text
URL:       https://portal.almaz-t.ru/bars/logistics/
Mount:     #root
Vite base: /
Assets:    /assets/* → /bars/logistics/assets/* (proxy)
API:       https://barslogistics.almaz-t.ru/api (+ CORS)
Token:     __BARS_PORTAL__.token | GET .../bars-auth/v1/token
Embed:     __BARS_PORTAL__.embed + CSS var --bars-app-height
Validate:  POST requestchainrestproxy.../v1/auth/validate
```
