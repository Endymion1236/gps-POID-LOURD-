'use client';

import {
  ArrowUpRight,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  X,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/format';
import type { NavState } from '@/lib/navigation';

type Props = {
  state: NavState;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStop: () => void;
};

/**
 * Choix d'icône selon le type d'étape ORS.
 * Codes ORS : 0=left, 1=right, 2=sharp left, 3=sharp right, 4=slight left, 5=slight right,
 * 6=straight, 7=enter roundabout, 8=exit roundabout, 9=u-turn, 10=goal, 11=depart...
 */
function maneuverIcon(type: number | undefined) {
  switch (type) {
    case 0:
    case 2:
    case 4:
      return CornerUpLeft;
    case 1:
    case 3:
    case 5:
      return CornerUpRight;
    case 9:
      return RotateCcw;
    case 7:
    case 8:
      return ArrowUpRight;
    default:
      return ArrowUp;
  }
}

export default function NavigationView({ state, voiceEnabled, onToggleVoice, onStop }: Props) {
  const Icon = maneuverIcon(state.currentStep?.type);
  const next = state.currentStep;

  return (
    <>
      {/* Bandeau supérieur — prochaine manœuvre */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <div className="bg-amber-glow text-ink-950 rounded-2xl shadow-2xl shadow-black/50 p-4 pointer-events-auto animate-fade-up grain">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-ink-950/15 flex items-center justify-center">
              <Icon className="w-9 h-9 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-3xl font-bold tabular-nums leading-none">
                {state.distanceToNextManeuver < 50
                  ? 'Maintenant'
                  : formatDistance(state.distanceToNextManeuver)}
              </div>
              <div className="text-sm font-medium opacity-80 mt-1 line-clamp-2 leading-snug">
                {next?.instruction ?? 'Suivez le tracé'}
              </div>
            </div>
          </div>
        </div>

        {state.recalculating && (
          <div className="mt-2 bg-ink-900/90 backdrop-blur-md text-zinc-100 rounded-xl px-4 py-2.5 flex items-center gap-2 pointer-events-auto animate-fade-up shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-amber-glow" />
            <span className="text-sm">Recalcul de l’itinéraire…</span>
          </div>
        )}
      </div>

      {/* Bandeau inférieur — stats + contrôles */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-ink-950/90 to-transparent">
        <div className="bg-ink-900/95 backdrop-blur-xl border border-ink-700 rounded-2xl shadow-2xl shadow-black/50 p-4 grain animate-fade-up">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat
              label="Restant"
              value={formatDistance(state.remainingDistance)}
              accent="amber"
            />
            <Stat
              label="Arrivée dans"
              value={formatDuration(state.remainingDuration)}
            />
            <Stat
              label="Vitesse"
              value={`${Math.round(state.speedKmh)} km/h`}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onToggleVoice}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                voiceEnabled
                  ? 'bg-ink-800 border-ink-700 text-zinc-100'
                  : 'bg-ink-900 border-ink-800 text-zinc-500'
              }`}
            >
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                Voix {voiceEnabled ? 'activée' : 'coupée'}
              </span>
            </button>
            <button
              onClick={onStop}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-950/60 border border-red-900/60 text-red-300 hover:bg-red-950/80 transition-all"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Arrêter</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'amber';
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`font-display text-xl font-semibold tabular-nums leading-tight mt-0.5 ${
          accent === 'amber' ? 'text-amber-glow' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
