import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bug, ChevronDown, Download, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { useI18n, translations } from '../../i18n';
import { ApiService } from '../../services/api';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';
import type { ErrorLog, ErrorLogLevel, ErrorLogSource } from '../../types';

type LevelFilter = 'all' | ErrorLogLevel;
type SourceFilter = 'all' | ErrorLogSource;
type SortOrder = 'newest' | 'oldest';

const LEVELS: ErrorLogLevel[] = ['error', 'warn', 'fatal'];
const SOURCES: ErrorLogSource[] = ['http', 'unhandled', 'process'];

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function ErrorLogDetails({
  log,
  t,
}: {
  log: ErrorLog;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <>
      {log.stack ? (
        <div className="admin-errors-detail-block">
          <div className="admin-errors-detail-label">{t('admin.errors.stack')}</div>
          <pre className="admin-errors-stack">{log.stack}</pre>
        </div>
      ) : null}
      {log.meta && Object.keys(log.meta).length > 0 ? (
        <div className="admin-errors-detail-block">
          <div className="admin-errors-detail-label">{t('admin.errors.meta')}</div>
          <pre className="admin-errors-stack">{JSON.stringify(log.meta, null, 2)}</pre>
        </div>
      ) : null}
      {!log.stack && (!log.meta || Object.keys(log.meta).length === 0) ? (
        <div className="admin-errors-route">{log.message}</div>
      ) : null}
    </>
  );
}

export const ErrorLogsAdmin: React.FC = () => {
  const { t, locale, localeTag } = useI18n();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadLogs = useCallback(async () => {
    setError('');
    try {
      const data = await ApiService.getErrorLogs({
        search: debouncedSearch || undefined,
        level: levelFilter === 'all' ? undefined : levelFilter,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        sort: sortOrder,
        limit: 500,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.errors.loadFailed'));
    }
  }, [debouncedSearch, levelFilter, sourceFilter, sortOrder, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await loadLogs();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadLogs]);

  const levelOptions = useMemo(() => ([
    { value: 'all', label: t('admin.errors.filterAll') },
    ...LEVELS.map(level => ({ value: level, label: t(`admin.errors.levels.${level}`) })),
  ]), [t]);

  const sourceOptions = useMemo(() => ([
    { value: 'all', label: t('admin.errors.filterAll') },
    ...SOURCES.map(source => ({ value: source, label: t(`admin.errors.sources.${source}`) })),
  ]), [t]);

  const sortOptions = useMemo(() => ([
    { value: 'newest', label: t('admin.errors.sortNewest') },
    { value: 'oldest', label: t('admin.errors.sortOldest') },
  ]), [t]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(localeTag, { dateStyle: 'short', timeStyle: 'medium' });

  const hasActiveFilters = Boolean(search.trim()) || levelFilter !== 'all' || sourceFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setLevelFilter('all');
    setSourceFilter('all');
  };

  const exportCSV = () => {
    const headers = [...translations[locale].admin.errors.csvHeaders];
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      log.source,
      csvEscape(log.message),
      csvEscape(log.route ?? ''),
      log.status_code != null ? String(log.status_code) : '',
      csvEscape(log.username ?? ''),
      csvEscape(log.ip_address ?? ''),
      csvEscape(log.stack ?? ''),
    ]);
    const csvContent = `\uFEFF${[headers.join(','), ...rows.map(row => row.join(','))].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const emptyLabel = hasActiveFilters ? t('admin.errors.emptyFiltered') : t('admin.errors.empty');

  return (
    <div className="admin-errors admin-form-panel space-y-4">
      <div className="admin-support-toolbar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="admin-support-subtitle text-xs">
          {t('admin.errors.subtitle')}
          {!loading ? (
            <span className="admin-errors-count-badge">
              {t('admin.errors.showing', { shown: logs.length, total })}
            </span>
          ) : null}
        </p>
        <div className="admin-errors-toolbar-actions">
          <button
            type="button"
            className="admin-support-refresh-btn admin-form-actions-btn"
            onClick={exportCSV}
            disabled={logs.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            {t('admin.errors.exportCsv')}
          </button>
          <button
            type="button"
            className="admin-support-refresh-btn admin-form-actions-btn"
            onClick={() => void loadLogs()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5${loading ? ' animate-spin' : ''}`} />
            {t('admin.errors.refresh')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="admin-support-error">{error}</div>
      ) : null}

      <div className="admin-errors-filters">
        <div className="admin-errors-search">
          <Search aria-hidden />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('admin.errors.searchPlaceholder')}
            aria-label={t('admin.errors.searchPlaceholder')}
          />
          {search ? (
            <button
              type="button"
              className="admin-errors-search-clear"
              onClick={() => setSearch('')}
              aria-label={t('common.close')}
            >
              <X aria-hidden />
            </button>
          ) : null}
        </div>
        <SearchableSelect
          value={levelFilter}
          onChange={v => setLevelFilter(v as LevelFilter)}
          options={levelOptions}
          {...adminDropdownSelectProps}
        />
        <SearchableSelect
          value={sourceFilter}
          onChange={v => setSourceFilter(v as SourceFilter)}
          options={sourceOptions}
          {...adminDropdownSelectProps}
        />
        <SearchableSelect
          value={sortOrder}
          onChange={v => setSortOrder(v as SortOrder)}
          options={sortOptions}
          {...adminDropdownSelectProps}
        />
      </div>

      {hasActiveFilters ? (
        <button type="button" className="admin-errors-clear-btn" onClick={clearFilters}>
          {t('admin.errors.clearFilters')}
        </button>
      ) : null}

      {loading ? (
        <div className="admin-support-loading">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-support-panel admin-support-empty">
          <Bug className="admin-support-empty-icon w-8 h-8 mx-auto mb-2" />
          {emptyLabel}
        </div>
      ) : (
        <div className="admin-support-panel admin-errors-list overflow-hidden">
          <div className="admin-errors-table-wrap overflow-x-auto responsive-table-wrap">
            <table className="admin-support-table w-full text-xs">
              <thead>
                <tr className="admin-support-table-head">
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colTime')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colLevel')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colSource')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colMessage')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colRoute')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colUser')}</th>
                  <th className="text-left p-3 font-semibold">{t('admin.errors.colStatus')}</th>
                  <th className="p-3 w-8" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const expanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`admin-support-row${expanded ? ' is-selected' : ''}`}
                        onClick={() => setExpandedId(expanded ? null : log.id)}
                      >
                        <td className="p-3 whitespace-nowrap">
                          <time dateTime={log.timestamp}>{formatDate(log.timestamp)}</time>
                        </td>
                        <td className="p-3">
                          <span className={`admin-errors-badge admin-errors-badge--${log.level}`}>
                            {t(`admin.errors.levels.${log.level}`)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`admin-errors-badge admin-errors-badge--${log.source}`}>
                            {t(`admin.errors.sources.${log.source}`)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="admin-errors-message truncate max-w-[28rem]">{log.message}</div>
                        </td>
                        <td className="p-3">
                          <div className="admin-errors-route truncate max-w-[16rem]">{log.route || '—'}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">{log.username || '—'}</td>
                        <td className="p-3 whitespace-nowrap">{log.status_code ?? '—'}</td>
                        <td className="p-3">
                          <ChevronDown className={`admin-errors-chevron${expanded ? ' is-open' : ''}`} aria-hidden />
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="admin-errors-detail-row">
                          <td colSpan={8} className="p-3">
                            <ErrorLogDetails log={log} t={t} />
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-errors-cards-mobile">
            {logs.map(log => {
              const expanded = expandedId === log.id;
              return (
                <button
                  key={log.id}
                  type="button"
                  className={`admin-support-card${expanded ? ' is-selected' : ''}`}
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                >
                  <div className="admin-support-card-header">
                    <time className="admin-errors-route" dateTime={log.timestamp}>{formatDate(log.timestamp)}</time>
                    <span className={`admin-errors-badge admin-errors-badge--${log.level}`}>
                      {t(`admin.errors.levels.${log.level}`)}
                    </span>
                  </div>
                  <div className="admin-errors-message text-left">{log.message}</div>
                  <div className="admin-support-card-meta text-left">
                    {t(`admin.errors.sources.${log.source}`)}
                    {log.route ? ` · ${log.route}` : ''}
                    {log.username ? ` · ${log.username}` : ''}
                  </div>
                  {expanded ? (
                    <div className="admin-errors-card-details text-left">
                      <ErrorLogDetails log={log} t={t} />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
