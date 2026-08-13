import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NotificationItem, User } from '../types';
import {
  MapPin, BarChart3, Truck, Building2, FileText, Download,
  Bell, Shield, Menu, X, Languages, LogOut, LayoutGrid, BookOpen, Package, Container, Train, UserCircle, UserCog, Search,
  Moon, Sun, ListTodo, Wrench,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { canAccessTab, canExport } from '../utils/rbac';
import { ThemeToggle } from './Theme/ThemeToggle';
import { BrandLogo } from './Brand/BrandLogo';
import { UserAvatar } from './UI/UserAvatar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTheme } from '../store/themeSlice';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  wsConnected: boolean;
  notifications: NotificationItem[];
  onOpenExportModal: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenTasks?: () => void;
  tasksOpenCount?: number;
  onOpenActiveShipments?: () => void;
  activeShipmentsCount?: number;
  onOpenNotifications?: () => void;
  /** Hide bell/tasks in the desktop header bar (moved to AppSideRail). */
  hideDesktopQuickActions?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  wsConnected,
  notifications,
  onOpenExportModal,
  onOpenGlobalSearch,
  onOpenTasks,
  tasksOpenCount = 0,
  onOpenActiveShipments,
  activeShipmentsCount = 0,
  onOpenNotifications,
  hideDesktopQuickActions = false,
}) => {
  const { t, locale, setLocale } = useI18n();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(state => state.theme.mode);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = useMemo(() => ([
    { id: 'map', label: t('nav.map'), icon: MapPin },
    { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'shipments', label: t('nav.shipments'), icon: Truck },
    { id: 'factories', label: t('nav.factories'), icon: Building2 },
    { id: 'sites', label: t('nav.sites'), icon: BookOpen },
    { id: 'carriers', label: t('nav.carriers'), icon: Container },
    { id: 'products', label: t('nav.products'), icon: Package },
    { id: 'transport', label: t('nav.transport'), icon: Wrench },
    { id: 'managers', label: t('nav.managers'), icon: UserCircle },
    { id: 'rzd-analytics', label: t('nav.rzdAnalytics'), icon: Train },
    { id: 'mydata', label: t('nav.mydata'), icon: FileText },
    { id: 'account', label: t('nav.account'), icon: UserCog },
    { id: 'admin', label: t('nav.admin'), icon: Shield },
    { id: 'logs', label: t('nav.logs'), icon: FileText },
  ]).filter(item => canAccessTab(item.id, currentUser.role)), [t, currentUser.role]);

  const closeNav = useCallback(() => {
    setNavOpen(false);
    setShowUserMenu(false);
  }, []);

  const openNav = useCallback(() => {
    setShowUserMenu(false);
    setNavOpen(true);
  }, []);

  const selectTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setNavOpen(false);
    setShowUserMenu(false);
  }, [setActiveTab]);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el || !navOpen) return;
    const isMobileNav = document.documentElement.classList.contains('layout-mobile')
      || document.documentElement.classList.contains('layout-fold');
    if (!isMobileNav) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showUserMenu) {
        setShowUserMenu(false);
        return;
      }
      closeNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen, closeNav, showUserMenu]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!showUserMenu) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [showUserMenu]);

  const toggleLocale = () => setLocale(locale === 'ru' ? 'en' : 'ru');

  const activeNavItem = navItems.find(item => item.id === activeTab);

  const userPanel = (
    <div className="header-nav-inline-panel">
      <div className="header-nav-user-card">
        <div className="flex items-center gap-2.5 mb-2">
          <UserAvatar
            userId={currentUser.id}
            name={currentUser.name}
            hasAvatar={Boolean(currentUser.has_avatar)}
            avatarVersion={currentUser.avatar_version}
            size="md"
          />
          <div className="min-w-0">
            <div className="header-nav-user-name">{currentUser.name}</div>
            <div className="header-nav-user-handle">@{currentUser.username}</div>
          </div>
        </div>
        <div className="header-nav-user-role">
          {t(`roles.${currentUser.role}.title`)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setShowUserMenu(false);
          closeNav();
          setActiveTab('account');
        }}
        className="header-nav-item w-full mt-2"
      >
        <UserCog className="header-nav-item-icon" aria-hidden="true" />
        <span className="header-nav-item-label">{t('account.open')}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setShowUserMenu(false);
          closeNav();
          onLogout();
        }}
        className="header-nav-item header-nav-item--logout w-full mt-1"
      >
        <LogOut className="header-nav-item-icon" aria-hidden="true" />
        <span className="header-nav-item-label">{t('header.logout')}</span>
      </button>
    </div>
  );

  return (
    <>
      <header
        className={`app-header w-full shrink-0 z-50${showUserMenu ? ' is-popover-open' : ''}`}
      >
        <div className="app-header-inner w-full max-w-none px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="app-header-row flex items-center justify-between gap-2 sm:gap-3 min-w-0 h-12 sm:h-14">

            <div className="app-header-brand flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
              <button
                type="button"
                onClick={() => (navOpen ? closeNav() : openNav())}
                className={`app-header-menu-btn shrink-0${navOpen ? ' is-open' : ''}`}
                aria-label={t('common.menu')}
                aria-expanded={navOpen}
              >
                {navOpen ? <X className="shrink-0" aria-hidden /> : <Menu className="shrink-0" aria-hidden />}
              </button>

              <div className="app-header-brand-lockup flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                <BrandLogo size="md" className="app-header-brand-logo shrink-0" />

                <div className="app-header-brand-text min-w-0 flex-1 overflow-hidden">
                  <div className="app-header-brand-title-row flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <h1 className="app-header-brand-title font-bold text-sm sm:text-base tracking-tight truncate min-w-0">
                      {t('header.brandTitle')}
                    </h1>
                    {activeNavItem && (
                      <span className="app-header-active-tab" title={activeNavItem.label}>
                        {activeNavItem.label}
                      </span>
                    )}
                  </div>
                  <p className="app-header-brand-subtitle truncate leading-snug">
                    {t('header.brandSubtitle')}
                  </p>
                </div>

                <span
                  className={`app-header-sync-badge inline-flex items-center gap-1 rounded-full shrink-0 self-center ${
                    wsConnected ? 'is-live' : 'is-polling'
                  }`}
                  title={wsConnected ? t('header.wsLive') : t('header.pollingSync')}
                >
                  <span
                    className={`app-header-sync-dot ${wsConnected ? 'is-live' : 'is-polling'}`}
                  />
                  <span className="app-header-sync-label">
                    {wsConnected ? t('header.wsLive') : t('header.pollingSync')}
                  </span>
                </span>
              </div>
            </div>

            <div className="app-header-actions app-header-actions--bar flex items-center shrink-0">

              <ThemeToggle compact className="app-header-theme-toggle" />

              <button
                type="button"
                onClick={toggleLocale}
                className="app-header-btn app-header-btn--pill app-header-btn--collapse-sm"
                title={t('lang.switch')}
              >
                <Languages className="app-header-btn-icon" aria-hidden />
                <span className="hidden sm:inline">{locale === 'ru' ? t('lang.en') : t('lang.ru')}</span>
              </button>

              {canExport(currentUser.role) && (
                <button
                  type="button"
                  onClick={onOpenExportModal}
                  className="app-header-btn app-header-btn--pill app-header-btn--collapse-md"
                  title={t('header.exportTitle')}
                >
                  <Download className="app-header-btn-icon" aria-hidden />
                  <span className="hidden md:inline">{t('header.exportButton')}</span>
                </button>
              )}

              {onOpenTasks && !hideDesktopQuickActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenTasks?.();
                  }}
                  className="app-header-btn"
                  title={t('header.tasksTitle')}
                  aria-label={t('header.tasksTitle')}
                >
                  <ListTodo className="app-header-btn-icon" aria-hidden />
                  {tasksOpenCount > 0 ? (
                    <span className="app-header-badge">
                      {tasksOpenCount > 99 ? '99+' : tasksOpenCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {onOpenActiveShipments && !hideDesktopQuickActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenActiveShipments?.();
                  }}
                  className="app-header-btn"
                  title={t('header.activeShipmentsTitle')}
                  aria-label={t('header.activeShipmentsTitle')}
                >
                  <Truck className="app-header-btn-icon" aria-hidden />
                  {activeShipmentsCount > 0 ? (
                    <span className="app-header-badge app-header-badge--success">
                      {activeShipmentsCount > 99 ? '99+' : activeShipmentsCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {onOpenNotifications && !hideDesktopQuickActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenNotifications();
                  }}
                  className="app-header-btn"
                  title={t('header.notificationsTitle')}
                  aria-label={t('header.notificationsTitle')}
                >
                  <Bell className="app-header-btn-icon" aria-hidden />
                  {unreadCount > 0 && (
                    <span className="app-header-badge app-header-badge--alert app-header-notify-ring">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              ) : null}

              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`app-header-btn app-header-btn--pill${showUserMenu ? ' is-open' : ''}`}
                  aria-expanded={showUserMenu}
                >
                  <UserAvatar
                    userId={currentUser.id}
                    name={currentUser.name}
                    hasAvatar={Boolean(currentUser.has_avatar)}
                    avatarVersion={currentUser.avatar_version}
                    size="sm"
                    className="app-header-user-avatar"
                  />
                  <span className="hidden sm:inline font-medium truncate max-w-[80px] md:max-w-[110px]">{currentUser.name}</span>
                  <span className="app-header-role-chip hidden md:inline">
                    {t(`roles.${currentUser.role}.title`)}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="app-header-popover app-header-user-popover absolute right-0 mt-2 w-56 text-xs">
                    <div className="app-header-user-head">
                      <UserAvatar
                        userId={currentUser.id}
                        name={currentUser.name}
                        hasAvatar={Boolean(currentUser.has_avatar)}
                        avatarVersion={currentUser.avatar_version}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="header-nav-user-name">{currentUser.name}</div>
                        <div className="header-nav-user-handle">@{currentUser.username}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('account');
                      }}
                      className="header-nav-item w-full"
                    >
                      <UserCog className="header-nav-item-icon" aria-hidden="true" />
                      <span className="header-nav-item-label">{t('account.open')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="header-nav-item header-nav-item--logout w-full mt-1"
                    >
                      <LogOut className="header-nav-item-icon" aria-hidden="true" />
                      <span className="header-nav-item-label">{t('header.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {navOpen && (
        <div className="app-header-nav-overlay fixed inset-0 z-[60]" role="presentation">
          <button
            type="button"
            className="app-header-nav-backdrop absolute inset-0 nav-backdrop-enter"
            onClick={closeNav}
            aria-label={t('common.close')}
          />

          <nav
            className="app-header-nav"
            aria-label={t('header.navMenuTitle')}
          >
            <div className="app-header-nav-head">
              <div className="app-header-nav-head-title">
                <LayoutGrid aria-hidden />
                <span>{t('header.navMenuTitle')}</span>
              </div>
              <button
                type="button"
                onClick={closeNav}
                className="app-header-nav-close"
                aria-label={t('common.close')}
              >
                <X aria-hidden />
              </button>
            </div>

            <div
              ref={navScrollRef}
              className={[
                'header-nav-scroll overflow-y-auto overscroll-contain',
                showUserMenu ? 'is-user-open' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="header-nav-scroll-inner">
                <div className="header-nav-sections-wrap">
                  <div className="header-nav-grid header-nav-grid--sections">
                    {onOpenGlobalSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenGlobalSearch();
                          closeNav();
                        }}
                        className="header-nav-item header-nav-item--search"
                      >
                        <Search className="header-nav-item-icon" aria-hidden="true" />
                        <span className="header-nav-item-label">{t('nav.search')}</span>
                      </button>
                    )}
                    {navItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          className={`header-nav-item${isActive ? ' is-active' : ''}`}
                        >
                          <Icon className="header-nav-item-icon" aria-hidden="true" />
                          <span className="header-nav-item-label">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="header-nav-tools-block">
                  <p className="header-nav-section-title">{t('header.toolsMenuTitle')}</p>
                  <div className="header-nav-grid header-nav-grid--tools">
                  <button
                    type="button"
                    onClick={() => dispatch(setTheme('dark'))}
                    className={`header-nav-item header-nav-item--tool${themeMode === 'dark' ? ' is-active' : ''}`}
                  >
                    <Moon className="header-nav-item-icon" aria-hidden="true" />
                    <span className="header-nav-item-label">{t('theme.dark')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(setTheme('light'))}
                    className={`header-nav-item header-nav-item--tool${themeMode === 'light' ? ' is-active' : ''}`}
                  >
                    <Sun className="header-nav-item-icon" aria-hidden="true" />
                    <span className="header-nav-item-label">{t('theme.light')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleLocale}
                    className="header-nav-item header-nav-item--tool"
                  >
                    <Languages className="header-nav-item-icon" aria-hidden="true" />
                    <span className="header-nav-item-label">{locale === 'ru' ? t('lang.en') : t('lang.ru')}</span>
                  </button>
                  {canExport(currentUser.role) && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenExportModal();
                        closeNav();
                      }}
                      className="header-nav-item header-nav-item--tool"
                    >
                      <Download className="header-nav-item-icon" aria-hidden="true" />
                      <span className="header-nav-item-label">{t('header.exportButton')}</span>
                    </button>
                  )}
                  {onOpenNotifications ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        closeNav();
                        onOpenNotifications();
                      }}
                      className="header-nav-item header-nav-item--tool header-nav-item--notify"
                    >
                      <span className="header-nav-item-icon-wrap">
                        <Bell className="header-nav-item-icon" aria-hidden="true" />
                        {unreadCount > 0 && (
                          <span className="header-nav-notify-badge" aria-hidden="true">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </span>
                      <span className="header-nav-item-label">{t('header.notificationsTitle')}</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(v => !v)}
                    className={`header-nav-item header-nav-item--tool${showUserMenu ? ' is-active' : ''}`}
                    aria-expanded={showUserMenu}
                  >
                    <UserAvatar
                      userId={currentUser.id}
                      name={currentUser.name}
                      hasAvatar={Boolean(currentUser.has_avatar)}
                      avatarVersion={currentUser.avatar_version}
                      size="sm"
                      className="header-nav-item-icon app-header-user-avatar"
                    />
                    <span className="header-nav-item-label">{currentUser.name.split(' ')[0]}</span>
                  </button>
                </div>
              </div>

                <div
                  className={`header-nav-user-sheet${showUserMenu ? ' is-open' : ''}`}
                  aria-hidden={!showUserMenu}
                >
                  <div className="header-nav-user-sheet-inner">
                    {userPanel}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
