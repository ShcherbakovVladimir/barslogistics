import crypto from "crypto";
import { promisify } from "util";
import type { IncomingMessage } from "http";
import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../src/types.js";
import { normalizeRole } from "../src/utils/permissions.js";
import type { Locale } from "../src/i18n/types.js";
import { getServerT } from "../src/i18n/translations.js";

const scryptAsync = promisify(crypto.scrypt);

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
}

export type AuthRequest = Request & {
  locale: Locale;
  st: ReturnType<typeof getServerT>;
  user: AuthUser;
};

const ROLE_LEVEL: Record<UserRole, number> = {
  local_employee: 1,
  site_manager: 2,
  manager: 3,
  key_person: 4,
  admin: 5,
};

const TOKEN_TTL_SEC = 12 * 60 * 60;

function tokenExpiresAtMs(exp: number): boolean {
  if (!exp) return true;
  // Legacy tokens stored exp in milliseconds; RFC 7519 uses Unix seconds.
  if (exp > 1e12) return Date.now() > exp;
  return Math.floor(Date.now() / 1000) > exp;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return secret;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  if (derived.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(derived, hashBuf);
}

export function signToken(user: AuthUser): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  }));
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");

  const header = parts[0];
  const payload = parts[1];
  const signature = parts[2];
  if (!header || !payload || !signature) throw new Error("Invalid token");
  const expected = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid signature");
  }

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
    sub: string;
    username: string;
    name: string;
    role: UserRole;
    email: string;
    exp: number;
  };

  if (tokenExpiresAtMs(data.exp)) {
    throw new Error("Token expired");
  }

  return {
    id: data.sub,
    username: data.username,
    name: data.name,
    role: normalizeRole(data.role),
    email: data.email,
  };
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

const MIN_DEFAULT_PASSWORD_LENGTH = 12;

/** Initial/sync password for seeded accounts — must be set via env (min 12 chars). */
export function getDefaultPassword(): string {
  const password = process.env.DEFAULT_USER_PASSWORD?.trim();
  if (!password) {
    throw new Error("DEFAULT_USER_PASSWORD environment variable is required");
  }
  if (password.length < MIN_DEFAULT_PASSWORD_LENGTH) {
    throw new Error(`DEFAULT_USER_PASSWORD must be at least ${MIN_DEFAULT_PASSWORD_LENGTH} characters`);
  }
  return password;
}

/** JWT for WebSocket upgrade: ?token=…, Authorization header, or Sec-WebSocket-Protocol bearer.<jwt> */
export function extractWebSocketToken(req: IncomingMessage): string | null {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const queryToken = url.searchParams.get("token")?.trim();
    if (queryToken) return queryToken;
  } catch {
    /* ignore malformed URL */
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const protocol = req.headers["sec-websocket-protocol"];
  if (typeof protocol === "string") {
    for (const part of protocol.split(",").map((p) => p.trim())) {
      if (part.startsWith("bearer.")) {
        return part.slice("bearer.".length);
      }
    }
  }

  return null;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

/** Resolve local HS256 JWT or portal JWT (requestchainrestproxy validate). */
export async function resolveAuthUser(token: string): Promise<AuthUser> {
  try {
    return verifyToken(token);
  } catch {
    const { authenticatePortalToken, isPortalAuthConfigured, PortalAuthError } = await import("./portalAuth.js");
    if (!isPortalAuthConfigured()) throw new Error("Invalid or expired token");
    try {
      return await authenticatePortalToken(token);
    } catch (error) {
      if (error instanceof PortalAuthError && error.code === "REJECTED") {
        throw error;
      }
      throw new Error("Invalid or expired token");
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  void resolveAuthUser(token)
    .then((user) => {
      (req as AuthRequest).user = user;
      next();
    })
    .catch((error) => {
      if (error?.name === "PortalAuthError" && error.code === "REJECTED") {
        const st = (req as AuthRequest).st ?? getServerT("ru");
        return res.status(403).json({ error: st("auth.rejected"), code: "REJECTED" });
      }
      res.status(401).json({ error: "Invalid or expired token" });
    });
}

export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user || ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function toPublicUser(user: AuthUser & {
  site_id?: string;
  assigned_site_ids?: string[];
  notifications_enabled?: boolean;
  email_verified?: boolean;
  account_status?: string;
  telegram_chat_id?: string;
  has_avatar?: boolean;
  avatar_version?: string;
}) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    notifications_enabled: user.notifications_enabled ?? true,
    site_id: user.site_id,
    assigned_site_ids: user.assigned_site_ids,
    email_verified: user.email_verified ?? true,
    account_status: user.account_status ?? "active",
    telegram_chat_id: user.telegram_chat_id,
    has_avatar: user.has_avatar ?? false,
    avatar_version: user.avatar_version,
  };
}

