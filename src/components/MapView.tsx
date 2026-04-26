'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  start: [number, number] | null;
  end: [number, number] | null;
  routeGeometry: GeoJSON.LineString | null;
  bbox: [number, number, number, number] | null;
  userPosition: [number, number] | null;
};

export default function MapView({ start, end, routeGeometry, bbox, userPosition }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const startMarker = useRef<Marker | null>(null);
  const endMarker = useRef<Marker | null>(null);
  const userMarker = useRef<Marker | null>(null);

  // Init carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
      },
      center: [2.35, 46.6], // France centre
      zoom: 5,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Marker départ
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    startMarker.current?.remove();
    if (start) {
      const el = document.createElement('div');
      el.className = 'rh-marker rh-marker-start';
      startMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(start)
        .addTo(map);
    }
  }, [start]);

  // Marker arrivée
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    endMarker.current?.remove();
    if (end) {
      const el = document.createElement('div');
      el.className = 'rh-marker rh-marker-end';
      endMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(end)
        .addTo(map);
    }
  }, [end]);

  // Marker position utilisateur
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarker.current?.remove();
    if (userPosition) {
      const el = document.createElement('div');
      el.className = 'rh-marker-user';
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat(userPosition)
        .addTo(map);
    }
  }, [userPosition]);

  // Tracé de la route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (map.getLayer('route-glow')) map.removeLayer('route-glow');
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');

      if (routeGeometry) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: routeGeometry, properties: {} },
        });
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#ffb547',
            'line-width': 10,
            'line-opacity': 0.18,
            'line-blur': 3,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#ffb547', 'line-width': 4 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [routeGeometry]);

  // Recadrage sur la bbox de la route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bbox) return;
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: { top: 80, bottom: 280, left: 40, right: 40 }, duration: 1200 },
    );
  }, [bbox]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <style jsx global>{`
        .rh-marker {
          width: 28px;
          height: 36px;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }
        .rh-marker-start {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 36'><path d='M14 0C6.3 0 0 6.3 0 14c0 9.7 14 22 14 22s14-12.3 14-22c0-7.7-6.3-14-14-14z' fill='%2334d399'/><circle cx='14' cy='14' r='5' fill='%23064e3b'/></svg>");
        }
        .rh-marker-end {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 36'><path d='M14 0C6.3 0 0 6.3 0 14c0 9.7 14 22 14 22s14-12.3 14-22c0-7.7-6.3-14-14-14z' fill='%23ffb547'/><circle cx='14' cy='14' r='5' fill='%237c2d12'/></svg>");
        }
        .rh-marker-user {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #60a5fa;
          border: 3px solid #0a0a0c;
          box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.3), 0 0 20px rgba(96, 165, 250, 0.6);
          animation: pulse-user 2s ease-in-out infinite;
        }
        @keyframes pulse-user {
          0%, 100% { box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.3), 0 0 20px rgba(96, 165, 250, 0.6); }
          50% { box-shadow: 0 0 0 10px rgba(96, 165, 250, 0.05), 0 0 30px rgba(96, 165, 250, 0.4); }
        }
      `}</style>
    </div>
  );
}
