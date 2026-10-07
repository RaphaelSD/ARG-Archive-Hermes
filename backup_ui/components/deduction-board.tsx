'use client';

import { useState } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  FileText, 
  Brain, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeductionRule } from '@/lib/engine/types';
import type { CaseDocument } from '@/lib/archive-data';

interface DeductionBoardProps {
  deductions: DeductionRule[];
  availableEvidence: CaseDocument[];
  completedDeductionIds: string[];
  onCompleteDeduction: (clueA: string, clueB: string) => {
    success: boolean;
    deduction?: DeductionRule;
    error?: string;
    title?: string;
    conclusion?: string;
    resultEvidenceId?: string;
  };
  onSelectEvidence?: (evidenceId: string) => void;
}

export function DeductionBoard({
  deductions,
  availableEvidence,
  completedDeductionIds,
  onCompleteDeduction,
  onSelectEvidence,
}: DeductionBoardProps) {
  const [slotA, setSlotA] = useState<CaseDocument | null>(null);
  const [slotB, setSlotB] = useState<CaseDocument | null>(null);
  const [activeSlotTarget, setActiveSlotTarget] = useState<'A' | 'B' | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'failure';
    title: string;
    message: string;
    resultEvidenceId?: string;
  } | null>(null);

  const handleSelectClue = (doc: CaseDocument) => {
    if (activeSlotTarget === 'A') {
      if (slotB?.id === doc.id) setSlotB(null);
      setSlotA(doc);
      setActiveSlotTarget(null);
    } else if (activeSlotTarget === 'B') {
      if (slotA?.id === doc.id) setSlotA(null);
      setSlotB(doc);
      setActiveSlotTarget(null);
    } else {
      // Auto-assign: fill slot A first, else slot B
      if (!slotA) {
        setSlotA(doc);
      } else if (!slotB && slotA.id !== doc.id) {
        setSlotB(doc);
      } else if (slotA.id === doc.id) {
        setSlotA(null);
      } else {
        setSlotB(doc);
      }
    }
    setFeedback(null);
  };

  const handleAnalyze = () => {
    if (!slotA || !slotB) return;

    const result = onCompleteDeduction(slotA.id, slotB.id);

    if (result.success) {
      setFeedback({
        type: 'success',
        title: result.deduction?.title ?? result.title ?? 'ВЕРСИЯ ПОДТВЕРЖДЕНА',
        message: result.deduction?.conclusion ?? result.conclusion ?? '',
        resultEvidenceId: result.deduction?.resultEvidenceId ?? result.resultEvidenceId,
      });
    } else {
      setFeedback({
        type: 'failure',
        title: 'СВЯЗЬ НЕ ПОДТВЕРЖДЕНА',
        message:
          result.error ??
          result.conclusion ??
          'Сопоставление данных материалов не дало значимого результата. Попробуйте изучить другие улики или перечитать свидетельские показания.',
      });
    }
  };

  const completedRules = deductions.filter((d) => completedDeductionIds.includes(d.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base uppercase tracking-wider text-foreground">
                Дедуктивный стол
              </h2>
              <p className="text-xs text-muted-foreground">
                Сопоставление улик, протоколов и зацепок для реконструкции событий
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-muted-foreground">
              Завершено дедукций:
            </span>
            <span className="border border-border/60 bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-primary">
              {completedRules.length} / {deductions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Slots Workbench */}
      <div className="border border-border/70 bg-card/60 p-4 sm:p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Slot A */}
          <div
            onClick={() => setActiveSlotTarget(activeSlotTarget === 'A' ? null : 'A')}
            className={cn(
              'group relative flex min-h-[140px] cursor-pointer flex-col justify-between border-2 border-dashed p-4 transition-all',
              slotA
                ? 'border-primary/60 bg-secondary/40'
                : activeSlotTarget === 'A'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/60 hover:border-border hover:bg-secondary/20'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Материал I
              </span>
              {slotA && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlotA(null);
                    setFeedback(null);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  title="Очистить слот"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {slotA ? (
              <div className="my-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" />
                  <span className="font-mono text-xs font-semibold text-primary">
                    [{slotA.id.toUpperCase()}]
                  </span>
                  <span className="font-medium text-xs text-foreground line-clamp-1">
                    {slotA.title}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {slotA.meta || slotA.source || slotA.content || 'Материал дела'}
                </p>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center text-center">
                <Plus className="size-5 text-muted-foreground/60 mb-1 group-hover:text-primary transition-colors" />
                <span className="text-xs text-muted-foreground">
                  {activeSlotTarget === 'A' ? 'Выберите улику из списка ниже' : 'Нажмите, чтобы выбрать улику'}
                </span>
              </div>
            )}

            <div className="text-[10px] font-mono text-muted-foreground/60">
              {slotA ? slotA.kind.toUpperCase() : 'СЛОТ ПУСТ'}
            </div>
          </div>

          {/* Compare Icon / Center Button */}
          <div className="flex flex-col items-center justify-center py-2 md:py-0">
            <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-secondary text-muted-foreground">
              <GitCompare className="size-5 text-primary" />
            </div>
          </div>

          {/* Slot B */}
          <div
            onClick={() => setActiveSlotTarget(activeSlotTarget === 'B' ? null : 'B')}
            className={cn(
              'group relative flex min-h-[140px] cursor-pointer flex-col justify-between border-2 border-dashed p-4 transition-all',
              slotB
                ? 'border-primary/60 bg-secondary/40'
                : activeSlotTarget === 'B'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/60 hover:border-border hover:bg-secondary/20'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Материал II
              </span>
              {slotB && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlotB(null);
                    setFeedback(null);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  title="Очистить слот"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {slotB ? (
              <div className="my-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" />
                  <span className="font-mono text-xs font-semibold text-primary">
                    [{slotB.id.toUpperCase()}]
                  </span>
                  <span className="font-medium text-xs text-foreground line-clamp-1">
                    {slotB.title}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {slotB.meta || slotB.source || slotB.content || 'Материал дела'}
                </p>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center text-center">
                <Plus className="size-5 text-muted-foreground/60 mb-1 group-hover:text-primary transition-colors" />
                <span className="text-xs text-muted-foreground">
                  {activeSlotTarget === 'B' ? 'Выберите улику из списка ниже' : 'Нажмите, чтобы выбрать улику'}
                </span>
              </div>
            )}

            <div className="text-[10px] font-mono text-muted-foreground/60">
              {slotB ? slotB.kind.toUpperCase() : 'СЛОТ ПУСТ'}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            disabled={!slotA || !slotB}
            onClick={handleAnalyze}
            className={cn(
              'flex items-center gap-2 border px-6 py-2.5 text-xs font-display uppercase tracking-widest transition-all',
              slotA && slotB
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                : 'border-border/50 bg-secondary/40 text-muted-foreground cursor-not-allowed opacity-50'
            )}
          >
            <Sparkles className="size-4" />
            Сопоставить материалы
          </button>
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div
            className={cn(
              'mt-6 border p-4 transition-all animate-in fade-in slide-in-from-top-2',
              feedback.type === 'success'
                ? 'border-primary/60 bg-primary/10 text-foreground'
                : 'border-destructive/40 bg-destructive/10 text-foreground'
            )}
          >
            <div className="flex items-start gap-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold font-display tracking-wider uppercase">
                    {feedback.title}
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-current/30">
                    {feedback.type === 'success' ? 'ЗАКЛЮЧЕНИЕ СФОРМУЛИРОВАНО' : 'ДИССОНАНС'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feedback.message}
                </p>
                {feedback.resultEvidenceId && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[11px] text-primary font-mono">
                      Разблокирован новый материал:
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectEvidence?.(feedback.resultEvidenceId!)}
                      className="inline-flex items-center gap-1 border border-primary/60 bg-secondary px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <span>[{feedback.resultEvidenceId.toUpperCase()}]</span>
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Evidence Clue Picker Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Доступные материалы дела ({availableEvidence.length})
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {activeSlotTarget ? `Выбирается для: Слота ${activeSlotTarget}` : 'Кликните по улике для добавления в слот'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {availableEvidence.map((doc) => {
            const isSelectedA = slotA?.id === doc.id;
            const isSelectedB = slotB?.id === doc.id;
            const isSelected = isSelectedA || isSelectedB;

            return (
              <div
                key={doc.id}
                onClick={() => handleSelectClue(doc)}
                className={cn(
                  'group flex flex-col justify-between border p-3 cursor-pointer transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border/60 bg-card hover:border-border hover:bg-secondary/40'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      [{doc.id.toUpperCase()}]
                    </span>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground border border-border/40 px-1">
                      {doc.kind}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                    {doc.meta || doc.source || doc.content || 'Материал дела'}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-[10px] font-mono">
                  <span className="text-muted-foreground">
                    {isSelectedA ? 'Выбран: Слот I' : isSelectedB ? 'Выбран: Слот II' : 'Нажмите для выбора'}
                  </span>
                  {isSelected && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Deductions History */}
      {completedRules.length > 0 && (
        <div className="border border-border/70 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <h3 className="font-display text-xs uppercase tracking-wider text-foreground">
              Журнал дедуктивных выводов ({completedRules.length})
            </h3>
          </div>

          <div className="space-y-2">
            {completedRules.map((rule) => (
              <div
                key={rule.id}
                className="border border-border/50 bg-secondary/30 p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-foreground font-display">
                    {rule.title}
                  </h5>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <span>[{rule.clueIds[0].toUpperCase()}]</span>
                    <span>+</span>
                    <span>[{rule.clueIds[1].toUpperCase()}]</span>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {rule.conclusion}
                </p>
                {rule.resultEvidenceId && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectEvidence?.(rule.resultEvidenceId!)}
                      className="text-[11px] font-mono text-primary hover:underline"
                    >
                      → Изучить материал [{rule.resultEvidenceId.toUpperCase()}]
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
