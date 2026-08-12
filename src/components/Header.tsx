import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NotificationItem, User } from '../types';
import {
  MapPin, BarChart3, Truck, Building2, FileText, Download,
  Bell, Shield, Menu, X, Languages, LogOut, LayoutGrid, BookOpen, Package, Container, Train, UserCircle, UserCog, Search,
  Moon, Sun, Trash2, CheckCheck, ListTodo, Wrench,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { canAccessTab, canExport } from '../utils/rbac';
import { ThemeToggle } from './Theme/ThemeToggle';
import { BrandLogo } from './Brand/BrandLogo';
import { UserAvatar } from './UI/UserAvatar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTheme } from '../store/themeSlice';

/** Open Tasks drawer from a notification link (task or board). */
function dispatchSupportOpenFromNotification(linkId?: string) {
  window.dispatchEvent(
    new CustomEvent('bars-support-open', { detail: { ticketId: linkId } }),
  );
}

function dispatchTasksOpenFromNotification(linkType?: string, linkId?: string) {
  if (linkType === 'support') {
    dispatchSupportOpenFromNotification(linkId);
    return;
  }
  if (!linkId) return;
  // Board invites historically used link_type=task with a kboard_* id
  if (linkType === 'board' || linkId.startsWith('kboard_')) {
    window.dispatchEvent(
      new CustomEvent('bars-tasks-open', { detail: { boardId: linkId } }),
    );
    return;
  }
  if (linkType === 'task') {
    window.dispatchEvent(
      new CustomEvent('bars-tasks-open', { detail: { taskId: linkId } }),
    );
  }
}

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  wsConnected: boolean;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearAllNotifications: () => void;
  onOpenExportModal: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenTasks?: () => void;
  tasksOpenCount?: number;
  onOpenActiveShipments?: () => void;
  activeShipmentsCount?: number;
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
  onMarkNotificationRead,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
  onOpenExportModal,
  onOpenGlobalSearch,
  onOpenTasks,
  tasksOpenCount = 0,
  onOpenActiveShipments,
  activeShipmentsCount = 0,
  hideDesktopQuickActions = false,
}) => {
  const { t, locale, setLocale, localeTag } = useI18n();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(state => state.theme.mode);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
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
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  const openNav = useCallback(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setNavOpen(true);
  }, []);

  const selectTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setNavOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [setActiveTab]);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el || !navOpen) return;
    const isMobileNav = document.documentElement.classList.contains('layout-mobile')
      || document.documentElement.classList.contains('layout-fold');
    if (!isMobileNav) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showNotifications, navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showNotifications || showUserMenu) {
        setShowNotifications(false);
        setShowUserMenu(false);
        return;
      }
      closeNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen, closeNav, showNotifications, showUserMenu]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!showNotifications && !showUserMenu) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const isMobileNav = document.documentElement.classList.contains('layout-mobile')
        || document.documentElement.classList.contains('layout-fold');
      /* Mobile drawer: notifications close only via the bell (or closing the menu). */
      if (isMobileNav && navOpen) return;

      const target = e.target as Node;
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [showNotifications, showUserMenu, navOpen]);

  const toggleLocale = () => setLocale(locale === 'ru' ? 'en' : 'ru');

  const activeNavItem = navItems.find(item => item.id === activeTab);

  const notificationsPanel = (
    <div className="header-nav-inline-panel header-nav-notifications-panel">
      <div className="header-nav-inline-panel-title flex items-center justify-between gap-2">
        <span className="header-nav-notifications-panel-heading">{t('header.notificationsPanel')}</span>
        {notifications.length > 0 ? (
          <div className="header-nav-notifications-panel-actions flex items-center gap-1">
            {unreadCount > 0 ? (
              <button
                type="button"
                className="header-nav-notifications-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllNotificationsRead();
                }}
              >
                {t('header.notificationsMarkAll')}
              </button>
            ) : null}
            <button
              type="button"
              className="header-nav-notifications-action header-nav-notifications-action--danger"
              onClick={(e) => {
                e.stopPropagation();
                onClearAllNotifications();
              }}
            >
              {t('header.notificationsClear')}
            </button>
          </div>
        ) : null}
      </div>
      <div className="header-nav-inline-panel-body theme-scrollbar">
        {notifications.length === 0 ? (
          <p className="header-nav-notify-empty">{t('header.notificationsEmpty')}</p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`header-nav-notify-item${n.read ? ' is-read' : ''}`}
            >
              <div
                className="header-nav-notify-item-main cursor-pointer"
                onClick={() => {
                  onMarkNotificationRead(n.id);
                  if (n.link_type === 'chat' && n.link_id) {
                    window.dispatchEvent(
                      new CustomEvent('bars-chat-open', { detail: { conversationId: n.link_id } }),
                    );
                  }
                  if (n.link_type === 'task' || n.link_type === 'board') {
                    dispatchTasksOpenFromNotification(n.link_type, n.link_id);
                  }
                  if (n.link_type === 'support') {
                    dispatchSupportOpenFromNotification(n.link_id);
                  }
                  if (n.link_type === 'shipment' && n.link_id) {
                    window.dispatchEvent(
                      new CustomEvent('bars-shipment-open', { detail: { shipmentId: n.link_id } }),
                    );
                  }
                }}
              >
                <div className="header-nav-notify-item-top">
                  <span className={`header-nav-notify-item-title header-nav-notify-item-title--${n.type === 'alert' || n.type === 'success' ? n.type : 'info'}`}>
                    {n.title}
                  </span>
                  <span className="header-nav-notify-item-time">
                    {new Date(n.timestamp).toLocaleString(localeTag, {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="header-nav-notify-item-message">{n.message}</p>
              </div>
              <div className="header-nav-notify-item-actions">
                {!n.read ? (
                  <button
                    type="button"
                    className="header-nav-notify-item-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkNotificationRead(n.id);
                    }}
                    title={t('header.notificationsMarkRead')}
                  >
                    <CheckCheck size={12} />
                    {t('header.notificationsMarkRead')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="header-nav-notify-item-action header-nav-notify-item-action--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(n.id);
                  }}
                  title={t('header.notificationsDelete')}
                >
                  <Trash2 size={12} />
                  {t('header.notificationsDelete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
            <div className="font-semibold text-slate-100 truncate">{currentUser.name}</div>
            <div className="text-slate-400 text-[10px] mt-0.5 truncate">@{currentUser.username}</div>
          </div>
        </div>
        <div className="text-[10px] text-indigo-300 uppercase font-semibold">
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
        className={`app-header w-full bg-slate-900/96 backdrop-blur-md shrink-0 z-50${
          showNotifications || showUserMenu ? ' is-popover-open' : ''
        }`}
      >
        <div className="app-header-inner w-full max-w-none px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="app-header-row flex items-center justify-between gap-2 sm:gap-3 min-w-0 h-14 sm:h-16">

            <div className="app-header-brand flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
              <button
                type="button"
                onClick={() => (navOpen ? closeNav() : openNav())}
                className={`app-header-menu-btn inline-flex items-center justify-center shrink-0 rounded-xl border transition-all duration-200 ${
                  navOpen
                    ? 'is-open bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/40'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600'
                }`}
                aria-label={t('common.menu')}
                aria-expanded={navOpen}
              >
                {navOpen ? <X className="w-5 h-5 shrink-0 block" /> : <Menu className="w-5 h-5 shrink-0 block" />}
              </button>

              <div className="app-header-brand-lockup flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                <BrandLogo size="md" className="app-header-brand-logo shrink-0" />

                <div className="app-header-brand-text min-w-0 flex-1 overflow-hidden">
                  <div className="app-header-brand-title-row flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <h1 className="app-header-brand-title font-bold text-slate-100 text-sm sm:text-base tracking-tight truncate min-w-0">
                      {t('header.brandTitle')}
                    </h1>
                    {activeNavItem && (
                      <span className="app-header-active-tab" title={activeNavItem.label}>
                        {activeNavItem.label}
                      </span>
                    )}
                  </div>
                  <p className="app-header-brand-subtitle text-[11px] text-slate-400 truncate leading-snug">
                    {t('header.brandSubtitle')}
                  </p>
                </div>

                <span
                  className={`app-header-sync-badge inline-flex items-center gap-1 rounded-full text-[10px] font-semibold border shrink-0 self-center ${
                    wsConnected
                      ? 'is-live bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'is-polling bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                  title={wsConnected ? t('header.wsLive') : t('header.pollingSync')}
                >
                  <span
                    className={`app-header-sync-dot w-1.5 h-1.5 rounded-full shrink-0 ${
                      wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="app-header-sync-label">
                    {wsConnected ? t('header.wsLive') : t('header.pollingSync')}
                  </span>
                </span>
              </div>
            </div>

            <div className="app-header-actions app-header-actions--bar flex items-center gap-1 sm:gap-1.5 shrink-0">

              <ThemeToggle compact className="app-header-theme-toggle" />

              <button
                type="button"
                onClick={toggleLocale}
                className="app-header-btn flex items-center gap-1 px-2 py-1.5 bg-transparent hover:bg-slate-800/80 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors"
                title={t('lang.switch')}
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">{locale === 'ru' ? t('lang.en') : t('lang.ru')}</span>
              </button>

              {canExport(currentUser.role) && (
                <button
                  type="button"
                  onClick={onOpenExportModal}
                  className="app-header-btn flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-transparent hover:bg-slate-800/80 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 transition-colors whitespace-nowrap"
                  title={t('header.exportTitle')}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden md:inline">{t('header.exportButton')}</span>
                </button>
              )}

              {onOpenTasks && !hideDesktopQuickActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    setShowUserMenu(false);
                    onOpenTasks();
                  }}
                  className="app-header-btn relative p-2 text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/80 rounded-lg border border-slate-700/80 transition-colors"
                  title={t('header.tasksTitle')}
                  aria-label={t('header.tasksTitle')}
                >
                  <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
                  {tasksOpenCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-indigo-500 text-[0.625rem] font-bold text-white flex items-center justify-center leading-none">
                      {tasksOpenCount > 99 ? '99+' : tasksOpenCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {onOpenActiveShipments && !hideDesktopQuickActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    setShowUserMenu(false);
                    onOpenActiveShipments();
                  }}
                  className="app-header-btn relative p-2 text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/80 rounded-lg border border-slate-700/80 transition-colors"
                  title={t('header.activeShipmentsTitle')}
                  aria-label={t('header.activeShipmentsTitle')}
                >
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                  {activeShipmentsCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-emerald-500 text-[0.625rem] font-bold text-white flex items-center justify-center leading-none">
                      {activeShipmentsCount > 99 ? '99+' : activeShipmentsCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {!hideDesktopQuickActions ? (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="app-header-btn relative p-2 text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/80 rounded-lg border border-slate-700/80 transition-colors"
                  title={t('header.notificationsTitle')}
                  aria-expanded={showNotifications}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.1rem] text-center ring-2 ring-slate-900 app-header-notify-ring">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="app-header-popover absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/95 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-100">{t('header.notificationsPanel')}</h3>
                      {notifications.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {unreadCount > 0 ? (
                            <button
                              type="button"
                              className="text-[10px] text-indigo-300 hover:text-indigo-200 px-1.5 py-0.5 rounded"
                              onClick={() => onMarkAllNotificationsRead()}
                            >
                              {t('header.notificationsMarkAll')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-[10px] text-slate-400 hover:text-red-300 px-1.5 py-0.5 rounded"
                            onClick={() => onClearAllNotifications()}
                          >
                            {t('header.notificationsClear')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="max-h-80 overflow-y-auto theme-scrollbar p-2 space-y-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">{t('header.notificationsEmpty')}</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg text-xs border ${
                              n.read ? 'bg-slate-800/50 border-transparent opacity-60' : 'bg-slate-800/80 border-slate-700/50'
                            }`}
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => {
                                onMarkNotificationRead(n.id);
                                if (n.link_type === 'chat' && n.link_id) {
                                  window.dispatchEvent(
                                    new CustomEvent('bars-chat-open', { detail: { conversationId: n.link_id } }),
                                  );
                                }
                                if (n.link_type === 'task' || n.link_type === 'board') {
                                  dispatchTasksOpenFromNotification(n.link_type, n.link_id);
                                }
                                if (n.link_type === 'support') {
                                  dispatchSupportOpenFromNotification(n.link_id);
                                }
                                if (n.link_type === 'shipment' && n.link_id) {
                                  window.dispatchEvent(
                                    new CustomEvent('bars-shipment-open', { detail: { shipmentId: n.link_id } }),
                                  );
                                }
                              }}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`font-semibold ${n.type === 'alert' ? 'text-red-400' : n.type === 'success' ? 'text-emerald-400' : 'text-indigo-300'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {new Date(n.timestamp).toLocaleString(localeTag, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                            </div>
                            <div className="flex justify-end gap-1 mt-1.5">
                              {!n.read ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 px-1.5 py-0.5 rounded"
                                  onClick={() => onMarkNotificationRead(n.id)}
                                >
                                  <CheckCheck size={12} />
                                  {t('header.notificationsMarkRead')}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-300 px-1.5 py-0.5 rounded"
                                onClick={() => onDeleteNotification(n.id)}
                              >
                                <Trash2 size={12} />
                                {t('header.notificationsDelete')}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              ) : null}

              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="app-header-btn flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 bg-transparent hover:bg-slate-800/80 text-slate-100 rounded-lg border border-slate-700/80 text-xs transition-colors"
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
                  <span className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded uppercase font-semibold shrink-0 whitespace-nowrap">
                    {t(`roles.${currentUser.role}.title`)}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="app-header-popover absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl p-2 text-xs">
                    <div className="px-2 py-2 border-b border-slate-700 mb-1 flex items-center gap-2.5">
                      <UserAvatar
                        userId={currentUser.id}
                        name={currentUser.name}
                        hasAvatar={Boolean(currentUser.has_avatar)}
                        avatarVersion={currentUser.avatar_version}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate">{currentUser.name}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5 truncate">@{currentUser.username}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('account');
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                    >
                      <UserCog className="w-4 h-4 text-indigo-400" />
                      <span>{t('account.open')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>{t('header.logout')}</span>
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
            className="app-header-nav-backdrop absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] nav-backdrop-enter"
            onClick={closeNav}
            aria-label={t('common.close')}
          />

          <nav
            className="app-header-nav"
            aria-label={t('header.navMenuTitle')}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900/95">
              <div className="flex items-center gap-2 text-slate-100">
                <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">{t('header.navMenuTitle')}</span>
              </div>
              <button
                type="button"
                onClick={closeNav}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={navScrollRef}
              className={[
                'header-nav-scroll overflow-y-auto overscroll-contain',
                showNotifications ? 'is-notifications-open' : '',
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowNotifications(v => !v);
                    }}
                    className={`header-nav-item header-nav-item--tool header-nav-item--notify${showNotifications ? ' is-active' : ''}`}
                    aria-expanded={showNotifications}
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      setShowUserMenu(v => !v);
                    }}
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
                  className={`header-nav-notifications-sheet${showNotifications ? ' is-open' : ''}`}
                  aria-hidden={!showNotifications}
                >
                  <div className="header-nav-notifications-sheet-inner">
                    {notificationsPanel}
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
