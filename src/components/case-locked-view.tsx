'use client';

import Link from 'next/link';
import { Lock, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { CaseFile } from '@/lib/archive-data';
import { StatusBadge } from '@/components/archive-ui';
import { BuyCaseButton } from '@/components/buy-case-button';

export function CaseLockedView({
  item,
  isGuest = false,
  priceRub = null,
}: {
  item: Pick<CaseFile, 'id' | 'number' | 'title' | 'status' | 'summary' | 'archiveCode'>;
  isGuest?: boolean;
  priceRub?: number | null;
}) {

  const isCase002 = item.id === '002' || item.number.includes('002');
  const title = isCase002 ? 'ДЕЛО №002: КРЫША ОГОНЬКА' : `${item.number.toUpperCase()}: ${item.title.toUpperCase()}`;
  const summary = isCase002
    ? 'Тело найдено на крыше бара, где Клара Вэнс провела свой последний вечер. Местные говорят о странных звуках, полиция списывает на несчастный случай. Требуется независимый анализ.'
    : item.summary || 'Материалы предварительного следствия изъяты до особого распоряжения следственного отдела.';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-border/70 bg-secondary/50 px-3 py-1.5 label-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          <span>В архив</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary">{item.number}</span>
          <StatusBadge status="locked" />
        </div>
      </div>

      {/* Main Restricted Access / Teaser Dossier */}
      <div className="relative border border-border/80 bg-card p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Archival Red Tape Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-amber-600 opacity-90" />

        {/* Diagonal Classified Stamp */}
        <div className="absolute right-6 top-8 rotate-[8deg] border-2 border-primary/80 px-4 py-1.5 text-center font-display text-xs uppercase tracking-[0.25em] text-primary bg-primary/10 select-none shadow-sm">
          СЛЕДУЮЩИЙ ЭПИЗОД
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center border border-primary/70 bg-primary/10 text-primary">
              <Lock className="size-5" />
            </span>
            <div>
              <span className="font-mono text-xs text-primary uppercase tracking-widest block">
                ТИЗЕР СЛЕДСТВЕННОГО ЭПИЗОДА
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                АРХИВНЫЙ РЕЕСТР // {item.archiveCode || `${item.number} / 2009-С`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
              {title}
            </h1>
            <p className="font-display text-sm sm:text-base uppercase tracking-wide text-primary font-medium">
              Материалы готовятся к передаче независимому следователю.
            </p>
          </div>

          <div className="border-l-2 border-primary/70 pl-4 py-1 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              Краткая сводка:
            </p>
            <p className="text-foreground/90">
              {summary}
            </p>
          </div>

          {/* Redacted dossier preview */}
          <div className="paper-card p-4 space-y-2 text-ink">
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="font-mono text-xs text-ink/70">
                СПРАВКА ДЕЖУРНОГО АРХИВАРИУСА
              </span>
              <span className="text-[10px] font-mono text-amber-900 uppercase border border-amber-800/40 px-1.5 py-0.5 bg-amber-100/40 font-bold">
                ДОСТУП ЗАКРЫТ
              </span>
            </div>
            <p className="font-body text-xs text-ink/80 italic leading-relaxed">
              {summary}
            </p>
            <div className="pt-2 flex items-center gap-2 font-mono text-[11px] text-ink/60">
              <AlertTriangle className="size-3.5 text-primary" />
              <span>Доступ к материалам {item.number} открывается после оплаты.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-3 pt-2">
            <BuyCaseButton caseId={item.id} priceRub={priceRub} />

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-2.5 text-xs font-display uppercase tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <span>Вернуться в архив</span>
            </Link>
          </div>
          {isGuest && priceRub && (
            <p className="text-[11px] font-mono text-muted-foreground">
              Для покупки потребуется войти или зарегистрироваться — доступ привязывается к вашему аккаунту.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
