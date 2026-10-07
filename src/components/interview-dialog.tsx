'use client';

import { useState } from 'react';
import {
  User,
  MessageSquare,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Interview, InterviewQuestion, CaseDocument } from '@/lib/archive-data';

export type DialogueTurn = {
  id: string;
  type: 'question' | 'answer' | 'presentation' | 'reaction';
  text: string;
  speaker: string;
  clueTitle?: string;
  matches?: boolean;
};

type InterviewDialogProps = {
  interview: Interview;
  availableQuestions: InterviewQuestion[];
  askedQuestionIds: string[];
  onAskQuestion: (interviewId: string, questionId: string) => void;
  onPresentClue: (
    interviewId: string,
    questionId: string,
    clueId: string
  ) => {
    matches: boolean;
    reactionText: string;
    unlocksQuestionId?: string;
    unlocksEvidenceId?: string;
  };
  allUnlockedDocuments: CaseDocument[];
  onOpenEvidence?: (evidenceId: string) => void;
};

export function InterviewDialog({
  interview,
  availableQuestions,
  askedQuestionIds,
  onAskQuestion,
  onPresentClue,
  allUnlockedDocuments,
  onOpenEvidence,
}: InterviewDialogProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    availableQuestions[0]?.id ?? null
  );
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [presentationFeedback, setPresentationFeedback] = useState<{
    matches: boolean;
    text: string;
    unlockedEvidenceId?: string;
  } | null>(null);

  const handleAsk = (q: InterviewQuestion) => {
    onAskQuestion(interview.id, q.id);
    setActiveQuestionId(q.id);
    setPresentationFeedback(null);

    setDialogueHistory((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        type: 'question',
        speaker: 'Следователь Орлов',
        text: q.text,
      },
      {
        id: `a-${Date.now() + 1}`,
        type: 'answer',
        speaker: interview.title,
        text: q.answer,
      },
    ]);
  };

  const handleConfirmPresentClue = () => {
    if (!activeQuestionId || !selectedClueId) return;

    const clue = allUnlockedDocuments.find((d) => d.id === selectedClueId);
    const result = onPresentClue(interview.id, activeQuestionId, selectedClueId);

    setPresentationFeedback({
      matches: result.matches,
      text: result.reactionText,
      unlockedEvidenceId: result.unlocksEvidenceId,
    });

    setDialogueHistory((prev) => [
      ...prev,
      {
        id: `pres-${Date.now()}`,
        type: 'presentation',
        speaker: 'Следователь Орлов',
        text: `Предъявлено вещественное доказательство: ${clue?.title ?? selectedClueId}`,
        clueTitle: clue?.title,
      },
      {
        id: `react-${Date.now() + 1}`,
        type: 'reaction',
        speaker: interview.title,
        text: result.reactionText,
        matches: result.matches,
      },
    ]);

    setIsPickerOpen(false);
    setSelectedClueId(null);
  };

  return (
    <div className="space-y-5">
      {/* Witness Dossier Header */}
      <div className="border border-border/80 bg-card p-4 sm:p-5 text-foreground shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center border-2 border-primary/60 bg-secondary text-primary font-display text-lg shadow-inner">
            {interview.avatarUrl ? (
              <img src={interview.avatarUrl} alt={interview.title} className="size-full object-cover" />
            ) : (
              <User className="size-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base uppercase tracking-wider text-foreground font-bold">
                {interview.title}
              </span>
              <span className="border border-border/70 bg-secondary px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
                {interview.role}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
              ПРОТОКОЛ ОПРОСА // СЛЕДСТВЕННЫЙ ОТДЕЛ ОВР
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>Задано вопросов:</span>
          <span className="text-primary font-bold">
            {askedQuestionIds.filter((id) => interview.questions.some((q) => q.id === id)).length} /{' '}
            {interview.questions.length}
          </span>
        </div>
      </div>

      {/* Witness Introduction Statement */}
      <div className="paper-card p-4 border border-ink/20 space-y-1.5 text-ink">
        <span className="label-xs text-ink/60 font-mono block uppercase">
          ВСТУПИТЕЛЬНЫЕ ПОКАЗАНИЯ СВИДЕТЕЛЯ:
        </span>
        <p className="font-body text-xs sm:text-sm italic leading-relaxed text-ink/90">
          «{interview.introduction}»
        </p>
      </div>

      {/* Two Column Layout: Dialogue History (left) + Question Selector & Clue Presenter (right) */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: Interrogation Dialogue Log */}
        <div className="border border-border/80 bg-background/95 p-4 sm:p-5 flex flex-col min-h-[420px] max-h-[580px] overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
            <span className="label-xs text-primary font-display uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              СТЕНОГРАММА ДОПРОСА
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              ОВР // АУДИОПРОТОКОЛ
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
            {dialogueHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground space-y-2">
                <FileSearch className="size-8 text-muted-foreground/40" />
                <p>Выберите вопрос справа, чтобы начать опрос свидетеля.</p>
                <p className="text-[11px] text-muted-foreground/60 max-w-sm">
                  Вы сможете задавать уточняющие вопросы и предъявлять найденные улики для проверки алиби и устранения противоречий.
                </p>
              </div>
            ) : (
              dialogueHistory.map((turn) => {
                if (turn.type === 'question') {
                  return (
                    <div key={turn.id} className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-primary mb-1">
                        {turn.speaker}:
                      </span>
                      <div className="border border-primary/50 bg-primary/10 p-3 text-xs text-foreground max-w-md rounded-sm">
                        {turn.text}
                      </div>
                    </div>
                  );
                }

                if (turn.type === 'answer') {
                  return (
                    <div key={turn.id} className="flex flex-col items-start">
                      <span className="text-[10px] font-mono text-muted-foreground mb-1">
                        {turn.speaker}:
                      </span>
                      <div className="paper-card p-3 text-xs text-ink max-w-md border border-ink/20 shadow-sm leading-relaxed">
                        {turn.text}
                      </div>
                    </div>
                  );
                }

                if (turn.type === 'presentation') {
                  return (
                    <div key={turn.id} className="my-2 flex justify-center">
                      <div className="border border-stamp/70 bg-stamp/10 px-3 py-1.5 text-xs font-mono text-stamp flex items-center gap-2 uppercase">
                        <ShieldAlert className="size-3.5" />
                        <span>{turn.text}</span>
                      </div>
                    </div>
                  );
                }

                if (turn.type === 'reaction') {
                  return (
                    <div key={turn.id} className="flex flex-col items-start animate-in fade-in">
                      <span className="text-[10px] font-mono text-amber-500 mb-1 flex items-center gap-1">
                        <Sparkles className="size-3" />
                        {turn.speaker} (реакция на улику):
                      </span>
                      <div
                        className={cn(
                          'p-3 text-xs max-w-md border leading-relaxed',
                          turn.matches
                            ? 'border-emerald-600/70 bg-emerald-950/20 text-emerald-300 font-medium'
                            : 'border-border bg-secondary/40 text-muted-foreground italic'
                        )}
                      >
                        {turn.text}
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        </div>

        {/* Right: Question Selector and Clue Presentation */}
        <div className="space-y-4">
          {/* Questions Box */}
          <div className="border border-border/80 bg-card p-4 space-y-3">
            <span className="label-xs text-primary font-display uppercase tracking-wider block border-b border-border/60 pb-1.5">
              ДОСТУПНЫЕ ВОПРОСЫ
            </span>

            <div className="space-y-2">
              {availableQuestions.map((q, idx) => {
                const isAsked = askedQuestionIds.includes(q.id);
                const isCurrent = activeQuestionId === q.id;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className={cn(
                      'w-full text-left p-2.5 border transition-all text-xs flex items-start gap-2',
                      isCurrent
                        ? 'border-primary bg-primary/15 font-medium text-foreground'
                        : isAsked
                        ? 'border-border/60 bg-secondary/30 text-muted-foreground hover:border-primary/50'
                        : 'border-border/80 bg-card text-foreground hover:border-primary hover:bg-secondary/40'
                    )}
                  >
                    <span className="font-mono text-[11px] text-primary/70 shrink-0 mt-0.5">
                      [{idx + 1}]
                    </span>
                    <span className="flex-1 leading-snug">{q.text}</span>
                    {isAsked && (
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clue Presentation Trigger */}
          <div className="border border-border/80 bg-secondary/30 p-4 space-y-3">
            <span className="label-xs text-stamp font-display uppercase tracking-wider block border-b border-border/60 pb-1.5">
              ПРОВЕРКА ПОКАЗАНИЙ УЛИКАМИ
            </span>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Если свидетель искажает факты или путается в хронологии, предъявите ему вещественное доказательство из материалов дела.
            </p>

            <button
              type="button"
              disabled={!activeQuestionId}
              onClick={() => setIsPickerOpen(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 border px-4 py-2.5 text-xs font-display uppercase tracking-wider transition-colors shadow-sm',
                activeQuestionId
                  ? 'border-stamp bg-stamp/15 text-stamp hover:bg-stamp hover:text-white'
                  : 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              <FileSearch className="size-4" />
              <span>Предъявить улику свидетелю</span>
            </button>
          </div>

          {/* Feedback announcement if presented clue triggered unlock */}
          {presentationFeedback && (
            <div
              className={cn(
                'border p-3.5 space-y-2 text-xs font-mono animate-in fade-in',
                presentationFeedback.matches
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-2 font-bold uppercase">
                {presentationFeedback.matches ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="size-4 text-amber-400" />
                )}
                <span>
                  {presentationFeedback.matches
                    ? 'СВИДЕТЕЛЬ ПРИЖАТ ФАКТАМИ!'
                    : 'УЛИКА НЕ ВЫЗВАЛА РЕАКЦИИ'}
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed">
                {presentationFeedback.text}
              </p>
              {presentationFeedback.unlockedEvidenceId && onOpenEvidence && (
                <button
                  type="button"
                  onClick={() => onOpenEvidence(presentationFeedback.unlockedEvidenceId!)}
                  className="mt-2 flex items-center gap-1.5 border border-emerald-500/80 bg-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors"
                >
                  <span>Открыть новую улику {presentationFeedback.unlockedEvidenceId.toUpperCase()}</span>
                  <ArrowRight className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clue Selection Modal / Drawer */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col border border-border/80 bg-card p-5 shadow-2xl overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div>
                <span className="font-display text-sm uppercase tracking-wider text-foreground font-bold block">
                  ВЫБЕРИТЕ УЛИКУ ДЛЯ ПРЕДЪЯВЛЕНИЯ
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Свидетель: {interview.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Отмена [✕]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
              {allUnlockedDocuments.map((doc) => {
                const isSelected = selectedClueId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedClueId(doc.id)}
                    className={cn(
                      'w-full text-left p-3 border transition-all flex items-start justify-between gap-2',
                      isSelected
                        ? 'border-primary bg-primary/20 shadow-md'
                        : 'border-border/60 bg-secondary/30 hover:border-primary/60'
                    )}
                  >
                    <div>
                      <span className="block font-medium text-xs text-foreground">
                        {doc.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {doc.archiveId ?? doc.id} • {doc.date ?? 'В материалах'}
                      </span>
                    </div>
                    <span className="border border-border/60 px-1.5 py-0.5 text-[9px] font-mono uppercase text-primary">
                      {doc.kind}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border/60 pt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {selectedClueId ? `Выбрано: ${selectedClueId.toUpperCase()}` : 'Выберите улику из списка'}
              </span>
              <button
                type="button"
                disabled={!selectedClueId}
                onClick={handleConfirmPresentClue}
                className={cn(
                  'border px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors',
                  selectedClueId
                    ? 'border-stamp bg-stamp text-white hover:bg-stamp/80'
                    : 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                Предъявить свидетелю
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
