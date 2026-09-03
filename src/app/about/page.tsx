import type { Metadata } from 'next';

import { Panel } from '@/components/archive-ui';

export const metadata: Metadata = {
  title: 'О проекте — Архив города Н.',
  description:
    'Как устроен архив города Н.: правила доступа к материалам, заметки следователя и порядок расследования.',
  openGraph: {
    title: 'О проекте — Архив города Н.',
    description: 'Как пользоваться архивом дел и вести собственное расследование.',
  },
};

const steps = [
  {
    title: '1. Откройте дело',
    text: 'В архиве доступны дела с разным статусом. Закрытые дела можно изучать целиком, заблокированные откроются позже.',
  },
  {
    title: '2. Изучите материалы',
    text: 'Протоколы, фотографии, аудиозаписи и вырезки из газет находятся во вкладках дела. Любой документ можно открыть и скачать.',
  },
  {
    title: '3. Читайте заметки Орлова',
    text: 'Следователь ведёт бумажные записи. В них — версии, сомнения и вопросы, на которые он не нашёл ответа.',
  },
  {
    title: '4. Сопоставляйте с картой',
    text: 'Локации города Н. связаны с материалами дел. Сравнивайте показания, время и адреса.',
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <Panel title="О проекте" back="Назад к архиву" backTo="/">
        <p className="-mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          «Архив города Н.» — интерактивное расследование. Вы получаете доступ к материалам отдела внутренних расследований и ведёте дело вместе со старшим следователем Максимом Орловым. Никаких подсказок: только документы, показания и собственные выводы.
        </p>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.title} className="border border-border/60 bg-secondary/30 p-4">
              <h3 className="font-display text-base uppercase tracking-[0.06em] text-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 font-hand text-xl text-primary">
          «Истина редко лежит на поверхности. Её приходится вытаскивать из грязи.»
        </p>
      </Panel>
    </div>
  );
}
