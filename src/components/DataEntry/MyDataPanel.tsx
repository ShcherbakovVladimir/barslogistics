import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Save, History, Upload, ClipboardList, X, Download } from 'lucide-react';
import type {
  Factory,
  SupplyLink,
  User,
  CargoStatus,
  FlowType,
  Product,
  ThirdPartyCarrier,
  ShipmentImportBatch,
  ShipmentImportResult,
  SalesManager,
} from '../../types';
import { activeProducts } from '../../constants/products';
import { activeCarriers } from '../../constants/carriers';
import { activeSalesManagers, salesManagerLabel } from '../../constants/salesManagers';
import { useI18n } from '../../i18n';
import { canSeeDealAmount, canUploadData } from '../../utils/permissions';
import { ApiService } from '../../services/api';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import {
  downloadInternalShipmentsCsvTemplate,
  validateInternalShipmentsCsvStructure,
} from '../../utils/internalShipmentsCsv';

export interface MyDataPanelProps {
  user: User;
  factories: Factory[];
  shipments: SupplyLink[];
  products: Product[];
  carriers: ThirdPartyCarrier[];
  salesManagers: SalesManager[];
  onCreate: (data: Record<string, unknown>) => Promise<void>;
  onImported?: (result: ShipmentImportResult) => Promise<void>;
  changeLogs?: {
    id: string;
    shipment_id: string;
    username: string;
    action: string;
    changes: string;
    timestamp: string;
  }[];
}

const STATUSES: CargoStatus[] = ['en_route', 'delayed', 'arrived', 'loading', 'alert'];
const FLOWS: FlowType[] = ['shipment', 'purchase', 'internal'];

const fieldClass =
  'my-data-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

interface MyDataModalShellProps {
  onClose: () => void;
  children: React.ReactNode;
}

const MyDataModalShell: React.FC<MyDataModalShellProps> = ({ onClose, children }) => {
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
        className={`my-data-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
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

interface ShipmentCardProps {
  shipment: SupplyLink;
  user: User;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ShipmentCard = ({ shipment, user, t }: ShipmentCardProps) => (
  <article className="my-data-shipment-card">
    <div className="my-data-shipment-card-header">
      <span className="my-data-shipment-card-date">
        {shipment.shipment_date || shipment.period}
      </span>
      <span className="my-data-shipment-card-status px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
        {shipment.status ? t(`status.${shipment.status}`) : '—'}
      </span>
    </div>
    <div className="my-data-shipment-card-product">{shipment.cargo_type}</div>
    <div className="my-data-shipment-card-meta">
      <div className="my-data-shipment-card-stat">
        <span className="my-data-shipment-card-label">{t('myData.colVolume')}</span>
        <span className="my-data-shipment-card-volume">
          {shipment.volume} {shipment.unit}
        </span>
      </div>
      {user.role !== 'local_employee' && (
        <div className="my-data-shipment-card-stat">
          <span className="my-data-shipment-card-label">{t('myData.colAmount')}</span>
          <span>
            {canSeeDealAmount(user, shipment) && shipment.amount != null
              ? shipment.amount.toLocaleString()
              : '—'}
          </span>
        </div>
      )}
    </div>
  </article>
);

interface ImportBatchCardProps {
  batch: ShipmentImportBatch;
  localeTag: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const ImportBatchCard = ({ batch, localeTag, t }: ImportBatchCardProps) => (
  <article className="my-data-import-card">
    <div className="my-data-import-card-filename">{batch.filename}</div>
    <div className="my-data-import-card-date">
      {new Date(batch.created_at).toLocaleString(localeTag)}
    </div>
    <div className="my-data-import-card-stats">
      <div className="my-data-import-card-stat">
        <span className="my-data-import-card-stat-label">{t('myData.colInserted')}</span>
        <span className="text-emerald-400">{batch.inserted_count}</span>
      </div>
      <div className="my-data-import-card-stat">
        <span className="my-data-import-card-stat-label">{t('myData.colDuplicates')}</span>
        <span className="text-amber-400">{batch.duplicate_count}</span>
      </div>
    </div>
  </article>
);

export function MyDataPanel({
  user,
  factories,
  shipments,
  products,
  carriers,
  salesManagers,
  onCreate,
  onImported,
  changeLogs = [],
}: MyDataPanelProps) {
  const { t, locale, localeTag } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importBatches, setImportBatches] = useState<ShipmentImportBatch[]>([]);

  const ourSites = useMemo(() => factories.filter(f => f.is_ours), [factories]);
  const counterparties = useMemo(() => factories.filter(f => !f.is_ours), [factories]);

  const scopedShipments = useMemo(() => {
    if (user.role === 'admin') return shipments;
    if (user.role === 'manager') {
      return shipments.filter(s => s.created_by === user.id);
    }
    const siteIds = new Set(
      user.assigned_site_ids?.length ? user.assigned_site_ids : user.site_id ? [user.site_id] : [],
    );
    return shipments.filter(
      s =>
        (s.site_id && siteIds.has(s.site_id)) ||
        siteIds.has(s.origin_id) ||
        siteIds.has(s.destination_id),
    );
  }, [shipments, user]);

  const catalog = useMemo(() => activeProducts(products), [products]);
  const carrierList = useMemo(() => activeCarriers(carriers), [carriers]);
  const managerList = useMemo(() => activeSalesManagers(salesManagers), [salesManagers]);

  useEffect(() => {
    if (!canUploadData(user.role)) return;
    void ApiService.getShipmentImportBatches().then(setImportBatches).catch(() => {});
  }, [user.role]);

  const [form, setForm] = useState({
    site_id: ourSites[0]?.id ?? '',
    counterparty_id: counterparties[0]?.id ?? '',
    product_id: catalog[0]?.id ?? '',
    carrier_id: carrierList[0]?.id ?? '',
    sales_manager_id: managerList[0]?.id ?? '',
    flow_type: 'shipment' as FlowType,
    volume: '',
    shipment_date: new Date().toISOString().slice(0, 10),
    status: 'en_route' as CargoStatus,
    amount: '',
  });

  if (!canUploadData(user.role)) return null;

  const title = user.role === 'site_manager' ? t('myData.siteTitle') : t('myData.title');
  const showAmountField =
    user.role === 'admin' || user.role === 'site_manager' || user.role === 'manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.site_id || !form.counterparty_id || !form.volume || !form.shipment_date) {
      setError(t('myData.validationRequired'));
      return;
    }
    const site = factories.find(f => f.id === form.site_id);
    const counterparty = factories.find(f => f.id === form.counterparty_id);
    if (!site || !counterparty) return;

    let origin_id = form.site_id;
    let destination_id = form.counterparty_id;
    if (form.flow_type === 'purchase') {
      origin_id = form.counterparty_id;
      destination_id = form.site_id;
    } else if (form.flow_type === 'internal') {
      origin_id = form.site_id;
      destination_id = form.counterparty_id;
    }

    const product = catalog.find(p => p.id === form.product_id);
    const carrier = carrierList.find(c => c.id === form.carrier_id);
    setSaving(true);
    try {
      await onCreate({
        origin_id,
        destination_id,
        product_id: form.product_id,
        carrier_id: form.carrier_id || undefined,
        cargo_type: locale === 'ru' ? product?.name_ru : product?.name_en,
        source: carrier?.category === 'rzd' ? 'rzd' : 'own',
        flow_type: form.flow_type,
        volume: Number(form.volume),
        shipment_date: form.shipment_date,
        status: form.status,
        amount: form.amount ? Number(form.amount) : undefined,
        site_id: form.site_id,
        sales_manager_id: form.sales_manager_id || undefined,
        counterparty_name: counterparty.name,
      });
      setShowForm(false);
      setForm(prev => ({ ...prev, volume: '', amount: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('myData.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleImportCsv = async (file: File) => {
    setImporting(true);
    setImportMsg('');
    setError('');
    try {
      const csv = await file.text();
      const structure = validateInternalShipmentsCsvStructure(csv);
      if (!structure.ok) {
        setError(`${t('myData.structureError')}: ${structure.errors.join('; ')}`);
        return;
      }
      const result = await ApiService.importInternalShipmentsCsv(csv, file.name);
      if (result.skipped_file) {
        setImportMsg(t('myData.importSkipped', { name: result.batch.filename }));
      } else {
        setImportMsg(t('myData.importOk', {
          inserted: result.inserted,
          duplicates: result.duplicates,
          skipped: result.skipped,
        }));
      }
      await onImported?.(result);
      const batches = await ApiService.getShipmentImportBatches();
      setImportBatches(batches);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('myData.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const formFields = (
    <>
      <div className="my-data-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.site')}</span>
          <select
            value={form.site_id}
            onChange={e => setForm({ ...form, site_id: e.target.value })}
            className={fieldClass}
            required
          >
            {ourSites.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.counterparty')}</span>
          <select
            value={form.counterparty_id}
            onChange={e => setForm({ ...form, counterparty_id: e.target.value })}
            className={fieldClass}
            required
          >
            {counterparties.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.product')}</span>
          <select
            value={form.product_id}
            onChange={e => setForm({ ...form, product_id: e.target.value })}
            className={fieldClass}
            required
          >
            {catalog.map(p => (
              <option key={p.id} value={p.id}>
                {locale === 'ru' ? p.name_ru : p.name_en}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.carrier')}</span>
          <select
            value={form.carrier_id}
            onChange={e => setForm({ ...form, carrier_id: e.target.value })}
            className={fieldClass}
          >
            {carrierList.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.manager')}</span>
          <select
            value={form.sales_manager_id}
            onChange={e => setForm({ ...form, sales_manager_id: e.target.value })}
            className={fieldClass}
          >
            <option value="">{t('myData.managerNone')}</option>
            {managerList.map(m => (
              <option key={m.id} value={m.id}>
                {salesManagerLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.flowType')}</span>
          <select
            value={form.flow_type}
            onChange={e => setForm({ ...form, flow_type: e.target.value as FlowType })}
            className={fieldClass}
          >
            {FLOWS.map(f => (
              <option key={f} value={f}>
                {t(`flowType.${f}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.volume')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.volume}
            onChange={e => setForm({ ...form, volume: e.target.value })}
            className={fieldClass}
            required
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.date')}</span>
          <input
            type="date"
            value={form.shipment_date}
            onChange={e => setForm({ ...form, shipment_date: e.target.value })}
            className={fieldClass}
            required
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('myData.status')}</span>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as CargoStatus })}
            className={fieldClass}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        {showAmountField && (
          <label className="block space-y-1 text-xs">
            <span className="text-slate-400">{t('myData.amount')}</span>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className={fieldClass}
            />
          </label>
        )}
      </div>
    </>
  );

  return (
    <div className="my-data-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="my-data-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="my-data-toolbar-head flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{title}</span>
            </h2>
            <p className="my-data-hint text-[11px] sm:text-xs text-slate-500 mt-1">
              {t('myData.importHint')}
            </p>
          </div>
          <div className="my-data-toolbar-actions flex flex-wrap gap-2 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void handleImportCsv(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => downloadInternalShipmentsCsvTemplate()}
              className="my-data-toolbar-btn flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg min-h-[2.75rem] sm:min-h-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              {t('myData.downloadTemplate')}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="my-data-toolbar-btn flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg min-h-[2.75rem] sm:min-h-0"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              {importing ? t('myData.importing') : t('myData.importCsv')}
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setShowForm(true);
              }}
              className="my-data-toolbar-btn flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg min-h-[2.75rem] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              {t('myData.add')}
            </button>
          </div>
        </div>

        {(error || importMsg) && !showForm && (
          <div
            className={`my-data-alert text-sm rounded-lg px-3 py-2 border ${
              error
                ? 'text-red-400 bg-red-500/10 border-red-500/30'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            {error || importMsg}
          </div>
        )}

        <p className="my-data-results text-xs text-slate-500">
          {t('myData.results', { count: scopedShipments.length })}
        </p>
      </div>

      <div className="my-data-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="my-data-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="w-full text-xs min-w-[28rem]">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">{t('myData.colDate')}</th>
                <th className="px-3 py-2 text-left">{t('myData.colProduct')}</th>
                <th className="px-3 py-2 text-right">{t('myData.colVolume')}</th>
                {user.role !== 'local_employee' && (
                  <th className="px-3 py-2 text-right hidden sm:table-cell">{t('myData.colAmount')}</th>
                )}
                <th className="px-3 py-2">{t('myData.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {scopedShipments.length === 0 ? (
                <tr>
                  <td colSpan={user.role !== 'local_employee' ? 5 : 4} className="p-6 text-center text-slate-500">
                    {t('myData.empty')}
                  </td>
                </tr>
              ) : (
                scopedShipments.slice(0, 50).map(s => (
                  <tr key={s.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                      {s.shipment_date || s.period}
                    </td>
                    <td className="px-3 py-2 text-white">{s.cargo_type}</td>
                    <td className="px-3 py-2 text-right text-emerald-400 whitespace-nowrap">
                      {s.volume} {s.unit}
                    </td>
                    {user.role !== 'local_employee' && (
                      <td className="px-3 py-2 text-right text-slate-300 hidden sm:table-cell">
                        {canSeeDealAmount(user, s) && s.amount != null
                          ? s.amount.toLocaleString()
                          : '—'}
                      </td>
                    )}
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s.status ? t(`status.${s.status}`) : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="my-data-shipments-cards-mobile">
          {scopedShipments.length === 0 ? (
            <div className="my-data-empty">{t('myData.empty')}</div>
          ) : (
            scopedShipments.slice(0, 50).map(s => (
              <ShipmentCard key={s.id} shipment={s} user={user} t={t} />
            ))
          )}
        </div>
      </div>

      {importBatches.length > 0 && (
        <div className="my-data-imports-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="my-data-imports-title px-3 py-2.5 text-xs font-semibold text-slate-300 border-b border-slate-800">
            {t('myData.importHistory')}
          </div>
          <div className="my-data-imports-table-desktop overflow-x-auto responsive-table-wrap">
            <table className="w-full text-xs min-w-[24rem]">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">{t('myData.colFile')}</th>
                  <th className="px-3 py-2 text-right">{t('myData.colInserted')}</th>
                  <th className="px-3 py-2 text-right">{t('myData.colDuplicates')}</th>
                  <th className="px-3 py-2 text-left">{t('myData.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {importBatches.slice(0, 10).map(b => (
                  <tr key={b.id} className="border-t border-slate-800">
                    <td className="px-3 py-2 text-white truncate max-w-[12rem]">{b.filename}</td>
                    <td className="px-3 py-2 text-right text-emerald-400">{b.inserted_count}</td>
                    <td className="px-3 py-2 text-right text-amber-400">{b.duplicate_count}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString(localeTag)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="my-data-imports-cards-mobile">
            {importBatches.slice(0, 10).map(b => (
              <ImportBatchCard key={b.id} batch={b} localeTag={localeTag} t={t} />
            ))}
          </div>
        </div>
      )}

      {changeLogs.length > 0 && (
        <div className="my-data-changelog bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2">
          <div className="my-data-changelog-title flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <History className="w-3.5 h-3.5 shrink-0" />
            {t('myData.changeLog')}
          </div>
          <div className="my-data-changelog-list space-y-1">
            {changeLogs.slice(0, 10).map(log => (
              <div
                key={log.id}
                className="my-data-changelog-entry text-[10px] sm:text-xs text-slate-400 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0"
              >
                <span className="text-slate-300">{log.username}</span> — {log.action} —{' '}
                {new Date(log.timestamp).toLocaleString(localeTag)}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <MyDataModalShell onClose={() => setShowForm(false)}>
          <form onSubmit={e => void handleSubmit(e)} className="my-data-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white break-words">{t('myData.add')}</h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar px-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {formFields}
            </div>
            <footer className="my-data-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                {saving ? t('myData.saving') : t('myData.save')}
              </button>
            </footer>
          </form>
        </MyDataModalShell>
      )}
    </div>
  );
}
