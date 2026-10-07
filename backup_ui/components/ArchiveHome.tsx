'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  ArrowRight,
  ShieldHalf,
  FolderArchive,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Sparkles,
  X,
  Unlock,
  Eye,
  Flame,
} from 'lucide-react';

import { CityMap } from '@/components/city-map';
import { DetectiveCard } from '@/components/detective-card';
import { Panel, StatusBadge } from '@/components/archive-ui';
import { cases, type CaseFile } from '@/lib/archive-data';

export default function ArchiveHome() {
  const [completedCases, setCompletedCases] = useState<Record<string, boolean>>({});
  const [teaserCase, setTeaserCase] = useState<CaseFile | null>(null);
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);

  const [resetNotice, setResetNotice] = useState(false);

  const isDevMode = process.env.NODE_ENV === 'development';

  const checkCompletedStatus = () => {
    try {
      const is001Completed =
        localStorage.getItem('arg_case_001_status') === 'completed' ||
        localStorage.getItem('arg_case_status_001') === 'completed' ||
        localStorage.getItem('arg_case_state_001_completed') === 'true';

      if (is001Completed) {
        setCompletedCases({ '001': true });
      } else {
        setCompletedCases({});
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    checkCompletedStatus();
  }, []);

  const handleResetDevProgress = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('arg_') || key.includes('case'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setCompletedCases({});
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 3000);
    } catch (e) {
      console.error('Failed to reset progress in localStorage:', e);
    }
  };

  const openTeaser = (c: CaseFile) => {
    setTeaserCase(c);
    setShowPaymentNotice(false);
  };

  const closeTeaser = () => {
    setTeaserCase(null);
    setShowPaymentNotice(false);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-emerald-500/60 bg-emerald-950/40 px-3.5 py-2.5 font-mono text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <Unlock className="size-4 animate-pulse text-emerald-400 shrink-0" />
            <span className="font-bold tracking-wider uppercase">
              РЕЖИМ РАЗРАБОТЧИКА (DEV MODE // БОГ)
            </span>
            <span className="hidden lg:inline text-emerald-300/80">
              — Все дела разблокированы, блокировки и заглушки оплаты отключены для тестирования.
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleResetDevProgress}
              className="border border-emerald-500/80 bg-emerald-900/60 hover:bg-emerald-800 px-2.5 py-1 text-[11px] uppercase font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Очистить весь прогресс и кэш расследований в localStorage"
            >
              <span>Сбросить прогресс (DEV)</span>
            </button>
            <span className="border border-emerald-500/40 bg-emerald-900/50 px-2 py-0.5 text-[10px] uppercase font-bold">
              DEV
            </span>
          </div>
        </div>
      )}

      {/* Reset Notice Toast */}
      {resetNotice && (
        <div className="mb-4 flex items-center gap-2 border border-emerald-500 bg-emerald-950 px-4 py-3 font-mono text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>ПРОГРЕСС РАССЛЕДОВАНИЙ УСПЕШНО ОЧИЩЕН В LOCALSTORAGE. Состояние сброшено к чистому листу.</span>
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_460px]">
        {/* ЛЕВАЯ ЗОНА: Hero + Каталог дел */}
        <div className="space-y-4">
          {/* Hero Banner / Рабочий стол следователя */}
          <section className="relative overflow-hidden border border-border/70">
            <img
              src="/images/hero-desk.jpg"
              alt="Рабочий стол следователя с настольной лампой и папками дел"
              width={1600}
              height={900}
              className="absolute inset-0 size-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
            <div className="relative max-w-lg p-6 pb-8 sm:p-10 sm:pb-10">
              <div className="inline-flex items-center gap-2 border border-border/80 bg-secondary/80 px-2.5 py-1 label-xs text-primary mb-3">
                <ShieldHalf className="size-3.5" />
                <span>ОТДЕЛ ВНУТРЕННИХ РАССЛЕДОВАНИЙ // АРХИВ</span>
              </div>
              <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-foreground sm:text-6xl">
                Архив дел
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Вы получили доступ к оперативным материалам детектива Максима Орлова.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Изучайте документы, сопоставляйте улики, биллинг и показания свидетелей, чтобы восстановить картину событий.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-block border border-border bg-secondary/70 px-5 py-2.5 label-xs text-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                Как пользоваться архивом?
              </Link>
            </div>
          </section>

          {/* Каталог расследований (Эпизодическая система) */}
          <section className="border border-border/70 bg-card/60 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FolderArchive className="size-4 text-primary" />
                <h2 className="font-display text-base uppercase tracking-[0.1em] text-foreground">
                  Эпизоды расследований
                </h2>
              </div>
              <span className="label-xs text-muted-foreground font-mono">
                {isDevMode
                  ? 'DEV: ВСЕ ЭПИЗОДЫ ДОСТУПНЫ'
                  : completedCases['001']
                  ? 'ПРОЙДЕНО: 1 ИЗ 1 ДОСТУПНЫХ'
                  : 'ДОСТУПНО: 1 ИЗ ' + cases.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.slice(0, 3).map((c) => (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  isCompleted={Boolean(completedCases[c.id])}
                  isDevMode={isDevMode}
                  onResetProgress={handleResetDevProgress}
                  onOpenTeaser={() => openTeaser(c)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-2">
                <Lock className="size-3.5 text-muted-foreground" />
                Новые эпизоды добавляются по мере расширения архива
              </span>
              <span className="hidden sm:inline text-[10px] uppercase text-primary/80">
                СЕЗОН 1 // БЕЛМОНТСКИЕ ДЕЛА
              </span>
            </div>
          </section>
        </div>

        {/* ПРАВАЯ ЗОНА: Карточка Орлова + Карта Города Н. */}
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
                className="border border-border/70 px-3 py-1.5 label-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                Показать все локации
              </Link>
            }
          >
            <CityMap compact />
          </Panel>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПРЕВЬЮ (ТИЗЕР ДЕЛА) */}
      {teaserCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl border-2 border-primary/70 bg-card p-6 sm:p-8 shadow-2xl text-foreground space-y-6">
            {/* Header top bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  {teaserCase.number.toUpperCase()}
                </span>
                <span className="border border-amber-500/60 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-400 font-bold">
                  {isDevMode ? 'DEV ДОСТУП' : 'СКОРО / ПРЕВЬЮ'}
                </span>
              </div>
              <button
                type="button"
                onClick={closeTeaser}
                className="flex size-7 items-center justify-center border border-border/70 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Title & Summary */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
                {teaserCase.id === '002' ? 'ДЕЛО №002: КРЫША ОГОНЬКА' : teaserCase.title}
              </h2>

              <div className="border-l-2 border-primary/70 pl-4 py-1">
                <span className="font-mono text-xs uppercase text-primary block mb-1">
                  Краткая сводка:
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {teaserCase.id === '002'
                    ? 'Тело найдено на крыше бара, где Клара Вэнс провела свой последний вечер. Местные говорят о странных звуках, полиция списывает на несчастный случай. Требуется независимый анализ.'
                    : teaserCase.summary}
                </p>
              </div>
            </div>

            {/* Teaser image preview */}
            {teaserCase.cover && (
              <div className="relative overflow-hidden border border-border/60 bg-secondary/30">
                <img
                  src={teaserCase.cover}
                  alt={teaserCase.title}
                  className="aspect-[16/9] w-full object-cover grayscale-[20%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <span className="font-mono text-[11px] text-zinc-300 uppercase tracking-wider">
                    Материалы дела находятся на архивации следственного комитета
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentNotice(true)}
                  className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-6 py-3 font-display text-xs uppercase tracking-wider text-primary-foreground font-bold shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:bg-primary/90 transition-transform active:scale-95"
                >
                  <CreditCard className="size-4" />
                  <span>ПОЛУЧИТЬ ДОСТУП</span>
                </button>

                {isDevMode && (
                  <Link
                    href={`/cases/${teaserCase.id}`}
                    className="inline-flex items-center gap-2 border border-emerald-500 bg-emerald-950/60 px-5 py-3 font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold hover:bg-emerald-900/60 transition-colors"
                  >
                    <Unlock className="size-4" />
                    <span>ОТКРЫТЬ В ТЕРМИНАЛЕ (DEV)</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={closeTeaser}
                  className="border border-border/70 bg-secondary/60 px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Закрыть
                </button>
              </div>

              {/* Payment trigger notice */}
              {showPaymentNotice && (
                <div className="border border-primary/60 bg-primary/10 p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase">
                    <Sparkles className="size-4" />
                    <span>Шлюз монетизации эпизодов</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    В релизной версии по нажатию кнопки «ПОЛУЧИТЬ ДОСТУП» открывается платежное окно для покупки доступа к Эпизоду №002.
                  </p>
                  {isDevMode && (
                    <p className="text-[11px] font-mono text-emerald-400 font-bold">
                      В Dev-режиме вы можете открыть дело напрямую по зеленой кнопке выше.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseCard({
  caseItem,
  isCompleted,
  isDevMode,
  onResetProgress,
  onOpenTeaser,
}: {
  caseItem: CaseFile;
  isCompleted?: boolean;
  isDevMode?: boolean;
  onResetProgress?: () => void;
  onOpenTeaser: () => void;
}) {
  const isCase001 = caseItem.id === '001';

  // Карточка 1: Дело №001 «Комната 12»
  if (isCase001) {
    return (
      <div className="group flex min-h-[320px] flex-col justify-between border-2 border-primary/60 bg-card p-4 transition-all hover:border-primary hover:shadow-[0_0_25px_rgba(234,179,8,0.15)] focus:outline-none">
        <Link href={`/cases/${caseItem.id}`} className="block focus:outline-none">
          <div className="flex items-center justify-between">
            <span className="label-xs text-primary font-mono font-bold">{caseItem.number}</span>
            <div className="flex items-center gap-1.5">
              {isDevMode && (
                <span className="inline-flex items-center gap-1 border border-emerald-500/70 bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-mono uppercase text-emerald-400 font-bold">
                  <Unlock className="size-2.5" />
                  <span>DEV</span>
                </span>
              )}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 border border-emerald-500/70 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-400 font-bold animate-in fade-in">
                  <CheckCircle2 className="size-3" />
                  <span>{isDevMode ? 'ПРОЙДЕНО (DEV)' : 'ПРОЙДЕНО'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 border border-primary/70 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary font-bold">
                  <span>ОТКРЫТО</span>
                </span>
              )}
            </div>
          </div>

          <span className="mt-2.5 block font-display text-lg uppercase tracking-[0.05em] text-foreground group-hover:text-primary transition-colors">
            {caseItem.title}
          </span>

          {caseItem.cover && (
            <div className="relative mt-3 overflow-hidden border border-border/80 bg-secondary/30">
              <img
                src={caseItem.cover}
                alt={`Материалы дела «${caseItem.title}»`}
                width={600}
                height={400}
                className="aspect-[16/9] w-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {caseItem.summary}
          </p>
        </Link>

        <div className="mt-4 border-t border-border/60 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href={`/cases/${caseItem.id}`}
              className="font-display text-xs uppercase tracking-[0.14em] text-primary flex items-center gap-2 hover:translate-x-1 transition-transform font-bold"
            >
              <span>{isDevMode ? 'Начать расследование (DEV)' : isCompleted ? 'Пройдено (Материалы)' : 'Начать расследование'}</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              ДЕЛО №001
            </span>
          </div>

          {/* Dev Mode Reset Button directly on card */}
          {isDevMode && onResetProgress && (
            <div className="pt-1 flex items-center justify-between border-t border-emerald-900/40">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResetProgress();
                }}
                className="text-[10px] font-mono uppercase text-emerald-400 hover:text-emerald-200 border border-emerald-600/50 bg-emerald-950/40 px-2 py-1 flex items-center gap-1.5 transition-colors active:scale-95"
                title="Сбросить прогресс только этого дела"
              >
                <span>Сброс прогресса (DEV)</span>
              </button>
              <span className="text-[9px] font-mono text-emerald-500/80 uppercase">
                чистый лист
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Карточка 2 / 3: Дело №002 «Крыша Огонька» и другие
  const isCase002 = caseItem.id === '002';
  const displayTitle = isCase002 ? 'ДЕЛО №002: КРЫША ОГОНЬКА' : caseItem.title;
  const displaySummary = isCase002
    ? 'Тело найдено на крыше бара, где Клара Вэнс провела свой последний вечер. Местные говорят о странных звуках, полиция списывает на несчастный случай. Требуется независимый анализ.'
    : caseItem.summary;

  return (
    <div
      onClick={onOpenTeaser}
      className="group relative flex min-h-[320px] flex-col justify-between border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/80 hover:bg-card/90 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(234,179,8,0.12)]"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="label-xs text-muted-foreground font-mono font-bold">{caseItem.number}</span>
          {isDevMode ? (
            <span className="inline-flex items-center gap-1 border border-emerald-500/70 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-400 font-bold">
              <Unlock className="size-2.5" />
              <span>DEV ДОСТУП</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 border border-amber-500/60 bg-amber-950/40 px-2 py-0.5 text-[10px] font-mono uppercase text-amber-400 font-bold">
              <Lock className="size-2.5" />
              <span>ДОСТУП ЗАКРЫТ</span>
            </span>
          )}
        </div>

        <span className="mt-2.5 block font-display text-base uppercase tracking-[0.05em] text-foreground group-hover:text-primary transition-colors">
          {displayTitle}
        </span>

        {caseItem.cover && (
          <div className="relative mt-3 overflow-hidden border border-border/50 bg-secondary/30">
            <img
              src={caseItem.cover}
              alt={displayTitle}
              width={600}
              height={400}
              className="aspect-[16/9] w-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] group-hover:bg-black/20 transition-all">
              <div className="flex items-center gap-1.5 border border-primary/70 bg-black/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary shadow-md">
                <Eye className="size-3.5" />
                <span>ОТКРЫТЬ ТИЗЕР ДЕЛА</span>
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed group-hover:text-foreground/80 transition-colors">
          {displaySummary}
        </p>
      </div>

      <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenTeaser();
          }}
          className="flex items-center justify-center gap-2 border border-primary/60 bg-primary/10 py-2 px-3 font-mono text-xs uppercase tracking-wider text-primary group-hover:bg-primary group-hover:text-primary-foreground font-bold transition-all w-full"
        >
          <CreditCard className="size-3.5" />
          <span>СМОТРЕТЬ ТИЗЕР / ДОСТУП</span>
        </button>
      </div>
    </div>
  );
}
