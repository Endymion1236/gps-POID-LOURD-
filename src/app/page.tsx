'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDownUp, Crosshair, Loader2, Navigation2, Play } from 'lucide-react';
import AddressInput from '@/components/AddressInput';
import VehicleSelector from '@/components/VehicleSelector';
import VehicleCustomizer from '@/components/VehicleCustomizer';
import RouteSummary from '@/components/RouteSummary';
import NavigationView from '@/components/NavigationView';
import ThemeToggle from '@/components/ThemeToggle';
import { DEFAULT_PROFILES } from '@/lib/profiles';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useTheme } from '@/lib/theme';
import { useNavigation } from '@/lib/navigation';
import type { GeocodeResult, RouteResult, VehicleProfile } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const { mode: themeMode, resolved: theme, setMode: setThemeMode } = useTheme();

  const [profile, setProfile] = useLocalStorage<VehicleProfile>(
    'routehaul.profile',
    DEFAULT_PROFILES[0],
  );
  const [voiceEnabled, setVoiceEnabled] = useLocalStorage<boolean>(
    'routehaul.voice',
    true,
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
  const [userHeading, setUserHeading] = useState<number | null>(null);
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

  // === RECALCUL pour off-route ===
  const handleOffRoute = useCallback(async () => {
    if (!userPos || !endCoord) return;
    try {
      const r = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: userPos,
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
      const feature = data.features?.[0];
      if (!feature) return;

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

      setRoute({
        geometry: feature.geometry,
        summary: feature.properties.summary,
        steps,
        bbox: data.bbox,
      });
    } catch (e) {
      console.error('Recalcul échoué:', e);
    }
  }, [userPos, endCoord, profile]);

  const { state: navState, start: startNav, stop: stopNav } = useNavigation(route, {
    voiceEnabled,
    onOffRoute: handleOffRoute,
  });

  // Sync de la position vers l'affichage
  useEffect(() => {
    if (navState.position) setUserPos(navState.position);
    if (navState.heading != null) setUserHeading(navState.heading);
  }, [navState.position, navState.heading]);

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

  // ====== MODE NAVIGATION : layout simplifié, carte plein écran ======
  if (navState.active && route) {
    return (
      <main className="fixed inset-0 overflow-hidden bg-[var(--bg-0)]">
        <MapView
          start={startCoord}
          end={endCoord}
          routeGeometry={route.geometry}
          bbox={route.bbox}
          userPosition={userPos}
          userHeading={userHeading}
          theme={theme}
          followUser={true}
        />
        <NavigationView
          state={navState}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          onStop={stopNav}
        />
      </main>
    );
  }

  // ====== MODE PLANIFICATION ======
  return (
    <main className="fixed inset-0 flex flex-col lg:flex-row overflow-hidden bg-[var(--bg-0)]">
      <aside className="lg:relative lg:w-[420px] lg:h-full lg:flex-shrink-0 lg:bg-[var(--bg-1)] lg:border-r lg:border-[var(--border)] lg:flex lg:flex-col lg:z-20">
        <header
          className="absolute lg:relative top-0 left-0 right-0 z-10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 lg:bg-none lg:border-b lg:border-[var(--border)] lg:pt-6 lg:pb-5"
          style={{
            background:
              theme === 'dark'
                ? 'linear-gradient(to bottom, var(--bg-0) 0%, color-mix(in srgb, var(--bg-0) 80%, transparent) 70%, transparent 100%)'
                : 'linear-gradient(to bottom, var(--bg-0) 0%, color-mix(in srgb, var(--bg-0) 90%, transparent) 70%, transparent 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
                Route<span style={{ color: 'var(--accent)' }}>Haul</span>
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-5)' }}>
                v1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle mode={themeMode} onChange={setThemeMode} />
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
          </div>
          <p className="hidden lg:block text-xs mt-2" style={{ color: 'var(--text-4)' }}>
            Calcul d’itinéraire adapté au gabarit du véhicule.
          </p>
        </header>

        <div
          className="absolute lg:relative top-16 lg:top-0 left-3 right-3 lg:left-0 lg:right-0 lg:flex-1 lg:overflow-y-auto z-10 backdrop-blur-xl lg:backdrop-blur-0 border lg:border-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none animate-fade-up grain"
          style={{
            background:
              'color-mix(in srgb, var(--bg-1) 85%, transparent)',
            borderColor: 'var(--border)',
          }}
        >
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
                className="p-1.5 rounded-full transition-colors border"
                style={{
                  background: 'var(--bg-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-3)',
                }}
                aria-label="Inverser"
                title="Inverser"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
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

            {/* Bouton "Démarrer la navigation" si on a un itinéraire */}
            {route && (
              <button
                onClick={startNav}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom, #34d399, #059669)',
                  color: '#022c22',
                  boxShadow: '0 8px 20px -8px rgba(5, 150, 105, 0.5)',
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                Démarrer la navigation
              </button>
            )}

            {error && (
              <div
                className="text-xs rounded-lg p-3 leading-relaxed"
                style={{
                  color: '#fca5a5',
                  background: 'rgba(127, 29, 29, 0.3)',
                  border: '1px solid rgba(127, 29, 29, 0.5)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {!route && (
            <div
              className="px-4 lg:px-5 py-3 border-t text-[11px] leading-relaxed"
              style={{ borderColor: 'var(--border)', color: 'var(--text-5)' }}
            >
              <span style={{ color: 'var(--text-4)', fontWeight: 500 }}>Astuce :</span>{' '}
              mesure ton van <em>chargé</em> avec ton plus grand cheval. C’est la hauteur
              réelle, pas celle du constructeur.
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

      <section className="relative flex-1 min-h-0 lg:h-full" style={{ background: 'var(--bg-0)' }}>
        <MapView
          start={startCoord}
          end={endCoord}
          routeGeometry={route?.geometry ?? null}
          bbox={route?.bbox ?? null}
          userPosition={userPos}
          userHeading={userHeading}
          theme={theme}
          followUser={false}
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
