'use client';

import { useState } from 'react';
import { ChevronUp, AlertTriangle, Navigation, Clock, Route } from 'lucide-react';
import type { RouteResult } from '@/types';
import { formatDistance, formatDuration } from '@/lib/format';

type Props = { route: RouteResult; onClose: () => void };

export default function RouteSummary({ route, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-ink-900/95 backdrop-blur-md border-t border-ink-700 rounded-t-2xl shadow-2xl shadow-black/60 grain animate-fade-up">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex justify-center pt-2 pb-1"
        aria-label={expanded ? 'Réduire' : 'Détails'}
      >
        <span className="w-10 h-1 rounded-full bg-ink-600" />
      </button>

      <div className="px-5 pb-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Itinéraire calculé</p>
            <h3 className="font-display text-xl font-semibold text-zinc-100">
              Route adaptée à ton gabarit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
          >
            Effacer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Route className="w-4 h-4" />} label="Distance" value={formatDistance(route.summary.distance)} />
          <Stat icon={<Clock className="w-4 h-4" />} label="Durée" value={formatDuration(route.summary.duration)} />
          <Stat icon={<Navigation className="w-4 h-4" />} label="Étapes" value={String(route.steps.length)} />
        </div>

        {route.warnings && route.warnings.length > 0 && (
          <div className="mt-4 bg-amber-deep/10 border border-amber-deep/30 rounded-lg p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-glow flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-glow/90">
              <p className="font-medium mb-1">Vigilance</p>
              <ul className="space-y-0.5 text-amber-glow/70">
                {route.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 py-2"
        >
          <span>{expanded ? 'Masquer' : 'Voir'} les étapes</span>
          <ChevronUp
            className={`w-4 h-4 transition-transform ${expanded ? '' : 'rotate-180'}`}
          />
        </button>

        {expanded && (
          <div className="max-h-[40vh] overflow-y-auto mt-2 pr-1 space-y-1">
            {route.steps.map((s, i) => (
              <div
                key={i}
                className="flex gap-3 py-2.5 px-3 rounded-lg hover:bg-ink-800/60"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ink-700 text-zinc-300 text-xs font-mono flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 leading-snug">{s.instruction}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">
                    {formatDistance(s.distance)} · {formatDuration(s.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-ink-800/60 border border-ink-700 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="font-display text-lg text-zinc-100 mt-1 tabular-nums">{value}</div>
    </div>
  );
}
