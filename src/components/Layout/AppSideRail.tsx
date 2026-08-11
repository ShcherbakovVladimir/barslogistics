import React, { useEffect, useRef, useState } from 'react';
import {
  Bell, ChevronLeft, ChevronRight, ListTodo, MessageCircle, Trash2, CheckCheck, X, Truck,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { NotificationItem } from '../../types';

const RAIL_COLLAPSED_KEY = 'bars-side-rail-collapsed';

function dispatchTasksOpenFromNotification(linkType?: string, linkId?: string) {
  if (!linkId) return;
  if (linkType === 'board' || linkId.startsWith('kboard_')) {
    window.dispatchEvent(new CustomEvent('bars-tasks-open', { detail: { boardId: linkId } }));
    return;
  }
  if (linkType === 'task') {
    window.dispatchEvent(new CustomEvent('bars-tasks-open', { detail: { taskId: linkId } }));
  }
}

export interface AppSideRailProps {
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearAllNotifications: () => void;
  onOpenTasks: () => void;
  tasksOpenCount?: number;
  onOpenActiveShipments: () => void;
  activeShipmentsCount?: number;
  chatUnread?: number;
  chatOpen?: boolean;
  onToggleChat: () => void;
}

export const AppSideRail: React.FC<AppSideRailProps> = ({
  notifications,
  onMarkNotificationRead,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
  onOpenTasks,
  tasksOpenCount = 0,
  onOpenActiveShipments,
  activeShipmentsCount = 0,
  chatUnread = 0,
  chatOpen = false,
  onToggleChat,
}) => {
  const { t, localeTag } = useI18n();
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
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showNotifications) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [showNotifications]);

  return (
    <aside
      className={`app-side-rail${collapsed && !isMobileDock ? ' is-collapsed' : ''}${isMobileDock ? ' is-mobile-dock' : ''}`}
      aria-label={t('sideRail.label')}
    >
      {!isMobileDock ? (
        <button
          type="button"
          className="app-side-rail-toggle"
          onClick={() => {
            setCollapsed(v => !v);
            setShowNotifications(false);
          }}
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
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                className="app-side-rail-btn"
                onClick={() => setShowNotifications(v => !v)}
                title={t('header.notificationsTitle')}
                aria-expanded={showNotifications}
                aria-label={t('header.notificationsTitle')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                  <span className="app-side-rail-badge app-side-rail-badge--alert">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {showNotifications ? (
                <div className="app-side-rail-popover">
                  <div className="app-side-rail-popover-head">
                    <h3>{t('header.notificationsPanel')}</h3>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          className="app-side-rail-popover-action"
                          onClick={() => onMarkAllNotificationsRead()}
                        >
                          {t('header.notificationsMarkAll')}
                        </button>
                      ) : null}
                      {notifications.length > 0 ? (
                        <button
                          type="button"
                          className="app-side-rail-popover-action is-danger"
                          onClick={() => onClearAllNotifications()}
                        >
                          {t('header.notificationsClear')}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="app-side-rail-popover-close"
                        onClick={() => setShowNotifications(false)}
                        aria-label={t('common.close')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="app-side-rail-popover-body theme-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="app-side-rail-empty">{t('header.notificationsEmpty')}</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`app-side-rail-notify${n.read ? ' is-read' : ''}`}
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
                              if (n.link_type === 'shipment' && n.link_id) {
                                window.dispatchEvent(
                                  new CustomEvent('bars-shipment-open', { detail: { shipmentId: n.link_id } }),
                                );
                              }
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`font-semibold text-xs ${
                                n.type === 'alert' ? 'text-red-400'
                                  : n.type === 'success' ? 'text-emerald-400'
                                    : 'text-indigo-300'
                              }`}
                              >
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkNotificationRead(n.id);
                                }}
                              >
                                <CheckCheck size={12} />
                                {t('header.notificationsMarkRead')}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-300 px-1.5 py-0.5 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(n.id);
                              }}
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
              ) : null}
            </div>

            <button
              type="button"
              className="app-side-rail-btn"
              onClick={() => {
                setShowNotifications(false);
                onOpenTasks();
              }}
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
              onClick={() => {
                setShowNotifications(false);
                onOpenActiveShipments();
              }}
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
              onClick={() => {
                setShowNotifications(false);
                onToggleChat();
              }}
              title={chatOpen ? t('common.close') : t('chat.open')}
              aria-expanded={chatOpen}
              aria-label={chatOpen ? t('common.close') : `${t('chat.title')} — ${t('chat.brand')}`}
            >
              <MessageCircle className="w-5 h-5" />
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
