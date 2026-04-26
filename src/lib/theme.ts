'use client';

import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'routehaul.theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [resolved, setResolved] = useState<ResolvedTheme>('dark');

  // Initialisation depuis localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === 'auto' || stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Calcul du thème résolu
  useEffect(() => {
    const compute = () => {
      const r = mode === 'auto' ? getSystemTheme() : mode;
      setResolved(r);
      document.documentElement.dataset.theme = r;
    };

    compute();

    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', compute);
      return () => mq.removeEventListener('change', compute);
    }
  }, [mode]);

  const change = useCallback((m: ThemeMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* noop */
    }
  }, []);

  return { mode, resolved, setMode: change };
}
