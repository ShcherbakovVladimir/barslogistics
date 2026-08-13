import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { getClientIp, type AuthRequest } from "../auth.js";
import { logAppError, markErrorLogged, normalizeError, wasErrorLogged } from "./logger.js";
import type { ErrorLogLevel, ErrorLogSource } from "../../src/types.js";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function requestUser(req: Request): { id: string | null; username: string | null } {
  const user = (req as AuthRequest).user;
  if (!user) return { id: null, username: null };
  return { id: user.id, username: user.username };
}

function requestRoute(req: Request, fallback?: string): string {
  const url = req.originalUrl || req.url || "";
  const path = url.split("?")[0] || "";
  return fallback || `${req.method} ${path}`;
}

export function statusFromError(error: unknown): number {
  if (error instanceof HttpError) return error.status;
  if (error && typeof error === "object") {
    const withStatus = error as { status?: unknown; statusCode?: unknown };
    if (typeof withStatus.status === "number") return withStatus.status;
    if (typeof withStatus.statusCode === "number") return withStatus.statusCode;
  }
  if (error instanceof SyntaxError) return 400;
  return 500;
}

function publicMessage(error: unknown, status: number, fallback: string): string {
  if (error instanceof HttpError) return error.message;
  if (status < 500 && error instanceof Error && error.message) return error.message;
  return fallback;
}

function shouldPersist(status: number, level: ErrorLogLevel): boolean {
  if (level === "fatal") return true;
  if (status >= 500) return true;
  return false;
}

export function handleRouteError(
  req: Request,
  res: Response,
  error: unknown,
  context: string,
  publicError = "Internal server error",
): void {
  const status = statusFromError(error);
  const user = requestUser(req);
  const route = requestRoute(req, context);
  const level: ErrorLogLevel = status >= 500 ? "error" : "warn";

  if (shouldPersist(status, level)) {
    void logAppError({
      error,
      level,
      source: "http",
      route,
      status_code: status,
      user_id: user.id,
      username: user.username,
      ip_address: getClientIp(req),
      meta: {
        method: req.method,
        path: req.path,
      },
    });
  } else {
    markErrorLogged(error);
  }

  if (!res.headersSent) {
    res.status(status >= 400 ? status : 500).json({
      error: publicMessage(error, status, publicError),
    });
  }
}

export const expressErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  handleRouteError(req, res, err, `${req.method} ${req.originalUrl || req.path}`, "Internal server error");
};

function captureFromConsole(args: unknown[]): void {
  const err = args.find((arg) => arg instanceof Error);
  if (wasErrorLogged(err)) return;

  const first = typeof args[0] === "string" ? args[0] : "";
  const httpMatch = first.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD) (\S+)/i);
  const normalized = err ? normalizeError(err) : { message: first.replace(/:$/, "") || "Error", stack: null };
  if (!normalized.message) return;

  const routeFromHttp = httpMatch
    ? `${httpMatch[1]!.toUpperCase()} ${httpMatch[2]!.replace(/:$/, "")}`
    : null;

  const source: ErrorLogSource = httpMatch ? "http" : "process";
  const contextLabel = first.replace(/:$/, "") || routeFromHttp;

  void logAppError({
    error: err,
    level: "error",
    source,
    message: normalized.message,
    stack: normalized.stack,
    route: routeFromHttp || contextLabel,
    status_code: httpMatch ? 500 : null,
    meta: contextLabel && contextLabel !== normalized.message ? { context: contextLabel } : null,
  });
}

let processHandlersInstalled = false;
let consoleBridgeInstalled = false;

export function installProcessErrorHandlers(): void {
  if (processHandlersInstalled) return;
  processHandlersInstalled = true;

  process.on("unhandledRejection", (reason) => {
    const normalized = normalizeError(reason);
    void logAppError({
      error: reason,
      level: "error",
      source: "unhandled",
      message: normalized.message,
      stack: normalized.stack,
      route: "unhandledRejection",
    });
  });

  process.on("uncaughtException", (error) => {
    const normalized = normalizeError(error);
    void Promise.race([
      logAppError({
        error,
        level: "fatal",
        source: "process",
        message: normalized.message,
        stack: normalized.stack,
        route: "uncaughtException",
      }),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      }),
    ]).finally(() => {
      process.exit(1);
    });
  });
}

/** Persist existing `console.error("METHOD /path:", error)` catches without rewriting every route. */
export function installConsoleErrorBridge(): void {
  if (consoleBridgeInstalled) return;
  consoleBridgeInstalled = true;

  const originalError = console.error.bind(console);
  console.error = ((...args: unknown[]) => {
    originalError(...args);
    const hasError = args.some((arg) => arg instanceof Error);
    const first = typeof args[0] === "string" ? args[0] : "";
    const looksLikeRoute = /^(GET|POST|PUT|PATCH|DELETE|HEAD) /i.test(first);
    if (!hasError && !looksLikeRoute) return;
    captureFromConsole(args);
  }) as typeof console.error;
}

export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((error) => {
      handleRouteError(req, res, error, `${req.method} ${req.path}`);
    });
  };
}
