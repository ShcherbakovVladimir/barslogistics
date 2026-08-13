import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { activeProducts, getProductName } from '../../constants/products';
import { activeCarriers } from '../../constants/carriers';
import { activeSalesManagers, salesManagerLabel } from '../../constants/salesManagers';
import { useI18n } from '../../i18n';
import { canSeeDealAmount, canUploadData } from '../../utils/permissions';
import { ApiService } from '../../services/api';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import { SearchableSelect } from '../UI/SearchableSelect';
import { TasksDatePicker } from '../Tasks/TasksDatePicker';
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

type MyDataPanelId = 'table' | 'imports' | 'changelog';

const PANEL_HEIGHTS_KEY = 'bars.myData.panelHeights';
const PANEL_MIN_HEIGHT = 128;
const PANEL_MAX_HEIGHT = 2000;
const PANEL_DEFAULT_SECONDARY = 224;

function clampPanelHeight(value: number): number {
  return Math.round(Math.min(Math.max(value, PANEL_MIN_HEIGHT), PANEL_MAX_HEIGHT));
}

function readStoredPanelHeights(): Partial<Record<MyDataPanelId, number>> {
  try {
    const raw = localStorage.getItem(PANEL_HEIGHTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Partial<Record<MyDataPanelId, number>> = {};
    for (const id of ['table', 'imports', 'changelog'] as const) {
      const value = parsed[id];
      if (typeof value === 'number' && Number.isFinite(value)) {
        next[id] = clampPanelHeight(value);
      }
    }
    return next;
  } catch {
    return {};
  }
}

function persistPanelHeights(heights: Partial<Record<MyDataPanelId, number>>) {
  try {
    localStorage.setItem(PANEL_HEIGHTS_KEY, JSON.stringify(heights));
  } catch {
    /* ignore quota / private mode */
  }
}

interface PanelResizeHandleProps {
  label: string;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyNudge: (delta: number) => void;
}

const PanelResizeHandle: React.FC<PanelResizeHandleProps> = ({
  label,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyNudge,
}) => (
  <div
    className={`my-data-resize-handle${dragging ? ' is-dragging' : ''}`}
    role="separator"
    aria-orientation="horizontal"
    aria-label={label}
    title={label}
    tabIndex={0}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    onLostPointerCapture={onPointerUp}
    onKeyDown={e => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onKeyNudge(-24);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onKeyNudge(24);
      }
    }}
  >
    <span className="my-data-resize-handle-bar" aria-hidden />
  </div>
);

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
        className={`my-data-modal app-modal-sheet modal-panel ${isDragging ? 'is-sheet-dragging' : ''}`}
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
  <article className="my-data-card">
    <div className="my-data-shipment-card-header">
      <span className="my-data-shipment-card-date">
        {shipment.shipment_date || shipment.period}
      </span>
      <span className="my-data-status-badge">
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
  <article className="my-data-card">
    <div className="my-data-import-card-filename">{batch.filename}</div>
    <div className="my-data-import-card-date">
      {new Date(batch.created_at).toLocaleString(localeTag)}
    </div>
    <div className="my-data-import-card-stats">
      <div className="my-data-import-card-stat">
        <span className="my-data-import-card-stat-label">{t('myData.colInserted')}</span>
        <span className="my-data-import-stat-value--inserted">{batch.inserted_count}</span>
      </div>
      <div className="my-data-import-card-stat">
        <span className="my-data-import-card-stat-label">{t('myData.colDuplicates')}</span>
        <span className="my-data-import-stat-value--duplicates">{batch.duplicate_count}</span>
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
  const tablePanelRef = useRef<HTMLDivElement>(null);
  const importsPanelRef = useRef<HTMLDivElement>(null);
  const changelogPanelRef = useRef<HTMLDivElement>(null);
  const panelHeightsRef = useRef(readStoredPanelHeights());
  const resizeDragRef = useRef<{ id: MyDataPanelId; startY: number; startH: number } | null>(null);
  const [panelHeights, setPanelHeights] = useState(panelHeightsRef.current);
  const [resizingPanel, setResizingPanel] = useState<MyDataPanelId | null>(null);
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

  useEffect(() => {
    panelHeightsRef.current = panelHeights;
  }, [panelHeights]);

  useEffect(() => () => {
    document.documentElement.classList.remove('is-ns-resizing');
  }, []);

  const applyPanelHeight = useCallback((id: MyDataPanelId, height: number, persist = false) => {
    const next = { ...panelHeightsRef.current, [id]: clampPanelHeight(height) };
    panelHeightsRef.current = next;
    setPanelHeights(next);
    if (persist) persistPanelHeights(next);
  }, []);

  const beginPanelResize = useCallback((
    id: MyDataPanelId,
    panelEl: HTMLElement | null,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!panelEl || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeDragRef.current = {
      id,
      startY: e.clientY,
      startH: panelEl.getBoundingClientRect().height,
    };
    setResizingPanel(id);
    document.documentElement.classList.add('is-ns-resizing');
  }, []);

  const onPanelResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;
    if (!drag) return;
    applyPanelHeight(drag.id, drag.startH + (e.clientY - drag.startY));
  }, [applyPanelHeight]);

  const endPanelResize = useCallback(() => {
    if (!resizeDragRef.current) return;
    resizeDragRef.current = null;
    setResizingPanel(null);
    document.documentElement.classList.remove('is-ns-resizing');
    persistPanelHeights(panelHeightsRef.current);
  }, []);

  const nudgePanelHeight = useCallback((
    id: MyDataPanelId,
    panelEl: HTMLElement | null,
    delta: number,
  ) => {
    const current =
      panelHeightsRef.current[id]
      ?? panelEl?.getBoundingClientRect().height
      ?? PANEL_DEFAULT_SECONDARY;
    applyPanelHeight(id, current + delta, true);
  }, [applyPanelHeight]);

  const tablePanelStyle = panelHeights.table
    ? { height: panelHeights.table, flex: `0 0 ${panelHeights.table}px` }
    : undefined;
  const importsPanelStyle = {
    height: panelHeights.imports ?? PANEL_DEFAULT_SECONDARY,
    flex: `0 0 ${panelHeights.imports ?? PANEL_DEFAULT_SECONDARY}px`,
  };
  const changelogPanelStyle = {
    height: panelHeights.changelog ?? PANEL_DEFAULT_SECONDARY,
    flex: `0 0 ${panelHeights.changelog ?? PANEL_DEFAULT_SECONDARY}px`,
  };

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
      <div className="my-data-form-grid">
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.site')}</span>
          <SearchableSelect
            value={form.site_id}
            onChange={v => setForm({ ...form, site_id: v })}
            options={ourSites.map(s => ({ value: s.id, label: s.name }))}
            placeholder={t('myData.site')}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.counterparty')}</span>
          <SearchableSelect
            value={form.counterparty_id}
            onChange={v => setForm({ ...form, counterparty_id: v })}
            options={counterparties.map(c => ({ value: c.id, label: c.name }))}
            placeholder={t('myData.counterparty')}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.product')}</span>
          <SearchableSelect
            value={form.product_id}
            onChange={v => setForm({ ...form, product_id: v })}
            options={catalog.map(p => ({
              value: p.id,
              label: getProductName(p.id, locale, catalog),
            }))}
            placeholder={t('myData.product')}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.carrier')}</span>
          <SearchableSelect
            value={form.carrier_id}
            onChange={v => setForm({ ...form, carrier_id: v })}
            options={carrierList.map(c => ({ value: c.id, label: c.name }))}
            allowEmpty
            emptyLabel={t('searchableSelect.select')}
            placeholder={t('myData.carrier')}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.manager')}</span>
          <SearchableSelect
            value={form.sales_manager_id}
            onChange={v => setForm({ ...form, sales_manager_id: v })}
            options={managerList.map(m => ({ value: m.id, label: salesManagerLabel(m) }))}
            allowEmpty
            emptyLabel={t('myData.managerNone')}
            placeholder={t('myData.manager')}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.flowType')}</span>
          <SearchableSelect
            value={form.flow_type}
            onChange={v => setForm({ ...form, flow_type: v as FlowType })}
            options={FLOWS.map(f => ({ value: f, label: t(`flowType.${f}`) }))}
            searchable={false}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        <label className="my-data-form-field">
          <span className="my-data-form-label">{t('myData.volume')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.volume}
            onChange={e => setForm({ ...form, volume: e.target.value })}
            className="my-data-field"
            required
          />
        </label>
        <div className="my-data-form-field my-data-date">
          <span className="my-data-form-label">{t('myData.date')}</span>
          <TasksDatePicker
            value={form.shipment_date}
            onChange={v => setForm({ ...form, shipment_date: v })}
            required
            placeholder={t('myData.date')}
          />
        </div>
        <div className="my-data-form-field my-data-select">
          <span className="my-data-form-label">{t('myData.status')}</span>
          <SearchableSelect
            value={form.status}
            onChange={v => setForm({ ...form, status: v as CargoStatus })}
            options={STATUSES.map(s => ({ value: s, label: t(`status.${s}`) }))}
            searchable={false}
            className="my-data-dropdown"
            triggerClassName="my-data-dropdown-trigger"
            panelClassName="my-data-dropdown-panel map-filter-dropdown-panel"
          />
        </div>
        {showAmountField && (
          <label className="my-data-form-field">
            <span className="my-data-form-label">{t('myData.amount')}</span>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="my-data-field"
            />
          </label>
        )}
      </div>
    </>
  );

  return (
    <div className="my-data-page">
      <div className="my-data-toolbar shipments-list-toolbar">
        <div className="my-data-toolbar-top">
          <div className="shipments-list-toolbar-head">
            <span className="shipments-list-toolbar-icon" aria-hidden>
              <ClipboardList />
            </span>
            <div className="shipments-list-toolbar-text">
              <h2 className="shipments-list-title">
                <span className="truncate">{title}</span>
              </h2>
              <p className="shipments-list-subtitle">{t('myData.importHint')}</p>
            </div>
          </div>
          <div className="my-data-toolbar-actions">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="my-data-file-input"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void handleImportCsv(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => downloadInternalShipmentsCsvTemplate()}
              className="my-data-toolbar-btn my-data-toolbar-btn--secondary"
            >
              <Download aria-hidden />
              {t('myData.downloadTemplate')}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="my-data-toolbar-btn my-data-toolbar-btn--secondary"
            >
              <Upload aria-hidden />
              {importing ? t('myData.importing') : t('myData.importCsv')}
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setShowForm(true);
              }}
              className="my-data-toolbar-btn my-data-toolbar-btn--add"
            >
              <Plus aria-hidden />
              {t('myData.add')}
            </button>
          </div>
        </div>

        {(error || importMsg) && !showForm && (
          <div className={`my-data-alert ${error ? 'my-data-alert--error' : 'my-data-alert--success'}`}>
            {error || importMsg}
          </div>
        )}

        <p className="my-data-results-bar">
          {t('myData.results', { count: scopedShipments.length })}
        </p>
      </div>

      <div
        ref={tablePanelRef}
        className={`my-data-table-panel${panelHeights.table ? ' is-resized' : ''}${resizingPanel === 'table' ? ' is-resizing' : ''}`}
        style={tablePanelStyle}
      >
        <div className="my-data-table-desktop responsive-table-wrap theme-scrollbar">
          <table className="my-data-table">
            <thead>
              <tr>
                <th>{t('myData.colDate')}</th>
                <th>{t('myData.colProduct')}</th>
                <th className="my-data-col-volume">{t('myData.colVolume')}</th>
                {user.role !== 'local_employee' && (
                  <th className="my-data-col-amount">{t('myData.colAmount')}</th>
                )}
                <th className="my-data-col-status">{t('myData.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {scopedShipments.length === 0 ? (
                <tr>
                  <td colSpan={user.role !== 'local_employee' ? 5 : 4} className="my-data-table-empty">
                    {t('myData.empty')}
                  </td>
                </tr>
              ) : (
                scopedShipments.slice(0, 50).map(s => (
                  <tr key={s.id}>
                    <td className="my-data-cell-date">{s.shipment_date || s.period}</td>
                    <td className="my-data-cell-product">{s.cargo_type}</td>
                    <td className="my-data-col-volume my-data-cell-volume">
                      {s.volume} {s.unit}
                    </td>
                    {user.role !== 'local_employee' && (
                      <td className="my-data-col-amount my-data-cell-amount">
                        {canSeeDealAmount(user, s) && s.amount != null
                          ? s.amount.toLocaleString()
                          : '—'}
                      </td>
                    )}
                    <td className="my-data-col-status">
                      <span className="my-data-status-badge">
                        {s.status ? t(`status.${s.status}`) : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="my-data-shipments-cards-mobile theme-scrollbar">
          {scopedShipments.length === 0 ? (
            <div className="my-data-empty">{t('myData.empty')}</div>
          ) : (
            scopedShipments.slice(0, 50).map(s => (
              <ShipmentCard key={s.id} shipment={s} user={user} t={t} />
            ))
          )}
        </div>
        <PanelResizeHandle
          label={t('myData.resizePanel')}
          dragging={resizingPanel === 'table'}
          onPointerDown={e => beginPanelResize('table', tablePanelRef.current, e)}
          onPointerMove={onPanelResizeMove}
          onPointerUp={endPanelResize}
          onKeyNudge={delta => nudgePanelHeight('table', tablePanelRef.current, delta)}
        />
      </div>

      {importBatches.length > 0 && (
        <div
          ref={importsPanelRef}
          className={`my-data-imports-panel${resizingPanel === 'imports' ? ' is-resizing' : ''}`}
          style={importsPanelStyle}
        >
          <div className="my-data-imports-title">
            {t('myData.importHistory')}
          </div>
          <div className="my-data-imports-table-desktop responsive-table-wrap theme-scrollbar">
            <table className="my-data-table my-data-imports-table">
              <thead>
                <tr>
                  <th>{t('myData.colFile')}</th>
                  <th className="my-data-col-num">{t('myData.colInserted')}</th>
                  <th className="my-data-col-num">{t('myData.colDuplicates')}</th>
                  <th>{t('myData.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {importBatches.slice(0, 10).map(b => (
                  <tr key={b.id}>
                    <td className="my-data-cell-filename">{b.filename}</td>
                    <td className="my-data-col-num my-data-cell-inserted">{b.inserted_count}</td>
                    <td className="my-data-col-num my-data-cell-duplicates">{b.duplicate_count}</td>
                    <td className="my-data-cell-date">
                      {new Date(b.created_at).toLocaleString(localeTag)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="my-data-imports-cards-mobile theme-scrollbar">
            {importBatches.slice(0, 10).map(b => (
              <ImportBatchCard key={b.id} batch={b} localeTag={localeTag} t={t} />
            ))}
          </div>
          <PanelResizeHandle
            label={t('myData.resizePanel')}
            dragging={resizingPanel === 'imports'}
            onPointerDown={e => beginPanelResize('imports', importsPanelRef.current, e)}
            onPointerMove={onPanelResizeMove}
            onPointerUp={endPanelResize}
            onKeyNudge={delta => nudgePanelHeight('imports', importsPanelRef.current, delta)}
          />
        </div>
      )}

      {changeLogs.length > 0 && (
        <div
          ref={changelogPanelRef}
          className={`my-data-changelog${resizingPanel === 'changelog' ? ' is-resizing' : ''}`}
          style={changelogPanelStyle}
        >
          <div className="my-data-changelog-title">
            <History aria-hidden />
            {t('myData.changeLog')}
          </div>
          <div className="my-data-changelog-list">
            {changeLogs.slice(0, 10).map(log => (
              <div key={log.id} className="my-data-changelog-entry">
                <span className="my-data-changelog-user">{log.username}</span> — {log.action} —{' '}
                {new Date(log.timestamp).toLocaleString(localeTag)}
              </div>
            ))}
          </div>
          <PanelResizeHandle
            label={t('myData.resizePanel')}
            dragging={resizingPanel === 'changelog'}
            onPointerDown={e => beginPanelResize('changelog', changelogPanelRef.current, e)}
            onPointerMove={onPanelResizeMove}
            onPointerUp={endPanelResize}
            onKeyNudge={delta => nudgePanelHeight('changelog', changelogPanelRef.current, delta)}
          />
        </div>
      )}

      {showForm && (
        <MyDataModalShell onClose={() => setShowForm(false)}>
          <form onSubmit={e => void handleSubmit(e)} className="my-data-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header">
              <div className="flex items-start justify-between gap-3">
                <h3 className="my-data-modal-title">{t('myData.add')}</h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="my-data-modal-close-btn"
                  aria-label={t('common.close')}
                >
                  <X aria-hidden />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
              {error && (
                <p className="my-data-form-error">{error}</p>
              )}
              {formFields}
            </div>
            <footer className="my-data-form-modal-footer modal-panel-footer">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="my-data-form-cancel"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="my-data-form-submit"
              >
                <Save aria-hidden />
                {saving ? t('myData.saving') : t('myData.save')}
              </button>
            </footer>
          </form>
        </MyDataModalShell>
      )}
    </div>
  );
}
