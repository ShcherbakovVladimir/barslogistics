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
    <div className="admin-support space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-400">
          {t('admin.support.subtitle')}
          {openCount > 0 ? (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold">
              {t('admin.support.openCount', { count: openCount })}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          className="admin-form-actions-btn px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0 w-full sm:w-auto"
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
        <div className="admin-support-empty bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          {t('admin.support.empty')}
        </div>
      ) : (
        <div className="admin-support-layout grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
          <div className="admin-support-list-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="admin-support-list-desktop overflow-x-auto responsive-table-wrap">
              <table className="admin-support-table w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
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
                        <div className="font-semibold text-white truncate max-w-[14rem]">{ticket.subject}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[14rem]">{ticket.message}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-200">{ticket.user_name || '—'}</div>
                        <div className="text-[10px] text-slate-500">
                          @{ticket.user_username || '—'}
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        {t(`tasks.supportCategoryOptions.${ticket.category}`)}
                      </td>
                      <td className="p-3">
                        <span className={`admin-support-status ${STATUS_CLASS[ticket.status]}`}>
                          {t(`tasks.supportStatus.${ticket.status}`)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{formatDate(ticket.created_at)}</td>
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
                    <div className="font-semibold text-white text-left">{ticket.subject}</div>
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

          <div className="admin-support-detail bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 min-h-[16rem]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center gap-2 py-8">
                <LifeBuoy className="w-8 h-8 text-slate-600" />
                {t('admin.support.selectHint')}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-white">{selected.subject}</h4>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {t('admin.support.ticketId')}: <span className="font-mono">{selected.id}</span>
                  </div>
                </div>

                <div className="admin-support-user-card bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <UserRound className="w-4 h-4 text-indigo-400" />
                    {t('admin.support.author')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">{t('admin.users.fullName')}</div>
                      <div className="text-white font-medium">{selected.user_name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t('admin.users.colUser')}</div>
                      <div className="text-white font-medium">@{selected.user_username || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t('admin.users.colEmail')}</div>
                      <div className="text-white break-all">{selected.user_email || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t('admin.users.colRole')}</div>
                      <div className="text-white">
                        {selected.user_role ? t(`roles.${selected.user_role}.title`) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-1">{t('admin.support.colCategory')}</div>
                    <div className="text-slate-200">{t(`tasks.supportCategoryOptions.${selected.category}`)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">{t('admin.support.pageContext')}</div>
                    <div className="text-slate-200">{pageLabel(selected.page_context)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">{t('admin.support.colCreated')}</div>
                    <div className="text-slate-200">{formatDate(selected.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">{t('admin.support.updatedAt')}</div>
                    <div className="text-slate-200">{formatDate(selected.updated_at)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-xs mb-1">{t('admin.support.message')}</div>
                  <div className="admin-support-message bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div className="admin-support-status-field">
                  <label className="block text-xs text-slate-400 mb-1">{t('admin.support.changeStatus')}</label>
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
