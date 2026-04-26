'use client';

import { useState } from 'react';
import { ChevronUp, AlertTriangle, Navigation, Clock, Route } from 'lucide-react';
import type { RouteResult } from '@/types';
import { formatDistance, formatDuration } from '@/lib/format';

type Props = { route: RouteResult; onClose: () => void };

export default function RouteSummary({ route, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-t grain animate-fade-up"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="px-4 lg:px-5 py-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-4)' }}
            >
              Itinéraire
            </p>
            <h3
              className="font-display text-base lg:text-lg font-semibold"
              style={{ color: 'var(--text-1)' }}
            >
              Adapté à ton gabarit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs underline underline-offset-2 hover:opacity-80"
            style={{ color: 'var(--text-4)' }}
          >
            Effacer
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<Route className="w-3.5 h-3.5" />}
            label="Distance"
            value={formatDistance(route.summary.distance)}
          />
          <Stat
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Durée"
            value={formatDuration(route.summary.duration)}
          />
          <Stat
            icon={<Navigation className="w-3.5 h-3.5" />}
            label="Étapes"
            value={String(route.steps.length)}
          />
        </div>

        {route.warnings && route.warnings.length > 0 && (
          <div
            className="mt-3 rounded-lg p-3 flex gap-2.5"
            style={{
              background: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
            }}
          >
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: 'var(--accent)' }}
            />
            <div className="text-xs" style={{ color: 'var(--accent)' }}>
              <p className="font-medium mb-1">Vigilance</p>
              <ul className="space-y-0.5 opacity-80">
                {route.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full mt-3 flex items-center justify-center gap-2 text-xs py-2 rounded-lg transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span>
            {expanded ? 'Masquer' : 'Voir'} les {route.steps.length} étapes
          </span>
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : 'rotate-180'}`}
          />
        </button>

        {expanded && (
          <div className="mt-2 pr-1 space-y-1 max-h-[40vh] overflow-y-auto">
            {route.steps.map((s, i) => (
              <div
                key={i}
                className="flex gap-2.5 py-2 px-2 rounded-lg transition-colors"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full text-[10px] font-mono flex items-center justify-center mt-0.5"
                  style={{
                    background: 'var(--bg-3)',
                    color: 'var(--text-2)',
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs leading-snug"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {s.instruction}
                  </p>
                  <p
                    className="text-[10px] font-mono mt-0.5"
                    style={{ color: 'var(--text-4)' }}
                  >
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
    <div
      className="rounded-lg p-2.5"
      style={{
        background: 'color-mix(in srgb, var(--bg-2) 70%, transparent)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center gap-1 text-[9px] uppercase tracking-wider"
        style={{ color: 'var(--text-4)' }}
      >
        {icon}
        {label}
      </div>
      <div
        className="font-display text-base mt-0.5 tabular-nums leading-tight"
        style={{ color: 'var(--text-1)' }}
      >
        {value}
      </div>
    </div>
  );
}
