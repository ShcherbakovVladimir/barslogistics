import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCircle, Plus, Pencil, Trash2, RefreshCw, Search, X } from 'lucide-react';
import type { SalesManager, SalesManagerInput } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { activeSalesManagers } from '../../constants/salesManagers';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';

interface ManagerFormState {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  position: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm = (): ManagerFormState => ({
  id: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  position: '',
  sort_order: '0',
  is_active: true,
});

const fieldClass =
  'manager-directory-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem] placeholder:text-slate-500';

interface ManagerDirectoryPageProps {
  managers: SalesManager[];
  canManage: boolean;
  onManagersChanged: () => Promise<void>;
}

interface ManagerModalShellProps {
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const ManagerModalShell: React.FC<ManagerModalShellProps> = ({
  onClose,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`manager-directory-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidthClass} shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        {children}
      </div>
    </div>
  );
};

interface ManagerCardProps {
  manager: SalesManager;
  canManage: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (m: SalesManager) => void;
  onDelete: (m: SalesManager) => void;
  statusBadge: (m: SalesManager) => React.ReactNode;
}

const ManagerCard: React.FC<ManagerCardProps> = ({
  manager,
  canManage,
  t,
  onEdit,
  onDelete,
  statusBadge,
}) => (
  <article className="manager-directory-card">
    <div className="manager-directory-card-header">
      <span className="manager-directory-card-id">{manager.id}</span>
      {statusBadge(manager)}
    </div>
    <div className="manager-directory-card-name">{manager.full_name}</div>
    {manager.position && (
      <div className="manager-directory-card-position">{manager.position}</div>
    )}
    <div className="manager-directory-card-meta">
      <span className="manager-directory-card-order">
        {t('managers.colOrder')}: {manager.sort_order ?? 0}
      </span>
    </div>
    {canManage && (
      <div className="manager-directory-card-actions">
        <button
          type="button"
          onClick={() => onEdit(manager)}
          className="manager-directory-card-action manager-directory-card-action--edit"
        >
          <Pencil className="w-4 h-4 shrink-0" />
          {t('managers.edit')}
        </button>
        <button
          type="button"
          onClick={() => onDelete(manager)}
          className="manager-directory-card-action manager-directory-card-action--delete"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          {t('managers.delete')}
        </button>
      </div>
    )}
  </article>
);

export const ManagerDirectoryPage: React.FC<ManagerDirectoryPageProps> = ({
  managers,
  canManage,
  onManagersChanged,
}) => {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalesManager | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesManager | null>(null);
  const [form, setForm] = useState<ManagerFormState>(emptyForm);

  const displayList = useMemo(() => {
    const base = showInactive ? managers : activeSalesManagers(managers);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(m =>
      [m.id, m.full_name, m.last_name, m.first_name, m.middle_name, m.position].some(
        v => (v || '').toLowerCase().includes(q),
      ),
    );
  }, [managers, search, showInactive]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (manager: SalesManager) => {
    setEditing(manager);
    setForm({
      id: manager.id,
      last_name: manager.last_name,
      first_name: manager.first_name,
      middle_name: manager.middle_name || '',
      position: manager.position || '',
      sort_order: String(manager.sort_order ?? 0),
      is_active: manager.is_active !== false,
    });
    setError('');
    setModalOpen(true);
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await onManagersChanged();
    } finally {
      setLoading(false);
    }
  }, [onManagersChanged]);

  useEffect(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.last_name.trim() || !form.first_name.trim()) {
      setError(t('managers.validationRequired'));
      return;
    }
    if (!editing && !form.id.trim()) {
      setError(t('managers.validationRequired'));
      return;
    }

    setSaving(true);
    try {
      const sortOrder = Number(form.sort_order) || 0;
      if (editing) {
        await ApiService.updateSalesManager(editing.id, {
          last_name: form.last_name.trim(),
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim(),
          position: form.position.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        });
      } else {
        const input: SalesManagerInput = {
          id: form.id.trim(),
          last_name: form.last_name.trim(),
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim(),
          position: form.position.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        };
        await ApiService.createSalesManager(input);
      }
      setModalOpen(false);
      await onManagersChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managers.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { soft } = await ApiService.deleteSalesManager(deleteTarget.id);
      setDeleteTarget(null);
      await onManagersChanged();
      if (soft) {
        setError(t('managers.softDeleted'));
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managers.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (manager: SalesManager) => (
    <span className={`manager-status-badge text-xs px-2 py-0.5 rounded border ${
      manager.is_active !== false
        ? 'manager-status-active bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'manager-status-inactive bg-slate-500/10 text-slate-400 border-slate-500/30'
    }`}>
      {manager.is_active !== false ? t('managers.active') : t('managers.inactive')}
    </span>
  );

  const cardProps = {
    canManage,
    t,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    statusBadge,
  };

  return (
    <div className="manager-directory-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="manager-directory-toolbar shipments-list-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="manager-directory-toolbar-head flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{t('managers.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('managers.subtitle')}</p>
          </div>
          <div className="manager-directory-toolbar-actions flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="manager-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('managers.refresh')}
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="manager-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('managers.add')}
              </button>
            )}
          </div>
        </div>

        <div className="manager-directory-filters-grid">
          <div className="manager-directory-search flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-h-[2.75rem] sm:min-h-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('managers.searchPlaceholder')}
              className="bg-transparent text-sm text-white w-full min-w-0 outline-none placeholder:text-slate-500"
            />
          </div>
          {canManage && (
            <label className="manager-directory-inactive-toggle flex items-center gap-2 text-xs text-slate-400 px-1 min-h-[2.75rem] sm:min-h-0">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded border-slate-600"
              />
              {t('managers.showInactive')}
            </label>
          )}
        </div>

        <p className="manager-directory-results text-xs text-slate-500">
          {t('managers.results', { count: displayList.length })}
        </p>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="manager-directory-alert text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="manager-directory-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="manager-directory-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[40rem]">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left p-3">{t('managers.colLastName')}</th>
                <th className="text-left p-3">{t('managers.colFirstName')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('managers.colMiddleName')}</th>
                <th className="text-left p-3">{t('managers.colPosition')}</th>
                <th className="text-left p-3 hidden md:table-cell">{t('managers.colStatus')}</th>
                {canManage && <th className="text-right p-3">{t('managers.colActions')}</th>}
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="p-6 text-center text-slate-500">
                    {t('managers.empty')}
                  </td>
                </tr>
              ) : displayList.map(manager => (
                <tr key={manager.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-white">{manager.last_name}</td>
                  <td className="p-3 text-slate-300">{manager.first_name}</td>
                  <td className="p-3 text-slate-400 hidden sm:table-cell">{manager.middle_name || '—'}</td>
                  <td className="p-3 text-slate-300 max-w-xs">{manager.position || '—'}</td>
                  <td className="p-3 hidden md:table-cell">{statusBadge(manager)}</td>
                  {canManage && (
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(manager)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title={t('managers.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(manager)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          title={t('managers.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="manager-directory-cards-mobile">
        {displayList.length === 0 ? (
          <div className="manager-directory-empty">{t('managers.empty')}</div>
        ) : (
          displayList.map(manager => (
            <ManagerCard key={manager.id} manager={manager} {...cardProps} />
          ))
        )}
      </div>

      {modalOpen && canManage && (
        <ManagerModalShell onClose={() => setModalOpen(false)}>
          <form onSubmit={e => void handleSave(e)} className="manager-directory-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white break-words">
                  {editing ? t('managers.editTitle') : t('managers.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar px-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
              )}
              {!editing && (
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('managers.colId')}</span>
                  <input
                    value={form.id}
                    onChange={e => setForm(prev => ({ ...prev, id: e.target.value }))}
                    className={`${fieldClass} font-mono`}
                    placeholder="mgr_ivanov_ai"
                  />
                  <span className="text-[10px] text-slate-500">{t('managers.idHint')}</span>
                </label>
              )}
              <div className="manager-directory-form-grid grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('managers.colLastName')}</span>
                  <input
                    required
                    value={form.last_name}
                    onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('managers.colFirstName')}</span>
                  <input
                    required
                    value={form.first_name}
                    onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('managers.colMiddleName')}</span>
                  <input
                    value={form.middle_name}
                    onChange={e => setForm(prev => ({ ...prev, middle_name: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
              </div>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('managers.colPosition')}</span>
                <input
                  value={form.position}
                  onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
                  className={fieldClass}
                />
              </label>
              <div className="manager-directory-form-meta grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('managers.colOrder')}</span>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 min-h-[2.75rem] sm:min-h-0 sm:pb-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-slate-600"
                  />
                  {t('managers.active')}
                </label>
              </div>
            </div>
            <footer className="manager-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 min-h-[2.75rem] sm:min-h-0"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
              >
                {saving ? t('myData.saving') : t('myData.save')}
              </button>
            </footer>
          </form>
        </ManagerModalShell>
      )}

      {deleteTarget && canManage && (
        <ManagerModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-md">
          <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
            <h3 className="font-bold text-white">{t('managers.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body px-4 pb-2 space-y-2">
            <p className="text-sm text-slate-300">{t('managers.deleteConfirm', { name: deleteTarget.full_name })}</p>
            <p className="text-xs text-slate-500">{t('managers.deleteHint')}</p>
          </div>
          <footer className="manager-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 min-h-[2.75rem] sm:min-h-0"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleDelete()}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
            >
              {t('managers.delete')}
            </button>
          </footer>
        </ManagerModalShell>
      )}
    </div>
  );
};
