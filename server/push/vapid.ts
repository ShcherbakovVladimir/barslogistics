import webpush from "web-push";

let configured = false;

export function isWebPushConfigured(): boolean {
  return configured;
}

export function configureWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim()
    || process.env.APP_URL?.trim()
    || process.env.PUBLIC_BASE_URL?.trim()
    || "mailto:admin@logistics.local";

  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  const key = process.env.VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export { webpush };
