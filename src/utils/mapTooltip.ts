import type { Layer, LeafletEventHandlerFn, Marker } from 'leaflet';
import type { Factory, FactoryType } from '../types';
import type { FactorySalesTrendDirection } from './factoryTrend';

/** Safely close tooltips on factory markers (Map.closeTooltip expects a tooltip arg — do not use on map). */
export function closeAllMarkerTooltips(markers: Iterable<Marker>): void {
  for (const marker of markers) {
    try {
      marker.closeTooltip();
    } catch {
      /* marker removed or tooltip not bound */
    }
  }
}

/** Leaflet opens tooltips on click by default — we only want hover (or modal on click). */
export function disableLeafletTooltipClick(layer: Layer): void {
  const withTooltip = layer as Layer & { _openTooltip?: LeafletEventHandlerFn };
  if (withTooltip._openTooltip) {
    layer.off('click', withTooltip._openTooltip);
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildFactoryTooltipHtml(
  factory: Factory,
  typeLabel: string,
  typeColor: string,
  oursLabel: string,
  holdingLabel?: string,
  trend?: {
    direction: FactorySalesTrendDirection;
    currentVolume: number;
    previousVolume: number;
    labelUp: string;
    labelDown: string;
    labelFlat: string;
    volumeLabel: string;
  },
): string {
  const holding = factory.holding
    ? `<div style="margin-top:4px;font-weight:500;color:var(--map-tooltip-text);">${escapeHtml(holdingLabel ?? factory.holding)}</div>`
    : '';
  const description = factory.description
    ? `<div style="margin-top:4px;font-style:italic;color:var(--map-tooltip-muted);">${escapeHtml(factory.description)}</div>`
    : '';
  const addressLine = factory.address
    ? `<div style="margin-top:4px;color:var(--map-tooltip-text);font-size:11px;">${escapeHtml(factory.address)}</div>`
    : '';
  const kladrLine = factory.kladr_id
    ? `<div style="margin-top:2px;font-size:10px;color:var(--map-tooltip-muted);">KLADR: ${escapeHtml(factory.kladr_id)}</div>`
    : '';
  const ours = factory.is_ours
    ? `<span style="margin-left:6px;padding:1px 4px;font-size:9px;font-weight:600;border-radius:3px;background:var(--map-tooltip-ours-bg);color:var(--map-tooltip-ours-text);">${escapeHtml(oursLabel)}</span>`
    : '';

  const trendLine = trend
    ? (() => {
        const trendLabel =
          trend.direction === 'up'
            ? trend.labelUp
            : trend.direction === 'down'
              ? trend.labelDown
              : trend.labelFlat;
        const trendColor =
          trend.direction === 'up'
            ? '#16a34a'
            : trend.direction === 'down'
              ? '#dc2626'
              : '#64748b';
        return `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--map-tooltip-border);font-size:11px;color:${trendColor};font-weight:600;">${escapeHtml(trendLabel)}</div>
    <div style="margin-top:2px;font-size:10px;color:var(--map-tooltip-muted);">${escapeHtml(trend.volumeLabel)}</div>`;
      })()
    : '';

  return `<div style="padding:8px;font-size:12px;font-family:system-ui,sans-serif;line-height:1.35;white-space:normal;max-width:260px;">
    <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--map-tooltip-text);">
      <span style="width:8px;height:8px;border-radius:9999px;background:${typeColor};flex-shrink:0;"></span>
      <span>${escapeHtml(factory.name)}</span>
      ${ours}
    </div>
    <div style="margin-top:2px;font-size:10px;font-family:ui-monospace,monospace;color:var(--map-tooltip-accent);">${escapeHtml(factory.id)}</div>
    <div style="margin-top:2px;color:var(--map-tooltip-muted);">${escapeHtml(typeLabel)} · ${escapeHtml(factory.region)}, ${escapeHtml(factory.country)}</div>
    ${holding}
    ${addressLine}
    ${kladrLine}
    ${description}
    ${trendLine}
  </div>`;
}

export const factoryTypeColors: Record<FactoryType, string> = {
  gok: '#f59e0b',
  port: '#3b82f6',
  steel_mill: '#ef4444',
  slag_dump: '#6b7280',
  coal_mine: '#8b5cf6',
};
