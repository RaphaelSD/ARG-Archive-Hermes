'use client';

import { useState } from 'react';

import { Panel, StatusBadge } from '@/components/archive-ui';
import { CallLog, DocumentGrid, NotesBoard } from '@/components/case-widgets';
import type { CaseFile } from '@/lib/archive-data';
import { cn } from '@/lib/utils';

const tabs = ['Документы', 'Фотографии', 'Аудио', 'Заметки Орлова', 'Хронология'] as const;

export function CasePageClient({ item }: { item: CaseFile }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Документы');

  const docs = item.documents.filter((doc) =>
    tab === 'Фотографии' ? doc.kind === 'photo' : tab === 'Аудио' ? doc.kind === 'audio' : true,
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 sm:px-6">
      <Panel title={`${item.number}: ${item.title}`} back="Назад к архиву" backTo="/" action={<StatusBadge status={item.status} />}>
        <p className="-mt-2 mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.summary}</p>

        <div className="mb-5 flex flex-wrap gap-4 border-b border-border/60 pb-2">
          {tabs.map((tabName) => (
            <button
              key={tabName}
              type="button"
              onClick={() => setTab(tabName)}
              className={cn(
                'label-xs pb-1 transition-colors',
                tab === tabName ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tabName}
            </button>
          ))}
        </div>

        {tab === 'Заметки Орлова' ? (
          <NotesBoard notes={item.notes} />
        ) : tab === 'Хронология' ? (
          <ol className="space-y-4 border-l border-border/70 pl-5">
            {item.timeline.map((entry) => (
              <li key={entry.time} className="relative">
                <span className="absolute -left-[1.6rem] top-1.5 size-2 rounded-full bg-primary" />
                <p className="label-xs text-primary">{entry.time}</p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <DocumentGrid documents={docs} />
        )}
      </Panel>

      {item.callLog ? (
        <Panel title="Детализация звонков" back="Назад к делу" backTo="/">
          <CallLog log={item.callLog} />
        </Panel>
      ) : null}
    </div>
  );
}
