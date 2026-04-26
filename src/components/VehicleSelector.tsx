'use client';

import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import type { VehicleProfile } from '@/types';

type Props = {
  profile: VehicleProfile;
  profiles: VehicleProfile[];
  onChange: (p: VehicleProfile) => void;
  onCustomize: () => void;
};

export default function VehicleSelector({
  profile,
  profiles,
  onChange,
  onCustomize,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label
        className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-4)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Véhicule
      </label>

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg px-4 py-3 text-left flex items-center justify-between transition-colors"
        style={{
          background: 'color-mix(in srgb, var(--bg-1) 60%, transparent)',
          border: '1px solid var(--border)',
          color: 'var(--text-1)',
        }}
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{profile.emoji}</span>
          <span>
            <span className="block text-sm">{profile.name}</span>
            <span
              className="block text-[11px] font-mono mt-0.5"
              style={{ color: 'var(--text-4)' }}
            >
              H {profile.height}m · L {profile.length}m · {profile.weight}T
            </span>
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-4)' }}
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-2 w-full rounded-lg overflow-hidden animate-fade-up max-h-80 overflow-y-auto"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-strong)',
          }}
        >
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 border-b last:border-0 flex items-center gap-3 transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-1)',
                background: p.id === profile.id ? 'var(--bg-3)' : 'transparent',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  p.id === profile.id ? 'var(--bg-3)' : 'var(--bg-3)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  p.id === profile.id ? 'var(--bg-3)' : 'transparent')
              }
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm">{p.name}</span>
                <span
                  className="block text-[11px] font-mono mt-0.5"
                  style={{ color: 'var(--text-4)' }}
                >
                  H {p.height}m · L {p.length}m · {p.weight}T
                </span>
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              onCustomize();
            }}
            className="w-full text-left px-4 py-3 flex items-center gap-3 border-t transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--accent)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">Personnaliser les dimensions</span>
          </button>
        </div>
      )}
    </div>
  );
}
