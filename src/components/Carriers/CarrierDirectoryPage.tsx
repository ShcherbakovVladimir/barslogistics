import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Truck, Plus, Pencil, Trash2, RefreshCw, Search, Copy, Plug, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import type {
  CarrierCategory,
  CarrierInput,
  CarrierIntegrationSpec,
  CarrierSettingsUpdate,
  ThirdPartyCarrier,
} from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { activeCarriers } from '../../constants/carriers';
import { CarrierConfigForm } from '../Integrations/IntegrationAdminForms';
import { HorizontalScrollChips } from '../UI/HorizontalScrollChips';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';

type CategoryFilter = 'all' | CarrierCategory;

const CATEGORIES: CarrierCategory[] = ['own', 'rzd', 'other'];

interface CarrierFormState {
  id: string;
  name: string;
  code: string;
  category: CarrierCategory;
  description: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm = (): CarrierFormState => ({
  id: '',
  name: '',
  code: '',
  category: 'other',
  description: '',
  sort_order: '0',
  is_active: true,
});

interface CarrierDirectoryPageProps {
  carriers: ThirdPartyCarrier[];
  canManage: boolean;
  onCarriersChanged: () => Promise<void>;
  onSyncCarrier?: (id: string) => Promise<void>;
  onSaveCarrierSettings?: (id: string, data: CarrierSettingsUpdate) => Promise<void>;
}

interface CarrierModalShellProps {
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const CarrierModalShell: React.FC<CarrierModalShellProps> = ({
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
        className={`carrier-directory-modal app-modal-sheet modal-panel ${maxWidthClass} ${isDragging ? 'is-sheet-dragging' : ''}`}
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

interface CarrierActionsProps {
  carrier: ThirdPartyCarrier;
  canManage: boolean;
  variant: 'table' | 'card';
  t: (key: string, params?: Record<string, string | number>) => string;
  onIntegration: (c: ThirdPartyCarrier) => void;
  onSync?: (id: string) => void;
  onEdit: (c: ThirdPartyCarrier) => void;
  onDelete: (c: ThirdPartyCarrier) => void;
}

const CarrierActions: React.FC<CarrierActionsProps> = ({
  carrier,
  canManage,
  variant,
  t,
  onIntegration,
  onSync,
  onEdit,
  onDelete,
}) => {
  if (variant === 'card') {
    return (
      <div className="carrier-directory-card-actions">
        <button
          type="button"
          onClick={() => onIntegration(carrier)}
          className="carrier-directory-card-action carrier-directory-card-action--integration"
        >
          <Plug className="w-4 h-4 shrink-0" />
          {t('carriers.integration')}
        </button>
        {canManage && onSync && carrier.api_endpoint && (
          <button
            type="button"
            onClick={() => void onSync(carrier.id)}
            className="carrier-directory-card-action carrier-directory-card-action--sync"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            {t('integrations.syncNow')}
          </button>
        )}
        {canManage && (
          <>
            <button
              type="button"
              onClick={() => onEdit(carrier)}
              className="carrier-directory-card-action carrier-directory-card-action--edit"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              {t('siteDirectory.admin.edit')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(carrier)}
              className="carrier-directory-card-action carrier-directory-card-action--delete"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              {t('carriers.delete')}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="carrier-directory-row-actions">
      <button
        type="button"
        onClick={() => onIntegration(carrier)}
        className="carrier-directory-row-icon-btn carrier-directory-row-icon-btn--integration"
        title={t('carriers.integration')}
        aria-label={t('carriers.integration')}
      >
        <Plug className="w-3.5 h-3.5" />
      </button>
      {canManage && onSync && carrier.api_endpoint && (
        <button
          type="button"
          onClick={() => void onSync(carrier.id)}
          className="carrier-directory-row-icon-btn carrier-directory-row-icon-btn--sync"
          title={t('integrations.syncNow')}
          aria-label={t('integrations.syncNow')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
      {canManage && (
        <>
          <button
            type="button"
            onClick={() => onEdit(carrier)}
            className="carrier-directory-row-icon-btn carrier-directory-row-icon-btn--edit"
            title={t('siteDirectory.admin.edit')}
            aria-label={t('siteDirectory.admin.edit')}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(carrier)}
            className="carrier-directory-row-icon-btn carrier-directory-row-icon-btn--delete"
            title={t('carriers.delete')}
            aria-label={t('carriers.delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

interface CarrierCardProps {
  carrier: ThirdPartyCarrier;
  canManage: boolean;
  t: CarrierActionsProps['t'];
  categoryBadge: (cat: CarrierCategory) => React.ReactNode;
  statusBadge: (c: ThirdPartyCarrier) => React.ReactNode;
  onIntegration: (c: ThirdPartyCarrier) => void;
  onSync?: (id: string) => void;
  onEdit: (c: ThirdPartyCarrier) => void;
  onDelete: (c: ThirdPartyCarrier) => void;
}

const CarrierCard: React.FC<CarrierCardProps> = ({
  carrier,
  canManage,
  t,
  categoryBadge,
  statusBadge,
  onIntegration,
  onSync,
  onEdit,
  onDelete,
}) => (
  <article className="carrier-directory-card">
    <div className="carrier-directory-card-header">
      <span className="carrier-directory-card-code">{carrier.code}</span>
      {statusBadge(carrier)}
    </div>
    <div className="carrier-directory-card-name">{carrier.name}</div>
    {carrier.description && (
      <div className="carrier-directory-card-description">{carrier.description}</div>
    )}
    <div className="carrier-directory-card-meta">
      {categoryBadge(carrier.category)}
      <span className="carrier-directory-card-shipments">
        {t('carriers.colShipments')}: {carrier.active_shipments_count}
      </span>
    </div>
    <CarrierActions
      carrier={carrier}
      canManage={canManage}
      variant="card"
      t={t}
      onIntegration={onIntegration}
      onSync={onSync}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  </article>
);

export const CarrierDirectoryPage: React.FC<CarrierDirectoryPageProps> = ({
  carriers,
  canManage,
  onCarriersChanged,
  onSyncCarrier,
  onSaveCarrierSettings,
}) => {
  const { t } = useI18n();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ThirdPartyCarrier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ThirdPartyCarrier | null>(null);
  const [form, setForm] = useState<CarrierFormState>(emptyForm);
  const [integrationCarrier, setIntegrationCarrier] = useState<ThirdPartyCarrier | null>(null);
  const [integrationSpec, setIntegrationSpec] = useState<CarrierIntegrationSpec | null>(null);
  const [externalDocs, setExternalDocs] = useState<Awaited<ReturnType<typeof ApiService.getExternalIntegrations>> | null>(null);
  const [showExternalDocs, setShowExternalDocs] = useState(true);
  const [copied, setCopied] = useState('');

  const baseList = useMemo(() => (showInactive ? carriers : activeCarriers(carriers)), [carriers, showInactive]);

  const counts = useMemo(() => ({
    own: baseList.filter(c => c.category === 'own').length,
    rzd: baseList.filter(c => c.category === 'rzd').length,
    other: baseList.filter(c => c.category === 'other').length,
  }), [baseList]);

  const filtered = useMemo(() => {
    let list = baseList;
    if (categoryFilter !== 'all') list = list.filter(c => c.category === categoryFilter);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c =>
      [c.id, c.name, c.code, c.description || ''].some(v => v.toLowerCase().includes(q)),
    );
  }, [baseList, categoryFilter, search]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await onCarriersChanged();
    } finally {
      setLoading(false);
    }
  }, [onCarriersChanged]);

  useEffect(() => {
    void handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    void ApiService.getExternalIntegrations().then(setExternalDocs).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c: ThirdPartyCarrier) => {
    setEditing(c);
    setForm({
      id: c.id,
      name: c.name,
      code: c.code,
      category: c.category,
      description: c.description || '',
      sort_order: String(c.sort_order ?? 0),
      is_active: c.is_active !== false,
    });
    setError('');
    setModalOpen(true);
  };

  const openIntegration = async (c: ThirdPartyCarrier) => {
    setIntegrationCarrier(c);
    setIntegrationSpec(null);
    try {
      const spec = await ApiService.getCarrierIntegration(c.id);
      setIntegrationSpec(spec);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('carriers.integrationLoadFailed'));
    }
  };

  const copyText = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.code.trim()) {
      setError(t('carriers.validationRequired'));
      return;
    }
    if (!editing && !form.id.trim()) {
      setError(t('carriers.validationRequired'));
      return;
    }

    setSaving(true);
    try {
      const sortOrder = Number(form.sort_order) || 0;
      if (editing) {
        await ApiService.updateCarrier(editing.id, {
          name: form.name.trim(),
          code: form.code.trim(),
          category: form.category,
          description: form.description.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        });
      } else {
        const input: CarrierInput = {
          id: form.id.trim(),
          name: form.name.trim(),
          code: form.code.trim(),
          category: form.category,
          description: form.description.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        };
        await ApiService.createCarrier(input);
      }
      setModalOpen(false);
      await onCarriersChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('carriers.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { soft } = await ApiService.deleteCarrier(deleteTarget.id);
      setDeleteTarget(null);
      await onCarriersChanged();
      if (soft) {
        setError(t('carriers.softDeleted'));
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('carriers.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const categoryBadge = (cat: CarrierCategory) => (
    <span className={`carrier-directory-category-badge carrier-directory-category-badge--${cat}`}>
      {t(`carriers.category.${cat}`)}
    </span>
  );

  const statusBadge = (c: ThirdPartyCarrier) => (
    <span className={`carrier-directory-status-badge ${
      c.status === 'error' ? 'carrier-directory-status-badge--error'
        : c.enabled === false ? 'carrier-directory-status-badge--off'
          : 'carrier-directory-status-badge--ok'
    }`}>
      {c.status === 'error' ? 'ERROR' : c.enabled === false ? 'OFF' : c.status.toUpperCase()}
    </span>
  );

  const categoryChips = ([
    ['all', t('carriers.allCategories'), baseList.length] as const,
    ['own', t('carriers.category.own'), counts.own] as const,
    ['rzd', t('carriers.category.rzd'), counts.rzd] as const,
    ['other', t('carriers.category.other'), counts.other] as const,
  ]).map(([id, label, count]) => (
    <button
      key={id}
      type="button"
      onClick={() => setCategoryFilter(id as CategoryFilter)}
      className={`carrier-directory-chip${categoryFilter === id ? ' is-active' : ''}${
        id !== 'all' ? ` carrier-directory-chip--${id}` : ''
      }`}
    >
      {label}
      <span>{count}</span>
    </button>
  ));

  const cardProps = {
    canManage,
    t,
    categoryBadge,
    statusBadge,
    onIntegration: (c: ThirdPartyCarrier) => void openIntegration(c),
    onSync: onSyncCarrier,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
  };

  return (
    <div className="carrier-directory-page">
      <div className="carrier-directory-toolbar shipments-list-toolbar">
        <div className="carrier-directory-toolbar-top">
          <div className="shipments-list-toolbar-head">
            <span className="shipments-list-toolbar-icon" aria-hidden>
              <Truck />
            </span>
            <div className="shipments-list-toolbar-text">
              <h2 className="shipments-list-title">
                <span className="truncate">{t('carriers.title')}</span>
              </h2>
              <p className="shipments-list-subtitle">{t('carriers.subtitle')}</p>
            </div>
          </div>
          <div className="carrier-directory-toolbar-actions">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="carrier-directory-toolbar-btn carrier-directory-toolbar-btn--refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('carriers.refresh')}
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="carrier-directory-toolbar-btn carrier-directory-toolbar-btn--add"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('carriers.add')}
              </button>
            )}
          </div>
        </div>

        <div className="carrier-directory-filter-block">
          <div className="carrier-directory-filter-label">{t('carriers.colCategory')}</div>
          <HorizontalScrollChips>{categoryChips}</HorizontalScrollChips>
        </div>

        <div className="carrier-directory-filters-grid shipments-list-filters-grid">
          <div className="carrier-directory-search shipments-list-search">
            <Search aria-hidden />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('carriers.searchPlaceholder')}
            />
          </div>
          {canManage && (
            <label className="carrier-directory-inactive-toggle">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              {t('carriers.showInactive')}
            </label>
          )}
        </div>
      </div>

      {error && !modalOpen && !deleteTarget && !integrationCarrier && (
        <div className="carrier-directory-alert">{error}</div>
      )}

      <div className="carrier-directory-results-bar">
        {t('carriers.results', { count: filtered.length })}
      </div>

      <div className="carrier-directory-table-panel">
        <div className="carrier-directory-table-head-bar">
          {t('carriers.results', { count: filtered.length })}
        </div>
        <div className="carrier-directory-table-desktop responsive-table-wrap">
          <table className="carrier-directory-table">
            <thead>
              <tr>
                <th>{t('carriers.colName')}</th>
                <th className="carrier-directory-col-code">{t('carriers.colCode')}</th>
                <th>{t('carriers.colCategory')}</th>
                <th className="carrier-directory-col-status">{t('carriers.colStatus')}</th>
                <th className="carrier-directory-col-shipments">{t('carriers.colShipments')}</th>
                <th className="carrier-directory-col-actions">{t('carriers.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="carrier-directory-table-empty">{t('carriers.empty')}</td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="carrier-directory-cell-name">{c.name}</div>
                      {c.description && (
                        <div className="carrier-directory-cell-description">{c.description}</div>
                      )}
                    </td>
                    <td className="carrier-directory-col-code">
                      <span className="carrier-directory-cell-code">{c.code}</span>
                    </td>
                    <td>{categoryBadge(c.category)}</td>
                    <td className="carrier-directory-col-status">{statusBadge(c)}</td>
                    <td className="carrier-directory-col-shipments carrier-directory-cell-shipments">
                      {c.active_shipments_count}
                    </td>
                    <td className="carrier-directory-col-actions">
                      <CarrierActions
                        carrier={c}
                        canManage={canManage}
                        variant="table"
                        t={t}
                        onIntegration={c => void openIntegration(c)}
                        onSync={onSyncCarrier}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="carrier-directory-cards-mobile">
        {filtered.length === 0 ? (
          <div className="carrier-directory-empty">{t('carriers.empty')}</div>
        ) : (
          filtered.map(c => <CarrierCard key={c.id} carrier={c} {...cardProps} />)
        )}
      </div>

      <div className="carrier-directory-external-panel">
        <button
          type="button"
          onClick={() => setShowExternalDocs(v => !v)}
          className="carrier-directory-external-toggle"
        >
          <div className="carrier-directory-external-toggle-text">
            <h3>{t('carriers.externalIntegrationTitle')}</h3>
            <p>{t('carriers.externalIntegrationSubtitle')}</p>
          </div>
          <span className="carrier-directory-external-toggle-chevron">
            {showExternalDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
        {showExternalDocs && externalDocs && (
          <div className="carrier-directory-external-body">
            <p className="carrier-directory-external-auth">{externalDocs.auth}</p>
            <div className="carrier-directory-external-url carrier-directory-external-url--openapi">{externalDocs.openapi_url}</div>
            <div className="carrier-directory-external-url carrier-directory-external-url--ws">{externalDocs.websocket}</div>
            <div className="carrier-directory-endpoint-list">
              {externalDocs.endpoints.map(ep => (
                <div key={ep.path} className="carrier-directory-endpoint-row">
                  <span className="carrier-directory-endpoint-method">{ep.method} {ep.path}</span>
                  <span className="carrier-directory-endpoint-desc">{ep.description}</span>
                  <button
                    type="button"
                    onClick={() => copyText(`${ep.method} ${ep.path}`, ep.path)}
                    className="carrier-directory-endpoint-copy"
                  >
                    <Copy className="w-3 h-3" />
                    {copied === ep.path ? t('integrations.copied') : t('integrations.copyCurl')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {integrationCarrier && (
        <CarrierModalShell onClose={() => { setIntegrationCarrier(null); setIntegrationSpec(null); }}>
          <header className="modal-panel-header app-modal-sheet-header">
            <div className="carrier-directory-modal-head">
              <div className="min-w-0">
                <h3 className="carrier-directory-modal-title">
                  {t('carriers.integrationTitle', { name: integrationCarrier.name })}
                </h3>
                <p className="carrier-directory-modal-subtitle">{t('carriers.integrationHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => { setIntegrationCarrier(null); setIntegrationSpec(null); }}
                className="carrier-directory-modal-close-btn"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>
          <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
            {!integrationSpec ? (
              <div className="carrier-directory-modal-loading">{t('siteDirectory.admin.loading')}</div>
            ) : (
              <div className="carrier-directory-spec-list">
                {([
                  ['API endpoint', integrationSpec.api_endpoint || '—'],
                  ['Auth', integrationSpec.auth_type],
                  ['JSON path', integrationSpec.sync_path || '(root)'],
                  ['Pull sync', `${integrationSpec.pull_sync_url} {"carrier_id":"${integrationSpec.id}"}`],
                  ['Telemetry push', integrationSpec.telemetry_push_url],
                  ['Webhook', integrationSpec.telemetry_webhook_url],
                  ['OpenAPI', integrationSpec.openapi_url],
                ] as const).map(([label, value]) => (
                  <div key={label} className="carrier-directory-spec-block">
                    <div className="carrier-directory-spec-label">{label}</div>
                    <div className="carrier-directory-spec-value">{value}</div>
                    <button
                      type="button"
                      onClick={() => copyText(String(value), label)}
                      className="carrier-directory-spec-copy"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === label ? t('integrations.copied') : t('integrations.copyCurl')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canManage && onSaveCarrierSettings && integrationCarrier && integrationSpec && (
              <div className="carrier-directory-modal-divider">
                <CarrierConfigForm carrier={integrationCarrier} onSave={onSaveCarrierSettings} />
              </div>
            )}
          </div>
        </CarrierModalShell>
      )}

      {modalOpen && (
        <CarrierModalShell onClose={() => setModalOpen(false)} maxWidthClass="max-w-md">
          <form onSubmit={handleSave} className="carrier-directory-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header">
              <div className="carrier-directory-modal-head">
                <h3 className="carrier-directory-modal-title">
                  {editing ? t('carriers.editTitle') : t('carriers.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="carrier-directory-modal-close-btn"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
              {error && <p className="carrier-directory-form-error">{error}</p>}
              {!editing && (
                <label className="carrier-directory-form-field">
                  <span className="carrier-directory-form-label">ID</span>
                  <input
                    required
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="c_example"
                    className="carrier-directory-field carrier-directory-field--mono"
                  />
                </label>
              )}
              <label className="carrier-directory-form-field">
                <span className="carrier-directory-form-label">{t('carriers.colName')}</span>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="carrier-directory-field" />
              </label>
              <label className="carrier-directory-form-field">
                <span className="carrier-directory-form-label">{t('carriers.colCode')}</span>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="carrier-directory-field carrier-directory-field--mono" />
              </label>
              <label className="carrier-directory-form-field">
                <span className="carrier-directory-form-label">{t('carriers.colCategory')}</span>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as CarrierCategory }))}
                  className="carrier-directory-field"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{t(`carriers.category.${cat}`)}</option>
                  ))}
                </select>
              </label>
              <label className="carrier-directory-form-field">
                <span className="carrier-directory-form-label">{t('carriers.description')}</span>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="carrier-directory-field" />
              </label>
              <label className="carrier-directory-form-checkbox">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                {t('carriers.active')}
              </label>
            </div>
            <footer className="carrier-directory-form-modal-footer modal-panel-footer">
              <button type="button" onClick={() => setModalOpen(false)} className="carrier-directory-form-cancel">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="carrier-directory-form-submit">
                {saving ? t('admin.users.saving') : t('admin.users.save')}
              </button>
            </footer>
          </form>
        </CarrierModalShell>
      )}

      {deleteTarget && (
        <CarrierModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-sm">
          <header className="modal-panel-header app-modal-sheet-header">
            <h3 className="carrier-directory-modal-title">{t('carriers.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body">
            <p className="carrier-directory-modal-text">{t('carriers.deleteConfirm', { name: deleteTarget.name })}</p>
          </div>
          <footer className="carrier-directory-form-modal-footer modal-panel-footer">
            <button type="button" onClick={() => setDeleteTarget(null)} className="carrier-directory-form-cancel">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="carrier-directory-form-delete"
            >
              {t('carriers.delete')}
            </button>
          </footer>
        </CarrierModalShell>
      )}
    </div>
  );
};
