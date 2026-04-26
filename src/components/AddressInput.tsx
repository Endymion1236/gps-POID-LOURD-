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
    if (picked) return;
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

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const dotColor = accent === 'green' ? '#34d399' : 'var(--accent)';

  return (
    <div ref={containerRef} className="relative">
      <label
        className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-4)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dotColor }}
        />
        {label}
      </label>
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--text-5)' }}
        />
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
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--text-4)' }} />
        )}
        {!loading && value && (
          <button
            onClick={() => {
              onClear();
              setResults([]);
              setPicked(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
            style={{ color: 'var(--text-4)' }}
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-30 mt-2 w-full rounded-lg overflow-hidden animate-fade-up"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-strong)',
          }}
        >
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              onClick={() => {
                onSelect(r);
                setOpen(false);
                setPicked(true);
              }}
              className="w-full text-left px-4 py-3 transition-colors border-b last:border-0"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-1)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--bg-3)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <div className="text-sm line-clamp-1">
                {r.display_name.split(',')[0]}
              </div>
              <div
                className="text-xs line-clamp-1 mt-0.5"
                style={{ color: 'var(--text-4)' }}
              >
                {r.display_name.split(',').slice(1).join(',').trim()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
