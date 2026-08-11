/**
 * OpenAPI 3.0 document for BarsLogistics REST + WebSocket API.
 */
export function buildOpenApiDocument(baseUrl: string) {
  const bearerAuth = { bearerAuth: [] as string[] };
  const secured = { security: [bearerAuth] };

  const factorySchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      country: { type: "string", nullable: true },
      region: { type: "string", nullable: true },
      is_ours: { type: "boolean" },
    },
    required: ["id", "name", "latitude", "longitude"],
  };

  const supplyLinkSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      origin_id: { type: "string" },
      destination_id: { type: "string" },
      cargo_type: { type: "string" },
      volume: { type: "number" },
      status: { type: "string" },
      progress_pct: { type: "integer" },
    },
    required: ["id", "origin_id", "destination_id"],
  };

  const paginationParams = [
    { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 500, default: 50 } },
    { name: "search", in: "query", schema: { type: "string" } },
    { name: "all", in: "query", schema: { type: "boolean" }, description: "Return full unpaginated list (map bootstrap)" },
  ];

  const paginatedMeta = {
    type: "object",
    properties: {
      total: { type: "integer" },
      page: { type: "integer" },
      pageSize: { type: "integer" },
      totalPages: { type: "integer" },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "BarsLogistics API",
      version: "2.0.0",
      description: [
        "REST API with JWT authentication and role-based access control (RBAC).",
        "",
        "## WebSocket (`/ws`)",
        "",
        "Connect with `Sec-WebSocket-Protocol: bearer.<jwt>` (JWT from `POST /api/auth/login`).",
        "",
        "### Server → client message types",
        "",
        "| type | description |",
        "|------|-------------|",
        "| `INIT` | Connection acknowledged |",
        "| `LIVE_TELEMETRY_UPDATE` | Batch GPS updates `{ shipments: [{ id, current_lat, current_lng, progress_pct, speed_kmh, status }] }` |",
        "| `SHIPMENT_EVENT` | Shipment timeline event `{ shipment_id, event, shipment? }` |",
        "| `SHIPMENT_STATUS_UPDATE` | Status change `{ shipment_id, status, delay_reason? }` |",
        "| `FACTORY_ADDED` / `FACTORY_UPDATED` / `FACTORY_DELETED` | Map factory CRUD |",
        "| `CARGO_ARRIVED` | Arrival notification |",
        "| `MAP_DATA_IMPORTED` | Bulk import finished |",
        "| `PRODUCTS_UPDATED` / `CARRIERS_UPDATED` / `SALES_MANAGERS_UPDATED` | Directory refresh signals |",
        "",
        "Messages are filtered by user role and site scope.",
        "",
        "Interactive docs: [`/api/docs`](${baseUrl}/api/docs)",
      ].join("\n"),
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Factory: factorySchema,
        SupplyLink: supplyLinkSchema,
        Pagination: paginatedMeta,
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
    security: [bearerAuth],
    paths: {
      "/api/auth/login": {
        post: {
          summary: "Login — obtain JWT",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "JWT token and user profile" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          summary: "Current authenticated user",
          ...secured,
          responses: { "200": { description: "User profile" } },
        },
      },
      "/api/map/bootstrap": {
        get: {
          summary: "Map bootstrap — scoped factories + supply links in one request",
          ...secured,
          responses: {
            "200": {
              description: "Scoped map data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          factories: { type: "array", items: factorySchema },
                          supplyLinks: { type: "array", items: supplyLinkSchema },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/factories": {
        get: {
          summary: "List factories (paginated or ?all=true for map)",
          parameters: paginationParams,
          ...secured,
          responses: {
            "200": {
              description: "Factory list with optional pagination metadata",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      data: { type: "array", items: factorySchema },
                      pagination: paginatedMeta,
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create factory (admin)",
          ...secured,
          responses: { "201": { description: "Created factory" } },
        },
      },
      "/api/factories/{id}": {
        put: {
          summary: "Update factory (manager+)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          ...secured,
          responses: { "200": { description: "Updated factory" } },
        },
        delete: {
          summary: "Delete factory (admin)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          ...secured,
          responses: { "200": { description: "Deleted" } },
        },
      },
      "/api/supply-links": {
        get: {
          summary: "List shipments / supply links",
          parameters: [
            ...paginationParams,
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          ...secured,
          responses: { "200": { description: "Shipment list" } },
        },
      },
      "/api/supply-links/{id}/status": {
        put: {
          summary: "Update shipment status (dispatcher+)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          ...secured,
          responses: { "200": { description: "Updated shipment" } },
        },
      },
      "/api/carriers": {
        get: {
          summary: "Carrier directory",
          parameters: paginationParams,
          ...secured,
          responses: { "200": { description: "Carriers" } },
        },
        post: {
          summary: "Add carrier (admin)",
          ...secured,
          responses: { "201": { description: "Created carrier" } },
        },
      },
      "/api/products": {
        get: {
          summary: "Product catalog",
          parameters: [{ name: "all", in: "query", schema: { type: "boolean" } }],
          ...secured,
          responses: { "200": { description: "Products" } },
        },
      },
      "/api/backups": {
        get: {
          summary: "List backups (admin)",
          ...secured,
          responses: { "200": { description: "Backup metadata list" } },
        },
      },
      "/api/backups/create": {
        post: {
          summary: "Create manual backup (admin)",
          ...secured,
          responses: { "200": { description: "New backup" } },
        },
      },
      "/api/backups/{id}/restore": {
        post: {
          summary: "Restore database from backup (admin, destructive)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          ...secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["confirm"],
                  properties: {
                    confirm: { type: "string", enum: ["RESTORE"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Database restored" },
            "503": { description: "psql not available" },
          },
        },
      },
      "/api/integrations/external": {
        get: {
          summary: "Integration overview for developers",
          ...secured,
          responses: { "200": { description: "REST + WebSocket integration summary" } },
        },
      },
      "/ws": {
        get: {
          summary: "WebSocket upgrade — real-time telemetry and events",
          description: "Use `Sec-WebSocket-Protocol: bearer.<jwt>`. See info.description for message types.",
          ...secured,
          responses: { "101": { description: "Switching Protocols" } },
        },
      },
    },
  };
}
