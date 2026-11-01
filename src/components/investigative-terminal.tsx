'use client';

import { useState, useEffect } from 'react';
import {
  Terminal,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { evidenceTitle } from '@/lib/evidence-title';
import { TypedText } from '@/components/typed-text';
import type { CaseTerminalConfig, HypothesisQuestion, TerminalQuery } from '@/lib/archive-data';
import { getCaseById } from '@/lib/cases/loader';

export function InvestigativeTerminal({
  caseId = '001',
  terminalConfig,
  onOpenEvidence,
  solvedQuestionIds,
  onSolveQuestion,
  isArchiveUnlocked = false,
  viewedEvidenceIds = [],
}: {
  caseId?: string;
  terminalConfig?: CaseTerminalConfig;
  onOpenEvidence?: (evidenceId: string) => void;
  solvedQuestionIds?: string[];
  onSolveQuestion?: (questionId: string) => void;
  isArchiveUnlocked?: boolean;
  viewedEvidenceIds?: string[];
}) {
  const activeConfig = terminalConfig ?? getCaseById(caseId)?.terminal;
  const questions = activeConfig?.questions ?? [];
  const databaseIndex = activeConfig?.databaseIndex ?? {};
  const queries: TerminalQuery[] = activeConfig?.queries ?? [];
  const systemHeader = activeConfig?.systemHeader ?? 'СЛУЖЕБНЫЙ ТЕРМИНАЛ ОВР // АРХИВ-СВЯЗЬ v2.0';
  const description =
    activeConfig?.description ??
    'Модуль криминалистической аналитики отдела внутренних расследований. Вводите ключевые слова, сигнатуры или команды поиска для сопоставления с базой данных закрытых дел.';

  const storageKey = `arg_terminal_solved_${caseId}`;
  const [solvedIds, setSolvedIds] = useState<string[]>(solvedQuestionIds ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { status: 'correct' | 'wrong'; message: string }>>({});

  // Free search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ key: string; title: string; record: string; classification: string; relatedEvidenceId?: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRun, setSearchRun] = useState(0);
  const [isArchiveBlockedNotice, setIsArchiveBlockedNotice] = useState(false);

  // Sync with external solvedQuestionIds if provided
  useEffect(() => {
    if (solvedQuestionIds) {
      setSolvedIds(solvedQuestionIds);
    }
  }, [solvedQuestionIds]);

  // Load solved state from localStorage if not provided via props
  useEffect(() => {
    if (solvedQuestionIds) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSolvedIds(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, [solvedQuestionIds, storageKey]);

  const handleCheckAnswer = (q: HypothesisQuestion) => {
    const input = (answers[q.id] ?? '').trim().toLowerCase();
    if (!input) return;

    const isMatch = q.acceptedKeywords.some((kw) => input.includes(kw.toLowerCase()));

    if (isMatch) {
      const updated = Array.from(new Set([...solvedIds, q.id]));
      setSolvedIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      onSolveQuestion?.(q.id);
      setFeedback((prev) => ({
        ...prev,
        [q.id]: {
          status: 'correct',
          message: 'Версия подтверждена данными архива ОВР. Открыто аналитическое заключение следователя.',
        },
      }));
    } else {
      setFeedback((prev) => ({
        ...prev,
        [q.id]: {
          status: 'wrong',
          message: 'Несоответствие материалам дела. Перепроверьте протоколы, записи и детализацию звонков.',
        },
      }));
    }
  };

  const executeSearch = (rawSearchText: string) => {
    const rawQuery = rawSearchText.trim().toLowerCase();
    if (!rawQuery) return;

    setHasSearched(true);
    setSearchRun((n) => n + 1);

    const queryTokens = rawQuery
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    const matches: Array<{ key: string; title: string; record: string; classification: string; relatedEvidenceId?: string }> = [];
    let blockedArchiveMatches = 0;

    // 1. Запросы из terminal.json: сопоставление по основам слов (порядок слов не важен),
    //    побеждает самый конкретный (длинный) шаблон. «часы» дают шум, «часы 1» — конкретное дело.
    const stem = (w: string) => (/^\d+$/.test(w) ? w : w.replace(/ё/g, 'е').slice(0, 3));
    const qStems = new Set(
      rawQuery
        .replace(/ё/g, 'е')
        .replace(/[^a-zа-я0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map(stem)
    );
    const scored: Array<{ q: TerminalQuery; score: number }> = [];
    for (const q of queries) {
      let best = 0;
      for (const alias of q.aliases) {
        const aStems = alias
          .toLowerCase()
          .replace(/ё/g, 'е')
          .replace(/[^a-zа-я0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .map(stem);
        if (aStems.length > 0 && aStems.every((st) => qStems.has(st))) {
          best = Math.max(best, aStems.length);
        }
      }
      if (best > 0) scored.push({ q, score: best });
    }
    const topScore = scored.reduce((m, x) => Math.max(m, x.score), 0);
    for (const { q, score } of scored) {
      if (score !== topScore) continue;
      let unlocked = true;
      if (q.unlockCondition && q.unlockCondition.type !== 'ALWAYS') {
        if (q.unlockCondition.type === 'EVIDENCE_VIEWED') {
          const target = q.unlockCondition.evidenceId ?? q.unlockCondition.targetId;
          unlocked = target ? viewedEvidenceIds.includes(target) : isArchiveUnlocked;
        } else {
          unlocked = isArchiveUnlocked;
        }
      }
      if (unlocked) {
        matches.push({
          key: q.id,
          title: q.command,
          record: q.responseText,
          classification: q.isCritical ? 'СОВПАДЕНИЕ АРХИВА // КРИТИЧЕСКИЙ МАРКЕР' : 'РЕЗУЛЬТАТ ЗАПРОСА ОВР',
        });
        q.archiveHits?.forEach((hit) => onSolveQuestion?.(hit));
      } else {
        blockedArchiveMatches++;
      }
    }

    // 2. Check legacy / structured databaseIndex
    for (const [key, val] of Object.entries(databaseIndex)) {
      const normalizedKey = key.toLowerCase();
      const normalizedTitle = val.title.toLowerCase();
      const normalizedRecord = val.record.toLowerCase();

      // Direct phrase substring match
      const directMatch =
        normalizedKey.includes(rawQuery) ||
        rawQuery.includes(normalizedKey) ||
        normalizedTitle.includes(rawQuery) ||
        normalizedRecord.includes(rawQuery);

      // Token match: all non-trivial tokens match in either key, title, or record
      const tokenMatch =
        queryTokens.length > 0 &&
        queryTokens.every(
          (token) =>
            normalizedKey.includes(token) ||
            normalizedTitle.includes(token) ||
            normalizedRecord.includes(token)
        );

      if (directMatch || tokenMatch) {
        const isEntryArchive = (val as any).isArchive || val.classification?.includes('АРХИВ');
        if (isEntryArchive && !isArchiveUnlocked) {
          blockedArchiveMatches++;
        } else {
          matches.push({ key, ...val });
        }
      }
    }

    setSearchResults(matches);
    setIsArchiveBlockedNotice(blockedArchiveMatches > 0 && matches.length === 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const solvedCount = solvedIds.length;
  const totalCount = questions.length;

  return (
    <div className="space-y-6">
      {/* Terminal Header */}
      <div className="border border-primary/30 bg-[#06080b] p-4 sm:p-5 text-foreground shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary via-stamp to-primary opacity-75" />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center border border-primary/60 bg-primary/10 text-primary">
              <Terminal className="size-4" />
            </span>
            <div>
              <span className="font-display uppercase tracking-widest text-xs text-primary block">
                {systemHeader}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                МОДУЛЬ СВЕРКИ СЛЕДСТВЕННЫХ ВЕРСИЙ // ДЕЛО #{caseId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="label-xs text-muted-foreground block">
                {totalCount > 0 ? 'ПОДТВЕРЖДЕНО ВЕРСИЙ:' : 'БАЗА ДАННЫХ:'}
              </span>
              <span className="font-mono text-xs text-primary font-bold">
                {totalCount > 0 ? `${solvedCount} ИЗ ${totalCount}` : 'ГОТОВА К ЗАПРОСАМ'}
              </span>
            </div>
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Терминал онлайн" />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-sans max-w-3xl">
          {description}
        </p>
      </div>

      {/* SECTION 1: Forensic Questions (Only if configured) */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h3 className="font-display uppercase tracking-wider text-sm text-foreground">
              Ключевые вопросы расследования
            </h3>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const isSolved = solvedIds.includes(q.id);
              const fb = feedback[q.id];

              return (
                <div
                  key={q.id}
                  className={cn(
                    'border p-4 sm:p-5 transition-colors relative',
                    isSolved
                      ? 'border-primary/60 bg-secondary/40'
                      : 'border-border/70 bg-card/60'
                  )}
                >
                  {/* Stamp if solved */}
                  {isSolved && (
                    <div className="absolute right-4 top-4 rotate-[-6deg] border border-stamp px-2.5 py-0.5 text-[10px] font-display uppercase tracking-widest text-stamp select-none bg-stamp/10">
                      ВЕРСИЯ ПОДТВЕРЖДЕНА
                    </div>
                  )}

                  <div className="max-w-2xl">
                    <span className="font-mono text-[11px] text-primary/80 block">
                      {q.code}
                    </span>
                    <h4 className="mt-1 text-sm sm:text-base font-semibold text-foreground leading-snug">
                      {q.question}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 italic">
                      <HelpCircle className="size-3 text-muted-foreground/70 shrink-0" />
                      Подсказка: {q.hint}
                    </p>
                  </div>

                  {/* Unsolved input form */}
                  {!isSolved ? (
                    <div className="mt-4 pt-3 border-t border-border/40">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCheckAnswer(q);
                        }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl"
                      >
                        <input
                          type="text"
                          placeholder="Введите ответ или название..."
                          value={answers[q.id] ?? ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="flex-1 border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="flex items-center justify-center gap-1.5 border border-primary bg-primary/10 px-4 py-2 text-xs font-display uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                        >
                          <span>Сверить с архивом</span>
                          <CornerDownLeft className="size-3" />
                        </button>
                      </form>

                      {fb && (
                        <div
                          className={cn(
                            'mt-2.5 flex items-center gap-2 text-xs font-mono p-2 border',
                            fb.status === 'correct'
                              ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-400'
                              : 'border-destructive/60 bg-destructive/10 text-destructive'
                          )}
                        >
                          {fb.status === 'correct' ? (
                            <CheckCircle2 className="size-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="size-3.5 shrink-0" />
                          )}
                          <span>{fb.message}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Solved disclosure box */
                    <div className="mt-4 border-t border-ink/20 pt-4 paper-card p-4 text-ink space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs uppercase tracking-wider text-stamp font-bold">
                          {q.solvedTitle}
                        </span>
                        {q.sourceEvidenceId && onOpenEvidence && (
                          <button
                            type="button"
                            onClick={() => onOpenEvidence(q.sourceEvidenceId!)}
                            className="text-[10px] font-mono text-ink/70 hover:text-ink underline decoration-ink/40 underline-offset-2 flex items-center gap-1"
                          >
                            <span>Открыть: {evidenceTitle(q.sourceEvidenceId)}</span>
                            <ArrowRight className="size-3" />
                          </button>
                        )}
                      </div>
                      <p className="font-sans text-xs leading-relaxed whitespace-pre-wrap text-ink/90">
                        {q.solvedContent}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Архивный поиск — экран старого терминала */}
      <div className="relative overflow-hidden border border-primary/30 bg-[#06080b] p-4 sm:p-5 space-y-4 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.9) 3px, rgba(0,0,0,0.9) 4px)',
          }}
        />
        <div className="relative flex items-center justify-between border-b border-primary/20 pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            АРХИВ ОВР // ПОИСК ПО ЗАКРЫТЫМ ДЕЛАМ
          </span>
          <span className={isArchiveUnlocked ? 'text-emerald-400' : 'text-muted-foreground'}>
            {isArchiveUnlocked ? '● ДОСТУП ОТКРЫТ' : '○ ДОСТУП ЗАКРЫТ'}
          </span>
        </div>

        <p className="relative font-mono text-xs leading-relaxed text-muted-foreground">
          Введите ключевые слова описания: признаки, повторяющиеся в делах. Чем точнее запрос, тем меньше шума.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 font-mono">
          <span className="shrink-0 text-xs text-primary">ОВР://АРХИВ&gt;</span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 border-b border-primary/30 bg-transparent px-1 py-1.5 text-sm text-primary caret-primary placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
            placeholder="_"
          />
          <button
            type="submit"
            className="shrink-0 border border-primary/50 bg-primary/10 px-3 py-1.5 text-[11px] uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Выполнить
          </button>
        </form>

        {hasSearched && (
          <div className="relative mt-3 space-y-3 font-mono">
            {isArchiveBlockedNotice ? (
              <div className="border border-amber-600/50 bg-amber-950/20 p-4 space-y-2 text-xs text-amber-400 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-amber-800/40 pb-1.5 font-bold uppercase">
                  <span>[СИСТЕМА ОВР]: ДОСТУП К АРХИВУ ОГРАНИЧЕН</span>
                  <span className="border border-amber-600/40 px-1.5 text-[9px]">БЛОКИРОВКА</span>
                </div>
                <p className="leading-relaxed">
                  Закрытая картотека недоступна. Запрос будет принят, когда по текущему делу будут выделены три повторяющихся признака. Сопоставьте материалы на доске выводов.
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="text-[11px] text-muted-foreground">
                  &gt; найдено записей: {searchResults.length}
                </div>
                {searchResults.map((item, idx) => (
                  <div key={`${item.key}-${searchRun}`} className="border border-primary/30 bg-background/60 p-4 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-primary/15 pb-1.5">
                      <span className="text-xs font-bold text-primary">{item.title}</span>
                      <span className="border border-border px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
                        {item.classification}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      <TypedText text={item.record} animate={idx === 0} />
                    </p>
                    {item.relatedEvidenceId && onOpenEvidence && (
                      <div className="flex justify-end border-t border-border/30 pt-2">
                        <button
                          type="button"
                          onClick={() => onOpenEvidence(item.relatedEvidenceId!)}
                          className="flex items-center gap-1.5 border border-primary/60 bg-primary/10 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          <span>Приобщить к делу: {evidenceTitle(item.relatedEvidenceId)}</span>
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
                &gt; По запросу «{searchQuery}» совпадений не найдено. Попробуйте другие слова.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
