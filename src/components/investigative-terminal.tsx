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
  const searchExamples =
    activeConfig?.searchExamples ??
    (queries.length > 0
      ? queries.flatMap((q) => q.aliases.slice(0, 2))
      : Object.keys(databaseIndex).slice(0, 6));
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

    const queryTokens = rawQuery
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    const matches: Array<{ key: string; title: string; record: string; classification: string; relatedEvidenceId?: string }> = [];
    let blockedArchiveMatches = 0;

    // 1. Check queries array from terminal.json
    for (const q of queries) {
      const normCmd = q.command.toLowerCase();
      const normCmdClean = normCmd.replace(/^(search:|execute:|find:)\s*/i, '').trim();
      const rawClean = rawQuery.replace(/^(search:|execute:|find:)\s*/i, '').trim();

      const isAliasMatch = q.aliases.some((alias) => {
        const normAlias = alias.toLowerCase();
        return (
          rawQuery.includes(normAlias) ||
          normAlias.includes(rawQuery) ||
          rawClean.includes(normAlias) ||
          queryTokens.some((tok) => normAlias.includes(tok) || tok.includes(normAlias))
        );
      });

      const isCommandMatch =
        normCmd.includes(rawQuery) ||
        rawQuery.includes(normCmd) ||
        normCmdClean.includes(rawClean) ||
        rawClean.includes(normCmdClean);

      if (isAliasMatch || isCommandMatch) {
        // Check unlock condition
        let unlocked = true;
        if (q.unlockCondition) {
          if (q.unlockCondition.type === 'EVIDENCE_VIEWED') {
            const target = q.unlockCondition.evidenceId ?? q.unlockCondition.targetId;
            unlocked = target ? viewedEvidenceIds.includes(target) : isArchiveUnlocked;
          } else if (q.unlockCondition.type !== 'ALWAYS') {
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
        } else {
          blockedArchiveMatches++;
        }
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
      <div className="border border-border/80 bg-background/95 p-4 sm:p-5 text-foreground shadow-2xl relative overflow-hidden">
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
                            <span>Открыть улику {q.sourceEvidenceId.toUpperCase()}</span>
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

      {/* SECTION 2: Forensic Archive Database Search */}
      <div className="border border-border/80 bg-card/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Search className="size-4 text-primary" />
          <h3 className="font-display uppercase tracking-wider text-sm text-foreground">
            Поисковый запрос к базе данных ОВР
          </h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Поиск по ключевым словам и поисковым командам
          {searchExamples.length > 0 && (
            <>
              {' (попробуйте: '}
              {searchExamples.map((item, idx) => (
                <span key={item}>
                  {idx > 0 && ', '}
                  <code
                    className="text-primary font-mono cursor-pointer hover:underline"
                    onClick={() => {
                      setSearchQuery(item);
                      executeSearch(item);
                    }}
                  >
                    {item}
                  </code>
                </span>
              ))}
              {')'}
            </>
          )}:
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
          <input
            type="text"
            placeholder="Фамилия, телефон, организация, адрес..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 border border-border bg-secondary px-4 py-2 text-xs label-xs text-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
          >
            <Search className="size-3.5" />
            <span>Запрос</span>
          </button>
        </form>

        {hasSearched && (
          <div className="mt-3 space-y-3">
            {isArchiveBlockedNotice ? (
              <div className="border border-amber-600/60 bg-amber-950/30 p-4 space-y-2 text-xs font-mono text-amber-400 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-amber-800/40 pb-1.5 font-bold uppercase">
                  <span>[СИСТЕМА ОВР]: ДОСТУП К АРХИВУ ОГРАНИЧЕН</span>
                  <span className="border border-amber-600/40 px-1.5 py-0.2 text-[9px]">БЛОКИРОВКА</span>
                </div>
                <p className="leading-relaxed">
                  Доступ к закрытой картотеке архивных дел ограничен. В текущем расследовании ещё не подтверждена совокупность трёх ключевых сигнатур (требуются: подтверждённая чёрная ткань на зеркале [P02], факт похищения кольца [D03/P04] и зафиксированные стрелки часов на 3 [P03]).
                </p>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Подсказка: изучите обстановку номера 12, сопоставьте опись с фото кисти погибшей и осмотрите механизм настольных часов.
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="text-[11px] font-mono text-muted-foreground">
                  Найдено записей в базе данных: {searchResults.length}
                </div>
                {searchResults.map((item, idx) => (
                  <div key={idx} className="border border-primary/40 bg-secondary/50 p-4 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                      <span className="font-mono text-xs text-primary font-bold">
                        {item.title}
                      </span>
                      <span className="border border-border/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground uppercase">
                        {item.classification}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {item.record}
                    </p>
                    {item.relatedEvidenceId && onOpenEvidence && (
                      <div className="pt-2 border-t border-border/30 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenEvidence(item.relatedEvidenceId!)}
                          className="flex items-center gap-1.5 border border-primary/60 bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <span>Приобщить к делу [{item.relatedEvidenceId.toUpperCase()}]</span>
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="border border-border/60 bg-secondary/30 p-3 text-xs font-mono text-muted-foreground">
                [СИСТЕМА]: По запросу «{searchQuery}» совпадений в открытых сводках ОВР не найдено. Убедитесь в корректности написания фамилии, адреса или номера.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
