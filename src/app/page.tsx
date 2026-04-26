'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDownUp, Crosshair, Loader2, Navigation2 } from 'lucide-react';
import AddressInput from '@/components/AddressInput';
import VehicleSelector from '@/components/VehicleSelector';
import VehicleCustomizer from '@/components/VehicleCustomizer';
import RouteSummary from '@/components/RouteSummary';
import { DEFAULT_PROFILES } from '@/lib/profiles';
import { useLocalStorage } from '@/lib/useLocalStorage';
import type { GeocodeResult, RouteResult, VehicleProfile } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [profile, setProfile] = useLocalStorage<VehicleProfile>(
    'routehaul.profile',
    DEFAULT_PROFILES[0],
  );
  const [customizing, setCustomizing] = useState(false);

  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [start, setStart] = useState<GeocodeResult | null>(null);
  const [end, setEnd] = useState<GeocodeResult | null>(null);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const canCompute = !!start && !!end && !computing;

  const startCoord = useMemo<[number, number] | null>(
    () => (start ? [start.lon, start.lat] : null),
    [start],
  );
  const endCoord = useMemo<[number, number] | null>(
    () => (end ? [end.lon, end.lat] : null),
    [end],
  );

  function swap() {
    const ts = startQuery,
      te = endQuery,
      ps = start,
      pe = end;
    setStartQuery(te);
    setEndQuery(ts);
    setStart(pe);
    setEnd(ps);
  }

  async function locateMe() {
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([longitude, latitude]);

        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
            { headers: { Accept: 'application/json' } },
          );
          const data = await r.json();
          if (data?.display_name) {
            setStart({ display_name: data.display_name, lat: latitude, lon: longitude });
            setStartQuery(data.display_name.split(',').slice(0, 2).join(','));
          } else {
            setStart({
              display_name: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
              lat: latitude,
              lon: longitude,
            });
            setStartQuery('Ma position');
          }
        } catch {
          setStart({ display_name: 'Ma position', lat: latitude, lon: longitude });
          setStartQuery('Ma position');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(`Impossible d'obtenir la position : ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function compute() {
    if (!startCoord || !endCoord) return;
    setComputing(true);
    setError(null);
    setRoute(null);
    try {
      const r = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startCoord,
          end: endCoord,
          vehicle: {
            height: profile.height,
            width: profile.width,
            length: profile.length,
            weight: profile.weight,
          },
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data?.error || 'Le calcul a échoué.');
        return;
      }

      const feature = data.features?.[0];
      if (!feature) {
        setError('Aucun itinéraire trouvé pour ce gabarit.');
        return;
      }

      const segs = feature.properties?.segments || [];
      const steps =
        segs.flatMap((s: { steps?: Array<{ instruction: string; distance: number; duration: number; type: number; name?: string }> }) =>
          s.steps?.map((st) => ({
            instruction: st.instruction,
            distance: st.distance,
            duration: st.duration,
            type: st.type,
            name: st.name,
          })) ?? [],
        ) ?? [];

      const warnings: string[] = [];
      if (feature.properties?.warnings) {
        for (const w of feature.properties.warnings) {
          if (w?.message) warnings.push(w.message);
        }
      }
      const ext = feature.properties?.extras?.roadaccessrestrictions;
      if (ext) warnings.push('Restrictions de circulation détectées sur le trajet.');

      setRoute({
        geometry: feature.geometry,
        summary: feature.properties.summary,
        steps,
        warnings: warnings.length ? warnings : undefined,
        bbox: data.bbox,
      });
    } catch (e) {
      setError(`Erreur réseau : ${String(e)}`);
    } finally {
      setComputing(false);
    }
  }

  return (
    <main className="fixed inset-0 flex flex-col lg:flex-row overflow-hidden">
      {/* ====== PANNEAU LATÉRAL (desktop) / OVERLAY (mobile) ====== */}
      <aside className="lg:relative lg:w-[420px] lg:h-full lg:flex-shrink-0 lg:bg-ink-900 lg:border-r lg:border-ink-800 lg:flex lg:flex-col lg:z-20">
        {/* Header */}
        <header className="absolute lg:relative top-0 left-0 right-0 z-10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-ink-950 via-ink-950/90 to-transparent lg:bg-none lg:border-b lg:border-ink-800 lg:pt-6 lg:pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-zinc-100 tracking-tight">
                Route<span className="text-amber-glow">Haul</span>
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                v1
              </span>
            </div>
            <button
              onClick={locateMe}
              disabled={locating}
              className="btn-ghost !p-2.5"
              aria-label="Ma position"
              title="Utiliser ma position"
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="hidden lg:block text-xs text-zinc-500 mt-2">
            Calcul d’itinéraire adapté au gabarit du véhicule.
          </p>
        </header>

        {/* Panneau scrollable */}
        <div className="absolute lg:relative top-16 lg:top-0 left-3 right-3 lg:left-0 lg:right-0 lg:flex-1 lg:overflow-y-auto z-10 bg-ink-900/85 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-0 border lg:border-0 border-ink-700 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none shadow-black/60 grain animate-fade-up">
          <div className="p-4 lg:p-5 space-y-3">
            <AddressInput
              label="Départ"
              placeholder="Adresse de départ"
              value={startQuery}
              accent="green"
              onChange={setStartQuery}
              onSelect={(r) => {
                setStart(r);
                setStartQuery(r.display_name.split(',').slice(0, 2).join(','));
              }}
              onClear={() => {
                setStart(null);
                setStartQuery('');
              }}
            />

            <div className="flex justify-center -my-1">
              <button
                onClick={swap}
                className="p-1.5 rounded-full bg-ink-800 border border-ink-700 hover:bg-ink-700 hover:border-ink-600 transition-colors"
                aria-label="Inverser"
                title="Inverser départ et arrivée"
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            <AddressInput
              label="Arrivée"
              placeholder="Destination"
              value={endQuery}
              accent="amber"
              onChange={setEndQuery}
              onSelect={(r) => {
                setEnd(r);
                setEndQuery(r.display_name.split(',').slice(0, 2).join(','));
              }}
              onClear={() => {
                setEnd(null);
                setEndQuery('');
              }}
            />

            <div className="pt-1">
              <VehicleSelector
                profile={profile}
                profiles={DEFAULT_PROFILES}
                onChange={setProfile}
                onCustomize={() => setCustomizing(true)}
              />
            </div>

            <button
              onClick={compute}
              disabled={!canCompute}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {computing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calcul de l’itinéraire…
                </>
              ) : (
                <>
                  <Navigation2 className="w-4 h-4" />
                  Calculer l’itinéraire
                </>
              )}
            </button>

            {error && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg p-3 leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {!route && (
            <div className="px-4 lg:px-5 py-3 border-t border-ink-700/60 text-[11px] text-zinc-600 leading-relaxed">
              <span className="text-zinc-500 font-medium">Astuce :</span> mesure ton van{' '}
              <em>chargé</em> avec ton plus grand cheval. C’est la hauteur réelle, pas
              celle du constructeur.
            </div>
          )}

          {route && (
            <RouteSummary
              route={route}
              onClose={() => {
                setRoute(null);
                setError(null);
              }}
            />
          )}
        </div>
      </aside>

      {/* ====== CARTE ====== */}
      <section className="relative flex-1 min-h-0 lg:h-full bg-ink-950">
        <MapView
          start={startCoord}
          end={endCoord}
          routeGeometry={route?.geometry ?? null}
          bbox={route?.bbox ?? null}
          userPosition={userPos}
        />
      </section>

      {customizing && (
        <VehicleCustomizer
          profile={profile}
          onClose={() => setCustomizing(false)}
          onSave={(p) => {
            setProfile(p);
            setCustomizing(false);
          }}
        />
      )}
    </main>
  );
}
