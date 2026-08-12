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
        className={`manager-directory-modal app-modal-sheet modal-panel ${maxWidthClass} ${isDragging ? 'is-sheet-dragging' : ''}`}
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

interface ManagerActionsProps {
  manager: SalesManager;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (m: SalesManager) => void;
  onDelete: (m: SalesManager) => void;
  variant: 'table' | 'card';
}

const ManagerActions: React.FC<ManagerActionsProps> = ({
  manager,
  t,
  onEdit,
  onDelete,
  variant,
}) => {
  if (variant === 'card') {
    return (
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
    );
  }

  return (
    <div className="manager-directory-row-actions">
      <button
        type="button"
        onClick={() => onEdit(manager)}
        className="manager-directory-row-icon-btn manager-directory-row-icon-btn--edit"
        title={t('managers.edit')}
        aria-label={t('managers.edit')}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(manager)}
        className="manager-directory-row-icon-btn manager-directory-row-icon-btn--delete"
        title={t('managers.delete')}
        aria-label={t('managers.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
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
      <ManagerActions
        manager={manager}
        t={t}
        onEdit={onEdit}
        onDelete={onDelete}
        variant="card"
      />
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
    <span className={`manager-directory-status-badge ${
      manager.is_active !== false
        ? 'manager-directory-status-badge--active'
        : 'manager-directory-status-badge--inactive'
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
    <div className="manager-directory-page">
      <div className="manager-directory-toolbar shipments-list-toolbar">
        <div className="manager-directory-toolbar-top">
          <div className="shipments-list-toolbar-head">
            <span className="shipments-list-toolbar-icon" aria-hidden>
              <UserCircle />
            </span>
            <div className="shipments-list-toolbar-text">
              <h2 className="shipments-list-title">
                <span className="truncate">{t('managers.title')}</span>
              </h2>
              <p className="shipments-list-subtitle">{t('managers.subtitle')}</p>
            </div>
          </div>
          <div className="manager-directory-toolbar-actions">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="manager-directory-toolbar-btn manager-directory-toolbar-btn--refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('managers.refresh')}
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="manager-directory-toolbar-btn manager-directory-toolbar-btn--add"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('managers.add')}
              </button>
            )}
          </div>
        </div>

        <div className="manager-directory-filters-grid shipments-list-filters-grid">
          <div className="manager-directory-search shipments-list-search">
            <Search aria-hidden />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('managers.searchPlaceholder')}
            />
          </div>
          {canManage && (
            <label className="manager-directory-inactive-toggle">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              {t('managers.showInactive')}
            </label>
          )}
        </div>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="manager-directory-alert">{error}</div>
      )}

      <div className="manager-directory-results-bar">
        {t('managers.results', { count: displayList.length })}
      </div>

      <div className="manager-directory-table-panel">
        <div className="manager-directory-table-head-bar">
          {t('managers.results', { count: displayList.length })}
        </div>
        <div className="manager-directory-table-desktop responsive-table-wrap">
          <table className="manager-directory-table">
            <thead>
              <tr>
                <th>{t('managers.colLastName')}</th>
                <th>{t('managers.colFirstName')}</th>
                <th className="manager-directory-col-middle">{t('managers.colMiddleName')}</th>
                <th>{t('managers.colPosition')}</th>
                <th className="manager-directory-col-status">{t('managers.colStatus')}</th>
                {canManage && (
                  <th className="manager-directory-col-actions">{t('managers.colActions')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="manager-directory-table-empty">
                    {t('managers.empty')}
                  </td>
                </tr>
              ) : (
                displayList.map(manager => (
                  <tr key={manager.id}>
                    <td>
                      <div className="manager-directory-cell-last">{manager.last_name}</div>
                    </td>
                    <td>
                      <div className="manager-directory-cell-first">{manager.first_name}</div>
                    </td>
                    <td className="manager-directory-col-middle">
                      <div className="manager-directory-cell-middle">{manager.middle_name || '—'}</div>
                    </td>
                    <td>
                      <div className="manager-directory-cell-position">{manager.position || '—'}</div>
                    </td>
                    <td className="manager-directory-col-status">{statusBadge(manager)}</td>
                    {canManage && (
                      <td className="manager-directory-col-actions">
                        <ManagerActions
                          manager={manager}
                          t={t}
                          onEdit={openEdit}
                          onDelete={setDeleteTarget}
                          variant="table"
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
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
            <header className="modal-panel-header app-modal-sheet-header">
              <div className="manager-directory-modal-head">
                <h3 className="manager-directory-modal-title">
                  {editing ? t('managers.editTitle') : t('managers.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="manager-directory-modal-close-btn"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
              {error && <p className="manager-directory-form-error">{error}</p>}
              {!editing && (
                <label className="manager-directory-form-field">
                  <span className="manager-directory-form-label">{t('managers.colId')}</span>
                  <input
                    value={form.id}
                    onChange={e => setForm(prev => ({ ...prev, id: e.target.value }))}
                    className="manager-directory-field manager-directory-field--mono"
                    placeholder="mgr_ivanov_ai"
                  />
                  <span className="manager-directory-form-hint">{t('managers.idHint')}</span>
                </label>
              )}
              <div className="manager-directory-form-grid">
                <label className="manager-directory-form-field">
                  <span className="manager-directory-form-label">{t('managers.colLastName')}</span>
                  <input
                    required
                    value={form.last_name}
                    onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="manager-directory-field"
                  />
                </label>
                <label className="manager-directory-form-field">
                  <span className="manager-directory-form-label">{t('managers.colFirstName')}</span>
                  <input
                    required
                    value={form.first_name}
                    onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="manager-directory-field"
                  />
                </label>
                <label className="manager-directory-form-field">
                  <span className="manager-directory-form-label">{t('managers.colMiddleName')}</span>
                  <input
                    value={form.middle_name}
                    onChange={e => setForm(prev => ({ ...prev, middle_name: e.target.value }))}
                    className="manager-directory-field"
                  />
                </label>
              </div>
              <label className="manager-directory-form-field">
                <span className="manager-directory-form-label">{t('managers.colPosition')}</span>
                <input
                  value={form.position}
                  onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
                  className="manager-directory-field"
                />
              </label>
              <div className="manager-directory-form-meta">
                <label className="manager-directory-form-field">
                  <span className="manager-directory-form-label">{t('managers.colOrder')}</span>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                    className="manager-directory-field"
                  />
                </label>
                <label className="manager-directory-form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  {t('managers.active')}
                </label>
              </div>
            </div>
            <footer className="manager-directory-form-modal-footer modal-panel-footer">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="manager-directory-form-cancel"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="manager-directory-form-submit"
              >
                {saving ? t('myData.saving') : t('myData.save')}
              </button>
            </footer>
          </form>
        </ManagerModalShell>
      )}

      {deleteTarget && canManage && (
        <ManagerModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-md">
          <header className="modal-panel-header app-modal-sheet-header">
            <h3 className="manager-directory-modal-title">{t('managers.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body">
            <p className="manager-directory-modal-text">
              {t('managers.deleteConfirm', { name: deleteTarget.full_name })}
            </p>
            <p className="manager-directory-modal-hint">{t('managers.deleteHint')}</p>
          </div>
          <footer className="manager-directory-form-modal-footer modal-panel-footer">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="manager-directory-form-cancel"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleDelete()}
              className="manager-directory-form-delete"
            >
              {t('managers.delete')}
            </button>
          </footer>
        </ManagerModalShell>
      )}
    </div>
  );
};
