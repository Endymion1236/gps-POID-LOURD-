'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { VehicleProfile } from '@/types';

type Props = {
  profile: VehicleProfile;
  onSave: (p: VehicleProfile) => void;
  onClose: () => void;
};

export default function VehicleCustomizer({ profile, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<VehicleProfile>({ ...profile });

  function update<K extends keyof VehicleProfile>(k: K, v: VehicleProfile[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-ink-900 border-t sm:border border-ink-700 rounded-t-2xl sm:rounded-2xl p-6 grain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-100">
              Mon véhicule
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Adapte les dimensions à ton vrai gabarit chargé.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 text-zinc-500 hover:text-zinc-300"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
              Nom du profil
            </label>
            <input
              type="text"
              className="field"
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Hauteur (m)"
              value={draft.height}
              step={0.05}
              onChange={(v) => update('height', v)}
              hint="Le piège n°1 — mesure ton van chargé"
            />
            <NumberField
              label="Largeur (m)"
              value={draft.width}
              step={0.05}
              onChange={(v) => update('width', v)}
            />
            <NumberField
              label="Longueur (m)"
              value={draft.length}
              step={0.1}
              onChange={(v) => update('length', v)}
            />
            <NumberField
              label="Poids (T)"
              value={draft.weight}
              step={0.1}
              onChange={(v) => update('weight', v)}
              hint="Charge totale"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-ghost flex-1">
            Annuler
          </button>
          <button onClick={() => onSave(draft)} className="btn-primary flex-1">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min={0}
        className="field font-mono"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}
