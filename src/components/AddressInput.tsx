'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import type { GeocodeResult } from '@/types';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: GeocodeResult) => void;
  onClear: () => void;
  accent: 'green' | 'amber';
};

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  onClear,
  accent,
}: Props) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (picked) return; // ne pas relancer après sélection
    if (value.length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = await r.json();
        if (Array.isArray(data)) {
          setResults(data);
          setOpen(true);
        }
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, picked]);

  // Fermer le dropdown au clic dehors
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const dot = accent === 'green' ? 'bg-emerald-400' : 'bg-amber-glow';

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          className="field pl-10 pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setPicked(false);
            onChange(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
        )}
        {!loading && value && (
          <button
            onClick={() => {
              onClear();
              setResults([]);
              setPicked(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full bg-ink-800 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-fade-up">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              onClick={() => {
                onSelect(r);
                setOpen(false);
                setPicked(true);
              }}
              className="w-full text-left px-4 py-3 hover:bg-ink-700 transition-colors border-b border-ink-700 last:border-0"
            >
              <div className="text-sm text-zinc-200 line-clamp-1">
                {r.display_name.split(',')[0]}
              </div>
              <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                {r.display_name.split(',').slice(1).join(',').trim()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
