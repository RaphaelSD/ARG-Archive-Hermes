import type { Metadata } from 'next';

import { Panel } from '@/components/archive-ui';
import { news } from '@/lib/archive-data';

export const metadata: Metadata = {
  title: 'Новости архива — Архив города Н.',
  description:
    'Обновления архива: новые дела, документы и локации, добавленные в расследование.',
  openGraph: {
    title: 'Новости архива — Архив города Н.',
    description: 'Что нового появилось в материалах расследования.',
  },
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <Panel title="Новости" back="Назад к архиву" backTo="/">
        <ul className="divide-y divide-border/60">
          {news.map((item) => (
            <li key={item.id} className="flex flex-col gap-1 py-5 first:pt-0 sm:flex-row sm:gap-6">
              <div className="sm:w-32 sm:shrink-0">
                <p className="font-display text-xl text-primary">{item.date}</p>
                <p className="label-xs text-muted-foreground">{item.tag}</p>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-[0.04em] text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.excerpt}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
