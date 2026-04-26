'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Theme = 'light' | 'dark';

type Props = {
  start: [number, number] | null;
  end: [number, number] | null;
  routeGeometry: GeoJSON.LineString | null;
  bbox: [number, number, number, number] | null;
  userPosition: [number, number] | null;
  userHeading: number | null; // degrés depuis le Nord
  theme: Theme;
  followUser: boolean; // mode navigation : caméra suit la position
};

const TILES = {
  light: [
    'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
  ],
  dark: [
    'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
    'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
    'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
  ],
};

function buildStyle(theme: Theme): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: TILES[theme],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}

export default function MapView({
  start,
  end,
  routeGeometry,
  bbox,
  userPosition,
  userHeading,
  theme,
  followUser,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const startMarker = useRef<Marker | null>(null);
  const endMarker = useRef<Marker | null>(null);
  const userMarker = useRef<Marker | null>(null);
  const userMarkerEl = useRef<HTMLDivElement | null>(null);

  // Init carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(theme),
      center: [2.35, 46.6],
      zoom: 5,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de thème : reload du style
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildStyle(theme), { diff: false });
    // Réappliquer la route après changement de style
    map.once('idle', () => {
      if (routeGeometry) addRouteLayer(map, routeGeometry);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

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

    if (!userPosition) {
      userMarker.current?.remove();
      userMarker.current = null;
      userMarkerEl.current = null;
      return;
    }

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'rh-marker-user-wrap';
      el.innerHTML = `
        <div class="rh-marker-user-pulse"></div>
        <div class="rh-marker-user-arrow">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 2 L19 20 L12 16 L5 20 Z" fill="#3b82f6" stroke="#0a0a0c" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      userMarkerEl.current = el;
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat(userPosition).addTo(map);
    } else {
      userMarker.current.setLngLat(userPosition);
    }
  }, [userPosition]);

  // Rotation du marker selon le cap
  useEffect(() => {
    if (!userMarkerEl.current) return;
    const arrow = userMarkerEl.current.querySelector<HTMLDivElement>('.rh-marker-user-arrow');
    if (arrow) {
      arrow.style.transform = `rotate(${userHeading ?? 0}deg)`;
    }
  }, [userHeading]);

  // Tracé de la route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => addRouteLayer(map, routeGeometry);
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [routeGeometry]);

  // Recadrage sur la bbox de la route (UNIQUEMENT si pas en mode suivi)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !bbox || followUser) return;
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: { top: 80, bottom: 80, left: 40, right: 40 }, duration: 1200 },
    );
  }, [bbox, followUser]);

  // Mode suivi : la caméra colle à la position avec le cap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followUser || !userPosition) return;

    map.easeTo({
      center: userPosition,
      zoom: 16.5,
      pitch: 55,
      bearing: userHeading ?? 0,
      duration: 800,
      essential: true,
    });
  }, [followUser, userPosition, userHeading]);

  // Reset caméra quand on sort du mode suivi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || followUser) return;
    map.easeTo({ pitch: 0, duration: 600 });
  }, [followUser]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
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
        .rh-marker-user-wrap {
          position: relative;
          width: 36px;
          height: 36px;
        }
        .rh-marker-user-pulse {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.25);
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .rh-marker-user-arrow {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
        }
      `}</style>
    </div>
  );
}

function addRouteLayer(map: MLMap, geom: GeoJSON.LineString | null) {
  if (map.getLayer('route-glow')) map.removeLayer('route-glow');
  if (map.getLayer('route-line')) map.removeLayer('route-line');
  if (map.getLayer('route-arrows')) map.removeLayer('route-arrows');
  if (map.getSource('route')) map.removeSource('route');

  if (!geom) return;

  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: geom, properties: {} },
  });
  map.addLayer({
    id: 'route-glow',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#ffb547',
      'line-width': 12,
      'line-opacity': 0.18,
      'line-blur': 4,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#ffb547', 'line-width': 5 },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });
}
