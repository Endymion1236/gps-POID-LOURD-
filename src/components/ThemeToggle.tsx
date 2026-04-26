'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '@/lib/theme';

type Props = {
  mode: ThemeMode;
  onChange: (m: ThemeMode) => void;
};

export default function ThemeToggle({ mode, onChange }: Props) {
  const next: Record<ThemeMode, ThemeMode> = {
    auto: 'light',
    light: 'dark',
    dark: 'auto',
  };
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const label =
    mode === 'auto' ? 'Auto (selon l’heure)' : mode === 'light' ? 'Clair' : 'Sombre';

  return (
    <button
      onClick={() => onChange(next[mode])}
      className="btn-ghost !p-2.5"
      aria-label={`Thème : ${label}`}
      title={`Thème : ${label}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
