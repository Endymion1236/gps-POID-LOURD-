'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { distance, projectOnRoute, remainingDistance } from './geo';
import { speak, stopSpeech, primeSpeech } from './speech';
import type { RouteResult, RouteStep } from '@/types';

export type NavState = {
  active: boolean;
  position: [number, number] | null;
  heading: number | null;
  speedKmh: number;
  currentStepIndex: number;
  currentStep: RouteStep | null;
  distanceToNextManeuver: number; // en mètres
  remainingDistance: number;
  remainingDuration: number; // estimée
  offRoute: boolean;
  recalculating: boolean;
};

const OFF_ROUTE_THRESHOLD = 50; // mètres
const OFF_ROUTE_CONFIRMATIONS = 3; // 3 mesures consécutives avant de déclencher
const ANNOUNCE_DISTANCES = [500, 200, 50]; // mètres avant manœuvre où on parle

type Options = {
  voiceEnabled: boolean;
  onOffRoute: () => void;
};

export function useNavigation(route: RouteResult | null, opts: Options) {
  const [state, setState] = useState<NavState>({
    active: false,
    position: null,
    heading: null,
    speedKmh: 0,
    currentStepIndex: 0,
    currentStep: route?.steps[0] ?? null,
    distanceToNextManeuver: 0,
    remainingDistance: route?.summary.distance ?? 0,
    remainingDuration: route?.summary.duration ?? 0,
    offRoute: false,
    recalculating: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const offRouteCountRef = useRef(0);
  const announcedDistancesRef = useRef<Set<number>>(new Set());
  const lastStepIndexRef = useRef<number>(-1);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopSpeech();
    setState((s) => ({ ...s, active: false }));
  }, []);

  const start = useCallback(async () => {
    if (!route) return;
    if (!('geolocation' in navigator)) {
      alert('Géolocalisation non supportée par ton navigateur.');
      return;
    }

    // "Réveiller" le moteur vocal (iOS exige un user-gesture pour autoriser le son)
    if (opts.voiceEnabled) {
      await primeSpeech();
      speak('Navigation démarrée. Bonne route.');
    }

    offRouteCountRef.current = 0;
    announcedDistancesRef.current.clear();
    lastStepIndexRef.current = -1;

    setState((s) => ({
      ...s,
      active: true,
      currentStepIndex: 0,
      currentStep: route.steps[0] ?? null,
      remainingDistance: route.summary.distance,
      remainingDuration: route.summary.duration,
      offRoute: false,
    }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updatePosition(pos, route, opts),
      (err) => {
        console.error('Erreur géoloc:', err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  }, [route, opts]);

  const updatePosition = useCallback(
    (pos: GeolocationPosition, currentRoute: RouteResult, currentOpts: Options) => {
      const lon = pos.coords.longitude;
      const lat = pos.coords.latitude;
      const heading = pos.coords.heading; // peut être null
      const speed = pos.coords.speed; // m/s, peut être null

      const userPos: [number, number] = [lon, lat];
      const coords = currentRoute.geometry.coordinates as [number, number][];

      const proj = projectOnRoute(userPos, coords);
      const isOff = proj.crossTrack > OFF_ROUTE_THRESHOLD;

      // Compteur off-route (anti-faux-positif)
      if (isOff) {
        offRouteCountRef.current += 1;
      } else {
        offRouteCountRef.current = 0;
      }

      // Trouver l'étape courante en se basant sur la position projetée
      const stepIndex = findCurrentStepIndex(proj.alongTrack, currentRoute);
      const currentStep = currentRoute.steps[stepIndex] ?? null;
      const nextStep = currentRoute.steps[stepIndex + 1] ?? null;

      // Distance jusqu'à la prochaine manœuvre = fin de l'étape actuelle
      const stepEnd = sumStepDistances(currentRoute, stepIndex + 1);
      const distToManeuver = Math.max(0, stepEnd - proj.alongTrack);

      // Distance restante totale
      const remaining = remainingDistance(userPos, coords);
      const ratio = currentRoute.summary.distance > 0 ? remaining / currentRoute.summary.distance : 0;
      const remainingDur = currentRoute.summary.duration * ratio;

      // === ANNONCES VOCALES ===
      if (currentOpts.voiceEnabled) {
        // Nouvelle étape : annoncer immédiatement
        if (stepIndex !== lastStepIndexRef.current && lastStepIndexRef.current !== -1 && nextStep) {
          announcedDistancesRef.current.clear();
          speak(nextStep.instruction);
        }

        // Annonces basées sur la distance avant la manœuvre suivante
        if (nextStep) {
          for (const d of ANNOUNCE_DISTANCES) {
            if (distToManeuver <= d && !announcedDistancesRef.current.has(d)) {
              announcedDistancesRef.current.add(d);
              const dText = d >= 1000 ? `${(d / 1000).toFixed(1)} kilomètres` : `${d} mètres`;
              speak(`Dans ${dText}, ${nextStep.instruction.toLowerCase()}`);
              break;
            }
          }
        }

        // Arrivée
        if (remaining < 30 && stepIndex >= currentRoute.steps.length - 1) {
          if (!announcedDistancesRef.current.has(-1)) {
            announcedDistancesRef.current.add(-1);
            speak('Vous êtes arrivé à destination.');
          }
        }
      }

      lastStepIndexRef.current = stepIndex;

      // === HORS ITINÉRAIRE ===
      if (offRouteCountRef.current >= OFF_ROUTE_CONFIRMATIONS) {
        if (currentOpts.voiceEnabled) speak('Recalcul de l’itinéraire.');
        offRouteCountRef.current = 0;
        setState((s) => ({ ...s, offRoute: true, recalculating: true }));
        currentOpts.onOffRoute();
      }

      setState((s) => ({
        ...s,
        position: userPos,
        heading: Number.isFinite(heading) ? (heading as number) : s.heading,
        speedKmh: speed ? Math.max(0, speed * 3.6) : s.speedKmh,
        currentStepIndex: stepIndex,
        currentStep,
        distanceToNextManeuver: distToManeuver,
        remainingDistance: remaining,
        remainingDuration: remainingDur,
        offRoute: false,
        recalculating: false,
      }));
    },
    [],
  );

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      stopSpeech();
    };
  }, []);

  return { state, start, stop };
}

function findCurrentStepIndex(alongTrack: number, route: RouteResult): number {
  let cumulated = 0;
  for (let i = 0; i < route.steps.length; i++) {
    cumulated += route.steps[i].distance;
    if (alongTrack < cumulated) return i;
  }
  return route.steps.length - 1;
}

function sumStepDistances(route: RouteResult, untilIndex: number): number {
  let total = 0;
  for (let i = 0; i < Math.min(untilIndex, route.steps.length); i++) {
    total += route.steps[i].distance;
  }
  return total;
}
