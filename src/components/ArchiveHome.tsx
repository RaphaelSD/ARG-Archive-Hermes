import Link from 'next/link';
import { Lock } from 'lucide-react';

import { CityMap } from '@/components/city-map';
import { DetectiveCard } from '@/components/detective-card';
import { CallLog, DocumentGrid, NotesBoard } from '@/components/case-widgets';
import { Panel, StatusBadge } from '@/components/archive-ui';
import { cases } from '@/lib/archive-data';

export default function ArchiveHome() {
  const featured = cases[0]!;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6">
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <section className="relative self-start overflow-hidden border border-border/70">
            <img
              src="/images/hero-desk.jpg"
              alt="Рабочий стол следователя с настольной лампой и папками дел"
              width={1600}
              height={900}
              className="absolute inset-0 size-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
            <div className="relative max-w-md p-6 pb-10 sm:p-10">
              <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-foreground sm:text-6xl">
                Архив дел
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Вы получили доступ к архиву детектива Максима Орлова.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Изучайте материалы дел, находите несостыковки и делайте собственные выводы.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-block border border-border bg-secondary/70 px-5 py-3 label-xs text-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                Как пользоваться архивом?
              </Link>
            </div>

            <div className="relative grid grid-cols-2 gap-3 p-4 pt-0 sm:grid-cols-3 sm:p-6 sm:pt-0 lg:grid-cols-5">
              {cases.map((c) => (
                <CaseCard key={c.id} id={c.id} />
              ))}
            </div>
            <p className="relative flex items-center justify-center gap-2 border-t border-border/60 bg-background/70 px-4 py-3 label-xs text-muted-foreground">
              <Lock className="size-3" />
              Новые материалы будут добавлены по мере продвижения расследования
            </p>
          </section>

          <Panel
            title={`${featured.number}: ${featured.title}`}
            back="Назад к архиву"
            backTo="/"
            action={<StatusBadge status={featured.status} />}
          >
            <DocumentGrid documents={featured.documents} />
            <Link
              href={`/cases/${featured.id}`}
              className="mt-5 inline-block border border-border/70 px-4 py-2 label-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Открыть дело целиком
            </Link>
          </Panel>

          {featured.callLog ? (
            <Panel title="Детализация звонков" back="Назад к списку" backTo="/">
              <CallLog log={featured.callLog} />
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title="Детектив Орлов" back="Назад к архиву" backTo="/">
            <DetectiveCard />
          </Panel>
          <Panel
            title="Город Н."
            back="Назад к архиву"
            backTo="/"
            action={
              <Link
                href="/city"
                className="border border-border/70 px-3 py-2 label-xs text-muted-foreground transition-colors hover:text-primary"
              >
                Показать все локации
              </Link>
            }
          >
            <CityMap compact />
          </Panel>

          <Panel title="Заметки Орлова" back="Назад к делу" backTo="/">
            <NotesBoard notes={featured.notes} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CaseCard({ id }: { id: string }) {
  const item = cases.find((c) => c.id === id)!;
  const locked = item.status === 'locked';

  const inner = (
    <>
      <span className="block label-xs text-muted-foreground">{item.number}</span>
      <span className="mt-1 block font-display text-base uppercase tracking-[0.05em] text-foreground">
        {item.title}
      </span>
      {locked ? (
        <span className="mt-6 flex flex-1 flex-col items-center justify-end gap-4 pb-1">
          <Lock className="size-8 text-muted-foreground/70" />
          <span className="label-xs text-destructive">Заблокировано</span>
        </span>
      ) : (
        <>
          <span className="mt-2 inline-block w-fit">
            <StatusBadge status={item.status} />
          </span>
          {item.cover ? (
            <img
              src={item.cover}
              alt={`Материалы дела «${item.title}»`}
              width={800}
              height={600}
              loading="lazy"
              className="mt-3 aspect-[4/3] w-full border-4 border-[oklch(0.85_0.03_82)] object-cover"
            />
          ) : null}
        </>
      )}
    </>
  );

  if (locked) {
    return <div className="flex min-h-56 cursor-not-allowed flex-col border border-border/60 bg-card/70 p-3 opacity-80">{inner}</div>;
  }

  return (
    <Link
      href={`/cases/${item.id}`}
      className="flex min-h-56 flex-col border border-border/70 bg-card/80 p-3 transition-colors hover:border-primary/60"
    >
      {inner}
    </Link>
  );
}
