'use client';

import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Lock, Map, Mic, StickyNote } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CaseDocument, CaseFile, CaseNote } from '@/lib/archive-data';

const kindIcon = {
  document: FileText,
  photo: ImageIcon,
  audio: Mic,
  note: StickyNote,
  map: Map,
} as const;

export function DocumentGrid({ documents }: { documents: CaseDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Материалы недоступны.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {documents.map((doc) => {
        const Icon = kindIcon[doc.kind];
        return (
          <li key={doc.id}>
            <button
              type="button"
              className="group flex h-full w-full flex-col border border-border/70 bg-secondary/40 text-left transition-colors hover:border-primary/60"
            >
              <span className="flex h-24 w-full items-center justify-center border-b border-border/60 bg-[oklch(0.85_0.03_82)] text-ink/50">
                <Icon className="size-7" />
              </span>
              <span className="flex flex-1 items-start justify-between gap-2 p-2.5">
                <span>
                  <span className="block text-xs leading-snug text-foreground">{doc.title}</span>
                  {doc.meta ? (
                    <span className="mt-1 block label-xs text-muted-foreground">{doc.meta}</span>
                  ) : null}
                </span>
                <Download className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CallLog({ log }: { log: NonNullable<CaseFile['callLog']> }) {
  return (
    <div className="paper-card relative p-4 sm:p-6">
      <h3 className="text-center font-display text-sm uppercase tracking-[0.14em] text-ink">
        {log.subject}
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm text-ink">
          <thead>
            <tr className="border-b border-ink/30 text-left label-xs">
              <th className="py-1.5 pr-3">Дата</th>
              <th className="py-1.5 pr-3">Время</th>
              <th className="py-1.5 pr-3">Номер</th>
              <th className="py-1.5 pr-3">Длительность</th>
              <th className="py-1.5">Тип</th>
            </tr>
          </thead>
          <tbody>
            {log.rows.map((row, i) => (
              <tr key={i} className="border-b border-ink/10 last:border-0">
                <td className="py-1.5 pr-3">{row.date}</td>
                <td className="py-1.5 pr-3">{row.time}</td>
                <td className={cn('py-1.5 pr-3 tabular-nums', row.flagged && 'font-semibold underline decoration-stamp decoration-2 underline-offset-4')}>
                  {row.number}
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{row.duration}</td>
                <td className="py-1.5">{row.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {log.pin ? (
        <p className="mt-5 max-w-xs rotate-[-2deg] bg-[oklch(0.9_0.09_95)] p-3 font-hand text-lg leading-tight text-ink shadow-md">
          {log.pin}
        </p>
      ) : null}
    </div>
  );
}

export function NotesBoard({ notes }: { notes: CaseNote[] }) {
  const [active, setActive] = useState(notes.find((n) => !n.locked)?.id ?? notes[0]?.id);
  const selected = notes.find((n) => n.id === active);

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Заметок пока нет.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
      <ul className="space-y-1.5">
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => setActive(note.id)}
              className={cn(
                'flex w-full items-center justify-between gap-2 border border-border/60 px-3 py-2 text-left text-sm transition-colors',
                active === note.id ? 'border-primary/50 bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {note.title}
              {note.locked ? <Lock className="size-3.5" /> : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="paper-card min-h-56 p-5">
        {selected?.locked ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-ink/60">
            <Lock className="size-6" />
            <p className="text-sm">{selected.body[0]}</p>
          </div>
        ) : (
          <>
            <p className="font-hand text-2xl text-ink">{selected?.title}</p>
            <div className="mt-3 space-y-2 font-hand text-xl leading-snug text-ink/90">
              {selected?.body.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
