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

const categoryBadgeStyles: Record<CarrierCategory, string> = {
  own: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rzd: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  other: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

const fieldClass =
  'carrier-directory-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

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
        className={`carrier-directory-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidthClass} shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
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
    <div className="flex justify-end gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => onIntegration(carrier)}
        className="px-2 py-1 rounded-lg text-xs text-cyan-400 hover:bg-slate-800 flex items-center gap-1"
      >
        <Plug className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('carriers.integration')}</span>
      </button>
      {canManage && onSync && carrier.api_endpoint && (
        <button
          type="button"
          onClick={() => void onSync(carrier.id)}
          className="px-2 py-1 rounded-lg text-xs text-indigo-400 hover:bg-slate-800"
        >
          {t('integrations.syncNow')}
        </button>
      )}
      {canManage && (
        <>
          <button
            type="button"
            onClick={() => onEdit(carrier)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(carrier)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
          >
            <Trash2 className="w-4 h-4" />
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
    <span className={`carrier-directory-category-badge text-xs px-2 py-0.5 rounded border ${categoryBadgeStyles[cat]}`}>
      {t(`carriers.category.${cat}`)}
    </span>
  );

  const statusBadge = (c: ThirdPartyCarrier) => (
    <span className={`carrier-directory-status-badge text-xs px-2 py-0.5 rounded border ${
      c.status === 'error' ? 'carrier-directory-status-badge--error bg-red-500/10 text-red-400 border-red-500/30'
        : c.enabled === false ? 'carrier-directory-status-badge--off bg-slate-500/10 text-slate-400 border-slate-500/30'
          : 'carrier-directory-status-badge--ok bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
      className={`carrier-directory-chip px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
        categoryFilter === id
          ? 'bg-indigo-600 text-white border-indigo-500'
          : id === 'all'
            ? 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
            : `${categoryBadgeStyles[id as CarrierCategory]} hover:opacity-90`
      }`}
    >
      {label} ({count})
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
    <div className="carrier-directory-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="carrier-directory-toolbar shipments-list-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="carrier-directory-toolbar-head flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{t('carriers.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('carriers.subtitle')}</p>
          </div>
          <div className="carrier-directory-toolbar-actions flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="carrier-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('carriers.refresh')}
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="carrier-directory-toolbar-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('carriers.add')}
              </button>
            )}
          </div>
        </div>

        <div className="carrier-directory-filter-block space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('carriers.colCategory')}
          </div>
          <HorizontalScrollChips>{categoryChips}</HorizontalScrollChips>
        </div>

        <div className="carrier-directory-filters-grid">
          <div className="carrier-directory-search flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-h-[2.75rem] sm:min-h-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('carriers.searchPlaceholder')}
              className="bg-transparent text-sm text-white w-full min-w-0 outline-none placeholder:text-slate-500"
            />
          </div>
          {canManage && (
            <label className="carrier-directory-inactive-toggle flex items-center gap-2 text-xs text-slate-400 px-1 min-h-[2.75rem] sm:min-h-0">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded border-slate-600"
              />
              {t('carriers.showInactive')}
            </label>
          )}
        </div>
      </div>

      {error && !modalOpen && !deleteTarget && !integrationCarrier && (
        <div className="carrier-directory-alert text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="carrier-directory-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="carrier-directory-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[32rem] xl:min-w-[40rem]">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left p-3">{t('carriers.colName')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('carriers.colCode')}</th>
                <th className="text-left p-3">{t('carriers.colCategory')}</th>
                <th className="text-left p-3 hidden md:table-cell">{t('carriers.colStatus')}</th>
                <th className="text-left p-3 hidden lg:table-cell">{t('carriers.colShipments')}</th>
                <th className="text-right p-3">{t('carriers.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">{t('carriers.empty')}</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-medium text-white">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400 hidden sm:table-cell">{c.code}</td>
                    <td className="p-3">{categoryBadge(c.category)}</td>
                    <td className="p-3 hidden md:table-cell">{statusBadge(c)}</td>
                    <td className="p-3 text-slate-400 hidden lg:table-cell">{c.active_shipments_count}</td>
                    <td className="p-3">
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

      <div className="carrier-directory-external-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExternalDocs(v => !v)}
          className="carrier-directory-external-toggle w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 min-h-[3rem]"
        >
          <div className="min-w-0 pr-3">
            <h3 className="font-bold text-white text-sm">{t('carriers.externalIntegrationTitle')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('carriers.externalIntegrationSubtitle')}</p>
          </div>
          {showExternalDocs ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>
        {showExternalDocs && externalDocs && (
          <div className="carrier-directory-external-body px-4 pb-4 space-y-3 border-t border-slate-800 pt-4 text-xs">
            <p className="text-slate-400">{externalDocs.auth}</p>
            <div className="font-mono text-cyan-400 break-all">{externalDocs.openapi_url}</div>
            <div className="font-mono text-blue-400 break-all">{externalDocs.websocket}</div>
            <div className="grid gap-2">
              {externalDocs.endpoints.map(ep => (
                <div key={ep.path} className="carrier-directory-endpoint-row p-2 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-mono text-emerald-400 shrink-0 break-all">{ep.method} {ep.path}</span>
                  <span className="text-slate-400">{ep.description}</span>
                  <button
                    type="button"
                    onClick={() => copyText(`${ep.method} ${ep.path}`, ep.path)}
                    className="sm:ml-auto text-slate-500 hover:text-white flex items-center gap-1 min-h-[2.5rem] sm:min-h-0"
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
          <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-white break-words">
                  {t('carriers.integrationTitle', { name: integrationCarrier.name })}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('carriers.integrationHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => { setIntegrationCarrier(null); setIntegrationSpec(null); }}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>
          <div className="modal-panel-body modal-scrollbar px-4 pb-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
            {!integrationSpec ? (
              <div className="text-slate-500 text-sm">{t('siteDirectory.admin.loading')}</div>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {([
                  ['API endpoint', integrationSpec.api_endpoint || '—'],
                  ['Auth', integrationSpec.auth_type],
                  ['JSON path', integrationSpec.sync_path || '(root)'],
                  ['Pull sync', `${integrationSpec.pull_sync_url} {"carrier_id":"${integrationSpec.id}"}`],
                  ['Telemetry push', integrationSpec.telemetry_push_url],
                  ['Webhook', integrationSpec.telemetry_webhook_url],
                  ['OpenAPI', integrationSpec.openapi_url],
                ] as const).map(([label, value]) => (
                  <div key={label} className="carrier-directory-spec-block p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-500 mb-1">{label}</div>
                    <div className="text-slate-200 break-all">{value}</div>
                    <button
                      type="button"
                      onClick={() => copyText(String(value), label)}
                      className="mt-1 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 min-h-[2.5rem]"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === label ? t('integrations.copied') : t('integrations.copyCurl')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canManage && onSaveCarrierSettings && integrationCarrier && integrationSpec && (
              <div className="border-t border-slate-800 pt-3">
                <CarrierConfigForm carrier={integrationCarrier} onSave={onSaveCarrierSettings} />
              </div>
            )}
          </div>
        </CarrierModalShell>
      )}

      {modalOpen && (
        <CarrierModalShell onClose={() => setModalOpen(false)} maxWidthClass="max-w-md">
          <form onSubmit={handleSave} className="carrier-directory-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white break-words">
                  {editing ? t('carriers.editTitle') : t('carriers.addTitle')}
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
              {error && <p className="text-sm text-red-400">{error}</p>}
              {!editing && (
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">ID</span>
                  <input
                    required
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="c_example"
                    className={`${fieldClass} font-mono`}
                  />
                </label>
              )}
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('carriers.colName')}</span>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('carriers.colCode')}</span>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={`${fieldClass} font-mono`} />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('carriers.colCategory')}</span>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as CarrierCategory }))}
                  className={fieldClass}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{t(`carriers.category.${cat}`)}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('carriers.description')}</span>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={fieldClass} />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 min-h-[2.75rem] sm:min-h-0">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-600" />
                {t('carriers.active')}
              </label>
            </div>
            <footer className="carrier-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0">
                {saving ? t('admin.users.saving') : t('admin.users.save')}
              </button>
            </footer>
          </form>
        </CarrierModalShell>
      )}

      {deleteTarget && (
        <CarrierModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-sm">
          <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
            <h3 className="font-bold text-white">{t('carriers.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body px-4 pb-2">
            <p className="text-sm text-slate-400">{t('carriers.deleteConfirm', { name: deleteTarget.name })}</p>
          </div>
          <footer className="carrier-directory-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
            >
              {t('carriers.delete')}
            </button>
          </footer>
        </CarrierModalShell>
      )}
    </div>
  );
};
