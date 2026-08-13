import React, { useEffect, useState } from 'react';
import {
  Bell, ChevronLeft, ChevronRight, ListTodo, MessageCircle, Truck, X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { NotificationItem } from '../../types';

const RAIL_COLLAPSED_KEY = 'bars-side-rail-collapsed';

export interface AppSideRailProps {
  notifications: NotificationItem[];
  onOpenTasks: () => void;
  tasksOpenCount?: number;
  onOpenActiveShipments: () => void;
  activeShipmentsCount?: number;
  onOpenNotifications: () => void;
  chatUnread?: number;
  chatOpen?: boolean;
  onToggleChat: () => void;
}

export const AppSideRail: React.FC<AppSideRailProps> = ({
  notifications,
  onOpenTasks,
  tasksOpenCount = 0,
  onOpenActiveShipments,
  activeShipmentsCount = 0,
  onOpenNotifications,
  chatUnread = 0,
  chatOpen = false,
  onToggleChat,
}) => {
  const { t } = useI18n();
  const [isMobileDock, setIsMobileDock] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 640px)').matches
      || document.documentElement.classList.contains('layout-mobile')
      || document.documentElement.classList.contains('layout-fold');
  });
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.matchMedia('(max-width: 640px)').matches
        || document.documentElement.classList.contains('layout-mobile')
        || document.documentElement.classList.contains('layout-fold');
      if (mobile) return false;
    }
    try {
      return localStorage.getItem(RAIL_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const syncMobileDock = () => {
      const mobile = mq.matches
        || document.documentElement.classList.contains('layout-mobile')
        || document.documentElement.classList.contains('layout-fold');
      setIsMobileDock(mobile);
      if (mobile) setCollapsed(false);
    };
    syncMobileDock();
    mq.addEventListener('change', syncMobileDock);
    return () => mq.removeEventListener('change', syncMobileDock);
  }, []);

  useEffect(() => {
    const effectiveCollapsed = collapsed && !isMobileDock;
    try {
      if (!isMobileDock) {
        localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? '1' : '0');
      }
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle('app-side-rail-collapsed', effectiveCollapsed);
    document.documentElement.classList.add('app-side-rail-active');
    document.documentElement.classList.toggle('app-side-rail-mobile-dock', isMobileDock);
    return () => {
      document.documentElement.classList.remove('app-side-rail-active');
      document.documentElement.classList.remove('app-side-rail-collapsed');
      document.documentElement.classList.remove('app-side-rail-mobile-dock');
    };
  }, [collapsed, isMobileDock]);

  return (
    <aside
      className={`app-side-rail${collapsed && !isMobileDock ? ' is-collapsed' : ''}${isMobileDock ? ' is-mobile-dock' : ''}`}
      aria-label={t('sideRail.label')}
    >
      {!isMobileDock ? (
        <button
          type="button"
          className="app-side-rail-toggle"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? t('sideRail.expand') : t('sideRail.collapse')}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('sideRail.expand') : t('sideRail.collapse')}
        >
          {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      ) : null}

      {!collapsed || isMobileDock ? (
        <>
          <div className="app-side-rail-top">
            <button
              type="button"
              className="app-side-rail-btn"
              onClick={onOpenNotifications}
              title={t('header.notificationsTitle')}
              aria-label={t('header.notificationsTitle')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="app-side-rail-badge app-side-rail-badge--alert">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className="app-side-rail-btn"
              onClick={onOpenTasks}
              title={t('header.tasksTitle')}
              aria-label={t('header.tasksTitle')}
            >
              <ListTodo className="w-5 h-5" />
              {tasksOpenCount > 0 ? (
                <span className="app-side-rail-badge">
                  {tasksOpenCount > 99 ? '99+' : tasksOpenCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className="app-side-rail-btn"
              onClick={onOpenActiveShipments}
              title={t('header.activeShipmentsTitle')}
              aria-label={t('header.activeShipmentsTitle')}
            >
              <Truck className="w-5 h-5" />
              {activeShipmentsCount > 0 ? (
                <span className="app-side-rail-badge">
                  {activeShipmentsCount > 99 ? '99+' : activeShipmentsCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="app-side-rail-bottom">
            <button
              type="button"
              className={`app-side-rail-btn app-side-rail-btn--chat${chatOpen ? ' is-active' : ''}`}
              onClick={onToggleChat}
              title={chatOpen ? t('common.close') : t('chat.open')}
              aria-expanded={chatOpen}
              aria-label={chatOpen ? t('common.close') : `${t('chat.title')} — ${t('chat.brand')}`}
            >
              {chatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
              {chatUnread > 0 && !chatOpen ? (
                <span className="app-side-rail-badge app-side-rail-badge--alert">
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              ) : null}
            </button>
          </div>
        </>
      ) : null}
    </aside>
  );
};
