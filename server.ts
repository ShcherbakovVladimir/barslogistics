import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { Factory, SupplyLink, User, UserCreateInput, UserRole, UserUpdateInput, ShipmentEventInput, ShipmentEvent, ProductInput, CarrierInput, SalesManagerInput } from "./src/types.js";
import { getServerT } from "./src/i18n/translations.js";
import type { Locale } from "./src/i18n/types.js";
import { initDatabase, pool } from "./server/db.js";
import {
  requireAuth,
  requireMinRole,
  signToken,
  toPublicUser,
  getClientIp,
  resolveAuthUser,
  extractWebSocketToken,
  extractBearerToken,
  type AuthRequest,
} from "./server/auth.js";
import { corsMiddleware } from "./server/cors.js";
import { PortalAuthError } from "./server/portalAuth.js";
import {
  seedDatabaseIfEmpty,
  seedUsersIfEmpty,
  ensureUserPasswords,
  authenticateUser,
  getAllFactories,
  getAllFactoriesAdmin,
  getFactoriesPaginated,
  getSiteCategories,
  createFactory,
  updateFactory,
  deleteFactory,
  getAllSupplyLinks,
  getSupplyLinksPaginated,
  getEventLogs,
  insertEventLog,
  getAllUsers,
  getAllBackups,
  createShipment,
  getShipmentChangeLogs,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registerUser,
  confirmEmailByToken,
  requestPasswordReset,
  requestPasswordResetByUserId,
  resetPasswordByToken,
  updateSelfProfile,
  approveUser,
  rejectUser,
  getSupplyLinkById,
  getSupplyLinksByIds,
  updateSupplyLink,
  getShipmentEvents,
  getRecentShipmentEvents,
  getRecentShipmentEventsScoped,
  seedProductsIfEmpty,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllSalesManagers,
  createSalesManager,
  updateSalesManager,
  deleteSalesManager,
  getSalesManagerById,
  getCarriersPaginated,
} from "./server/repositories.js";
import {
  canCreateShipmentEvent,
  canViewShipmentEvents,
  recordShipmentEvent,
  recordStatusChangeEvent,
} from "./server/shipmentEvents.js";
import {
  getSiteDuplicatesReport,
  mergeSiteDuplicates,
} from "./server/siteDedup.js";
import { getAllCarriersDetailed, updateCarrierSettings, createCarrier, deleteCarrier, getCarrierByIdDetailed, buildCarrierIntegrationSpec } from "./server/integrations/carriers.js";
import {
  getTelegramSettingsMasked,
  updateTelegramSettings,
  getCloudSettingsMasked,
  updateCloudSettings,
  getTelegramSettings,
  getTelemetrySettingsMasked,
  updateTelemetrySettings,
  getTelemetrySettings,
  getMapDataSettingsMasked,
  updateMapDataSettings,
  getGeocodingSettingsMasked,
  updateGeocodingSettings,
  getMailSettingsMasked,
  updateMailSettings,
  getMailSettings,
} from "./server/integrations/settings.js";
import {
  testMailConnection,
  syncBuiltinSmtpServer,
  sendConfirmEmail,
  sendPasswordResetEmail,
  sendAccountApprovedEmail,
} from "./server/integrations/mail.js";
import {
  testGeocodingConnection,
  getKladrImportStatus,
  startKladrLocalImport,
} from "./server/integrations/geocodingService.js";
import { searchKladrSuggestions } from "./server/geocoding/kladrClient.js";
import { geocodeRussianAddress, reverseGeocodeRussianAddress } from "./server/geocoding/ruAddressGeocoder.js";
import { sendTelegramMessage, testTelegramConnection, maybeSendStatusAlert } from "./server/integrations/telegram.js";
import { testCloudConnection } from "./server/integrations/cloud.js";
import {
  createRealBackup,
  getBackupFilePath,
  uploadBackupToCloud,
  restoreBackupFromFile,
  startBackupScheduler,
  isPgDumpAvailable,
  isPsqlAvailable,
} from "./server/integrations/backup.js";
import {
  startTelemetryScheduler,
  runTelemetrySync,
  syncCarrierById,
  processTelemetryPoints,
  parseWebhookBody,
  verifyWebhookSecret,
  type TelemetryUpdate,
  type TelemetryTickResult,
} from "./server/integrations/telemetry.js";
import { checkEtaOverdueShipments } from "./server/etaCheck.js";
import { backfillSupplyLinkEtaAt } from "./server/etaBackfill.js";
import {
  filterFactoriesForUser,
  filterSupplyLinksForUser,
  personalizeWebSocketPayload,
  scopeSupplyLinkForUser,
  scopeSupplyLinksForUser,
  shouldDeliverWebSocketMessage,
  assertShipmentCreateInScope,
} from "./server/scoping.js";
import { pickFactoryUpdatePatch } from "./server/factoryUpdatePolicy.js";
import { parsePaginationQuery } from "./server/pagination.js";
import { buildOpenApiDocument } from "./server/openapi.js";
import { registerChatRoutes } from "./server/chat/routes.js";
import { registerPushRoutes } from "./server/push/routes.js";
import { registerNotificationRoutes } from "./server/notifications/routes.js";
import { registerTaskRoutes } from "./server/tasks/routes.js";
import { registerSupportRoutes } from "./server/support/routes.js";
import { registerShipmentLogisticsRoutes } from "./server/shipments/routes.js";
import { registerUserAvatarRoutes } from "./server/users/routes.js";
import { getUserAvatarFile } from "./server/users/avatars.js";
import fs from "fs";
import { setTaskBroadcast } from "./server/tasks/broadcast.js";
import { setChatBroadcast } from "./server/chat/broadcast.js";
import { setNotificationBroadcast } from "./server/notifications/service.js";
import {
  notifyShipmentCreated,
  notifyShipmentStatusChange,
} from "./server/notifications/personalEvents.js";
import { registerWsUser, unregisterWsUser } from "./server/wsPresence.js";
import {
  getMigrationDashboard,
  applyPendingMigrations,
  rollbackLastMigration,
} from "./server/applyMigrations.js";
import { DEPLOY_MIGRATION_SCOPES } from "./server/migrations.js";
import {
  importMapData,
  parseMapDataPayload,
  syncMapDataFromApi,
  getMapDataTemplate,
} from "./server/integrations/mapData.js";
import {
  importRzdAnalyticsCsv,
  getRzdAnalyticsSummary,
  getRzdAggregatedRoutes,
  getRzdAnalyticsRecords,
  getRzdImportBatches,
  getRzdFilterOptions,
} from "./server/rzdAnalytics/repository.js";
import { getStationDirectoryStats } from "./server/rzdAnalytics/stationDirectory.js";
import {
  importInternalShipmentsCsv,
  previewInternalShipmentsCsv,
  getShipmentImportBatches,
} from "./server/internalShipments/import.js";
import { getUserSiteIds, normalizeRole } from "./src/utils/permissions.js";
import { createHelmetMiddleware } from "./server/security/helmetConfig.js";
import {
  authRateLimiter,
  forgotPasswordRateLimiter,
  registerRateLimiter,
  portalSyncRateLimiter,
  telemetryWebhookRateLimiter,
} from "./server/security/rateLimit.js";
import {
  confirmEmailBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  updateMeBodySchema,
  validateBody,
  type ConfirmEmailBody,
  type ForgotPasswordBody,
  type LoginBody,
  type RegisterBody,
  type ResetPasswordBody,
  type UpdateMeBody,
} from "./server/security/validate.js";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set("trust proxy", 1);
app.use(corsMiddleware);
app.use(createHelmetMiddleware());
app.use(express.json({ limit: "15mb" }));

function parseLocale(acceptLanguage?: string): Locale {
  if (acceptLanguage?.toLowerCase().startsWith("en")) return "en";
  return "ru";
}

const defaultSt = getServerT("ru");

app.use((req, _res, next) => {
  const locale = parseLocale(req.headers["accept-language"] as string | undefined);
  (req as express.Request & { locale: Locale; st: ReturnType<typeof getServerT> }).locale = locale;
  (req as express.Request & { locale: Locale; st: ReturnType<typeof getServerT> }).st = getServerT(locale);
  next();
});

const CARRIER_I18N_KEYS: Record<string, string> = {
  c_rzd: "integrations.carriers.rzd",
  c_dellin: "integrations.carriers.dellin",
  c_fesco: "integrations.carriers.fesco",
  c_pgk: "integrations.carriers.pgk",
};

function getCarrierName(carrier: { id: string; name: string }, st: ReturnType<typeof getServerT>) {
  const key = CARRIER_I18N_KEYS[carrier.id];
  return key ? st(key) : carrier.name;
}

async function logEvent(
  req: AuthRequest,
  action: string,
  category: string,
  details: string
) {
  await insertEventLog({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    user_id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action,
    category: category as import("./src/types.js").EventLog["category"],
    details,
    ip_address: getClientIp(req),
  });
}

async function logSystemEvent(
  username: string,
  role: import("./src/types.js").UserRole,
  action: string,
  category: string,
  details: string
) {
  await insertEventLog({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    user_id: `u_${username}`,
    username,
    role,
    action,
    category: category as import("./src/types.js").EventLog["category"],
    details,
    ip_address: "127.0.0.1",
  });
}

type LocalizedRequest = express.Request & { locale: Locale; st: ReturnType<typeof getServerT> };

// --- Public routes ---

app.get("/api/health", async (_req, res) => {
  const payload: {
    status: string;
    authProxy?: { configured: boolean; reachable: boolean; status?: number; error?: string };
  } = { status: "ok" };

  const validateUrl = process.env.AUTH_VALIDATE_URL?.trim();
  if (validateUrl) {
    payload.authProxy = { configured: true, reachable: false };
    try {
      const r = await fetch(validateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: "{}",
        redirect: "follow",
        signal: AbortSignal.timeout(Number(process.env.AUTH_VALIDATE_TIMEOUT_MS || 5000)),
      });
      payload.authProxy.reachable = true;
      payload.authProxy.status = r.status;
    } catch (error) {
      payload.authProxy.error = error instanceof Error ? error.message : String(error);
      payload.status = "degraded";
    }
  } else {
    payload.authProxy = { configured: false, reachable: false };
  }

  res.status(payload.status === "ok" ? 200 : 503).json(payload);
});

app.post("/api/auth/login", authRateLimiter, validateBody(loginBodySchema), async (req, res) => {
  const { st } = req as LocalizedRequest;
  const { username, password } = req.body as LoginBody;

  try {
    const result = await authenticateUser(username, password);
    if (!result.ok) {
      const errorKey =
        result.code === "EMAIL_NOT_VERIFIED" ? "auth.emailNotVerified"
        : result.code === "PENDING_APPROVAL" ? "auth.pendingApproval"
        : result.code === "REJECTED" ? "auth.rejected"
        : "auth.loginFailed";
      return res.status(401).json({ error: st(errorKey), code: result.code });
    }

    const user = result.user;
    const authUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    };
    const token = signToken(authUser);

    await insertEventLog({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: user.id,
      username: user.username,
      role: user.role,
      action: st("server.logLogin"),
      category: "auth",
      details: st("server.logLoginDetails", { username: user.username, role: user.role }),
      ip_address: getClientIp(req),
    });

    res.json({
      status: "success",
      data: { token, user: toPublicUser({ ...authUser, ...user }) },
    });
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/** Portal JWT → auto-provision local user (NOT /api/auth/register). For embed + bars-portal plugin. */
app.post("/api/auth/portal/sync", portalSyncRateLimiter, async (req, res) => {
  const { st } = req as LocalizedRequest;
  const bodyToken = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const token = extractBearerToken(req) || bodyToken || null;
  if (!token) {
    return res.status(401).json({ error: st("auth.portalTokenMissing") });
  }
  try {
    const { authenticatePortalToken } = await import("./server/portalAuth.js");
    const authUser = await authenticatePortalToken(token);
    const user = await getUserById(authUser.id);
    res.json({
      status: "success",
      data: { user: user ?? toPublicUser(authUser) },
    });
  } catch (error) {
    if (error instanceof PortalAuthError) {
      if (error.code === "REJECTED") {
        return res.status(403).json({ error: st("auth.rejected"), code: "REJECTED" });
      }
      if (error.code === "NOT_CONFIGURED") {
        return res.status(503).json({ error: st("auth.portalNotConfigured") });
      }
      return res.status(401).json({ error: st("auth.portalLoginFailed"), code: error.code });
    }
    console.error("POST /api/auth/portal/sync:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/** Standalone: AD login via portal proxy → auto-provision (tab «Портал»). */
app.post("/api/auth/portal/login", authRateLimiter, validateBody(loginBodySchema), async (req, res) => {
  const { st } = req as LocalizedRequest;
  const { username, password } = req.body as LoginBody;
  try {
    const {
      authenticatePortalAd,
      isPortalAdLoginConfigured,
    } = await import("./server/portalAuth.js");
    if (!isPortalAdLoginConfigured()) {
      return res.status(503).json({ error: st("auth.portalNotConfigured") });
    }
    const { authUser } = await authenticatePortalAd(username, password);
    const fullUser = await getUserById(authUser.id);
    const token = signToken(authUser);

    await insertEventLog({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: authUser.id,
      username: authUser.username,
      role: authUser.role,
      action: st("auth.portalLoginLog"),
      category: "auth",
      details: st("auth.portalLoginLogDetails", { username: authUser.username, role: authUser.role }),
      ip_address: getClientIp(req),
    });

    res.json({
      status: "success",
      data: {
        token,
        user: fullUser ?? toPublicUser(authUser),
      },
    });
  } catch (error) {
    if (error instanceof PortalAuthError) {
      if (error.code === "REJECTED") {
        return res.status(403).json({ error: st("auth.rejected"), code: "REJECTED" });
      }
      if (error.code === "AD_FAILED") {
        return res.status(401).json({ error: st("auth.portalLoginFailed"), code: "AD_FAILED" });
      }
      if (error.code === "NOT_CONFIGURED") {
        return res.status(503).json({ error: st("auth.portalNotConfigured") });
      }
      return res.status(401).json({ error: st("auth.portalLoginFailed"), code: error.code });
    }
    console.error("POST /api/auth/portal/login:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/auth/register", registerRateLimiter, validateBody(registerBodySchema), async (req, res) => {
  const { st, locale } = req as LocalizedRequest;
  try {
    const mail = await getMailSettings();
    if (!mail.registration_enabled) {
      return res.status(403).json({ error: st("auth.registrationDisabled") });
    }
    if (!mail.enabled) {
      return res.status(503).json({ error: st("auth.mailNotConfigured") });
    }

    const { username, name, email, password } = req.body as RegisterBody;

    const { user, confirmToken } = await registerUser({
      username,
      name,
      email,
      password,
    });

    try {
      await sendConfirmEmail(user.email, confirmToken, locale);
    } catch (mailErr) {
      console.error("sendConfirmEmail:", mailErr);
      return res.status(503).json({ error: st("auth.mailSendFailed") });
    }

    await insertEventLog({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: user.id,
      username: user.username,
      role: user.role,
      action: st("auth.registeredLog"),
      category: "auth",
      details: st("auth.registeredLogDetails", { username: user.username, email: user.email }),
      ip_address: getClientIp(req),
    });

    res.status(201).json({
      status: "success",
      data: { message: st("auth.registerCheckEmail") },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "USERNAME_TAKEN") return res.status(409).json({ error: st("auth.usernameTaken") });
    if (msg === "EMAIL_TAKEN") return res.status(409).json({ error: st("auth.emailTaken") });
    if (msg === "PASSWORD_WEAK") return res.status(400).json({ error: st("auth.passwordWeak") });
    if (msg === "VALIDATION") return res.status(400).json({ error: st("auth.validationRequired") });
    console.error("POST /api/auth/register:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/auth/confirm-email", authRateLimiter, validateBody(confirmEmailBodySchema), async (req, res) => {
  const { st } = req as LocalizedRequest;
  const { token } = req.body as ConfirmEmailBody;
  try {
    const user = await confirmEmailByToken(token);
    if (!user) {
      return res.status(400).json({ error: st("auth.invalidOrExpiredToken") });
    }
    res.json({
      status: "success",
      data: {
        message: user.account_status === "pending"
          ? st("auth.confirmPendingApproval")
          : st("auth.confirmSuccess"),
        account_status: user.account_status,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/confirm-email:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/auth/forgot-password", forgotPasswordRateLimiter, validateBody(forgotPasswordBodySchema), async (req, res) => {
  const { st, locale } = req as LocalizedRequest;
  const { email } = req.body as ForgotPasswordBody;
  const neutral = { status: "success", data: { message: st("auth.forgotSent") } };

  try {
    const mail = await getMailSettings();
    if (!mail.enabled) {
      return res.json(neutral);
    }
    const result = await requestPasswordReset(email);
    if (result) {
      try {
        await sendPasswordResetEmail(result.user.email, result.resetToken, locale);
      } catch (mailErr) {
        console.error("sendPasswordResetEmail:", mailErr);
      }
    }
    res.json(neutral);
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/auth/reset-password", authRateLimiter, validateBody(resetPasswordBodySchema), async (req, res) => {
  const { st } = req as LocalizedRequest;
  const { token, password } = req.body as ResetPasswordBody;
  try {
    const user = await resetPasswordByToken(token, password);
    if (!user) {
      return res.status(400).json({ error: st("auth.invalidOrExpiredToken") });
    }
    res.json({ status: "success", data: { message: st("auth.resetSuccess") } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PASSWORD_WEAK") return res.status(400).json({ error: st("auth.passwordWeak") });
    console.error("POST /api/auth/reset-password:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const authUser = (req as AuthRequest).user;
    const user = await getUserById(authUser.id);
    res.json({ status: "success", data: user ?? toPublicUser(authUser) });
  } catch (error) {
    console.error("GET /api/auth/me:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/auth/me", requireAuth, validateBody(updateMeBodySchema), async (req, res) => {
  const { st } = req as AuthRequest;
  const authUser = (req as AuthRequest).user;
  const body = req.body as UpdateMeBody;
  try {
    const updated = await updateSelfProfile(authUser.id, {
      name: body.name,
      telegram_chat_id: body.telegram_chat_id,
      notifications_enabled: body.notifications_enabled,
    });
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ status: "success", data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "VALIDATION") return res.status(400).json({ error: st("auth.validationRequired") });
    console.error("PUT /api/auth/me:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post(
  "/api/auth/me/request-password-reset",
  requireAuth,
  forgotPasswordRateLimiter,
  async (req, res) => {
    const { st, locale } = req as AuthRequest;
    const authUser = (req as AuthRequest).user;
    try {
      const user = await getUserById(authUser.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.email?.trim()) {
        return res.status(400).json({ error: st("account.noEmail") });
      }

      const mail = await getMailSettings();
      if (!mail.enabled) {
        return res.status(503).json({ error: st("auth.mailNotConfigured") });
      }

      const result = await requestPasswordResetByUserId(user.id);
      if (!result) {
        return res.status(400).json({ error: st("account.passwordResetFailed") });
      }

      try {
        await sendPasswordResetEmail(result.user.email, result.resetToken, locale);
      } catch (mailErr) {
        console.error("sendPasswordResetEmail (me):", mailErr);
        return res.status(502).json({ error: st("auth.mailSendFailed") });
      }

      res.json({
        status: "success",
        data: {
          message: st("account.passwordResetSent", { email: result.user.email }),
        },
      });
    } catch (error) {
      console.error("POST /api/auth/me/request-password-reset:", error);
      res.status(500).json({ error: "Database error" });
    }
  },
);

app.get("/api/auth/registration-status", async (_req, res) => {
  try {
    const mail = await getMailSettings();
    res.json({
      status: "success",
      data: {
        registration_enabled: Boolean(mail.registration_enabled && mail.enabled),
      },
    });
  } catch (error) {
    console.error("GET /api/auth/registration-status:", error);
    res.status(500).json({ error: "Database error" });
  }
});
// --- Protected API routes ---

app.get("/api/map/bootstrap", requireAuth, async (req, res) => {
  try {
    const authUser = (req as AuthRequest).user;
    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });

    const [factories, supplyLinks] = await Promise.all([
      getAllFactories(),
      getAllSupplyLinks(),
    ]);
    const scopedLinks = scopeSupplyLinksForUser(supplyLinks, fullUser);
    const scopedFactories = filterFactoriesForUser(factories, scopedLinks, fullUser);
    res.json({
      status: "success",
      data: { factories: scopedFactories, supplyLinks: scopedLinks },
    });
  } catch (error) {
    console.error("GET /api/map/bootstrap:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/factories", requireAuth, async (req, res) => {
  try {
    const authUser = (req as AuthRequest).user;
    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });

    const pagination = parsePaginationQuery(req.query as Record<string, unknown>);

    if (pagination.all) {
      const [factories, supplyLinks] = await Promise.all([
        getAllFactories(),
        getAllSupplyLinks(),
      ]);
      const scopedLinks = filterSupplyLinksForUser(supplyLinks, fullUser);
      const data = filterFactoriesForUser(factories, scopedLinks, fullUser);
      return res.json({ status: "success", data });
    }

    const pageResult = await getFactoriesPaginated({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: pagination.search,
    });
    const scopedLinks = filterSupplyLinksForUser(await getAllSupplyLinks(), fullUser);
    const items = filterFactoriesForUser(pageResult.items, scopedLinks, fullUser);
    res.json({
      status: "success",
      data: items,
      pagination: {
        total: pageResult.total,
        page: pageResult.page,
        pageSize: pageResult.pageSize,
        totalPages: pageResult.totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/factories:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/factories", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const newFactory: Factory = req.body;
  if (!newFactory.id || !newFactory.name || !newFactory.latitude || !newFactory.longitude) {
    return res.status(400).json({ error: "Missing required factory fields" });
  }

  try {
    const created = await createFactory(newFactory);
    await logEvent(req as AuthRequest, st("server.logFactoryCreate"), "factory", st("server.logFactoryCreateDetails", { name: newFactory.name, type: newFactory.type }));
    broadcastWebSocket({ type: "FACTORY_ADDED", factory: created });
    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    console.error("POST /api/factories:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/factories/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st, user } = req as AuthRequest;
  const { id } = req.params;
  try {
    const patch = pickFactoryUpdatePatch(user.role, req.body as Partial<Factory>);
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No allowed fields to update" });
    }
    const updated = await updateFactory(id, patch);
    if (!updated) return res.status(404).json({ error: "Factory not found" });
    await logEvent(req as AuthRequest, st("server.logFactoryUpdate"), "factory", st("server.logFactoryUpdateDetails", { name: updated.name }));
    broadcastWebSocket({ type: "FACTORY_UPDATED", factory: updated });
    res.json({ status: "success", data: updated });
  } catch (error) {
    console.error("PUT /api/factories/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/factories/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;
  try {
    const result = await deleteFactory(id);
    if (!result.ok) return res.status(400).json({ error: result.error });
    await logEvent(req as AuthRequest, st("server.logFactoryDelete"), "factory", st("server.logFactoryDeleteDetails", { id }));
    broadcastWebSocket({ type: "FACTORY_DELETED", factoryId: id });
    res.json({ status: "success" });
  } catch (error) {
    console.error("DELETE /api/factories/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/site-categories", requireAuth, async (_req, res) => {
  try {
    const data = await getSiteCategories();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/site-categories:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/products", requireAuth, async (req, res) => {
  try {
    const all = req.query.all === "1" || req.query.all === "true";
    const data = await getAllProducts(!all);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/products", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const body = req.body as ProductInput;
  if (!body.id?.trim() || !body.name_ru?.trim() || !body.name_en?.trim()) {
    return res.status(400).json({ error: st("products.validationRequired") });
  }
  if (!/^[a-z][a-z0-9_]{1,48}$/.test(body.id.trim())) {
    return res.status(400).json({ error: st("products.invalidId") });
  }

  try {
    const existing = await getProductById(body.id.trim());
    if (existing) return res.status(409).json({ error: st("products.idExists") });

    const created = await createProduct({
      id: body.id.trim(),
      name_ru: body.name_ru,
      name_en: body.name_en,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });
    await logEvent(req as AuthRequest, st("products.logCreate"), "import", `${created.name_ru} (${created.id})`);
    broadcastWebSocket({ type: "PRODUCTS_UPDATED" });
    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    console.error("POST /api/products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/products/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;
  const body = req.body as Partial<ProductInput>;

  try {
    const updated = await updateProduct(id, body);
    if (!updated) return res.status(404).json({ error: st("products.notFound") });
    await logEvent(req as AuthRequest, st("products.logUpdate"), "import", `${updated.name_ru} (${updated.id})`);
    broadcastWebSocket({ type: "PRODUCTS_UPDATED" });
    res.json({ status: "success", data: updated });
  } catch (error) {
    console.error("PUT /api/products/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/products/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;

  try {
    const result = await deleteProduct(id);
    if (!result.ok) return res.status(404).json({ error: result.error || st("products.notFound") });
    await logEvent(req as AuthRequest, st("products.logDelete"), "import", id);
    broadcastWebSocket({ type: "PRODUCTS_UPDATED" });
    res.json({ status: "success", soft: result.soft ?? false });
  } catch (error) {
    console.error("DELETE /api/products/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/sales-managers", requireAuth, async (req, res) => {
  try {
    const all = req.query.all === "1" || req.query.all === "true";
    const data = await getAllSalesManagers(!all);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/sales-managers:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/sales-managers", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const body = req.body as SalesManagerInput;
  if (!body.id?.trim() || !body.last_name?.trim() || !body.first_name?.trim()) {
    return res.status(400).json({ error: st("managers.validationRequired") });
  }
  if (!/^[a-z][a-z0-9_]{1,48}$/.test(body.id.trim())) {
    return res.status(400).json({ error: st("managers.invalidId") });
  }

  try {
    const existing = await getSalesManagerById(body.id.trim());
    if (existing) return res.status(409).json({ error: st("managers.idExists") });

    const created = await createSalesManager({
      id: body.id.trim(),
      last_name: body.last_name,
      first_name: body.first_name,
      middle_name: body.middle_name,
      position: body.position,
      sort_order: body.sort_order,
      is_active: body.is_active,
    });
    await logEvent(req as AuthRequest, st("managers.logCreate"), "import", `${created.full_name} (${created.id})`);
    broadcastWebSocket({ type: "SALES_MANAGERS_UPDATED" });
    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    console.error("POST /api/sales-managers:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/sales-managers/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;
  const body = req.body as Partial<SalesManagerInput>;

  try {
    const updated = await updateSalesManager(id, body);
    if (!updated) return res.status(404).json({ error: st("managers.notFound") });
    await logEvent(req as AuthRequest, st("managers.logUpdate"), "import", `${updated.full_name} (${updated.id})`);
    broadcastWebSocket({ type: "SALES_MANAGERS_UPDATED" });
    res.json({ status: "success", data: updated });
  } catch (error) {
    console.error("PUT /api/sales-managers/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/sales-managers/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;

  try {
    const result = await deleteSalesManager(id);
    if (!result.ok) return res.status(404).json({ error: result.error || st("managers.notFound") });
    await logEvent(req as AuthRequest, st("managers.logDelete"), "import", id);
    broadcastWebSocket({ type: "SALES_MANAGERS_UPDATED" });
    res.json({ status: "success", soft: result.soft ?? false });
  } catch (error) {
    console.error("DELETE /api/sales-managers/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/sites/admin", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await getAllFactoriesAdmin();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/sites/admin:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/sites/duplicates", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await getSiteDuplicatesReport();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/sites/duplicates:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Database error" });
  }
});

app.post("/api/sites/preview-import", requireAuth, requireMinRole("admin"), async (_req, res) => {
  res.status(410).json({
    error: "CSV import is disabled. Site catalog is managed in PostgreSQL via Admin → Site directories.",
  });
});

app.post("/api/sites/merge-duplicates", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  try {
    const data = await mergeSiteDuplicates();
    await logEvent(
      req as AuthRequest,
      st("server.logSiteDedup"),
      "site_directory",
      st("server.logSiteDedupDetails", {
        groups: data.merged_groups,
        deactivated: data.deactivated,
        aliases: data.aliases,
      }),
    );
    broadcastWebSocket({ type: "SITES_MERGED", result: data });
    res.json({ status: "success", data });
  } catch (error) {
    console.error("POST /api/sites/merge-duplicates:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Merge failed" });
  }
});

app.post("/api/sites/import-csv", requireAuth, requireMinRole("admin"), async (_req, res) => {
  res.status(410).json({
    error: "CSV import is disabled. Site catalog is managed in PostgreSQL via Admin → Site directories.",
  });
});

app.get("/api/supply-links", requireAuth, async (req, res) => {
  try {
    const authUser = (req as AuthRequest).user;
    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });

    const pagination = parsePaginationQuery(req.query as Record<string, unknown>);
    const statusFilter = req.query.status ? String(req.query.status) : undefined;

    if (pagination.all) {
      const links = await getAllSupplyLinks();
      const data = scopeSupplyLinksForUser(links, fullUser);
      return res.json({ status: "success", data });
    }

    const pageResult = await getSupplyLinksPaginated({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: pagination.search,
      status: statusFilter,
    });
    const data = scopeSupplyLinksForUser(pageResult.items, fullUser);
    res.json({
      status: "success",
      data,
      pagination: {
        total: pageResult.total,
        page: pageResult.page,
        pageSize: pageResult.pageSize,
        totalPages: pageResult.totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/supply-links:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/shipments", requireAuth, requireMinRole("site_manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const authUser = (req as AuthRequest).user;
  const body = req.body as Record<string, unknown>;

  const required = ["origin_id", "destination_id", "product_id", "volume", "shipment_date", "status"];
  for (const field of required) {
    if (body[field] == null || body[field] === "") {
      return res.status(400).json({ error: st("myData.validationRequired") });
    }
  }

  try {
    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });

    const originId = String(body.origin_id);
    const destinationId = String(body.destination_id);
    const siteId = body.site_id ? String(body.site_id) : fullUser.site_id;

    if (!assertShipmentCreateInScope(
      { origin_id: originId, destination_id: destinationId, site_id: siteId },
      fullUser,
    )) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = `sh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let carrierName: string | undefined;
    let carrierId: string | undefined;
    if (body.carrier_id) {
      carrierId = String(body.carrier_id);
      const carrier = await getCarrierByIdDetailed(carrierId);
      carrierName = carrier?.name || String(body.carrier_name || "");
    } else if (body.carrier_name) {
      carrierName = String(body.carrier_name);
    }

    let salesManagerId: string | undefined;
    let managerName: string | undefined;
    if (body.sales_manager_id) {
      salesManagerId = String(body.sales_manager_id);
      const salesManager = await getSalesManagerById(salesManagerId);
      if (!salesManager) {
        return res.status(400).json({ error: st("managers.notFound") });
      }
      managerName = salesManager.full_name;
    }

    const link = {
      id,
      origin_id: originId,
      destination_id: destinationId,
      cargo_type: String(body.cargo_type || body.product_id),
      product_id: String(body.product_id),
      flow_type: body.flow_type as SupplyLink["flow_type"],
      volume: Number(body.volume),
      unit: String(body.unit || "т"),
      source: (body.source as SupplyLink["source"]) || "own",
      period: String(body.shipment_date).slice(0, 4),
      shipment_date: String(body.shipment_date),
      amount: body.amount != null ? Number(body.amount) : undefined,
      status: body.status as SupplyLink["status"],
      sales_manager_id: salesManagerId,
      manager_id: salesManagerId,
      manager_name: managerName,
      created_by: authUser.id,
      site_id: siteId,
      carrier_id: carrierId,
      carrier_name: carrierName,
    } satisfies Partial<SupplyLink> & { id: string };

    const created = await createShipment(link as SupplyLink, {
      user_id: authUser.id,
      username: authUser.username,
      action: "create",
      changes: JSON.stringify(body),
    });

    await logEvent(req as AuthRequest, st("myData.save"), "import", st("myData.colProduct") + `: ${created.cargo_type}`);
    broadcastWebSocket({ type: "MAP_DATA_IMPORTED", factories_count: 0, supply_links_count: 1 });
    void notifyShipmentCreated({
      shipment: created,
      actorUserId: authUser.id,
      actorName: fullUser.name || fullUser.username,
    });
    const visible = scopeSupplyLinkForUser(created, fullUser!);
    if (!visible) return res.status(403).json({ error: "Forbidden" });
    res.status(201).json({ status: "success", data: visible });
  } catch (error) {
    console.error("POST /api/shipments:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/shipments/import-csv", requireAuth, requireMinRole("site_manager"), async (req, res) => {
  const authReq = req as AuthRequest;
  const { csv, filename } = req.body as { csv?: string; filename?: string };
  if (!csv || typeof csv !== "string") {
    return res.status(400).json({ error: "csv is required" });
  }
  const name = filename && typeof filename === "string" ? filename : "import.csv";

  try {
    const fullUser = await getUserById(authReq.user!.id);
    if (!fullUser) return res.status(401).json({ error: "User not found" });
    const products = await getAllProducts(false);
    const result = await importInternalShipmentsCsv(csv, name, fullUser, products);

    if (!result.skipped_file && result.inserted > 0) {
      await logEvent(authReq, "Internal shipments CSV import", "import", `${name}: +${result.inserted}`);
      broadcastWebSocket({
        type: "MAP_DATA_IMPORTED",
        factories_count: result.counterparties_created,
        supply_links_count: result.inserted,
      });
    }

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/shipments/import-csv:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Import failed" });
  }
});

app.post("/api/shipments/preview-csv", requireAuth, requireMinRole("site_manager"), async (req, res) => {
  const authReq = req as AuthRequest;
  const { csv, filename } = req.body as { csv?: string; filename?: string };
  if (!csv || typeof csv !== "string") {
    return res.status(400).json({ error: "csv is required" });
  }
  const name = filename && typeof filename === "string" ? filename : "preview.csv";

  try {
    const fullUser = await getUserById(authReq.user!.id);
    if (!fullUser) return res.status(401).json({ error: "User not found" });
    const products = await getAllProducts(false);
    const result = await previewInternalShipmentsCsv(csv, name, fullUser, products);
    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/shipments/preview-csv:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Preview failed" });
  }
});

app.get("/api/shipments/import-batches", requireAuth, requireMinRole("site_manager"), async (_req, res) => {
  try {
    const data = await getShipmentImportBatches();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/shipments/import-batches:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/shipments/change-logs", requireAuth, requireMinRole("site_manager"), async (_req, res) => {
  try {
    const data = await getShipmentChangeLogs();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/shipments/change-logs:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/supply-links/:id", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const authUser = (req as AuthRequest).user;
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  try {
    const existing = await getSupplyLinkById(id);
    if (!existing) {
      return res.status(404).json({ error: "Supply link not found" });
    }

    if (body.origin_id != null && body.destination_id != null && String(body.origin_id) === String(body.destination_id)) {
      return res.status(400).json({ error: st("shipments.originDestSame") });
    }

    let cargoType = existing.cargo_type;
    if (body.product_id) {
      const product = await getProductById(String(body.product_id));
      if (!product) {
        return res.status(400).json({ error: st("products.notFound") });
      }
      cargoType = body.cargo_type ? String(body.cargo_type) : product.name_ru;
    } else if (body.cargo_type) {
      cargoType = String(body.cargo_type);
    }

    let carrierName = existing.carrier_name;
    let carrierId = existing.carrier_id;
    if (body.carrier_id !== undefined) {
      if (body.carrier_id) {
        carrierId = String(body.carrier_id);
        const carrier = await getCarrierByIdDetailed(carrierId);
        carrierName = carrier?.name || String(body.carrier_name || "");
      } else {
        carrierId = undefined;
        carrierName = body.carrier_name ? String(body.carrier_name) : undefined;
      }
    }

    let salesManagerId = existing.sales_manager_id;
    let managerName = existing.manager_name;
    let managerId = existing.manager_id;
    if (body.sales_manager_id !== undefined) {
      if (body.sales_manager_id) {
        salesManagerId = String(body.sales_manager_id);
        const salesManager = await getSalesManagerById(salesManagerId);
        if (!salesManager) {
          return res.status(400).json({ error: st("managers.notFound") });
        }
        managerName = salesManager.full_name;
        managerId = salesManagerId;
      } else {
        salesManagerId = undefined;
        managerName = undefined;
        managerId = undefined;
      }
    }

    const patch: Partial<SupplyLink> = {
      origin_id: body.origin_id != null ? String(body.origin_id) : existing.origin_id,
      destination_id: body.destination_id != null ? String(body.destination_id) : existing.destination_id,
      cargo_type: cargoType,
      product_id: body.product_id ? String(body.product_id) : existing.product_id,
      flow_type: (body.flow_type as SupplyLink["flow_type"]) ?? existing.flow_type,
      volume: body.volume != null ? Number(body.volume) : existing.volume,
      unit: body.unit ? String(body.unit) : existing.unit,
      source: (body.source as SupplyLink["source"]) ?? existing.source,
      shipment_date: body.shipment_date ? String(body.shipment_date) : existing.shipment_date,
      amount: body.amount != null && body.amount !== "" ? Number(body.amount) : existing.amount,
      status: (body.status as SupplyLink["status"]) ?? existing.status,
      site_id: body.site_id ? String(body.site_id) : existing.site_id,
      carrier_id: carrierId,
      carrier_name: carrierName,
      sales_manager_id: salesManagerId,
      manager_id: managerId,
      manager_name: managerName,
      driver_info: body.driver_info != null ? String(body.driver_info) : existing.driver_info,
      delay_reason: body.delay_reason != null ? String(body.delay_reason) : existing.delay_reason,
      eta: body.eta != null ? String(body.eta) : existing.eta,
    };

    const updated = await updateSupplyLink(id, patch, {
      user_id: authUser.id,
      username: authUser.username,
      action: "update",
      changes: JSON.stringify(body),
    });

    if (!updated) {
      return res.status(404).json({ error: "Supply link not found" });
    }

    await logEvent(req as AuthRequest, st("server.logRouteUpdate"), "route", st("server.logRouteUpdateDetails", { id }));

    broadcastWebSocket({
      type: "SHIPMENT_EVENT",
      shipment_id: id,
      shipment: updated,
      event: { id: `edit_${Date.now()}`, shipment_id: id, event_type: "edit" },
    });

    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
    const visible = scopeSupplyLinkForUser(updated, fullUser);
    if (!visible) return res.status(403).json({ error: "Forbidden" });
    res.json({ status: "success", data: visible });
  } catch (error) {
    if (error instanceof Error && error.message === "ORIGIN_DEST_SAME") {
      return res.status(400).json({ error: st("shipments.originDestSame") });
    }
    console.error("PUT /api/supply-links/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/supply-links/:id/status", requireAuth, requireMinRole("manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const authUser = (req as AuthRequest).user;
  const { id } = req.params;
  const { status, delay_reason } = req.body;

  try {
    const existing = await getSupplyLinkById(id);
    if (!existing) {
      return res.status(404).json({ error: "Supply link not found" });
    }

    const { event, shipment: link } = await recordStatusChangeEvent(
      id,
      status,
      { id: authUser.id, username: authUser.username, name: authUser.name },
      delay_reason,
    );

    const details = st("server.logRouteStatusDetails", {
      id,
      old: st(`status.${event.old_status || "en_route"}`),
      new: st(`status.${status}`)
    }) + (delay_reason ? st("server.logRouteReason", { reason: delay_reason }) : "");

    await logEvent(req as AuthRequest, st("server.logRouteStatus"), "route", details);

    void maybeSendStatusAlert({
      shipmentId: id,
      cargoType: link.cargo_type,
      status,
      delayReason: delay_reason,
    });

    broadcastWebSocket({
      type: "SHIPMENT_EVENT",
      shipment_id: id,
      event,
      shipment: link,
    });
    broadcastWebSocket({
      type: "SHIPMENT_STATUS_UPDATE",
      shipment_id: id,
      status,
      cargo_type: link.cargo_type,
      delay_reason: delay_reason,
      updated_at: link.last_updated,
      notification: {
        title: status === "delayed" ? st("notifications.shipmentDelayedTitle") : st("notifications.shipmentStatusTitle"),
        message: st("notifications.shipmentStatusMessage", {
          id: id.slice(0, 8),
          cargo: link.cargo_type,
          status: st(`status.${status}`)
        }),
        type: status === "delayed" ? "alert" : "info"
      }
    });

    void persistShipmentStatusNotifications({
      shipment: link,
      status,
      delayReason: delay_reason,
      actorUserId: authUser.id,
    });

    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });
    const visible = scopeSupplyLinkForUser(link, fullUser);
    if (!visible) return res.status(403).json({ error: "Forbidden" });
    res.json({ status: "success", data: visible, event });
  } catch (error) {
    console.error("PUT /api/supply-links/:id/status:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/shipments/events/recent", requireAuth, requireMinRole("site_manager"), async (req, res) => {
  try {
    const authUser = (req as AuthRequest).user;
    const fullUser = await getUserById(authUser.id);
    if (!fullUser) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const data =
      fullUser.role === "admin" || fullUser.role === "manager"
        ? await getRecentShipmentEvents(limit)
        : fullUser.role === "site_manager"
          ? await getRecentShipmentEventsScoped(limit, getUserSiteIds(fullUser))
          : [];

    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/shipments/events/recent:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/shipments/:id/events", requireAuth, async (req, res) => {
  const authUser = (req as AuthRequest).user;
  const { id } = req.params;
  try {
    const link = await getSupplyLinkById(id);
    if (!link) return res.status(404).json({ error: "Shipment not found" });
    const fullUser = await getUserById(authUser.id);
    if (!fullUser || !canViewShipmentEvents(fullUser, link)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = await getShipmentEvents(id, 200);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/shipments/:id/events:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/shipments/:id/events", requireAuth, requireMinRole("site_manager"), async (req, res) => {
  const { st } = req as AuthRequest;
  const authUser = (req as AuthRequest).user;
  const { id } = req.params;
  const body = req.body as ShipmentEventInput;

  try {
    const link = await getSupplyLinkById(id);
    if (!link) return res.status(404).json({ error: "Shipment not found" });
    const fullUser = await getUserById(authUser.id);
    if (!fullUser || !canCreateShipmentEvent(fullUser, link)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { event, shipment } = await recordShipmentEvent(
      id,
      body,
      { id: authUser.id, username: authUser.username, name: authUser.name },
    );

    const statusLabel = event.new_status ? st(`status.${event.new_status}`) : st(`shipmentEvents.types.${event.event_type}`);
    await logEvent(
      req as AuthRequest,
      st("shipmentEvents.logAction"),
      "route",
      st("shipmentEvents.logDetails", { id: id.slice(0, 8), type: statusLabel }),
    );

    if (event.new_status) {
      void maybeSendStatusAlert({
        shipmentId: id,
        cargoType: shipment.cargo_type,
        status: event.new_status,
        delayReason: event.delay_reason,
      });
    }

    broadcastWebSocket({ type: "SHIPMENT_EVENT", shipment_id: id, event, shipment });
    if (event.new_status) {
      broadcastWebSocket({
        type: "SHIPMENT_STATUS_UPDATE",
        shipment_id: id,
        status: event.new_status,
        cargo_type: shipment.cargo_type,
        delay_reason: event.delay_reason,
      });
      void persistShipmentStatusNotifications({
        shipment,
        status: event.new_status,
        delayReason: event.delay_reason,
        actorUserId: authUser.id,
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        event,
        shipment: scopeSupplyLinkForUser(shipment, fullUser) ?? shipment,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("POST /api/shipments/:id/events:", error);
    res.status(error instanceof Error && message.includes("required") ? 400 : 500).json({ error: message });
  }
});

function parseRzdFilters(query: express.Request['query']) {
  return {
    dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : undefined,
    dateTo: typeof query.dateTo === 'string' ? query.dateTo : undefined,
    cargoCode: typeof query.cargoCode === 'string' ? query.cargoCode : undefined,
    cargoSearch: typeof query.cargoSearch === 'string' ? query.cargoSearch : undefined,
    originRegion: typeof query.originRegion === 'string' ? query.originRegion : undefined,
    destRegion: typeof query.destRegion === 'string' ? query.destRegion : undefined,
    shipperSearch: typeof query.shipperSearch === 'string' ? query.shipperSearch : undefined,
    consigneeSearch: typeof query.consigneeSearch === 'string' ? query.consigneeSearch : undefined,
  };
}

app.get("/api/rzd-analytics/summary", requireAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const data = await getRzdAnalyticsSummary(parseRzdFilters(req.query));
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/rzd-analytics/summary:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rzd-analytics/routes", requireAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 500, 2000);
    const data = await getRzdAggregatedRoutes(parseRzdFilters(req.query), limit);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/rzd-analytics/routes:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rzd-analytics/records", requireAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 50, 200);
    const result = await getRzdAnalyticsRecords(parseRzdFilters(req.query), page, pageSize);
    res.json({ status: "success", data: result.records, total: result.total, page, pageSize });
  } catch (error) {
    console.error("GET /api/rzd-analytics/records:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rzd-analytics/batches", requireAuth, requireMinRole("manager"), async (_req, res) => {
  try {
    const data = await getRzdImportBatches();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/rzd-analytics/batches:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rzd-analytics/filter-options", requireAuth, requireMinRole("manager"), async (_req, res) => {
  try {
    const data = await getRzdFilterOptions();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/rzd-analytics/filter-options:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/rzd-analytics/station-directory/stats", requireAuth, requireMinRole("manager"), async (_req, res) => {
  try {
    const data = await getStationDirectoryStats();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/rzd-analytics/station-directory/stats:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/rzd-analytics/import", requireAuth, requireMinRole("manager"), async (req, res) => {
  const authReq = req as AuthRequest;
  const { csv, filename } = req.body as { csv?: string; filename?: string };
  if (!csv || !filename) {
    return res.status(400).json({ error: "csv and filename are required" });
  }
  try {
    const result = await importRzdAnalyticsCsv(csv, filename, authReq.user?.username);
    if (!result.skipped_file && result.inserted > 0) {
      await logEvent(authReq, "RZD analytics import", "import", filename);
      broadcastWebSocket({
        type: "RZD_ANALYTICS_IMPORTED",
        inserted: result.inserted,
        duplicates: result.duplicates,
      });
    }
    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/rzd-analytics/import:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Import failed" });
  }
});

app.get("/api/logs", requireAuth, requireMinRole("manager"), async (_req, res) => {
  try {
    const data = await getEventLogs();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/logs:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/users", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await getAllUsers();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/users:", error);
    res.status(500).json({ error: "Database error" });
  }
});

const VALID_ROLES: UserRole[] = ["admin", "key_person", "manager", "site_manager", "local_employee"];

function parseUserBody(body: Record<string, unknown>, requirePassword: boolean): UserCreateInput | UserUpdateInput | null {
  const role = body.role ? normalizeRole(String(body.role)) : undefined;
  if (body.role && !VALID_ROLES.includes(role as UserRole)) return null;

  const base = {
    username: body.username != null ? String(body.username) : undefined,
    name: body.name != null ? String(body.name) : undefined,
    role: role as UserRole | undefined,
    email: body.email != null ? String(body.email) : undefined,
    telegram_chat_id: body.telegram_chat_id != null ? String(body.telegram_chat_id) : undefined,
    notifications_enabled: body.notifications_enabled !== undefined ? Boolean(body.notifications_enabled) : undefined,
    site_id: body.site_id === null || body.site_id === "" ? null : body.site_id != null ? String(body.site_id) : undefined,
    assigned_site_ids: Array.isArray(body.assigned_site_ids)
      ? body.assigned_site_ids.map(String)
      : undefined,
  };

  if (requirePassword) {
    const password = body.password != null ? String(body.password) : "";
    if (!base.username || !base.name || !base.role || !base.email || !password) return null;
    return { ...base, username: base.username, name: base.name, role: base.role, email: base.email, password } as UserCreateInput;
  }

  if (body.password) {
    return { ...base, password: String(body.password) } as UserUpdateInput;
  }
  return base as UserUpdateInput;
}

app.post("/api/users", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const input = parseUserBody(req.body as Record<string, unknown>, true) as UserCreateInput | null;
  if (!input) {
    return res.status(400).json({ error: st("admin.users.validationRequired") });
  }

  try {
    const created = await createUser(input);
    await logEvent(req as AuthRequest, st("admin.users.created"), "system", st("admin.users.createdDetails", { username: created.username }));
    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "USERNAME_TAKEN") return res.status(409).json({ error: st("admin.users.usernameTaken") });
    if (msg === "EMAIL_TAKEN") return res.status(409).json({ error: st("auth.emailTaken") });
    console.error("POST /api/users:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/users/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;
  const input = parseUserBody(req.body as Record<string, unknown>, false) as UserUpdateInput | null;
  if (!input || Object.keys(input).length === 0) {
    return res.status(400).json({ error: st("admin.users.validationRequired") });
  }

  try {
    const updated = await updateUser(id, input);
    if (!updated) return res.status(404).json({ error: "User not found" });
    await logEvent(req as AuthRequest, st("admin.users.updated"), "system", st("admin.users.updatedDetails", { username: updated.username }));
    res.json({ status: "success", data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "USERNAME_TAKEN") return res.status(409).json({ error: st("admin.users.usernameTaken") });
    if (msg === "LAST_ADMIN") return res.status(400).json({ error: st("admin.users.lastAdmin") });
    console.error("PUT /api/users/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/users/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { id } = req.params;
  const actor = (req as AuthRequest).user;

  try {
    const target = await getUserById(id);
    if (!target) return res.status(404).json({ error: "User not found" });

    const avatarFile = target.has_avatar ? await getUserAvatarFile(id).catch(() => null) : null;
    const ok = await deleteUser(id, actor.id);
    if (!ok) return res.status(404).json({ error: "User not found" });
    if (avatarFile?.absolutePath) {
      try {
        fs.unlinkSync(avatarFile.absolutePath);
      } catch {
        /* best-effort disk cleanup */
      }
    }
    await logEvent(req as AuthRequest, st("admin.users.deleted"), "system", st("admin.users.deletedDetails", { username: target.username }));
    res.json({ status: "success" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "SELF_DELETE") return res.status(400).json({ error: st("admin.users.selfDelete") });
    if (msg === "LAST_ADMIN") return res.status(400).json({ error: st("admin.users.lastAdmin") });
    console.error("DELETE /api/users/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/users/:id/approve", requireAuth, requireMinRole("admin"), async (req, res) => {
  const authReq = req as AuthRequest;
  const { st, locale } = authReq;
  const { id } = req.params;
  try {
    const user = await approveUser(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await logEvent(authReq, st("admin.users.approved"), "system", st("admin.users.approvedDetails", { username: user.username }));
    if (user.email) {
      try {
        await sendAccountApprovedEmail(user.email, locale);
      } catch (mailErr) {
        console.error("sendAccountApprovedEmail:", mailErr);
      }
    }
    res.json({ status: "success", data: user });
  } catch (error) {
    console.error("POST /api/users/:id/approve:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/users/:id/reject", requireAuth, requireMinRole("admin"), async (req, res) => {
  const authReq = req as AuthRequest;
  const { st } = authReq;
  const { id } = req.params;
  try {
    const user = await rejectUser(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await logEvent(authReq, st("admin.users.rejected"), "system", st("admin.users.rejectedDetails", { username: user.username }));
    res.json({ status: "success", data: user });
  } catch (error) {
    console.error("POST /api/users/:id/reject:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/backups", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await getAllBackups();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/backups:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/backups/create", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;

  try {
    const newBackup = await createRealBackup("manual", st("backups.manualDesc"));
    await logEvent(req as AuthRequest, st("server.logBackupCreate"), "backup", st("server.logBackupCreateDetails", { filename: newBackup.filename }));
    res.json({ status: "success", data: newBackup });
  } catch (error) {
    console.error("POST /api/backups/create:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Backup failed" });
  }
});

app.get("/api/backups/:id/download", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const filePath = await getBackupFilePath(req.params.id);
    if (!filePath) return res.status(404).json({ error: "Backup file not found" });
    res.download(filePath);
  } catch (error) {
    console.error("GET /api/backups/:id/download:", error);
    res.status(500).json({ error: "Download failed" });
  }
});

app.post("/api/backups/:id/upload-cloud", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const result = await uploadBackupToCloud(req.params.id);
    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/backups/:id/upload-cloud:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
  }
});

app.post("/api/backups/:id/restore", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "RESTORE") {
    return res.status(400).json({ error: "Send { \"confirm\": \"RESTORE\" } to restore database from backup" });
  }
  if (!isPsqlAvailable()) {
    return res.status(503).json({ error: "psql not available — install postgresql-client" });
  }

  try {
    const filePath = await getBackupFilePath(req.params.id);
    if (!filePath) return res.status(404).json({ error: "Backup file not found" });
    await restoreBackupFromFile(filePath);
    await logEvent(
      req as AuthRequest,
      st("server.logBackupRestore"),
      "backup",
      st("server.logBackupRestoreDetails", { id: req.params.id }),
    );
    res.json({ status: "success", message: "Database restored from backup" });
  } catch (error) {
    console.error("POST /api/backups/:id/restore:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Restore failed" });
  }
});

app.get("/api/db/maintenance", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const migrations = await getMigrationDashboard(pool);
    res.json({
      status: "success",
      data: {
        tools: {
          pg_dump: isPgDumpAvailable(),
          psql: isPsqlAvailable(),
        },
        migrations,
      },
    });
  } catch (error) {
    console.error("GET /api/db/maintenance:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Database error" });
  }
});

app.post("/api/db/migrations/apply", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "APPLY") {
    return res.status(400).json({ error: "Send { \"confirm\": \"APPLY\" } to run pending migrations" });
  }

  try {
    const result = await applyPendingMigrations(pool, DEPLOY_MIGRATION_SCOPES);
    if (result.applied.length > 0) {
      await logEvent(
        req as AuthRequest,
        st("server.logMigrationsApply"),
        "system",
        st("server.logMigrationsApplyDetails", { files: result.applied.join(", ") }),
      );
    }
    const dashboard = await getMigrationDashboard(pool);
    res.json({
      status: "success",
      data: {
        applied: result.applied,
        skipped: result.skipped,
        migrations: dashboard,
      },
    });
  } catch (error) {
    console.error("POST /api/db/migrations/apply:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Migration failed" });
  }
});

app.post("/api/db/migrations/rollback", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "ROLLBACK") {
    return res.status(400).json({ error: "Send { \"confirm\": \"ROLLBACK\" } to roll back the last migration" });
  }

  try {
    const result = await rollbackLastMigration(pool, DEPLOY_MIGRATION_SCOPES);
    if (result.rolledBack) {
      await logEvent(
        req as AuthRequest,
        st("server.logMigrationsRollback"),
        "system",
        st("server.logMigrationsRollbackDetails", { file: result.rolledBack }),
      );
    }
    const dashboard = await getMigrationDashboard(pool);
    res.json({
      status: "success",
      data: {
        rolled_back: result.rolledBack,
        message: result.message,
        migrations: dashboard,
      },
    });
  } catch (error) {
    console.error("POST /api/db/migrations/rollback:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Rollback failed" });
  }
});

registerChatRoutes(app);
registerPushRoutes(app);
registerNotificationRoutes(app);
registerTaskRoutes(app);
registerSupportRoutes(app);
registerShipmentLogisticsRoutes(app);
registerUserAvatarRoutes(app);

app.get("/api/carriers", requireAuth, async (req, res) => {
  try {
    const all = req.query.all === "1" || req.query.all === "true";
    const pagination = parsePaginationQuery(req.query as Record<string, unknown>);

    if (all || !req.query.page) {
      const data = await getAllCarriersDetailed(!all);
      return res.json({ status: "success", data });
    }

    const pageResult = await getCarriersPaginated({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: pagination.search,
      activeOnly: !all,
    });
    res.json({
      status: "success",
      data: pageResult.items,
      pagination: {
        total: pageResult.total,
        page: pageResult.page,
        pageSize: pageResult.pageSize,
        totalPages: pageResult.totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/carriers:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/carriers/:id/integration", requireAuth, async (req, res) => {
  try {
    const carrier = await getCarrierByIdDetailed(req.params.id);
    if (!carrier) return res.status(404).json({ error: "Carrier not found" });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const spec = buildCarrierIntegrationSpec(carrier, baseUrl);
    res.json({ status: "success", data: spec });
  } catch (error) {
    console.error("GET /api/carriers/:id/integration:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/integrations/external", requireAuth, async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    status: "success",
    data: {
      openapi_url: `${baseUrl}/api/openapi.json`,
      auth: "Bearer JWT from POST /api/auth/login",
      endpoints: [
        { method: "GET", path: "/api/carriers", description: "Carrier directory" },
        { method: "GET", path: "/api/carriers/{id}/integration", description: "Integration spec for a carrier" },
        { method: "GET", path: "/api/supply-links", description: "Shipments and routes" },
        { method: "POST", path: "/api/telemetry/push", description: "Push GPS/status updates" },
        { method: "POST", path: "/api/telemetry/webhook", description: "Webhook for tracker events" },
        { method: "POST", path: "/api/integrations/carriers/sync", description: "Pull sync from carrier API (admin)" },
      ],
      websocket: `${baseUrl.replace(/^http/, "ws")}/ws`,
      websocket_auth: "Sec-WebSocket-Protocol: bearer.<jwt> (JWT from POST /api/auth/login)",
    },
  });
});

app.post("/api/carriers", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const body = req.body as CarrierInput;
  if (!body.id?.trim() || !body.name?.trim() || !body.code?.trim() || !body.category) {
    return res.status(400).json({ error: st("carriers.validationRequired") });
  }
  if (!/^[a-z][a-z0-9_]{1,48}$/.test(body.id.trim())) {
    return res.status(400).json({ error: st("carriers.invalidId") });
  }

  try {
    const existing = await getCarrierByIdDetailed(body.id.trim());
    if (existing) return res.status(409).json({ error: st("carriers.idExists") });

    const created = await createCarrier(body);
    await logEvent(req as AuthRequest, st("carriers.logCreate"), "sync", `${created.name} (${created.id})`);
    broadcastWebSocket({ type: "CARRIERS_UPDATED" });
    res.status(201).json({ status: "success", data: created });
  } catch (error) {
    console.error("POST /api/carriers:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/carriers/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  try {
    const updated = await updateCarrierSettings(req.params.id, req.body);
    await logEvent(req as AuthRequest, st("carriers.logUpdate"), "sync", `${updated.name} (${updated.id})`);
    broadcastWebSocket({ type: "CARRIERS_UPDATED" });
    res.json({ status: "success", data: updated });
  } catch (error) {
    console.error("PUT /api/carriers/:id:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Update failed" });
  }
});

app.delete("/api/carriers/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  try {
    const result = await deleteCarrier(req.params.id);
    if (!result.ok) return res.status(404).json({ error: result.error || st("carriers.notFound") });
    await logEvent(req as AuthRequest, st("carriers.logDelete"), "sync", req.params.id);
    broadcastWebSocket({ type: "CARRIERS_UPDATED" });
    res.json({ status: "success", soft: result.soft ?? false });
  } catch (error) {
    console.error("DELETE /api/carriers/:id:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/integrations/carriers/:id", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const carrier = await updateCarrierSettings(req.params.id, req.body);
    broadcastWebSocket({ type: "CARRIERS_UPDATED" });
    res.json({ status: "success", data: carrier });
  } catch (error) {
    console.error("PUT /api/integrations/carriers/:id:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Update failed" });
  }
});

app.post("/api/integrations/carriers/sync", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { carrier_id } = req.body;

  try {
    const result = await syncCarrierById(carrier_id);
    const carrierName = getCarrierName(result.carrier, st);
    await logEvent(
      req as AuthRequest,
      st("server.logCarrierSync"),
      "sync",
      `${st("server.logCarrierSyncDetails", { name: carrierName })} — ${result.message}`,
    );

    const etaDelays = await checkEtaOverdueShipments();
    await publishTelemetryTick({ updates: result.updates, etaDelays });

    broadcastWebSocket({
      type: "CARRIER_SYNC_COMPLETED",
      carrier_id: result.carrier.id,
      synced_at: result.carrier.last_sync,
      message: result.message,
    });
    broadcastWebSocket({ type: "CARRIERS_UPDATED" });

    res.json({ status: "success", message: result.message, data: result.carrier });
  } catch (error) {
    const err = error as Error & { carrier?: import("./src/types.js").ThirdPartyCarrier };
    console.error("POST /api/integrations/carriers/sync:", error);
    res.status(500).json({
      error: err.message || "Sync failed",
      data: err.carrier,
    });
  }
});

app.get("/api/integrations/settings", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const [telegram, cloud, telemetry, mapData, geocoding, mail] = await Promise.all([
      getTelegramSettingsMasked(),
      getCloudSettingsMasked(),
      getTelemetrySettingsMasked(),
      getMapDataSettingsMasked(),
      getGeocodingSettingsMasked(),
      getMailSettingsMasked(),
    ]);
    res.json({ status: "success", data: { telegram, cloud, telemetry, mapData, geocoding, mail } });
  } catch (error) {
    console.error("GET /api/integrations/settings:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/integrations/settings/telegram", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateTelegramSettings(req.body);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/telegram:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/integrations/settings/cloud", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateCloudSettings(req.body);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/cloud:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/integrations/settings/telemetry", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateTelemetrySettings(req.body);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/telemetry:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/integrations/settings/map-data", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateMapDataSettings(req.body);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/map-data:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/integrations/settings/geocoding", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateGeocodingSettings(req.body);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/geocoding:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/api/integrations/settings/mail", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const data = await updateMailSettings(req.body);
    const full = await getMailSettings();
    await syncBuiltinSmtpServer(full);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("PUT /api/integrations/settings/mail:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.post("/api/integrations/mail/test", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const to = typeof req.body?.to === "string" ? req.body.to : undefined;
    const settings = req.body?.settings && typeof req.body.settings === "object"
      ? (req.body.settings as Partial<import("./src/types.js").MailSettings>)
      : undefined;
    const data = await testMailConnection(to, settings);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("POST /api/integrations/mail/test:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Test failed" });
  }
});

app.post("/api/integrations/geocoding/test", requireAuth, requireMinRole("admin"), async (req, res) => {
  try {
    const sample = typeof req.body?.address === "string" ? req.body.address : undefined;
    const data = await testGeocodingConnection(sample);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("POST /api/integrations/geocoding/test:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Test failed" });
  }
});

app.get("/api/integrations/geocoding/local-status", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await getKladrImportStatus();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/integrations/geocoding/local-status:", error);
    res.status(500).json({ error: "Status failed" });
  }
});

app.post("/api/integrations/geocoding/import-local", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const data = await startKladrLocalImport();
    res.json({ status: "success", data });
  } catch (error) {
    console.error("POST /api/integrations/geocoding/import-local:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Import failed" });
  }
});

app.get("/api/kladr/suggest", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limitRaw = parseInt(String(req.query.limit || "10"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 10;
  const kind = req.query.kind === "region" ? "region" : "address";
  const regionHint = typeof req.query.region === "string" ? req.query.region.trim() : undefined;
  if (q.length < 2) {
    return res.json({ status: "success", data: [] });
  }
  try {
    const data = await searchKladrSuggestions(q, { limit, kind, regionHint });
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/kladr/suggest:", error);
    res.status(500).json({ error: "KLADR suggest failed" });
  }
});

app.get("/api/kladr/geocode", requireAuth, async (req, res) => {
  const address = String(req.query.address || "").trim();
  const regionHint = typeof req.query.region === "string" ? req.query.region : undefined;
  if (!address) {
    return res.status(400).json({ error: "address required" });
  }
  try {
    const data = await geocodeRussianAddress(address, { regionHint });
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/kladr/geocode:", error);
    res.status(500).json({ error: "Geocode failed" });
  }
});

app.get("/api/kladr/reverse", requireAuth, async (req, res) => {
  const lat = parseFloat(String(req.query.lat ?? ""));
  const lng = parseFloat(String(req.query.lng ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng required" });
  }
  try {
    const data = await reverseGeocodeRussianAddress(lat, lng);
    res.json({ status: "success", data });
  } catch (error) {
    console.error("GET /api/kladr/reverse:", error);
    res.status(500).json({ error: "Reverse geocode failed" });
  }
});

app.get("/api/map-data/template", requireAuth, requireMinRole("admin"), (_req, res) => {
  res.json({ status: "success", data: getMapDataTemplate() });
});

app.post("/api/map-data/import", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const mode = req.body?.mode === "replace" ? "replace" : "merge";

  try {
    const payload = parseMapDataPayload(req.body);
    const result = await importMapData(payload, mode);

    await logEvent(
      req as AuthRequest,
      st("server.logMapDataImport"),
      "import",
      st("server.logMapDataImportDetails", {
        factories: result.factories_upserted,
        links: result.supply_links_upserted,
        mode,
      })
    );

    broadcastWebSocket({
      type: "MAP_DATA_IMPORTED",
      factories_count: result.factories_upserted,
      supply_links_count: result.supply_links_upserted,
    });

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/map-data/import:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Import failed" });
  }
});

app.post("/api/integrations/map-data/sync", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const mode = req.body?.mode === "replace" ? "replace" : "merge";

  try {
    const result = await syncMapDataFromApi(mode);

    await logEvent(
      req as AuthRequest,
      st("server.logMapDataSync"),
      "sync",
      st("server.logMapDataSyncDetails", {
        factories: result.factories_upserted,
        links: result.supply_links_upserted,
      })
    );

    broadcastWebSocket({
      type: "MAP_DATA_IMPORTED",
      factories_count: result.factories_upserted,
      supply_links_count: result.supply_links_upserted,
    });

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("POST /api/integrations/map-data/sync:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Sync failed" });
  }
});

app.post("/api/integrations/telemetry/sync", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const updates = await runTelemetrySync();
    const etaDelays = await checkEtaOverdueShipments();
    await publishTelemetryTick({ updates, etaDelays });
    res.json({ status: "success", data: { updated: updates.length, shipments: updates } });
  } catch (error) {
    console.error("POST /api/integrations/telemetry/sync:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Sync failed" });
  }
});

app.post("/api/telemetry/push", requireAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const settings = await getTelemetrySettings();
    if (!settings.allow_jwt_push) {
      return res.status(403).json({ error: "JWT telemetry push is disabled" });
    }
    const points = parseWebhookBody(req.body);
    if (points.length === 0) return res.status(400).json({ error: "No valid GPS points" });
    const updates = await processTelemetryPoints(points);
    const etaDelays = await checkEtaOverdueShipments();
    await publishTelemetryTick({ updates, etaDelays });
    res.json({ status: "success", data: { updated: updates.length, shipments: updates } });
  } catch (error) {
    console.error("POST /api/telemetry/push:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Push failed" });
  }
});

app.post("/api/telemetry/webhook", telemetryWebhookRateLimiter, async (req, res) => {
  try {
    const settings = await getTelemetrySettings();
    const secret = req.headers["x-telemetry-secret"] as string | undefined;
    if (!verifyWebhookSecret(secret, settings)) {
      return res.status(401).json({ error: "Invalid telemetry webhook secret" });
    }
    const points = parseWebhookBody(req.body);
    if (points.length === 0) return res.status(400).json({ error: "No valid GPS points" });
    const updates = await processTelemetryPoints(points);
    const etaDelays = await checkEtaOverdueShipments();
    await publishTelemetryTick({ updates, etaDelays });
    res.json({ status: "success", data: { updated: updates.length } });
  } catch (error) {
    console.error("POST /api/telemetry/webhook:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Webhook failed" });
  }
});

app.post("/api/integrations/telegram/test", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { chat_id } = req.body;
  try {
    const result = await testTelegramConnection(chat_id);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ status: "success", message: "OK", data: result });
  } catch (error) {
    console.error("POST /api/integrations/telegram/test:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Test failed" });
  }
});

app.post("/api/integrations/cloud/test", requireAuth, requireMinRole("admin"), async (_req, res) => {
  try {
    const result = await testCloudConnection();
    if (!result.ok) return res.status(400).json({ error: result.message });
    res.json({ status: "success", message: result.message });
  } catch (error) {
    console.error("POST /api/integrations/cloud/test:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Test failed" });
  }
});

app.post("/api/telegram/send", requireAuth, requireMinRole("admin"), async (req, res) => {
  const { st } = req as AuthRequest;
  const { message, chat_id } = req.body;
  try {
    const settings = await getTelegramSettings();
    const target = chat_id || settings.default_chat_id;
    const result = await sendTelegramMessage(target, message);
    if (!result.ok) return res.status(400).json({ error: result.error });

    await logEvent(req as AuthRequest, st("server.logTelegramSend"), "system", st("server.logTelegramSendDetails", { chatId: target || "@logistics_alerts", message }));
    res.json({ status: "success", message: "OK", data: result });
  } catch (error) {
    console.error("POST /api/telegram/send:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Send failed" });
  }
});

app.get("/api/openapi.json", requireAuth, (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json(buildOpenApiDocument(baseUrl));
});

app.get("/api/docs", requireAuth, (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarsLogistics API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: window.location.origin + '/api/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
      requestInterceptor: (req) => {
        const token = sessionStorage.getItem('barslogistics_token');
        if (token) req.headers['Authorization'] = 'Bearer ' + token;
        return req;
      },
    });
  </script>
</body>
</html>`);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

interface AuthenticatedWsClient {
  ws: WebSocket;
  user: User;
}

const authenticatedClients = new Map<WebSocket, AuthenticatedWsClient>();

setChatBroadcast((userIds, payload) => {
  const allowed = new Set(userIds);
  for (const client of authenticatedClients.values()) {
    if (!allowed.has(client.user.id)) continue;
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    client.ws.send(JSON.stringify(payload));
  }
});

setNotificationBroadcast((userId, payload) => {
  for (const client of authenticatedClients.values()) {
    if (client.user.id !== userId) continue;
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    client.ws.send(JSON.stringify(payload));
  }
});

setTaskBroadcast((userIds, payload) => {
  const allowed = new Set(userIds);
  for (const client of authenticatedClients.values()) {
    if (!allowed.has(client.user.id)) continue;
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    client.ws.send(JSON.stringify(payload));
  }
});

async function persistShipmentStatusNotifications(params: {
  shipment: SupplyLink;
  status: string;
  delayReason?: string | null;
  actorUserId?: string;
}): Promise<void> {
  try {
    await notifyShipmentStatusChange({
      shipment: params.shipment,
      status: params.status,
      delayReason: params.delayReason,
      actorUserId: params.actorUserId,
    });
  } catch (error) {
    console.error("persistShipmentStatusNotifications:", error);
  }
}

wss.on("connection", (ws, req) => {
  const token = extractWebSocketToken(req);
  if (!token) {
    ws.close(4401, "Unauthorized");
    return;
  }

  void resolveAuthUser(token)
    .then(async (authUser) => {
      const fullUser = await getUserById(authUser.id);
      if (!fullUser) {
        ws.close(4401, "Unauthorized");
        return;
      }

      authenticatedClients.set(ws, { ws, user: fullUser });
      registerWsUser(fullUser.id);
      const locale = parseLocale(req.headers["accept-language"]);
      const st = getServerT(locale);
      ws.send(JSON.stringify({ type: "INIT", message: st("server.wsInit") }));

      ws.on("close", () => {
        authenticatedClients.delete(ws);
        unregisterWsUser(fullUser.id);
      });
    })
    .catch(() => {
      ws.close(4401, "Unauthorized");
    });
});

function shipmentScopeFromPayload(
  payload: Record<string, unknown>,
  external?: Map<string, SupplyLink>,
): Map<string, SupplyLink> | undefined {
  if (external) return external;
  const shipment = payload.shipment as SupplyLink | undefined;
  if (!shipment?.id) return undefined;
  return new Map([[shipment.id, shipment]]);
}

function broadcastWebSocket(data: unknown, shipmentScope?: Map<string, SupplyLink>) {
  const payload = data as Record<string, unknown>;
  const scope = shipmentScopeFromPayload(payload, shipmentScope);

  for (const client of authenticatedClients.values()) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (!shouldDeliverWebSocketMessage(payload, client.user, scope)) continue;
    const personalized = personalizeWebSocketPayload(payload, client.user, scope);
    client.ws.send(JSON.stringify(personalized));
  }
}

async function publishAutomatedShipmentEvent(
  shipment: SupplyLink,
  event: ShipmentEvent,
  shipmentScope?: Map<string, SupplyLink>,
) {
  const st = defaultSt;
  const scope = shipmentScope ?? new Map([[shipment.id, shipment]]);
  broadcastWebSocket({ type: "SHIPMENT_EVENT", shipment_id: shipment.id, event, shipment }, scope);
  if (!event.new_status) return;

  broadcastWebSocket({
    type: "SHIPMENT_STATUS_UPDATE",
    shipment_id: shipment.id,
    status: event.new_status,
    cargo_type: shipment.cargo_type,
    delay_reason: event.delay_reason,
    updated_at: shipment.last_updated,
    notification: {
      title: event.new_status === "delayed"
        ? st("notifications.shipmentDelayedTitle")
        : st("notifications.shipmentStatusTitle"),
      message: st("notifications.shipmentStatusMessage", {
        id: shipment.id.slice(0, 8),
        cargo: shipment.cargo_type,
        status: st(`status.${event.new_status}`),
      }),
      type: event.new_status === "delayed" ? "alert" : "info",
    },
  }, scope);

  void persistShipmentStatusNotifications({
    shipment,
    status: event.new_status,
    delayReason: event.delay_reason,
  });

  void maybeSendStatusAlert({
    shipmentId: shipment.id,
    cargoType: shipment.cargo_type,
    status: event.new_status,
    delayReason: event.delay_reason,
  });
}

async function publishTelemetryTick({ updates, etaDelays }: TelemetryTickResult) {
  await publishTelemetryUpdates(updates);
  for (const { event, shipment } of etaDelays) {
    await publishAutomatedShipmentEvent(shipment, event);
  }
}

async function publishTelemetryUpdates(updates: TelemetryUpdate[]) {
  if (updates.length === 0) return;

  const st = defaultSt;
  const shipmentScope = new Map(
    (await getSupplyLinksByIds(updates.map(update => update.id))).map(link => [link.id, link]),
  );

  for (const update of updates) {
    if (update.event) {
      const shipment = shipmentScope.get(update.id) ?? await getSupplyLinkById(update.id);
      if (shipment) {
        shipmentScope.set(shipment.id, shipment);
        await publishAutomatedShipmentEvent(shipment, update.event, shipmentScope);
      }
    }

    if (update.arrived_now) {
      const cargo = update.cargo_type || update.id;
      await logSystemEvent(
        "system",
        "admin",
        st("server.logCargoArrived"),
        "route",
        st("server.logCargoArrivedDetails", { id: update.id, cargo })
      );
      broadcastWebSocket({
        type: "CARGO_ARRIVED",
        shipment_id: update.id,
        cargo_type: cargo,
        message: st("server.cargoArrivedMsg", { cargo }),
      }, shipmentScope);
    }
  }

  if (authenticatedClients.size > 0) {
    broadcastWebSocket({
      type: "LIVE_TELEMETRY_UPDATE",
      shipments: updates,
    }, shipmentScope);
  }
}

async function start() {
  await initDatabase();
  await backfillSupplyLinkEtaAt();
  await seedProductsIfEmpty();
  await seedUsersIfEmpty();
  await seedDatabaseIfEmpty();
  await ensureUserPasswords();
  console.log("PostgreSQL connected and ready");

  try {
    const mailSettings = await getMailSettings();
    await syncBuiltinSmtpServer(mailSettings);
  } catch (err) {
    console.warn("Mail builtin SMTP init skipped:", err instanceof Error ? err.message : err);
  }

  if (isPgDumpAvailable()) {
    startBackupScheduler(() => defaultSt("backups.autoDesc"));
  } else {
    console.warn("pg_dump not found — manual backups will fail until postgresql-client is installed");
  }

  startTelemetryScheduler((result) => publishTelemetryTick(result));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.get("/index-portal.html", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index-portal.html"));
    });
    app.use(
      express.static(distPath, {
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("sw.mjs")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      }),
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
