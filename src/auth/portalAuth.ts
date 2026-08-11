import type { PortalBootstrap } from '../types/portal';
import '../types/portal';

export function isPortalEmbed(): boolean {
  return Boolean(window.__BARS_PORTAL__);
}

/** Shell layout: fit inside WP chrome (not full viewport). */
export function isPortalShellEmbed(): boolean {
  const portal = window.__BARS_PORTAL__;
  return Boolean(portal?.embed || portal?.shell);
}

/** Mark <html> for embed CSS (`--bars-app-height`, no 100dvh shell). */
export function applyPortalEmbedClass(): void {
  if (typeof document === 'undefined') return;
  if (isPortalShellEmbed()) {
    document.documentElement.classList.add('portal-embed');
  } else {
    document.documentElement.classList.remove('portal-embed');
  }
}

export function getPortalConfig(): PortalBootstrap | undefined {
  return window.__BARS_PORTAL__;
}

/** Router / URL basename: /bars/logistics on portal, / standalone. */
export function getPortalBasename(): string {
  const portal = window.__BARS_PORTAL__;
  if (portal?.basename) return portal.basename.replace(/\/$/, '') || '/';
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/bars/logistics')) {
    return '/bars/logistics';
  }
  return '/';
}

function isUsablePortalToken(token: unknown): token is string {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed === '<jwt>') return false;
  return trimmed.split('.').length === 3;
}

/** Fresh JWT from cookie-backed proxy; fallback to inline bootstrap token. */
export async function getAuthToken(): Promise<string> {
  const portal = window.__BARS_PORTAL__;
  if (!portal) return '';

  if (portal.authProxy) {
    try {
      const res = await fetch(`${portal.authProxy.replace(/\/$/, '')}/token`, {
        credentials: 'same-origin',
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { token?: string }; token?: string };
        const token = (json?.data?.token ?? json?.token ?? '').trim();
        if (isUsablePortalToken(token)) {
          portal.token = token;
          return token;
        }
      }
    } catch {
      /* portal token endpoint unavailable */
    }
  }

  if (isUsablePortalToken(portal.token)) {
    return portal.token.trim();
  }

  return '';
}

export async function logoutFromPortal(): Promise<void> {
  const proxy = window.__BARS_PORTAL__?.authProxy;
  if (!proxy) return;

  try {
    await fetch(`${proxy.replace(/\/$/, '')}/logout`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    /* ignore */
  }
}

/** WebSocket URL without credentials — pass token via Sec-WebSocket-Protocol. */
export function getWebSocketUrl(_token: string): string {
  const portal = window.__BARS_PORTAL__;
  const apiBase =
    portal?.apiBase
    || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE)
    || '';

  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    try {
      const api = new URL(apiBase);
      const wsProto = api.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${api.host}/ws`;
    } catch {
      /* fall through */
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/** Subprotocol carrying JWT — avoids ?token= in URL/logs. */
export function getWebSocketProtocols(token: string): string[] {
  return [`bearer.${token}`];
}

/** Resolve REST API base (no trailing slash). Standalone keeps relative `/api`. */
export function getApiBase(): string {
  const portal = window.__BARS_PORTAL__;
  const fromEnv =
    typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_API_BASE === 'string'
      ? import.meta.env.VITE_API_BASE.trim()
      : '';
  const raw = (portal?.apiBase || fromEnv || '/api').replace(/\/$/, '');
  if (!raw) return '/api';

  // Standalone: if build baked an absolute URL but page opened via LAN IP/hostname,
  // use same-origin /api so requests do not cross CORS to the public domain.
  if (!portal?.apiBase && fromEnv && /^https?:\/\//i.test(fromEnv) && typeof window !== 'undefined') {
    try {
      const configured = new URL(fromEnv);
      const pageHost = window.location.hostname;
      if (configured.hostname !== pageHost) {
        return '/api';
      }
    } catch {
      /* keep configured base */
    }
  }

  return raw || '/api';
}

/** bars-portal dispatches after AD login + JWT is ready. */
export function subscribePortalAuthReady(onReady: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onReady();
  window.addEventListener('bars-portal:auth', handler);
  window.addEventListener('bars-portal:login', handler);
  return () => {
    window.removeEventListener('bars-portal:auth', handler);
    window.removeEventListener('bars-portal:login', handler);
  };
}
