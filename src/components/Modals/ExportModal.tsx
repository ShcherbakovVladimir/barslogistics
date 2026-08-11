import React, { useMemo, useState } from 'react';
import { Factory, SupplyLink, User } from '../../types';
import { useI18n } from '../../i18n';
import { Download, FileSpreadsheet, FileText, Check } from 'lucide-react';
import {
  isFactoryInUserScope,
  isShipmentInUserScope,
  maskSupplyLinkFinancials,
} from '../../utils/permissions';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  factories: Factory[];
  supplyLinks: SupplyLink[];
  currentUser: User;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  factories,
  supplyLinks,
  currentUser,
}) => {
  const { t, localeTag } = useI18n();
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeFactories, setIncludeFactories] = useState(true);
  const [includeShipments, setIncludeShipments] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const scopedLinks = useMemo(
    () => supplyLinks
      .filter(link => isShipmentInUserScope(link, currentUser))
      .map(link => maskSupplyLinkFinancials(link, currentUser)),
    [supplyLinks, currentUser],
  );

  const scopedFactories = useMemo(() => {
    const linkedIds = new Set<string>();
    for (const link of scopedLinks) {
      linkedIds.add(link.origin_id);
      linkedIds.add(link.destination_id);
    }
    return factories.filter(factory => isFactoryInUserScope(factory, currentUser, linkedIds));
  }, [factories, scopedLinks, currentUser]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setSuccessMsg('');

    try {
      if (exportFormat === 'excel') {
        const ExcelJS = await import('exceljs');
        const wb = new ExcelJS.Workbook();

        const addJsonSheet = (sheetName: string, rows: Record<string, string | number | boolean>[]) => {
          const ws = wb.addWorksheet(sheetName.slice(0, 31));
          if (rows.length === 0) return;
          const keys = Object.keys(rows[0]);
          ws.columns = keys.map(key => ({ header: key, key, width: Math.min(32, key.length + 4) }));
          ws.addRows(rows);
        };

        if (includeFactories) {
          const facData = scopedFactories.map(f => ({
            [t('export.colId')]: f.id,
            [t('export.colName')]: f.name,
            [t('export.colType')]: f.type,
            [t('export.colLatitude')]: f.latitude,
            [t('export.colLongitude')]: f.longitude,
            [t('export.colRegion')]: f.region,
            [t('export.colCountry')]: f.country,
            [t('export.colIsOurs')]: f.is_ours ? t('common.yes') : t('common.no'),
            [t('export.colHolding')]: f.holding || '-',
            [t('export.colDescription')]: f.description || '-',
          }));
          addJsonSheet(t('export.sheetFactories'), facData);
        }

        if (includeShipments) {
          const factoryMap = new Map(scopedFactories.map(f => [f.id, f.name]));
          const shipData = scopedLinks.map(s => ({
            [t('export.colRouteId')]: s.id,
            [t('common.sender')]: factoryMap.get(s.origin_id) || s.origin_id,
            [t('common.receiver')]: factoryMap.get(s.destination_id) || s.destination_id,
            [t('export.colCargoType')]: s.cargo_type,
            [t('export.colVolume')]: s.volume,
            [t('export.colUnit')]: s.unit,
            [t('export.colChannel')]: s.source === 'own' ? t('export.channelOwn') : t('export.channelRzd'),
            [t('export.colPeriod')]: s.period,
            [t('common.status')]: s.status || 'en_route',
            [t('export.colCarrier')]: s.carrier_name || '-',
          }));
          addJsonSheet(t('export.sheetShipments'), shipData);
        }

        const fileName = `logistics_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        setSuccessMsg(t('export.successExcel', { fileName }));
      } else {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(t('export.pdfTitle'), 14, 20);

        doc.setFontSize(10);
        doc.text(t('export.pdfDate', { date: new Date().toLocaleString(localeTag) }), 14, 28);
        doc.text(t('export.pdfSummary', { factories: scopedFactories.length, shipments: scopedLinks.length }), 14, 34);

        let y = 45;
        doc.setFontSize(12);
        doc.text(t('export.pdfRoutesHeading'), 14, y);
        y += 8;

        doc.setFontSize(9);
        const factoryMap = new Map(scopedFactories.map(f => [f.id, f.name]));
        scopedLinks.slice(0, 15).forEach((s, idx) => {
          const orig = factoryMap.get(s.origin_id) || t('common.object');
          const dest = factoryMap.get(s.destination_id) || t('common.object');
          const line = `${idx + 1}. ${s.cargo_type} (${s.volume} ${s.unit}): ${orig} -> ${dest} [${(s.status || 'en_route').toUpperCase()}]`;
          doc.text(line, 14, y);
          y += 6;
        });

        const fileName = `logistics_report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        setSuccessMsg(t('export.successPdf', { fileName }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full text-slate-100 shadow-2xl">
        <div className="modal-panel-header">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base text-white flex items-center gap-2 min-w-0">
              <Download className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{t('export.title')}</span>
            </h3>
            <button type="button" onClick={onClose} className="shrink-0 text-slate-400 hover:text-white p-1">✕</button>
          </div>
        </div>

        <div className="modal-panel-body space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExportFormat('excel')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                exportFormat === 'excel'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                exportFormat === 'pdf'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={includeFactories} onChange={e => setIncludeFactories(e.target.checked)} />
              {t('export.dataFactories', { count: scopedFactories.length })}
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={includeShipments} onChange={e => setIncludeShipments(e.target.checked)} />
              {t('export.dataShipments', { count: scopedLinks.length })}
            </label>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-panel-footer flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || (!includeFactories && !includeShipments)}
            className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          >
            {exporting ? t('export.generating') : t('export.download')}
          </button>
        </div>
      </div>
    </div>
  );
};
