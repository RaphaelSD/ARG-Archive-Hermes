'use client';

import { useState } from 'react';
import { Download, Eye, FileText, Image as ImageIcon, Lock, Map, Mic, Phone, StickyNote } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CaseDocument, CaseFile, CaseNote, CallLogRow } from '@/lib/archive-data';

const kindIcon = {
  document: FileText,
  photo: ImageIcon,
  audio: Mic,
  note: StickyNote,
  map: Map,
  call: Phone,
} as const;

export function DocumentGrid({
  documents,
  onSelectDocument,
  compact = false,
  className,
}: {
  documents: CaseDocument[];
  onSelectDocument?: (doc: CaseDocument) => void;
  compact?: boolean;
  className?: string;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Материалы недоступны.</p>;
  }
  return (
    <ul
      className={cn(
        compact
          ? 'grid grid-cols-2 gap-2.5'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5',
        className
      )}
    >
      {documents.map((doc) => {
        const Icon = kindIcon[doc.kind] ?? FileText;
        return (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => onSelectDocument?.(doc)}
              className="group flex h-full w-full flex-col border border-border/70 bg-secondary/40 text-left transition-all hover:border-primary/80 hover:bg-secondary/70 focus:outline-none"
            >
              <span
                className={cn(
                  'flex w-full items-center justify-center border-b border-border/60 bg-[oklch(0.85_0.03_82)] text-ink/50 group-hover:text-ink/80 transition-colors',
                  compact ? 'h-16' : 'h-24'
                )}
              >
                <Icon className={compact ? 'size-5' : 'size-7'} />
              </span>
              <span className="flex flex-1 items-start justify-between gap-2 p-2">
                <span className="min-w-0">
                  <span className="block text-xs leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {doc.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1 label-xs text-muted-foreground">
                    {doc.archiveId ? <span>{doc.archiveId}</span> : null}
                    {doc.meta ? <span className="truncate">• {doc.meta}</span> : null}
                  </span>
                </span>
                <Eye className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary mt-0.5" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CallLog({
  log,
  onSelectCall,
}: {
  log: NonNullable<CaseFile['callLog']>;
  onSelectCall?: (call: CallLogRow) => void;
}) {
  return (
    <div className="paper-card relative p-3 sm:p-5">
      <h3 className="text-center font-display text-xs uppercase tracking-[0.14em] text-ink border-b border-ink/20 pb-2">
        {log.subject}
      </h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[380px] text-xs text-ink">
          <thead>
            <tr className="border-b border-ink/30 text-left label-xs">
              <th className="py-1.5 pr-2">Дата</th>
              <th className="py-1.5 pr-2">Время</th>
              <th className="py-1.5 pr-2">Номер</th>
              <th className="py-1.5 pr-2">Длит.</th>
              <th className="py-1.5">Тип</th>
            </tr>
          </thead>
          <tbody>
            {log.rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onSelectCall?.(row)}
                className={cn(
                  'border-b border-ink/10 last:border-0 transition-colors',
                  onSelectCall && 'cursor-pointer hover:bg-ink/5'
                )}
                title={onSelectCall ? 'Нажмите для просмотра деталей звонка' : undefined}
              >
                <td className="py-1.5 pr-2 whitespace-nowrap">{row.date}</td>
                <td className="py-1.5 pr-2 font-mono whitespace-nowrap">{row.time}</td>
                <td className={cn('py-1.5 pr-2 tabular-nums whitespace-nowrap', row.flagged && 'font-bold underline decoration-stamp decoration-2 underline-offset-4 text-stamp')}>
                  {row.number}
                </td>
                <td className="py-1.5 pr-2 font-mono whitespace-nowrap">{row.duration}</td>
                <td className="py-1.5 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-block border px-1.5 py-0.2 font-mono text-[10px] uppercase',
                      row.type === 'Входящий' && 'border-sky-800 text-sky-900 bg-sky-200/40',
                      row.type === 'Исходящий' && 'border-emerald-800 text-emerald-900 bg-emerald-200/40',
                      row.type === 'Пропущенный' && 'border-amber-800 text-amber-900 bg-amber-200/40',
                      row.type === 'Автоответчик' && 'border-stamp text-stamp bg-stamp/15 font-bold',
                    )}
                  >
                    {row.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {log.pin ? (
        <p className="mt-3 border-t border-ink/20 pt-2 text-[11px] text-ink/70 text-center font-mono">
          {log.pin}
        </p>
      ) : null}
    </div>
  );
}

export function NotesBoard({ notes }: { notes: CaseNote[] }) {
  const [active, setActive] = useState(notes[0]?.id);
  const selected = notes.find((n) => n.id === active);

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Заметок пока нет.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setActive(note.id)}
            className={cn(
              'flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors',
              active === note.id
                ? 'border-primary/70 bg-secondary text-foreground font-medium'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <span>{note.title}</span>
            {note.locked ? <Lock className="size-3 text-muted-foreground" /> : null}
          </button>
        ))}
      </div>

      <div className="paper-card min-h-60 p-4 sm:p-5">
        {selected?.locked ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-ink/60">
            <Lock className="size-6" />
            <p className="text-sm text-center">{selected.body[0]}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <p className="font-display text-xs uppercase tracking-wider text-ink/80">{selected?.title}</p>
              <span className="font-mono text-[10px] text-ink/60">АРХИВ ОРЛОВА</span>
            </div>
            <div className="mt-3 space-y-2 font-hand text-xl leading-snug text-ink/90">
              {selected?.body.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
