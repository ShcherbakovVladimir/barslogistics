import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
  Save,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useI18n } from '../../i18n';
import { SearchableSelect } from '../UI/SearchableSelect';
import { ShipmentDateTimePicker } from './ShipmentDateTimePicker';
import {
  SHIPMENT_DOCUMENT_TYPES,
  TRANSPORT_MODES,
  type ShipmentDocument,
  type ShipmentDocumentType,
  type SupplyLink,
  type TransportAsset,
  type TransportMode,
} from '../../types';

function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface ShipmentLogisticsPanelProps {
  shipment: SupplyLink;
  canManage: boolean;
  onShipmentUpdated: (shipment: SupplyLink) => void;
  transportAssets?: TransportAsset[];
}

export const ShipmentLogisticsPanel: React.FC<ShipmentLogisticsPanelProps> = ({
  shipment,
  canManage,
  onShipmentUpdated,
  transportAssets = [],
}) => {
  const { t, localeTag } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<ShipmentDocumentType>('waybill');
  const [docNote, setDocNote] = useState('');
  const [docError, setDocError] = useState<string | null>(null);

  const [transportAssetId, setTransportAssetId] = useState(shipment.transport_asset_id || '');
  const [transportMode, setTransportMode] = useState<TransportMode | ''>(
    shipment.transport_mode || '',
  );
  const [vehicleNumber, setVehicleNumber] = useState(shipment.vehicle_number || '');
  const [trailerNumber, setTrailerNumber] = useState(shipment.trailer_number || '');
  const [containerNumber, setContainerNumber] = useState(shipment.container_number || '');
  const [sealNumber, setSealNumber] = useState(shipment.seal_number || '');
  const [waybillNumber, setWaybillNumber] = useState(shipment.waybill_number || '');
  const [driverInfo, setDriverInfo] = useState(shipment.driver_info || '');
  const [plannedDeparture, setPlannedDeparture] = useState(toLocalInput(shipment.planned_departure_at));
  const [plannedArrival, setPlannedArrival] = useState(toLocalInput(shipment.planned_arrival_at));
  const [actualDeparture, setActualDeparture] = useState(toLocalInput(shipment.actual_departure_at));
  const [actualArrival, setActualArrival] = useState(toLocalInput(shipment.actual_arrival_at));
  const [notes, setNotes] = useState(shipment.logistics_notes || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setTransportAssetId(shipment.transport_asset_id || '');
    setTransportMode(shipment.transport_mode || '');
    setVehicleNumber(shipment.vehicle_number || '');
    setTrailerNumber(shipment.trailer_number || '');
    setContainerNumber(shipment.container_number || '');
    setSealNumber(shipment.seal_number || '');
    setWaybillNumber(shipment.waybill_number || '');
    setDriverInfo(shipment.driver_info || '');
    setPlannedDeparture(toLocalInput(shipment.planned_departure_at));
    setPlannedArrival(toLocalInput(shipment.planned_arrival_at));
    setActualDeparture(toLocalInput(shipment.actual_departure_at));
    setActualArrival(toLocalInput(shipment.actual_arrival_at));
    setNotes(shipment.logistics_notes || '');
  }, [shipment]);

  const shipmentTransportOptions = useMemo(() => {
    return transportAssets
      .filter(a => a.is_active !== false && (a.purpose === 'shipment' || a.purpose === 'both'))
      .map(a => ({
        value: a.id,
        label: [
          a.name,
          a.vehicle_number,
          a.brand && a.model ? `${a.brand} ${a.model}` : a.brand || a.model,
        ]
          .filter(Boolean)
          .join(' · '),
      }));
  }, [transportAssets]);

  const applyTransportAsset = (id: string) => {
    setTransportAssetId(id);
    if (!id) return;
    const asset = transportAssets.find(a => a.id === id);
    if (!asset) return;
    if (asset.vehicle_number) setVehicleNumber(asset.vehicle_number);
    if (asset.trailer_number) setTrailerNumber(asset.trailer_number);
    if (asset.container_number) setContainerNumber(asset.container_number);
    if (asset.waybill_number) setWaybillNumber(asset.waybill_number);
    if (asset.driver_info) setDriverInfo(asset.driver_info);
    if (asset.category === 'rail') setTransportMode('rail');
    else if (!transportMode) setTransportMode('road');
  };

  const loadDocs = useCallback(async (id: string) => {
    setLoadingDocs(true);
    setDocError(null);
    try {
      const data = await ApiService.getShipmentDocuments(id);
      setDocuments(data);
    } catch (e) {
      setDocuments([]);
      setDocError(e instanceof Error ? e.message : t('common.loadDataFailed'));
    } finally {
      setLoadingDocs(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDocs(shipment.id);
  }, [shipment.id, loadDocs]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setDocError(null);
    try {
      const doc = await ApiService.uploadShipmentDocument(shipment.id, file, {
        doc_type: docType,
        note: docNote.trim() || undefined,
      });
      setDocuments((prev) => [doc, ...prev]);
      setDocNote('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setDocError(e instanceof Error ? e.message : t('shipmentLogistics.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: ShipmentDocument) => {
    if (!window.confirm(t('shipmentLogistics.confirmDelete', { name: doc.original_name }))) return;
    try {
      await ApiService.deleteShipmentDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      setDocError(e instanceof Error ? e.message : t('shipmentLogistics.deleteFailed'));
    }
  };

  const handleSaveLogistics = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveMsg(null);
    try {
      const updated = await ApiService.updateShipmentLogistics(shipment.id, {
        transport_mode: transportMode || null,
        transport_asset_id: transportAssetId || null,
        vehicle_number: vehicleNumber,
        trailer_number: trailerNumber,
        container_number: containerNumber,
        seal_number: sealNumber,
        waybill_number: waybillNumber,
        driver_info: driverInfo,
        planned_departure_at: fromLocalInput(plannedDeparture),
        planned_arrival_at: fromLocalInput(plannedArrival),
        actual_departure_at: fromLocalInput(actualDeparture),
        actual_arrival_at: fromLocalInput(actualArrival),
        logistics_notes: notes,
      });
      onShipmentUpdated(updated);
      setSaveMsg(t('shipmentLogistics.saved'));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t('shipmentLogistics.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const docTypeOptions = useMemo(
    () => SHIPMENT_DOCUMENT_TYPES.map((type) => ({
      value: type,
      label: t(`shipmentLogistics.docTypes.${type}`),
    })),
    [t],
  );

  const transportModeOptions = useMemo(
    () => TRANSPORT_MODES.map((mode) => ({
      value: mode,
      label: t(`shipmentLogistics.modes.${mode}`),
    })),
    [t],
  );

  return (
    <div className="shipment-logistics-panel space-y-5">
      <section className="shipment-logistics-section">
        <h4 className="shipment-logistics-section-title">
          <FileText aria-hidden />
          {t('shipmentLogistics.documents')}
          {documents.length > 0 ? ` (${documents.length})` : ''}
        </h4>

        {canManage && (
          <div className="shipment-logistics-upload-box space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="shipment-logistics-select">
                <label className="shipment-logistics-field-label">{t('shipmentLogistics.docType')}</label>
                <SearchableSelect
                  value={docType}
                  onChange={(v) => setDocType(v as ShipmentDocumentType)}
                  options={docTypeOptions}
                  searchable={false}
                  className="shipment-logistics-dropdown"
                  triggerClassName="shipment-logistics-dropdown-trigger"
                  panelClassName="shipment-logistics-dropdown-panel"
                />
              </div>
              <div>
                <label className="shipment-logistics-field-label">{t('shipmentLogistics.docNote')}</label>
                <input
                  className="shipment-logistics-field"
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder={t('shipmentLogistics.docNotePlaceholder')}
                />
              </div>
            </div>
            <div className="shipment-logistics-upload-actions">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="shipment-logistics-btn"
              >
                {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
                {uploading ? t('shipmentLogistics.uploading') : t('shipmentLogistics.upload')}
              </button>
              <span className="shipment-logistics-hint">{t('shipmentLogistics.uploadHint')}</span>
            </div>
          </div>
        )}

        {docError ? (
          <p className="shipment-logistics-msg--error">{docError}</p>
        ) : null}

        {loadingDocs ? (
          <div className="shipment-logistics-loading">
            <Loader2 className="animate-spin" aria-hidden />
            {t('common.loading')}
          </div>
        ) : documents.length === 0 ? (
          <p className="shipment-logistics-empty">{t('shipmentLogistics.noDocuments')}</p>
        ) : (
          <ul className="shipment-logistics-doc-list">
            {documents.map((doc) => (
              <li key={doc.id} className="shipment-logistics-doc-item">
                <div className="shipment-logistics-doc-body">
                  <div className="shipment-logistics-doc-name">{doc.original_name}</div>
                  <div className="shipment-logistics-doc-meta">
                    <span className="shipment-logistics-doc-type">{t(`shipmentLogistics.docTypes.${doc.doc_type}`)}</span>
                    <span>{formatBytes(doc.size_bytes)}</span>
                    <span>{doc.uploaded_by_name || '—'}</span>
                    <span>{new Date(doc.created_at).toLocaleString(localeTag)}</span>
                  </div>
                  {doc.note ? <div className="shipment-logistics-doc-note">{doc.note}</div> : null}
                </div>
                <div className="shipment-logistics-doc-actions">
                  <button
                    type="button"
                    className="shipment-logistics-doc-action shipment-logistics-doc-action--download"
                    title={t('shipmentLogistics.download')}
                    onClick={() => void ApiService.downloadShipmentDocument(doc.id, doc.original_name)}
                  >
                    <Download aria-hidden />
                  </button>
                  {canManage ? (
                    <button
                      type="button"
                      className="shipment-logistics-doc-action shipment-logistics-doc-action--delete"
                      title={t('common.delete')}
                      onClick={() => void handleDelete(doc)}
                    >
                      <Trash2 aria-hidden />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="shipment-logistics-section">
        <h4 className="shipment-logistics-section-title">{t('shipmentLogistics.transportDetails')}</h4>
        <div className="shipment-logistics-grid">
          <div className="shipment-logistics-select sm:col-span-2">
            <label className="shipment-logistics-field-label">{t('transport.selectFromDirectory')}</label>
            <SearchableSelect
              value={transportAssetId}
              onChange={applyTransportAsset}
              options={shipmentTransportOptions}
              allowEmpty
              emptyLabel={t('transport.selectUnset')}
              placeholder={t('transport.selectPlaceholder')}
              disabled={!canManage}
              className="shipment-logistics-dropdown"
              triggerClassName="shipment-logistics-dropdown-trigger"
              panelClassName="shipment-logistics-dropdown-panel"
            />
          </div>
          <div className="shipment-logistics-select">
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.transportMode')}</label>
            <SearchableSelect
              value={transportMode}
              onChange={(v) => setTransportMode(v as TransportMode | '')}
              options={transportModeOptions}
              searchable={false}
              allowEmpty
              emptyLabel={t('shipmentLogistics.modeUnset')}
              placeholder={t('shipmentLogistics.modeUnset')}
              disabled={!canManage}
              className="shipment-logistics-dropdown"
              triggerClassName="shipment-logistics-dropdown-trigger"
              panelClassName="shipment-logistics-dropdown-panel"
            />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.waybillNumber')}</label>
            <input className="shipment-logistics-field" value={waybillNumber} disabled={!canManage} onChange={(e) => setWaybillNumber(e.target.value)} />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.vehicleNumber')}</label>
            <input className="shipment-logistics-field" value={vehicleNumber} disabled={!canManage} onChange={(e) => setVehicleNumber(e.target.value)} />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.trailerNumber')}</label>
            <input className="shipment-logistics-field" value={trailerNumber} disabled={!canManage} onChange={(e) => setTrailerNumber(e.target.value)} />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.containerNumber')}</label>
            <input className="shipment-logistics-field" value={containerNumber} disabled={!canManage} onChange={(e) => setContainerNumber(e.target.value)} />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.sealNumber')}</label>
            <input className="shipment-logistics-field" value={sealNumber} disabled={!canManage} onChange={(e) => setSealNumber(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.driverInfo')}</label>
            <input className="shipment-logistics-field" value={driverInfo} disabled={!canManage} onChange={(e) => setDriverInfo(e.target.value)} placeholder={t('shipmentLogistics.driverPlaceholder')} />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.plannedDeparture')}</label>
            <ShipmentDateTimePicker
              value={plannedDeparture}
              disabled={!canManage}
              onChange={setPlannedDeparture}
              aria-label={t('shipmentLogistics.plannedDeparture')}
            />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.plannedArrival')}</label>
            <ShipmentDateTimePicker
              value={plannedArrival}
              disabled={!canManage}
              onChange={setPlannedArrival}
              aria-label={t('shipmentLogistics.plannedArrival')}
            />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.actualDeparture')}</label>
            <ShipmentDateTimePicker
              value={actualDeparture}
              disabled={!canManage}
              onChange={setActualDeparture}
              aria-label={t('shipmentLogistics.actualDeparture')}
            />
          </div>
          <div>
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.actualArrival')}</label>
            <ShipmentDateTimePicker
              value={actualArrival}
              disabled={!canManage}
              onChange={setActualArrival}
              aria-label={t('shipmentLogistics.actualArrival')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="shipment-logistics-field-label">{t('shipmentLogistics.notes')}</label>
            <textarea
              className="shipment-logistics-field shipment-logistics-field--textarea"
              value={notes}
              disabled={!canManage}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('shipmentLogistics.notesPlaceholder')}
            />
          </div>
        </div>

        {canManage && (
          <div className="shipment-logistics-save-row">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveLogistics()}
              className="shipment-logistics-btn"
            >
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              {saving ? t('common.saving') : t('common.save')}
            </button>
            {saveMsg ? <span className="shipment-logistics-save-msg shipment-logistics-save-msg--success">{saveMsg}</span> : null}
            {saveError ? <span className="shipment-logistics-save-msg shipment-logistics-save-msg--error">{saveError}</span> : null}
          </div>
        )}
      </section>
    </div>
  );
};
