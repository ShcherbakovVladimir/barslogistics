import type { Request, Response, NextFunction } from "express";

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function parseOriginList(raw: string | undefined): string[] {
  return raw?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}

/** RFC1918 / link-local / localhost — for LAN testing from phones and other subnets. */
function isPrivateNetworkOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

function lanOriginsAllowed(): boolean {
  const flag = process.env.CORS_ALLOW_LAN?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  // Dev server: allow phones/tablets on the same Wi‑Fi without editing CORS_ORIGINS each time.
  return process.env.NODE_ENV !== "production";
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  const allowed = parseOriginList(process.env.CORS_ORIGINS);
  if (allowed.length > 0 && allowed.includes(origin)) return true;

  if (lanOriginsAllowed() && isPrivateNetworkOrigin(origin)) return true;

  if (process.env.NODE_ENV !== "production" && DEV_ORIGINS.includes(origin)) return true;

  return false;
}

function allowedOrigins(): string[] {
  const fromEnv = parseOriginList(process.env.CORS_ORIGINS);
  if (fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV !== "production") return DEV_ORIGINS;
  return [];
}

/** CORS for portal SPA calling barslogistics API cross-origin. Set CORS_ORIGINS in production. */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept, Accept-Language",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export { allowedOrigins, isPrivateNetworkOrigin };
