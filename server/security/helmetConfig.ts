import helmet from "helmet";
import type { RequestHandler } from "express";

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name];
  if (!raw?.trim()) return [];
  return raw.split(",").map(v => v.trim()).filter(Boolean);
}

export function createHelmetMiddleware(): RequestHandler {
  const isProd = process.env.NODE_ENV === "production";
  const extraConnect = parseCsvEnv("CSP_CONNECT_SRC");
  const frameAncestors = parseCsvEnv("CSP_FRAME_ANCESTORS");

  return helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: [
              "'self'",
              "data:",
              "blob:",
              "https://*.tile.openstreetmap.org",
              "https://*.basemaps.cartocdn.com",
              "https://*.openstreetmap.org",
            ],
            connectSrc: ["'self'", "ws:", "wss:", ...extraConnect],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'", ...frameAncestors],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
}
