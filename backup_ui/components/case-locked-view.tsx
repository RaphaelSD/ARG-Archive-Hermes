'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, AlertTriangle, Sparkles, CreditCard, CheckCircle } from 'lucide-react';
import type { CaseFile } from '@/lib/archive-data';
import { StatusBadge } from '@/components/archive-ui';

export function CaseLockedView({
  item,
  isGuest = false,
}: {
  item: Pick<CaseFile, 'id' | 'number' | 'title' | 'status' | 'summary' | 'archiveCode'>;
  isGuest?: boolean;
}) {
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false);

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
              <span>Доступ к материалам дела №002 открывается через форму авторизованного запроса.</span>
            </div>
          </div>

          {/* Actions & Paywall Notice */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaymentNoticeOpen(true)}
              className="inline-flex items-center justify-center gap-2 border-2 border-primary bg-primary px-5 py-2.5 text-xs font-display uppercase tracking-wider text-primary-foreground font-bold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
            >
              <CreditCard className="size-4" />
              <span>ПОЛУЧИТЬ ДОСТУП</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-border bg-secondary px-4 py-2.5 text-xs font-display uppercase tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <span>Вернуться в архив</span>
            </Link>
          </div>

          {/* Payment Modal / Notice */}
          {paymentNoticeOpen && (
            <div className="border border-primary/60 bg-primary/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase">
                  <Sparkles className="size-4" />
                  <span>Шлюз монетизации эпизодов</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentNoticeOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-mono"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                В финальной версии здесь будет активировано окно оплаты / приобретения доступа к Эпизоду №002.
              </p>
              <div className="text-[11px] font-mono text-primary flex items-center gap-1.5">
                <CheckCircle className="size-3.5" />
                <span>В режиме разработки (DEV) все дела и материалы разблокированы автоматически.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
