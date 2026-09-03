import type { Metadata } from 'next';

import { DetectiveCard } from '@/components/detective-card';
import { Panel } from '@/components/archive-ui';
import { cases, detective } from '@/lib/archive-data';

export const metadata: Metadata = {
  title: 'Детектив Максим Орлов — Архив города Н.',
  description:
    'Личное дело старшего следователя Максима Орлова: биография, стиль работы и дела в производстве.',
  openGraph: {
    title: 'Детектив Максим Орлов — Архив города Н.',
    description: 'Личное дело старшего следователя отдела внутренних расследований.',
  },
};

export default function DetectivePage() {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_400px]">
      <Panel title="Детектив Орлов" back="Назад к архиву" backTo="/">
        <DetectiveCard expandable={false} />
      </Panel>

      <Panel title="Дела в производстве">
        <ul className="space-y-3">
          {cases.map((caseItem) => (
            <li key={caseItem.id} className="border border-border/60 bg-secondary/30 p-3">
              <p className="label-xs text-muted-foreground">{caseItem.number}</p>
              <p className="mt-1 font-display text-base uppercase tracking-[0.05em] text-foreground">{caseItem.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{caseItem.summary}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 font-hand text-xl leading-snug text-primary">«{detective.quote}»</p>
      </Panel>
    </div>
  );
}
