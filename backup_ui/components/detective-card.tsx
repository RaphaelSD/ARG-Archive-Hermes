'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { detective } from '@/lib/archive-data';
import { cn } from '@/lib/utils';

export function DetectiveCard({ expandable = true }: { expandable?: boolean }) {
  const [open, setOpen] = useState(!expandable);

  return (
    <div className="paper-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <img
          src="/images/orlov.jpg"
          alt="Портрет следователя Максима Орлова"
          width={600}
          height={760}
          loading="lazy"
          className="h-48 w-36 shrink-0 border-4 border-white/70 object-cover shadow-lg grayscale-[0.35] sepia-[0.25]"
        />
        <div className="min-w-0">
          <h3 className="font-display text-2xl uppercase tracking-[0.06em] text-ink">
            {detective.name}
          </h3>
          <dl className="mt-3 space-y-1 text-sm text-ink">
            <Row label="Должность" value={detective.role} />
            <Row label="Возраст" value={detective.age} />
            <Row label="Отдел" value={detective.department} />
            <Row label="Стаж" value={detective.experience} />
            <Row label="Специализация" value={detective.specialization} />
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-paper-foreground/85">{detective.bio}</p>
        </div>
      </div>

      <blockquote className="mt-5 border-t border-ink/20 pt-4 font-hand text-xl leading-snug text-ink">
        «{detective.quote}»
      </blockquote>

      {expandable ? (
        <>
          <div
            className={cn(
              'grid transition-all duration-300',
              open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <ul className="overflow-hidden space-y-2 text-sm text-paper-foreground/85">
              {detective.extra.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-ink/50">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-1 border-t border-ink/20 pt-3 label-xs text-ink/70 transition-colors hover:text-ink"
          >
            {open ? 'Свернуть' : 'Больше информации'}
            <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </>
      ) : (
        <ul className="mt-4 space-y-2 text-sm text-paper-foreground/85">
          {detective.extra.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-ink/50">—</span>
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-semibold">{label}:</dt>
      <dd className="text-paper-foreground/85">{value}</dd>
    </div>
  );
}
