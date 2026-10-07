import { FileText, Lock, Search, ShieldCheck } from 'lucide-react';

const pillars = [
  { icon: Lock, title: 'Без спойлеров', text: 'Все материалы подаются постепенно' },
  { icon: Search, title: 'Исследуй', text: 'Каждая деталь может оказаться важной' },
  { icon: FileText, title: 'Анализируй', text: 'Делай выводы и сопоставляй факты' },
  { icon: ShieldCheck, title: 'Раскрой истину', text: 'И узнай, что скрывается за закрытыми делами' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-border/70 bg-card/40">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.title} className="flex items-start gap-4">
              <Icon className="mt-1 size-6 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="font-display text-sm uppercase tracking-[0.16em] text-foreground">{pillar.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border/60 px-4 py-4 text-center label-xs text-muted-foreground sm:px-6">
        Архив города Н. — интерактивное детективное расследование
      </div>
    </footer>
  );
}
