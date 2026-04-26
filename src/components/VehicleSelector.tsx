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

export default function VehicleSelector({ profile, profiles, onChange, onCustomize }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Véhicule
      </label>

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-ink-600 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{profile.emoji}</span>
          <span>
            <span className="block text-sm text-zinc-100">{profile.name}</span>
            <span className="block text-[11px] text-zinc-500 font-mono mt-0.5">
              H {profile.height}m · L {profile.length}m · {profile.weight}T
            </span>
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-ink-800 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-fade-up max-h-80 overflow-y-auto">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-ink-700 transition-colors border-b border-ink-700 last:border-0 flex items-center gap-3 ${
                p.id === profile.id ? 'bg-ink-700/50' : ''
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm text-zinc-100">{p.name}</span>
                <span className="block text-[11px] text-zinc-500 font-mono mt-0.5">
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
            className="w-full text-left px-4 py-3 hover:bg-ink-700 transition-colors flex items-center gap-3 text-amber-glow border-t border-ink-700"
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">Personnaliser les dimensions</span>
          </button>
        </div>
      )}
    </div>
  );
}
