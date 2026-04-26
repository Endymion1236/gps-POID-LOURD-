'use client';

import { useState } from 'react';
import { ChevronUp, AlertTriangle, Navigation, Clock, Route } from 'lucide-react';
import type { RouteResult } from '@/types';
import { formatDistance, formatDuration } from '@/lib/format';

type Props = { route: RouteResult; onClose: () => void };

export default function RouteSummary({ route, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-ink-700/60 bg-ink-900/60 lg:bg-transparent grain animate-fade-up">
      <div className="px-4 lg:px-5 py-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Itinéraire</p>
            <h3 className="font-display text-base lg:text-lg font-semibold text-zinc-100">
              Adapté à ton gabarit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
          >
            Effacer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<Route className="w-3.5 h-3.5" />} label="Distance" value={formatDistance(route.summary.distance)} />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Durée" value={formatDuration(route.summary.duration)} />
          <Stat icon={<Navigation className="w-3.5 h-3.5" />} label="Étapes" value={String(route.steps.length)} />
        </div>

        {route.warnings && route.warnings.length > 0 && (
          <div className="mt-3 bg-amber-deep/10 border border-amber-deep/30 rounded-lg p-3 flex gap-2.5">
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
          className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 py-2 border border-ink-700/50 rounded-lg hover:bg-ink-800/40 transition-colors"
        >
          <span>{expanded ? 'Masquer' : 'Voir'} les {route.steps.length} étapes</span>
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : 'rotate-180'}`}
          />
        </button>

        {expanded && (
          <div className="mt-2 pr-1 space-y-1 max-h-[40vh] overflow-y-auto">
            {route.steps.map((s, i) => (
              <div
                key={i}
                className="flex gap-2.5 py-2 px-2 rounded-lg hover:bg-ink-800/60"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-ink-700 text-zinc-300 text-[10px] font-mono flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-200 leading-snug">{s.instruction}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
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
    <div className="bg-ink-800/60 border border-ink-700 rounded-lg p-2.5">
      <div className="flex items-center gap-1 text-zinc-500 text-[9px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="font-display text-base text-zinc-100 mt-0.5 tabular-nums leading-tight">{value}</div>
    </div>
  );
}
