import React, { useCallback, useMemo, useState } from 'react';
import { EventLog } from '../../types';
import { useI18n, translations } from '../../i18n';
import { FileText, Search, Download, X, Filter } from 'lucide-react';
import { SearchableSelect } from '../UI/SearchableSelect';

interface AuditLogsProps {
  logs: EventLog[];
}

type SortOrder = 'newest' | 'oldest';

type CategoryTone =
  | 'route'
  | 'factory'
  | 'system'
  | 'sync'
  | 'backup'
  | 'import'
  | 'auth'
  | 'export'
  | 'default';

function categoryTone(category: string): CategoryTone {
  const known: CategoryTone[] = [
    'route', 'factory', 'system', 'sync', 'backup', 'import', 'auth', 'export',
  ];
  return known.includes(category as CategoryTone) ? (category as CategoryTone) : 'default';
}

interface CategoryBadgeProps {
  label: string;
  category: string;
}

const CategoryBadge = ({ label, category }: CategoryBadgeProps) => (
  <span className={`audit-logs-category-badge audit-logs-category-badge--${categoryTone(category)}`}>
    {label}
  </span>
);

interface LogCardProps {
  log: EventLog;
  localeTag: string;
  categoryLabel: (category: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LogCard = ({ log, localeTag, categoryLabel, t }: LogCardProps) => (
  <article className="audit-logs-card">
    <div className="audit-logs-card-header">
      <time className="audit-logs-card-time" dateTime={log.timestamp}>
        {new Date(log.timestamp).toLocaleString(localeTag)}
      </time>
      <CategoryBadge label={categoryLabel(log.category)} category={log.category} />
    </div>
    <div className="audit-logs-card-user">
      <span className="audit-logs-card-username">{log.username}</span>
      <span className="audit-logs-card-role">{log.role}</span>
    </div>
    <div className="audit-logs-card-action">{log.action}</div>
    {log.details ? (
      <div className="audit-logs-card-details">
        <span className="audit-logs-card-label">{t('audit.colDetails')}</span>
        <span className="audit-logs-card-details-text">{log.details}</span>
      </div>
    ) : null}
  </article>
);

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const { t, locale, localeTag } = useI18n();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const categoryLabel = useCallback((category: string) => {
    const map: Record<string, string> = {
      route: t('audit.categoryRoute'),
      factory: t('audit.categoryFactory'),
      system: t('audit.categorySystem'),
      sync: t('audit.categorySync'),
      backup: t('audit.categoryBackup'),
      import: t('audit.categoryImport'),
      auth: t('audit.categoryAuth'),
      export: t('audit.categoryExport'),
    };
    return map[category] ?? category;
  }, [t]);

  const categoryFilterOptions = useMemo(() => ([
    { value: 'all', label: t('audit.allCategories') },
    { value: 'route', label: t('audit.categoryRoute') },
    { value: 'factory', label: t('audit.categoryFactory') },
    { value: 'system', label: t('audit.categorySystem') },
    { value: 'sync', label: t('audit.categorySync') },
    { value: 'backup', label: t('audit.categoryBackup') },
    { value: 'import', label: t('audit.categoryImport') },
    { value: 'auth', label: t('audit.categoryAuth') },
    { value: 'export', label: t('audit.categoryExport') },
  ]), [t]);

  const sortOptions = useMemo(() => ([
    { value: 'newest', label: t('audit.sortNewest') },
    { value: 'oldest', label: t('audit.sortOldest') },
  ]), [t]);

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter(l => {
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchAction = l.action.toLowerCase().includes(q);
        const matchDetails = l.details.toLowerCase().includes(q);
        const matchUser = l.username.toLowerCase().includes(q);
        if (!matchAction && !matchDetails && !matchUser) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const ta = Date.parse(a.timestamp);
      const tb = Date.parse(b.timestamp);
      const aTime = Number.isNaN(ta) ? 0 : ta;
      const bTime = Number.isNaN(tb) ? 0 : tb;
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [logs, categoryFilter, search, sortOrder]);

  const hasActiveFilters = search.trim().length > 0 || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
  };

  const exportCSV = () => {
    const headers = [...translations[locale].audit.csvHeaders];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.username,
      l.role,
      l.category,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="audit-logs-page">
      <div className="audit-logs-toolbar">
        <div className="audit-logs-toolbar-head">
          <div className="audit-logs-toolbar-title">
            <h2>
              <FileText className="audit-logs-toolbar-icon" aria-hidden="true" />
              <span className="truncate">{t('audit.title', { count: filteredLogs.length })}</span>
            </h2>
            <p className="audit-logs-subtitle">{t('audit.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="audit-logs-export-btn"
            disabled={filteredLogs.length === 0}
          >
            <Download className="audit-logs-export-icon" aria-hidden="true" />
            <span>{t('audit.exportCsv')}</span>
          </button>
        </div>

        <div className="audit-logs-filters-grid">
          <div className="audit-logs-search">
            <Search className="audit-logs-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder={t('audit.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="audit-logs-search-input"
              aria-label={t('audit.searchPlaceholder')}
            />
            {search ? (
              <button
                type="button"
                className="audit-logs-search-clear"
                onClick={() => setSearch('')}
                aria-label={t('common.close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          <div className="audit-logs-filter">
            <SearchableSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryFilterOptions}
              searchable={false}
              panelClassName="audit-logs-dropdown-panel"
              listClassName="audit-logs-dropdown-scroll"
            />
          </div>

          <div className="audit-logs-filter audit-logs-filter--sort">
            <SearchableSelect
              value={sortOrder}
              onChange={v => setSortOrder(v as SortOrder)}
              options={sortOptions}
              searchable={false}
              panelClassName="audit-logs-dropdown-panel"
              listClassName="audit-logs-dropdown-scroll"
            />
          </div>
        </div>

        <div className="audit-logs-toolbar-foot">
          <p className="audit-logs-results">
            <Filter className="audit-logs-results-icon" aria-hidden="true" />
            {t('audit.results', { count: filteredLogs.length })}
          </p>
          {hasActiveFilters ? (
            <button type="button" className="audit-logs-clear-btn" onClick={clearFilters}>
              {t('audit.clearFilters')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="audit-logs-table-panel">
        <div className="audit-logs-table-desktop">
          <div className="audit-logs-table-scroll shipment-events-scroll">
            <table className="audit-logs-table">
              <thead>
                <tr>
                  <th className="audit-logs-th audit-logs-th--time">{t('audit.colTime')}</th>
                  <th className="audit-logs-th audit-logs-th--user">{t('audit.colUser')}</th>
                  <th className="audit-logs-th audit-logs-th--category">{t('audit.colCategory')}</th>
                  <th className="audit-logs-th audit-logs-th--action">{t('audit.colAction')}</th>
                  <th className="audit-logs-th audit-logs-th--details">{t('audit.colDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="audit-logs-empty-row">
                      {t('audit.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="audit-logs-row">
                      <td className="audit-logs-td audit-logs-td--time">
                        <time dateTime={log.timestamp}>
                          {new Date(log.timestamp).toLocaleString(localeTag)}
                        </time>
                      </td>
                      <td className="audit-logs-td audit-logs-td--user">
                        <div className="audit-logs-user-name">{log.username}</div>
                        <div className="audit-logs-user-role">{log.role}</div>
                      </td>
                      <td className="audit-logs-td audit-logs-td--category">
                        <CategoryBadge label={categoryLabel(log.category)} category={log.category} />
                      </td>
                      <td className="audit-logs-td audit-logs-td--action">{log.action}</td>
                      <td className="audit-logs-td audit-logs-td--details">{log.details || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="audit-logs-cards-mobile">
          {filteredLogs.length === 0 ? (
            <div className="audit-logs-empty">{t('audit.empty')}</div>
          ) : (
            filteredLogs.map(log => (
              <LogCard
                key={log.id}
                log={log}
                localeTag={localeTag}
                categoryLabel={categoryLabel}
                t={t}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
