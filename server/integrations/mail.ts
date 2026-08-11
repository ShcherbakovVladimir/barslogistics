import dns from "dns/promises";
import net from "net";
import { SMTPServer, type SMTPServerSession } from "smtp-server";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { MailSettings } from "../../src/types.js";
import { getMailSettings, updateMailSettingsState } from "./settings.js";
import { mergeSecrets } from "./helpers.js";
import { getServerT } from "../../src/i18n/translations.js";
import type { Locale } from "../../src/i18n/types.js";

let builtinServer: SMTPServer | null = null;
let builtinPortListening = 0;

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function fromHeader(settings: MailSettings): string {
  const name = settings.from_name?.trim() || "BarsLogistics";
  const address = settings.from_address?.trim() || "noreply@localhost";
  return `"${name.replace(/"/g, "")}" <${address}>`;
}

async function deliverViaMx(envelopeFrom: string, recipients: string[], raw: Buffer): Promise<void> {
  const errors: string[] = [];
  for (const recipient of recipients) {
    const domain = recipient.split("@")[1];
    if (!domain) {
      errors.push(`Invalid recipient: ${recipient}`);
      continue;
    }
    let mxHosts: string[] = [];
    try {
      const records = await dns.resolveMx(domain);
      mxHosts = records.sort((a, b) => a.priority - b.priority).map((r) => r.exchange);
    } catch {
      mxHosts = [domain];
    }
    if (mxHosts.length === 0) mxHosts = [domain];

    let delivered = false;
    let lastErr = "";
    for (const host of mxHosts) {
      try {
        const transport = nodemailer.createTransport({
          host,
          port: 25,
          secure: false,
          tls: { rejectUnauthorized: false },
          name: envelopeFrom.split("@")[1] || "localhost",
          connectionTimeout: 20_000,
          greetingTimeout: 20_000,
          socketTimeout: 30_000,
        });
        await transport.sendMail({
          envelope: { from: envelopeFrom, to: [recipient] },
          raw,
        });
        delivered = true;
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
      }
    }
    if (!delivered) {
      errors.push(`${recipient}: ${lastErr || "MX delivery failed"}`);
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

function createBuiltinServer(settings: MailSettings): SMTPServer {
  const hostname = settings.builtin_hostname?.trim() || "localhost";
  return new SMTPServer({
    name: hostname,
    authOptional: true,
    disabledCommands: ["AUTH"],
    logger: false,
    onConnect(session, callback) {
      if (!net.isIP(session.remoteAddress || "") && session.remoteAddress !== "127.0.0.1") {
        // allow local + any when used as outbound relay from this app
      }
      callback();
    },
    onMailFrom(_address, _session, callback) {
      callback();
    },
    onRcptTo(_address, _session, callback) {
      callback();
    },
    onData(stream, session: SMTPServerSession, callback) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        void (async () => {
          try {
            const raw = Buffer.concat(chunks);
            const envelopeFrom = session.envelope.mailFrom
              ? (typeof session.envelope.mailFrom === "string"
                  ? session.envelope.mailFrom
                  : session.envelope.mailFrom.address)
              : settings.from_address;
            const recipients = (session.envelope.rcptTo || []).map((r) =>
              typeof r === "string" ? r : r.address,
            );
            if (recipients.length === 0) {
              throw new Error("No recipients");
            }
            await deliverViaMx(envelopeFrom || settings.from_address, recipients, raw);
            callback();
          } catch (err) {
            callback(err instanceof Error ? err : new Error(String(err)));
          }
        })();
      });
    },
  });
}

export async function stopBuiltinSmtpServer(): Promise<void> {
  if (!builtinServer) return;
  const server = builtinServer;
  builtinServer = null;
  builtinPortListening = 0;
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

export async function ensureBuiltinSmtpServer(settings?: MailSettings): Promise<void> {
  const cfg = settings ?? (await getMailSettings());
  if (!cfg.enabled || cfg.mode !== "builtin") {
    await stopBuiltinSmtpServer();
    return;
  }

  const port = cfg.builtin_port || 2525;
  if (builtinServer && builtinPortListening === port) {
    return;
  }

  await stopBuiltinSmtpServer();

  const server = createBuiltinServer(cfg);
  await new Promise<void>((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      builtinServer = server;
      builtinPortListening = port;
      console.log(`Builtin SMTP server listening on 127.0.0.1:${port}`);
      resolve();
    });
    server.on("error", (err) => {
      reject(err);
    });
  });
}

export async function syncBuiltinSmtpServer(settings: MailSettings): Promise<void> {
  try {
    await ensureBuiltinSmtpServer(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Builtin SMTP server failed:", message);
    await updateMailSettingsState({ last_error: message });
  }
}

function createExternalTransport(settings: MailSettings): Transporter {
  const host = settings.smtp_host?.trim();
  if (!host) {
    throw new Error("SMTP host is required for external mode");
  }

  const port = settings.smtp_port || 587;
  const user = settings.smtp_user?.trim();
  const pass = settings.smtp_password?.trim();
  if (!user || !pass) {
    throw new Error("SMTP user and password are required for external mode");
  }

  const secure = settings.smtp_secure ?? port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

function createBuiltinClientTransport(settings: MailSettings): Transporter {
  return nodemailer.createTransport({
    host: "127.0.0.1",
    port: settings.builtin_port || 2525,
    secure: false,
    tls: { rejectUnauthorized: false },
    name: settings.builtin_hostname || "localhost",
  });
}

async function resolveMailSettings(override?: Partial<MailSettings>): Promise<MailSettings> {
  const existing = await getMailSettings();
  if (!override) return existing;
  return mergeSecrets(override, existing, ["smtp_password"]);
}

function normalizeRecipient(value: string | undefined): string {
  return (value || "").trim();
}

function validateExternalSettings(settings: MailSettings): void {
  if (settings.mode !== "external") return;
  if (!settings.smtp_host?.trim()) {
    throw new Error("Укажите SMTP host");
  }
  if (!settings.smtp_user?.trim() || !settings.smtp_password?.trim()) {
    throw new Error("Укажите SMTP user и password");
  }
}

export async function sendMail(input: SendMailInput, settingsOverride?: Partial<MailSettings>): Promise<void> {
  const settings = await resolveMailSettings(settingsOverride);
  if (!settings.enabled) {
    throw new Error("Mail is disabled");
  }

  const to = normalizeRecipient(input.to);
  if (!to) {
    throw new Error("Recipient email is required");
  }

  validateExternalSettings(settings);

  if (settings.mode === "builtin") {
    await ensureBuiltinSmtpServer(settings);
  } else {
    await stopBuiltinSmtpServer();
  }

  const transport =
    settings.mode === "external"
      ? createExternalTransport(settings)
      : createBuiltinClientTransport(settings);

  try {
    await transport.sendMail({
      from: fromHeader(settings),
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (!settingsOverride) {
      await updateMailSettingsState({
        last_sent_at: new Date().toISOString(),
        last_error: undefined,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!settingsOverride) {
      await updateMailSettingsState({ last_error: message });
    }
    throw err;
  } finally {
    transport.close();
  }
}

export async function testMailConnection(
  to?: string,
  settingsOverride?: Partial<MailSettings>,
): Promise<{ ok: true; to: string }> {
  const settings = await resolveMailSettings(settingsOverride);
  if (!settings.enabled) {
    throw new Error("Mail is disabled");
  }

  const target = normalizeRecipient(to) || normalizeRecipient(settings.from_address);
  if (!target) {
    throw new Error("Укажите email получателя для тестового письма");
  }

  validateExternalSettings(settings);

  await sendMail(
    {
      to: target,
      subject: "BarsLogistics mail test",
      text: "This is a test message from BarsLogistics mail settings.",
      html: "<p>This is a test message from <strong>BarsLogistics</strong> mail settings.</p>",
    },
    settingsOverride,
  );
  return { ok: true, to: target };
}

function resolvePublicBaseUrl(settings: MailSettings): string {
  const fromSettings = settings.public_base_url?.trim().replace(/\/$/, "");
  if (fromSettings) return fromSettings;
  const fromEnv = (process.env.PUBLIC_BASE_URL || process.env.APP_URL)?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

export async function sendConfirmEmail(
  to: string,
  token: string,
  locale: Locale = "ru",
): Promise<void> {
  const settings = await getMailSettings();
  const st = getServerT(locale);
  const base = resolvePublicBaseUrl(settings);
  const link = `${base}/?auth=confirm&token=${encodeURIComponent(token)}`;
  await sendMail({
    to,
    subject: st("mail.confirmSubject"),
    text: st("mail.confirmText", { link }),
    html: `<p>${st("mail.confirmHtmlIntro")}</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  locale: Locale = "ru",
): Promise<void> {
  const settings = await getMailSettings();
  const st = getServerT(locale);
  const base = resolvePublicBaseUrl(settings);
  const link = `${base}/?auth=reset&token=${encodeURIComponent(token)}`;
  await sendMail({
    to,
    subject: st("mail.resetSubject"),
    text: st("mail.resetText", { link }),
    html: `<p>${st("mail.resetHtmlIntro")}</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendAccountApprovedEmail(
  to: string,
  locale: Locale = "ru",
): Promise<void> {
  const settings = await getMailSettings();
  const st = getServerT(locale);
  const base = resolvePublicBaseUrl(settings);
  await sendMail({
    to,
    subject: st("mail.approvedSubject"),
    text: st("mail.approvedText", { link: base }),
    html: `<p>${st("mail.approvedHtmlIntro")}</p><p><a href="${base}">${base}</a></p>`,
  });
}
