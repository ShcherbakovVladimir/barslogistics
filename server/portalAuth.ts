import type { AuthUser } from "./auth.js";
import { normalizeRole } from "../src/utils/permissions.js";
import type { UserRole } from "../src/types.js";
import { ensurePortalUser } from "./repositories.js";

type PortalValidateData = {
  valid?: boolean;
  samaccountname?: string;
  role?: string;
  creator_id?: string;
  name?: string;
  displayName?: string;
};

type PortalAdAuthData = {
  token?: string;
  access_token?: string;
  jwt?: string;
  samaccountname?: string;
  role?: string;
  name?: string;
  displayName?: string;
};

export class PortalAuthError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_TOKEN" | "REJECTED" | "NOT_CONFIGURED" | "AD_FAILED" | "CREATE_FAILED" = "INVALID_TOKEN",
  ) {
    super(message);
    this.name = "PortalAuthError";
  }
}

const validateCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function getValidateUrl(): string | null {
  const url = process.env.AUTH_VALIDATE_URL?.trim()
    || process.env.VITE_AUTH_VALIDATE_URL?.trim()
    || "";
  return url || null;
}

function getAdAuthenticateUrl(): string | null {
  const explicit = process.env.AUTH_AD_URL?.trim();
  if (explicit) return explicit;

  const validate = getValidateUrl();
  if (validate?.includes("/auth/validate")) {
    return validate.replace(/\/auth\/validate\/?$/i, "/authenticate/ad");
  }

  const base = process.env.AUTH_PROXY_BASE?.trim()
    || process.env.VITE_AUTH_BASE?.trim()
    || "https://requestchainrestproxy.almaz-t.ru";
  return `${base.replace(/\/$/, "")}/v1/authenticate/ad`;
}

function mapPortalRole(portalRole: string | undefined): UserRole {
  const defaults: Record<string, UserRole> = {
    user: "local_employee",
    leader: "key_person",
    key_person: "key_person",
    manager: "manager",
    site_manager: "site_manager",
    admin: "admin",
    local_employee: "local_employee",
  };

  let custom: Record<string, string> = {};
  const raw = process.env.PORTAL_ROLE_MAP?.trim();
  if (raw) {
    try {
      custom = JSON.parse(raw) as Record<string, string>;
    } catch {
      console.warn("PORTAL_ROLE_MAP is not valid JSON — ignoring");
    }
  }

  const key = (portalRole || "").toLowerCase();
  if (custom[key]) return normalizeRole(custom[key]);
  if (defaults[key]) return defaults[key];
  return normalizeRole(process.env.PORTAL_DEFAULT_ROLE || "local_employee");
}

function parseValidatePayload(
  payload: Record<string, unknown>,
  ok: boolean,
): PortalValidateData | null {
  const nested = payload.data;
  if (nested && typeof nested === "object") {
    const data = nested as PortalValidateData;
    const username = data.samaccountname?.trim();
    if (username && (data.valid === true || (ok && data.valid !== false))) {
      return { ...data, valid: true, samaccountname: username };
    }
  }

  const top = payload as PortalValidateData;
  const topUsername = top.samaccountname?.trim();
  if (topUsername && (top.valid === true || (ok && top.valid !== false))) {
    return { ...top, valid: true, samaccountname: topUsername };
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payloadPart = parts[1];
  if (!payloadPart) return null;
  try {
    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (exp != null && exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractPortalJwt(data: PortalAdAuthData | undefined, payload: Record<string, unknown>): string | null {
  const fromData = data?.token || data?.access_token || data?.jwt;
  if (typeof fromData === "string" && fromData.trim()) return fromData.trim();
  const top = payload.token || payload.access_token || payload.jwt;
  if (typeof top === "string" && top.trim()) return top.trim();
  return null;
}

async function provisionFromPortalIdentity(input: {
  username: string;
  name: string;
  role: UserRole;
}): Promise<AuthUser> {
  try {
    const user = await ensurePortalUser(input);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email || "",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "REJECTED") {
      throw new PortalAuthError("REJECTED", "REJECTED");
    }
    if (msg === "CREATE_FAILED") {
      throw new PortalAuthError("CREATE_FAILED", "CREATE_FAILED");
    }
    throw error;
  }
}

/** Validate portal JWT and auto-provision local user (NOT public email registration). */
export async function authenticatePortalToken(token: string): Promise<AuthUser> {
  const cached = validateCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const validateUrl = getValidateUrl();
  if (!validateUrl) {
    throw new PortalAuthError("Portal auth validate URL is not configured", "NOT_CONFIGURED");
  }

  let validateRes: Response;
  try {
    validateRes = await fetch(validateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
      redirect: "follow",
      signal: AbortSignal.timeout(Number(process.env.AUTH_VALIDATE_TIMEOUT_MS || 8000)),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[portalAuth] validate fetch failed:", validateUrl, msg);
    throw new PortalAuthError(
      `Auth proxy unreachable (${msg}). Check /etc/hosts and internal network.`,
      "NOT_CONFIGURED",
    );
  }

  const payload = (await validateRes.json().catch(() => ({}))) as Record<string, unknown> & {
    error?: string;
  };

  let data = parseValidatePayload(payload, validateRes.ok);

  if (!data) {
    const jwtClaims = decodeJwtPayload(token);
    const claimUser = typeof jwtClaims?.samaccountname === "string"
      ? jwtClaims.samaccountname.trim()
      : "";
    if (claimUser && validateRes.ok) {
      data = {
        valid: true,
        samaccountname: claimUser,
        role: typeof jwtClaims?.role === "string" ? jwtClaims.role : undefined,
        name: typeof jwtClaims?.name === "string" ? jwtClaims.name : undefined,
      };
    }
  }

  if (!data?.samaccountname) {
    const detail = typeof payload.error === "string" ? payload.error : payload.details;
    console.warn(
      "[portalAuth] validate rejected token:",
      validateRes.status,
      detail || "(no details)",
    );
    throw new PortalAuthError(
      (typeof payload.error === "string" && payload.error) || "Invalid portal token",
      "INVALID_TOKEN",
    );
  }

  const username = data.samaccountname.trim();
  const role = mapPortalRole(data.role);
  const name = (data.displayName || data.name || username).trim();

  const authUser = await provisionFromPortalIdentity({ username, name, role });

  validateCache.set(token, { user: authUser, expiresAt: Date.now() + CACHE_TTL_MS });
  return authUser;
}

/** AD username/password → portal JWT → auto-provision (standalone «Портал» tab). */
export async function authenticatePortalAd(username: string, password: string): Promise<{
  portalToken: string;
  authUser: AuthUser;
}> {
  const adUrl = getAdAuthenticateUrl();
  if (!adUrl) {
    throw new PortalAuthError("Portal AD auth URL is not configured", "NOT_CONFIGURED");
  }

  const adRes = await fetch(adUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      password,
      samaccountname: username.trim(),
      samAccountName: username.trim(),
    }),
  });

  const payload = (await adRes.json().catch(() => ({}))) as {
    status?: string;
    data?: PortalAdAuthData;
    error?: string;
    message?: string;
  };

  const data = payload.data;
  const portalToken = extractPortalJwt(data, payload as Record<string, unknown>);

  if (!adRes.ok || !portalToken) {
    throw new PortalAuthError(
      payload.error || payload.message || "Portal AD authentication failed",
      "AD_FAILED",
    );
  }

  const authUser = await authenticatePortalToken(portalToken);
  return { portalToken, authUser };
}

export function isPortalAuthConfigured(): boolean {
  return Boolean(getValidateUrl());
}

export function isPortalAdLoginConfigured(): boolean {
  return Boolean(getAdAuthenticateUrl() && getValidateUrl());
}
