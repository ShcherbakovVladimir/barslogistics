# WebSocket protocol — BarsLogistics

## Connection

- **URL:** `wss://<host>/ws` (same origin in production)
- **Auth:** `Sec-WebSocket-Protocol: bearer.<JWT>` where JWT is from `POST /api/auth/login`
- **First message:** `{ "type": "INIT", "message": "..." }`

## Server → client events

| type | payload | notes |
|------|---------|-------|
| `INIT` | `{ message }` | Sent once after auth |
| `LIVE_TELEMETRY_UPDATE` | `{ shipments: [{ id, current_lat?, current_lng?, progress_pct?, speed_kmh?, status? }] }` | Batched GPS updates |
| `SHIPMENT_EVENT` | `{ shipment_id, event, shipment? }` | Timeline event; may include full shipment |
| `SHIPMENT_STATUS_UPDATE` | `{ shipment_id, status, delay_reason? }` | Status change |
| `CARGO_ARRIVED` | shipment-scoped | Arrival notification |
| `FACTORY_ADDED` | `{ factory }` | New map marker |
| `FACTORY_UPDATED` | `{ factory }` | Marker updated |
| `FACTORY_DELETED` | `{ factoryId }` | Marker removed |
| `MAP_DATA_IMPORTED` | counts | Bulk import finished |
| `PRODUCTS_UPDATED` | — | Refresh product catalog |
| `CARRIERS_UPDATED` | — | Refresh carriers |
| `SALES_MANAGERS_UPDATED` | — | Refresh managers |
| `SITES_MERGED` | `{ result }` | Site dedup merge |
| `CHAT_MESSAGE` | `{ conversation_id, message, participant_ids }` | New chat message for 1:1 conversation participants |
| `CHAT_READ` | `{ conversation_id, reader_id, participant_ids }` | Peer marked messages as read |
| `NOTIFICATION_NEW` | `{ notification }` | Persisted bell notification created for this user |
| `NOTIFICATION_UPDATED` | `{ notification }` | Notification marked read or soft-deleted |

## In-app notifications (bell)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List active notifications + unread count |
| `POST` | `/api/notifications/:id/read` | Mark one as read |
| `POST` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Soft-delete one |
| `DELETE` | `/api/notifications` | Soft-delete all |

Stored in PostgreSQL (`user_notifications`): `created` → `read_at` → `deleted_at`.

## Chat REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chat/users` | Directory of system users (excludes self) |
| `GET` | `/api/chat/conversations` | Conversation list with unread counts |
| `POST` | `/api/chat/conversations` | Open/create conversation `{ peer_id }` |
| `GET` | `/api/chat/conversations/:id/messages` | Message history |
| `POST` | `/api/chat/conversations/:id/messages` | Send text `{ body }` |
| `POST` | `/api/chat/conversations/:id/attachments` | Upload file (multipart `file`, optional `body`) |
| `POST` | `/api/chat/conversations/:id/read` | Mark incoming messages read |
| `GET` | `/api/chat/attachments/:id/download` | Download attachment |

Attachments are stored on the server filesystem (`CHAT_FILES_DIR`, default `./data/chat-files`). Metadata lives in PostgreSQL (`chat_*` tables).

## Web Push (offline notifications)

When the browser is fully closed, chat messages are delivered via **Web Push + VAPID**.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/push/vapid-public-key` | VAPID public key (`{ public_key, enabled }`; `enabled: false` if unset) |
| `POST` | `/api/push/subscribe` | Save browser push subscription (JWT required) |
| `DELETE` | `/api/push/subscribe` | Remove subscription (`{ endpoint }` optional) |

Server sends Web Push only when the recipient has **no active WebSocket** (browser closed or disconnected). Subscriptions are stored in `push_subscriptions`. Requires env:

- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with `npm run generate:vapid`
- `VAPID_SUBJECT` — `mailto:…` or site URL (defaults to `APP_URL`)

## Scoping

Messages are filtered by user role and assigned sites. Restricted users do not receive factories/shipments outside their scope.

## REST reference

OpenAPI spec: `/api/openapi.json`  
Swagger UI: `/api/docs` (requires JWT in session or Authorization header)
