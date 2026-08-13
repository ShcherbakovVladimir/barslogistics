import React, { useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { NotificationItem } from '../../types';
import { openNotificationLink } from '../../utils/notificationNavigation';

export interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearAllNotifications: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  open,
  onClose,
  notifications,
  onMarkNotificationRead,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
}) => {
  const { t, localeTag } = useI18n();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleNotificationClick = (notification: NotificationItem) => {
    onMarkNotificationRead(notification.id);
    openNotificationLink(notification);
    onClose();
  };

  return (
    <div className="tasks-drawer-root app-notifications-drawer-root" role="presentation">
      <button type="button" className="tasks-drawer-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <aside
        className="tasks-drawer-panel app-notifications-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('header.notificationsPanel')}
      >
        <header className="tasks-drawer-header">
          <div className="tasks-drawer-header-main min-w-0">
            <div className="min-w-0 flex items-start gap-1.5">
              <Bell className="tasks-drawer-header-icon tasks-drawer-header-icon--indigo" aria-hidden />
              <div className="min-w-0">
                <h2 className="tasks-drawer-title truncate">{t('header.notificationsPanel')}</h2>
                <p className="tasks-drawer-subtitle">{t('header.notificationsTitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {unreadCount > 0 ? (
              <button
                type="button"
                className="app-notifications-toolbar-btn"
                onClick={() => onMarkAllNotificationsRead()}
              >
                {t('header.notificationsMarkAll')}
              </button>
            ) : null}
            {notifications.length > 0 ? (
              <button
                type="button"
                className="app-notifications-toolbar-btn app-notifications-toolbar-btn--danger"
                onClick={() => onClearAllNotifications()}
              >
                {t('header.notificationsClear')}
              </button>
            ) : null}
            <button type="button" className="tasks-drawer-icon-btn" onClick={onClose} aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="tasks-drawer-body scroll-area app-notifications-drawer-body">
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
                  onClick={() => handleNotificationClick(n)}
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
                  >
                    <Trash2 size={12} />
                    {t('header.notificationsDelete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
