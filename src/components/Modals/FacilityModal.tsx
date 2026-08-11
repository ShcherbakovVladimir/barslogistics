import React, { useEffect, useState } from 'react';
import { Factory, FactoryType, SupplyLink } from '../../types';
import { useI18n } from '../../i18n';
import { Building2, MapPin, ArrowRight, ArrowLeft, ShieldCheck, Move, X } from 'lucide-react';
import { SearchableSelect } from '../UI/SearchableSelect';
import { SITE_CATEGORIES, getSiteCategoryLabel } from '../../constants/siteCategories';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import { isMobileLayout } from '../../utils/deviceLayout';

interface FacilityModalProps {
  factory: Factory | null;
  onClose: () => void;
  supplyLinks: SupplyLink[];
  allFactories: Factory[];
  onSelectShipment: (shipment: SupplyLink) => void;
  canEditPosition?: boolean;
  onEditPosition?: (factory: Factory) => void;
  canEditType?: boolean;
  onSaveFactoryType?: (factoryId: string, type: FactoryType) => Promise<void>;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({
  factory,
  onClose,
  supplyLinks,
  allFactories,
  onSelectShipment,
  canEditPosition = false,
  onEditPosition,
  canEditType = false,
  onSaveFactoryType,
}) => {
  const { t, locale } = useI18n();
  const [draftType, setDraftType] = useState<FactoryType>('gok');
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [mobileLayout, setMobileLayout] = useState(() => isMobileLayout());

  useEffect(() => {
    setMobileLayout(isMobileLayout());
    const mq = window.matchMedia('(max-width: 640px)');
    const sync = () => setMobileLayout(isMobileLayout());
    mq.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    if (factory) {
      setDraftType(factory.type);
      setTypeError('');
    }
  }, [factory?.id, factory?.type]);

  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  if (!factory) return null;

  const handleTypeChange = async (next: FactoryType) => {
    if (!onSaveFactoryType || next === factory.type) return;
    setDraftType(next);
    setTypeSaving(true);
    setTypeError('');
    try {
      await onSaveFactoryType(factory.id, next);
    } catch (err) {
      setDraftType(factory.type);
      setTypeError(err instanceof Error ? err.message : t('facilityModal.typeSaveError'));
    } finally {
      setTypeSaving(false);
    }
  };

  const typeOptions = SITE_CATEGORIES.map(c => ({
    value: c.id,
    label: getSiteCategoryLabel(c.id, locale),
  }));

  const factoryMap = new Map<string, Factory>(allFactories.map(f => [f.id, f]));

  const outgoing = supplyLinks.filter(s => s.origin_id === factory.id);
  const incoming = supplyLinks.filter(s => s.destination_id === factory.id);

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`modal-panel facility-modal app-modal-sheet bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 ${isDragging ? 'is-sheet-dragging' : ''}`}
      >

        <header className="modal-panel-header app-modal-sheet-header">
          <AppBottomSheetHandle
            onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
            isDragging={isDragging}
          />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 flex-wrap">
                <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="facility-modal-title font-bold text-lg text-white break-words">{factory.name}</h3>
                  {factory.is_ours && (
                    <span className="inline-flex mt-1 px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {t('common.oursObject')}
                    </span>
                  )}
                </div>
              </div>
              <p className="facility-modal-meta text-xs text-slate-400 mt-1.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="break-words">
                  {factory.region}, {factory.country} ({factory.latitude.toFixed(2)}, {factory.longitude.toFixed(2)})
                </span>
              </p>
              <p className="facility-modal-meta facility-modal-id text-[11px] font-mono mt-1 truncate">{t('facilityModal.idLabel')}: {factory.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="modal-panel-body modal-scrollbar space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
            <div className="facility-modal-card">
              <span className="text-slate-400 font-medium">{t('facilityModal.typeLabel')}</span>
              {canEditType && onSaveFactoryType ? (
                <div className="mt-1 space-y-2">
                  <div className="facility-modal-type-select map-filter-panel">
                    <SearchableSelect
                      value={draftType}
                      onChange={v => {
                        const next = v as FactoryType;
                        if (next === factory.type) return;
                        void handleTypeChange(next);
                      }}
                      options={typeOptions}
                      searchable
                      disabled={typeSaving}
                      className="w-full"
                      panelClassName="map-filter-dropdown-panel"
                      listClassName="map-filter-period-list"
                      inlinePanel={mobileLayout}
                    />
                  </div>
                  {typeSaving && (
                    <div className="text-[11px] text-slate-400">{t('common.saving')}</div>
                  )}
                  {typeError && (
                    <div className="text-[11px] text-red-300">{typeError}</div>
                  )}
                </div>
              ) : (
                <div className="font-bold text-white text-sm mt-0.5">{t(`factoryType.${factory.type}`)}</div>
              )}
            </div>

            <div className="facility-modal-card">
              <span className="text-slate-400 font-medium">{t('facilityModal.holdingLabel')}</span>
              <div className="font-bold text-white text-sm mt-0.5 break-words">{factory.holding || t('facilityModal.holdingDefault')}</div>
            </div>
          </div>

          {factory.description && (
            <div className="facility-modal-card text-xs text-slate-300 italic break-words">
              &ldquo;{factory.description}&rdquo;
            </div>
          )}

          {factory.address && (
            <div className="facility-modal-card text-xs text-slate-300 break-words">
              <span className="text-slate-400 font-medium">{t('siteDirectory.admin.colAddress')}: </span>
              {factory.address}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span>{t('facilityModal.outgoing', { count: outgoing.length })}</span>
            </h4>
            {outgoing.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-1">{t('facilityModal.outgoingEmpty')}</div>
            ) : (
              <div className="facility-modal-list modal-scrollbar space-y-1.5">
                {outgoing.map(link => {
                  const dest = factoryMap.get(link.destination_id);
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => { onClose(); onSelectShipment(link); }}
                      className="facility-modal-shipment-btn w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white">{link.cargo_type}</span>
                        <span className="text-slate-400 text-[11px] ml-2">&rarr; {dest?.name || t('facilityModal.destination')}</span>
                      </div>
                      <span className="font-semibold text-emerald-400 shrink-0">{link.volume} {link.unit}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{t('facilityModal.incoming', { count: incoming.length })}</span>
            </h4>
            {incoming.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-1">{t('facilityModal.incomingEmpty')}</div>
            ) : (
              <div className="facility-modal-list modal-scrollbar space-y-1.5">
                {incoming.map(link => {
                  const orig = factoryMap.get(link.origin_id);
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => { onClose(); onSelectShipment(link); }}
                      className="facility-modal-shipment-btn w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white">{link.cargo_type}</span>
                        <span className="text-slate-400 text-[11px] ml-2">&larr; {orig?.name || t('common.sender')}</span>
                      </div>
                      <span className="font-semibold text-emerald-400 shrink-0">{link.volume} {link.unit}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="modal-panel-footer">
          <div className="facility-modal-footer-actions flex flex-wrap items-center justify-end gap-2">
            {canEditPosition && onEditPosition && (
              <button
                type="button"
                onClick={() => onEditPosition(factory)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold"
              >
                <Move className="w-3.5 h-3.5" />
                {t('map.editPosition')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              {t('common.close')}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
