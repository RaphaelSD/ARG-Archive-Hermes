'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

import { locations } from '@/lib/archive-data';
import { cn } from '@/lib/utils';

export function CityMap({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(locations.find((l) => l.current)?.id ?? locations[0]!.id);
  const selected = locations.find((l) => l.id === active)!;

  return (
    <div className={cn('grid gap-5', compact ? 'md:grid-cols-[1fr_240px]' : 'lg:grid-cols-[1fr_300px]')}>
      <div className="relative aspect-[16/11] overflow-hidden border border-border/70 bg-[oklch(0.19_0.008_70)]">
        <svg viewBox="0 0 100 62" className="absolute inset-0 size-full" aria-hidden>
          <g stroke="oklch(0.34 0.01 70)" strokeWidth="0.6" fill="none">
            <path d="M0 30 H100" />
            <path d="M20 0 V62" />
            <path d="M66 0 V62" />
            <path d="M0 48 C25 44, 45 52, 100 42" />
            <path d="M8 8 C40 14, 60 4, 96 18" />
            <path d="M40 0 C44 20, 34 40, 46 62" />
          </g>
          <g stroke="oklch(0.28 0.01 70)" strokeWidth="0.3" fill="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <path key={i} d={`M0 ${i * 5.5} H100`} />
            ))}
          </g>
        </svg>

        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActive(loc.id)}
            aria-label={loc.name}
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125',
              loc.current ? 'text-destructive' : loc.explored ? 'text-primary/70' : 'text-muted-foreground/50',
              active === loc.id && 'scale-125',
            )}
          >
            <MapPin className="size-5 drop-shadow" fill={active === loc.id ? 'currentColor' : 'none'} />
          </button>
        ))}

        <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 bg-background/85 px-4 py-3">
          <p className="label-xs text-primary">{selected.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {locations.map((loc) => (
          <li key={loc.id}>
            <button
              type="button"
              onClick={() => setActive(loc.id)}
              className={cn(
                'flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-sm transition-colors',
                active === loc.id ? 'border-border/70 bg-secondary/60 text-foreground' : 'text-muted-foreground hover:text-foreground',
                loc.current && 'text-destructive',
                !loc.explored && 'italic opacity-60',
              )}
            >
              <MapPin className="size-3.5 shrink-0" />
              {loc.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
