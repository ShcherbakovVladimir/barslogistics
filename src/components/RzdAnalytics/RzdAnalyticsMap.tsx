import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RzdAggregatedRoute } from '../../types';

interface RzdAnalyticsMapProps {
  routes: RzdAggregatedRoute[];
  onSelectRoute?: (route: RzdAggregatedRoute) => void;
}

export function RzdAnalyticsMap({ routes, onSelectRoute }: RzdAnalyticsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [55.0, 60.0],
      zoom: 4,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (routes.length === 0) return;

    const bounds: L.LatLngExpression[] = [];
    const maxVol = Math.max(...routes.map(r => r.total_volume), 1);

    for (const route of routes) {
      const o: L.LatLngExpression = [route.origin_lat, route.origin_lng];
      const d: L.LatLngExpression = [route.dest_lat, route.dest_lng];
      bounds.push(o, d);

      const weight = 1.5 + (route.total_volume / maxVol) * 6;
      const opacity = 0.35 + (route.total_volume / maxVol) * 0.55;

      const line = L.polyline([o, d], {
        color: '#3b82f6',
        weight,
        opacity,
        dashArray: '6 4',
      });
      line.on('click', () => onSelectRoute?.(route));
      group.addLayer(line);

      const originMarker = L.circleMarker(o, {
        radius: 4,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.85,
        weight: 1,
      });
      originMarker.bindTooltip(route.origin_name, { className: 'text-xs' });
      group.addLayer(originMarker);

      const destMarker = L.circleMarker(d, {
        radius: 4,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.85,
        weight: 1,
      });
      destMarker.bindTooltip(route.dest_name, { className: 'text-xs' });
      group.addLayer(destMarker);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 8 });
    }
  }, [routes, onSelectRoute]);

  return (
    <div className="rzd-analytics-map relative w-full h-full min-h-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
