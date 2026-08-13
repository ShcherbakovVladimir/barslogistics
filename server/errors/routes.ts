import type { Express } from "express";
import { requireAuth, requireMinRole } from "../auth.js";
import { getErrorLogs } from "./logger.js";
import { handleRouteError } from "./handler.js";
import type { ErrorLogLevel, ErrorLogSource } from "../../src/types.js";

const LEVELS: ErrorLogLevel[] = ["error", "warn", "fatal"];
const SOURCES: ErrorLogSource[] = ["http", "unhandled", "process"];

function queryString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export function registerErrorLogRoutes(app: Express): void {
  app.get("/api/error-logs", requireAuth, requireMinRole("admin"), async (req, res) => {
    try {
      const levelRaw = queryString(req.query.level);
      const sourceRaw = queryString(req.query.source);
      const sortRaw = queryString(req.query.sort);
      const search = queryString(req.query.search).trim();
      const limitRaw = Number(queryString(req.query.limit));

      const level = LEVELS.includes(levelRaw as ErrorLogLevel) ? levelRaw as ErrorLogLevel : undefined;
      const source = SOURCES.includes(sourceRaw as ErrorLogSource) ? sourceRaw as ErrorLogSource : undefined;
      const sort = sortRaw === "oldest" ? "oldest" as const : "newest" as const;
      const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;

      const data = await getErrorLogs({
        search: search || undefined,
        level,
        source,
        sort,
        limit,
      });
      res.json({ status: "success", data });
    } catch (error) {
      handleRouteError(req, res, error, "GET /api/error-logs", "Database error");
    }
  });
}
