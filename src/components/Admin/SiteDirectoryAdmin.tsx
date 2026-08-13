import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, GitMerge, AlertTriangle, Database } from 'lucide-react';
import type { Factory, FactoryType } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import { SiteDirectoryFormModal } from '../SiteDirectory/SiteDirectoryFormModal';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';

interface SiteDirectoryAdminProps {
  onSitesChanged: () => Promise<void>;
}

const DeleteModalShell: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => {
  const { sheetRef, sheetStyle, isDragging, dragEnabled, onHandlePointerDown } = useAppBottomSheet(onClose);
  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`admin-modal admin-sites-delete-modal app-modal-sheet modal-panel w-full max-w-sm flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle onPointerDown={dragEnabled ? onHandlePointerDown : () => {}} isDragging={isDragging} />
        {children}
      </div>
    </div>
  );
};

interface SiteAdminCardProps {
  site: Factory;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (site: Factory) => void;
  onDelete: (site: Factory) => void;
}

const SiteAdminCard = ({ site, t, onEdit, onDelete }: SiteAdminCardProps) => (
  <article className="admin-sites-card">
    <div className="admin-sites-card-header">
      <div className="min-w-0">
        <div className="admin-sites-card-name">{site.name}</div>
        <div className="admin-sites-card-id">{site.id}</div>
      </div>
      <span className={`admin-sites-card-contour px-2 py-0.5 rounded text-[10px] border shrink-0 ${
        site.is_ours
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      }`}>
        {site.is_ours ? t('siteDirectory.contourInner') : t('siteDirectory.contourOuter')}
      </span>
    </div>
    <div className="admin-sites-card-meta">
      <div className="admin-sites-card-row">
        <span className="admin-sites-card-label">{t('siteDirectory.colRegion')}</span>
        <span>{site.region}</span>
      </div>
      <div className="admin-sites-card-row">
        <span className="admin-sites-card-label">{t('siteDirectory.admin.colEdits')}</span>
        <span>{site.edit_count ?? 0}</span>
      </div>
    </div>
    <div className="admin-sites-card-actions">
      <button type="button" onClick={() => onEdit(site)} className="admin-sites-card-action admin-sites-card-action--edit">
        <Pencil className="w-4 h-4 shrink-0" />
        {t('siteDirectory.admin.edit')}
      </button>
      <button type="button" onClick={() => onDelete(site)} className="admin-sites-card-action admin-sites-card-action--delete">
        <Trash2 className="w-4 h-4 shrink-0" />
        {t('admin.users.delete')}
      </button>
    </div>
  </article>
);

export const SiteDirectoryAdmin: React.FC<SiteDirectoryAdminProps> = ({ onSitesChanged }) => {
  const { t, locale } = useI18n();
  const [sites, setSites] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FactoryType>('gok');
  const [activeContour, setActiveContour] = useState<'all' | 'inner' | 'outer'>('all');
  const [editing, setEditing] = useState<Factory | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Factory | null>(null);
  const [duplicatesReport, setDuplicatesReport] = useState<Awaited<ReturnType<typeof ApiService.getSiteDuplicatesReport>> | null>(null);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSitesAdmin();
      setSites(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDuplicates = useCallback(async () => {
    setDuplicatesLoading(true);
    try {
      const report = await ApiService.getSiteDuplicatesReport();
      setDuplicatesReport(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duplicates load failed');
    } finally {
      setDuplicatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSites();
    void loadDuplicates();
  }, [loadSites, loadDuplicates]);

  const innerCount = useMemo(() => sites.filter(s => s.is_ours).length, [sites]);
  const outerCount = useMemo(() => sites.filter(s => !s.is_ours).length, [sites]);

  const filtered = useMemo(
    () => sites.filter(s => {
      if (s.type !== activeCategory) return false;
      if (activeContour === 'inner' && !s.is_ours) return false;
      if (activeContour === 'outer' && s.is_ours) return false;
      return true;
    }),
    [sites, activeCategory, activeContour],
  );

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setError('');
  };

  const openEdit = (site: Factory) => {
    setCreating(false);
    setEditing(site);
    setError('');
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    await loadSites();
    await loadDuplicates();
    await onSitesChanged();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    try {
      await ApiService.deleteFactory(deleteTarget.id);
      setDeleteTarget(null);
      await loadSites();
      await loadDuplicates();
      await onSitesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const handleMergeDuplicates = async () => {
    setMerging(true);
    setError('');
    setMergeResult(null);
    try {
      const result = await ApiService.mergeSiteDuplicates();
      setMergeResult(t('siteDirectory.admin.mergeOk', {
        groups: result.merged_groups,
        deactivated: result.deactivated,
        aliases: result.aliases,
      }));
      await loadSites();
      await loadDuplicates();
      await onSitesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="admin-sites-page space-y-4">
      <div className="admin-section-toolbar admin-sites-toolbar">
        <p className="admin-section-hint">{t('siteDirectory.admin.subtitle')}</p>
        <div className="admin-sites-toolbar-actions flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { void loadSites(); void loadDuplicates(); }}
            className="admin-sites-toolbar-btn admin-sites-toolbar-btn--secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || duplicatesLoading ? 'animate-spin' : ''}`} />
            {t('siteDirectory.admin.refresh')}
          </button>
          <button
            type="button"
            onClick={() => void handleMergeDuplicates()}
            disabled={merging || (duplicatesReport?.total_groups ?? 0) === 0}
            className="admin-sites-toolbar-btn admin-sites-toolbar-btn--warn"
          >
            <GitMerge className={`w-3.5 h-3.5 ${merging ? 'animate-pulse' : ''}`} />
            {merging ? t('siteDirectory.admin.merging') : t('siteDirectory.admin.mergeDuplicates')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="admin-sites-toolbar-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('siteDirectory.admin.add')}
          </button>
        </div>
      </div>

      <div className="admin-sites-hint">
        <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p>{t('siteDirectory.admin.dbSourceHint')}</p>
      </div>

      {mergeResult ? (
        <div className="admin-alert admin-alert--success">{mergeResult}</div>
      ) : null}

      <div className="admin-sites-duplicates-panel space-y-3">
        <h4 className="admin-form-heading">
          <AlertTriangle />
          {t('siteDirectory.admin.duplicatesTitle')}
        </h4>
        {duplicatesLoading && !duplicatesReport ? (
          <p className="text-xs text-slate-500">{t('siteDirectory.admin.loading')}</p>
        ) : duplicatesReport && duplicatesReport.total_groups > 0 ? (
          <>
            <p className="text-xs text-amber-300">
              {t('siteDirectory.admin.duplicatesSummary', {
                groups: duplicatesReport.total_groups,
                rows: duplicatesReport.total_duplicate_rows,
              })}
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2 text-[11px]">
              {duplicatesReport.groups.slice(0, 8).map(group => (
                <div key={group.canonical_key} className="admin-sites-duplicates-item">
                  {group.sites.map(site => (
                    <div key={site.id} className="text-slate-300 flex flex-wrap gap-x-2">
                      <span className="text-white font-medium">{site.name}</span>
                      <span className="text-slate-500 font-mono">{site.id}</span>
                      <span className="text-slate-500">{t('siteDirectory.admin.colEdits')}: {site.edit_count}</span>
                      <span className="text-slate-500">{t('factories.routesCount', { count: site.link_refs })}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">{t('siteDirectory.admin.duplicatesEmpty')}</p>
        )}
      </div>

      <div className="admin-sites-contour-chips flex flex-wrap gap-2">
        {([
          ['all', t('siteDirectory.allContours'), sites.length] as const,
          ['inner', t('siteDirectory.contourInner'), innerCount] as const,
          ['outer', t('siteDirectory.contourOuter'), outerCount] as const,
        ]).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveContour(id)}
            className={`admin-sites-chip${activeContour === id ? ` is-active${id === 'inner' ? ' is-active--emerald' : id === 'outer' ? ' is-active--amber' : ''}` : ''}`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="admin-sites-category-chips flex flex-wrap gap-2">
        {SITE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`admin-sites-chip${activeCategory === cat.id ? ' is-active' : ''}`}
          >
            {getSiteCategoryLabel(cat.id, locale)} ({sites.filter(s => s.type === cat.id).length})
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
      )}

      <div className="admin-sites-table-panel overflow-x-auto responsive-table-wrap">
        <div className="admin-sites-table-desktop">
        <table>
          <thead>
            <tr>
              <th className="text-left p-3">{t('siteDirectory.colName')}</th>
              <th className="text-left p-3 hidden sm:table-cell">{t('siteDirectory.colContour')}</th>
              <th className="text-left p-3 hidden md:table-cell">{t('siteDirectory.colRegion')}</th>
              <th className="text-left p-3 hidden lg:table-cell">{t('siteDirectory.colCoords')}</th>
              <th className="text-left p-3 hidden sm:table-cell">{t('siteDirectory.admin.colEdits')}</th>
              <th className="text-left p-3 hidden sm:table-cell">{t('common.status')}</th>
              <th className="text-right p-3">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">{t('siteDirectory.admin.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">{t('siteDirectory.empty')}</td></tr>
            ) : filtered.map(site => (
              <tr key={site.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="text-white font-medium">{site.name}</div>
                  <div className="text-slate-500 font-mono text-[10px]">{site.id}</div>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${
                    site.is_ours
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {site.is_ours ? t('siteDirectory.contourInner') : t('siteDirectory.contourOuter')}
                  </span>
                </td>
                <td className="p-3 hidden md:table-cell text-slate-400">{site.region}</td>
                <td className="p-3 hidden lg:table-cell text-slate-500 font-mono">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </td>
                <td className="p-3 hidden sm:table-cell text-slate-400 font-mono">
                  {site.edit_count ?? 0}
                </td>
                <td className="p-3 hidden sm:table-cell">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    site.is_active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {site.is_active !== false ? t('siteDirectory.admin.active') : t('siteDirectory.admin.inactive')}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => openEdit(site)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(site)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="admin-sites-cards-mobile">
          {loading ? (
            <div className="admin-sites-empty">{t('siteDirectory.admin.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="admin-sites-empty">{t('siteDirectory.empty')}</div>
          ) : (
            filtered.map(site => (
              <SiteAdminCard key={site.id} site={site} t={t} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))
          )}
        </div>
      </div>

      {(creating || editing) && (
        <SiteDirectoryFormModal
          mode={creating ? 'create' : 'edit'}
          site={editing}
          defaultType={activeCategory}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteModalShell onClose={() => setDeleteTarget(null)}>
          <div className="flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header px-4 pb-3">
              <h3 className="admin-modal-title admin-modal-title--sm">{t('admin.users.deleteTitle')}</h3>
            </header>
            <div className="modal-panel-body px-4 py-2 flex-1">
              <p className="admin-modal-body-text">{t('siteDirectory.admin.deleteConfirm', { name: deleteTarget.name })}</p>
            </div>
            <footer className="admin-sites-delete-footer modal-panel-footer px-4 pt-2 pb-4">
              <button type="button" onClick={() => setDeleteTarget(null)} className="admin-modal-cancel admin-sites-btn-secondary flex-1 sm:flex-none">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={saving} className="admin-modal-submit admin-modal-submit--danger admin-sites-btn-danger flex-1 sm:flex-none">
                {t('admin.users.delete')}
              </button>
            </footer>
          </div>
        </DeleteModalShell>
      )}
    </div>
  );
};
