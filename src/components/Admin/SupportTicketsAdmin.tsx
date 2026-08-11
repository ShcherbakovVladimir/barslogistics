import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Loader2, RefreshCw, UserRound } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';
import type { SupportTicket, SupportTicketStatus } from '../../types';

const STATUSES: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_CLASS: Record<SupportTicketStatus, string> = {
  open: 'admin-support-status--open',
  in_progress: 'admin-support-status--progress',
  resolved: 'admin-support-status--resolved',
  closed: 'admin-support-status--closed',
};

interface SupportTicketsAdminProps {
  focusTicketId?: string | null;
  onFocusTicketConsumed?: () => void;
}

export const SupportTicketsAdmin: React.FC<SupportTicketsAdminProps> = ({
  focusTicketId,
  onFocusTicketConsumed,
}) => {
  const { t, localeTag } = useI18n();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setError('');
    try {
      const data = await ApiService.getSupportTickets();
      setTickets(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.support.loadFailed'));
      return [];
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await loadTickets();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadTickets]);

  useEffect(() => {
    if (!focusTicketId || tickets.length === 0) return;
    const found = tickets.find(ticket => ticket.id === focusTicketId);
    if (found) {
      setSelectedId(found.id);
      setStatusFilter('all');
    }
    onFocusTicketConsumed?.();
  }, [focusTicketId, tickets, onFocusTicketConsumed]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const selected = useMemo(
    () => tickets.find(ticket => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  const openCount = useMemo(
    () => tickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress').length,
    [tickets],
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(localeTag, { dateStyle: 'short', timeStyle: 'short' });

  const pageLabel = (ctx: string | null) => {
    if (!ctx) return '—';
    const key = `nav.${ctx}`;
    const label = t(key);
    return label === key ? ctx : label;
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicketStatus) => {
    setSaving(true);
    setError('');
    try {
      const updated = await ApiService.updateSupportTicket(ticketId, { status });
      setTickets(prev => prev.map(ticket => (ticket.id === updated.id ? updated : ticket)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.support.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = STATUSES.map(status => ({
    value: status,
    label: t(`tasks.supportStatus.${status}`),
  }));

  const filterButtons: { id: 'all' | SupportTicketStatus; label: string; count?: number }[] = [
    { id: 'all', label: t('admin.support.filterAll'), count: tickets.length },
    ...STATUSES.map(status => ({
      id: status,
      label: t(`tasks.supportStatus.${status}`),
      count: tickets.filter(ticket => ticket.status === status).length,
    })),
  ];

  return (
    <div className="admin-support admin-form-panel space-y-4">
      <div className="admin-support-toolbar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="admin-support-subtitle text-xs">
          {t('admin.support.subtitle')}
          {openCount > 0 ? (
            <span className="admin-support-open-badge">
              {t('admin.support.openCount', { count: openCount })}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          className="admin-support-refresh-btn admin-form-actions-btn"
          onClick={() => void loadTickets()}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5${loading ? ' animate-spin' : ''}`} />
          {t('admin.support.refresh')}
        </button>
      </div>

      {error ? (
        <div className="admin-support-error">{error}</div>
      ) : null}

      <div className="admin-support-filters flex flex-wrap gap-2">
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            type="button"
            className={`admin-support-filter-btn${statusFilter === btn.id ? ' is-active' : ''}`}
            onClick={() => setStatusFilter(btn.id)}
          >
            {btn.label}
            <span className="admin-support-filter-count">{btn.count ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-support-loading">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-support-panel admin-support-empty">
          <LifeBuoy className="admin-support-empty-icon w-8 h-8 mx-auto mb-2" />
          {t('admin.support.empty')}
        </div>
      ) : (
        <div className="admin-support-layout grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
          <div className="admin-support-panel admin-support-list-panel overflow-hidden">
            <div className="admin-support-list-desktop overflow-x-auto responsive-table-wrap">
              <table className="admin-support-table w-full text-xs">
                <thead>
                  <tr className="admin-support-table-head">
                    <th className="text-left p-3 font-semibold">{t('admin.support.colSubject')}</th>
                    <th className="text-left p-3 font-semibold">{t('admin.support.colUser')}</th>
                    <th className="text-left p-3 font-semibold">{t('admin.support.colCategory')}</th>
                    <th className="text-left p-3 font-semibold">{t('admin.support.colStatus')}</th>
                    <th className="text-left p-3 font-semibold">{t('admin.support.colCreated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ticket => (
                    <tr
                      key={ticket.id}
                      className={`admin-support-row${selectedId === ticket.id ? ' is-selected' : ''}`}
                      onClick={() => setSelectedId(ticket.id)}
                    >
                      <td className="p-3">
                        <div className="admin-support-subject truncate max-w-[14rem]">{ticket.subject}</div>
                        <div className="admin-support-preview truncate max-w-[14rem]">{ticket.message}</div>
                      </td>
                      <td className="p-3">
                        <div className="admin-support-user-name">{ticket.user_name || '—'}</div>
                        <div className="admin-support-user-login">
                          @{ticket.user_username || '—'}
                        </div>
                      </td>
                      <td className="p-3 admin-support-cell">
                        {t(`tasks.supportCategoryOptions.${ticket.category}`)}
                      </td>
                      <td className="p-3">
                        <span className={`admin-support-status ${STATUS_CLASS[ticket.status]}`}>
                          {t(`tasks.supportStatus.${ticket.status}`)}
                        </span>
                      </td>
                      <td className="p-3 admin-support-cell-muted whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-support-cards-mobile p-3 space-y-2">
              {filtered.map(ticket => (
                <button
                  key={ticket.id}
                  type="button"
                  className={`admin-support-card${selectedId === ticket.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div className="admin-support-card-header">
                    <div className="admin-support-subject text-left">{ticket.subject}</div>
                    <span className={`admin-support-status ${STATUS_CLASS[ticket.status]}`}>
                      {t(`tasks.supportStatus.${ticket.status}`)}
                    </span>
                  </div>
                  <div className="admin-support-card-user text-left">
                    {ticket.user_name} · @{ticket.user_username}
                  </div>
                  <div className="admin-support-card-meta text-left">
                    {t(`tasks.supportCategoryOptions.${ticket.category}`)} · {formatDate(ticket.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-support-panel admin-support-detail p-4 sm:p-5 min-h-[16rem]">
            {!selected ? (
              <div className="admin-support-placeholder">
                <LifeBuoy className="admin-support-empty-icon w-8 h-8" />
                {t('admin.support.selectHint')}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="admin-support-detail-title">{selected.subject}</h4>
                  <div className="admin-support-detail-id">
                    {t('admin.support.ticketId')}: <span className="font-mono">{selected.id}</span>
                  </div>
                </div>

                <div className="admin-support-user-card">
                  <div className="admin-support-user-card-title">
                    <UserRound className="w-4 h-4" />
                    {t('admin.support.author')}
                  </div>
                  <div className="admin-support-user-grid grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="admin-support-label">{t('admin.users.fullName')}</div>
                      <div className="admin-support-value">{selected.user_name || '—'}</div>
                    </div>
                    <div>
                      <div className="admin-support-label">{t('admin.users.colUser')}</div>
                      <div className="admin-support-value">@{selected.user_username || '—'}</div>
                    </div>
                    <div>
                      <div className="admin-support-label">{t('admin.users.colEmail')}</div>
                      <div className="admin-support-value break-all">{selected.user_email || '—'}</div>
                    </div>
                    <div>
                      <div className="admin-support-label">{t('admin.users.colRole')}</div>
                      <div className="admin-support-value">
                        {selected.user_role ? t(`roles.${selected.user_role}.title`) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-support-meta-grid grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="admin-support-label mb-1">{t('admin.support.colCategory')}</div>
                    <div className="admin-support-meta-value">{t(`tasks.supportCategoryOptions.${selected.category}`)}</div>
                  </div>
                  <div>
                    <div className="admin-support-label mb-1">{t('admin.support.pageContext')}</div>
                    <div className="admin-support-meta-value">{pageLabel(selected.page_context)}</div>
                  </div>
                  <div>
                    <div className="admin-support-label mb-1">{t('admin.support.colCreated')}</div>
                    <div className="admin-support-meta-value">{formatDate(selected.created_at)}</div>
                  </div>
                  <div>
                    <div className="admin-support-label mb-1">{t('admin.support.updatedAt')}</div>
                    <div className="admin-support-meta-value">{formatDate(selected.updated_at)}</div>
                  </div>
                </div>

                <div>
                  <div className="admin-support-label text-xs mb-1">{t('admin.support.message')}</div>
                  <div className="admin-support-message whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div className="admin-support-status-field">
                  <label className="admin-support-label block text-xs mb-1">{t('admin.support.changeStatus')}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SearchableSelect
                      value={selected.status}
                      onChange={v => void handleStatusChange(selected.id, v as SupportTicketStatus)}
                      options={statusOptions}
                      searchable={false}
                      disabled={saving}
                      {...adminDropdownSelectProps}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
