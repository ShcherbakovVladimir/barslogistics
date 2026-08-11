export interface PortalUser {
  samaccountname: string;
  role: string;
  creator_id: string;
}

export interface PortalShellVars {
  appHeightVar: string;
  headerVar: string;
  footerVar: string;
}

export interface PortalShellResizeDetail {
  appHeight?: number;
  headerHeight?: number;
  footerHeight?: number;
}

export interface PortalBootstrap {
  apiBase: string;
  authProxy: string;
  authBase: string;
  basename: string;
  token?: string;
  user?: PortalUser | null;
  /** Layout mode: app fits between WP header/footer (bars-portal ≥ 1.0.11). */
  embed?: boolean;
  shell?: PortalShellVars;
}

declare global {
  interface Window {
    __BARS_PORTAL__?: PortalBootstrap;
  }
}

export {};
