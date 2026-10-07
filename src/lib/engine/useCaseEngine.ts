'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  CaseFile,
  CaseDocument,
  CaseNote,
  Location,
  HypothesisQuestion,
  Interview,
  DeductionRule,
  EvidenceRelation,
} from '@/lib/archive-data';
import type { InvestigationState, CaseEngineResult } from './types';
import { evaluateCaseState, calculateProgress, isConditionMet } from './evaluator';

export type UseCaseEngineOptions = {
  caseFile: CaseFile;
  isGuest?: boolean;
};

const DEFAULT_STATE: InvestigationState = {
  viewedEvidence: [],
  solvedQuestions: [],
  completedDeductions: [],
  exploredLocations: [],
  discoveredHotspots: [],
  askedQuestions: [],
  presentedClues: [],
  notes: [],
};

export function useCaseEngine({ caseFile, isGuest = false }: UseCaseEngineOptions) {
  const caseId = caseFile.id;
  const storageKey = `arg_case_state_${caseId}`;

  const [state, setState] = useState<InvestigationState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newlyUnlockedTitle, setNewlyUnlockedTitle] = useState<string | null>(null);

  const prevAvailableIdsRef = useRef<Set<string>>(new Set());

  // 1. Загрузка состояния при монтировании (localStorage для всех + /api/progress для авторизованных)
  useEffect(() => {
    let active = true;

    async function loadInitialState() {
      let localState: Partial<InvestigationState> = {};

      // Чтение из localStorage
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          localState = JSON.parse(raw);
        } else {
          // Чтение из легаси-ключей при первом открытии
          const legacySolved = localStorage.getItem(`arg_terminal_solved_${caseId}`);
          const legacyNotes = localStorage.getItem(`arg_player_notes_${caseId}`);
          if (legacySolved) {
            localState.solvedQuestions = JSON.parse(legacySolved);
          }
          if (legacyNotes) {
            localState.notes = JSON.parse(legacyNotes);
          }
        }
      } catch {
        // Игнорируем ошибки парсинга
      }

      let mergedState: InvestigationState = {
        viewedEvidence: localState.viewedEvidence ?? [],
        solvedQuestions: localState.solvedQuestions ?? [],
        completedDeductions: localState.completedDeductions ?? [],
        exploredLocations: localState.exploredLocations ?? [],
        discoveredHotspots: localState.discoveredHotspots ?? [],
        askedQuestions: localState.askedQuestions ?? [],
        presentedClues: localState.presentedClues ?? [],
        notes: localState.notes ?? [],
      };

      // Если авторизован, подтягиваем данные с сервера
      if (!isGuest) {
        try {
          const res = await fetch(`/api/progress?caseId=${encodeURIComponent(caseId)}`);
          if (res.ok) {
            const serverData = await res.json();
            if (!serverData.isGuest) {
              const serverViewed = Array.isArray(serverData.viewedEvidence) ? serverData.viewedEvidence : [];
              const serverSolved = Array.isArray(serverData.solvedQuestions) ? serverData.solvedQuestions : [];
              const serverNotes = Array.isArray(serverData.notes) ? serverData.notes : [];

              const unpackedViewed: string[] = [];
              const unpackedLocations: string[] = [];
              const unpackedHotspots: string[] = [];
              for (const item of serverViewed) {
                if (typeof item === 'string') {
                  if (item.startsWith('loc:')) {
                    unpackedLocations.push(item.replace(/^loc:/, ''));
                  } else if (item.startsWith('hs:')) {
                    unpackedHotspots.push(item.replace(/^hs:/, ''));
                  } else {
                    unpackedViewed.push(item);
                  }
                }
              }

              const unpackedSolved: string[] = [];
              const unpackedDeductions: string[] = [];
              const unpackedAsked: string[] = [];
              const unpackedPresented: string[] = [];
              for (const item of serverSolved) {
                if (typeof item === 'string') {
                  if (item.startsWith('ded:')) {
                    unpackedDeductions.push(item.replace(/^ded:/, ''));
                  } else if (item.startsWith('qst:')) {
                    unpackedAsked.push(item.replace(/^qst:/, ''));
                  } else if (item.startsWith('prs:')) {
                    unpackedPresented.push(item.replace(/^prs:/, ''));
                  } else {
                    unpackedSolved.push(item);
                  }
                }
              }

              // Объединяем локальные и серверные данные
              mergedState = {
                viewedEvidence: Array.from(new Set([...mergedState.viewedEvidence, ...unpackedViewed])),
                solvedQuestions: Array.from(new Set([...mergedState.solvedQuestions, ...unpackedSolved])),
                completedDeductions: Array.from(new Set([...mergedState.completedDeductions, ...unpackedDeductions])),
                exploredLocations: Array.from(new Set([...mergedState.exploredLocations, ...unpackedLocations])),
                discoveredHotspots: Array.from(new Set([...mergedState.discoveredHotspots, ...unpackedHotspots])),
                askedQuestions: Array.from(new Set([...mergedState.askedQuestions, ...unpackedAsked])),
                presentedClues: Array.from(new Set([...mergedState.presentedClues, ...unpackedPresented])),
                notes: serverNotes.length > 0 ? serverNotes : mergedState.notes,
              };
            }
          }
        } catch (err) {
          console.warn('[useCaseEngine] Failed to fetch server progress:', err);
        }
      }

      if (active) {
        setState(mergedState);
        setIsLoaded(true);
      }
    }

    loadInitialState();

    return () => {
      active = false;
    };
  }, [caseId, isGuest, storageKey]);

  // 2. Функция сохранения состояния
  const persistState = useCallback(
    (nextState: InvestigationState) => {
      // Сохраняем в localStorage мгновенно
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextState));
        localStorage.setItem(`arg_terminal_solved_${caseId}`, JSON.stringify(nextState.solvedQuestions));
        if (nextState.notes) {
          localStorage.setItem(`arg_player_notes_${caseId}`, JSON.stringify(nextState.notes));
        }
      } catch {
        // Игнорируем ошибки квоты
      }

      // Если авторизован, отправляем на сервер
      if (!isGuest) {
        const progress = calculateProgress(caseFile, nextState);
        const packedSolved = [
          ...nextState.solvedQuestions,
          ...nextState.completedDeductions.map((d) => `ded:${d}`),
          ...nextState.askedQuestions.map((q) => `qst:${q}`),
          ...nextState.presentedClues.map((c) => `prs:${c}`),
        ];
        const packedViewed = [
          ...nextState.viewedEvidence,
          ...nextState.exploredLocations.map((l) => `loc:${l}`),
          ...nextState.discoveredHotspots.map((h) => `hs:${h}`),
        ];

        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId,
            progress,
            solvedQuestions: packedSolved,
            viewedEvidence: packedViewed,
            notes: nextState.notes ?? [],
          }),
        }).catch((err) => console.warn('[useCaseEngine] Failed to sync progress:', err));
      }
    },
    [caseFile, caseId, isGuest, storageKey]
  );

  // 3. Вычисление доступных материалов через чистый evaluator
  const engineResult: CaseEngineResult = useMemo(() => {
    return evaluateCaseState(caseFile, state);
  }, [caseFile, state]);

  // 4. Отслеживание новых разблокировок для уведомления
  useEffect(() => {
    if (!isLoaded) {
      prevAvailableIdsRef.current = new Set(engineResult.availableEvidenceIds);
      return;
    }

    const prev = prevAvailableIdsRef.current;
    const current = engineResult.availableEvidenceIds;

    for (const id of current) {
      if (!prev.has(id)) {
        const newlyDoc = caseFile.documents.find((d) => d.id === id);
        if (newlyDoc) {
          setNewlyUnlockedTitle(newlyDoc.title);
          const timer = setTimeout(() => setNewlyUnlockedTitle(null), 5000);
          prevAvailableIdsRef.current = new Set(current);
          return () => clearTimeout(timer);
        }
      }
    }

    prevAvailableIdsRef.current = new Set(current);
  }, [caseFile.documents, engineResult.availableEvidenceIds, isLoaded]);

  // 5. Игровые действия (Actions)

  // Изучение улики
  const markEvidenceViewed = useCallback(
    (evidenceId: string) => {
      setState((prev) => {
        if ((prev.viewedEvidence ?? []).includes(evidenceId)) {
          return prev;
        }
        const nextState: InvestigationState = {
          ...prev,
          viewedEvidence: [...(prev.viewedEvidence ?? []), evidenceId],
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  // Решение гипотезы в терминале
  const solveQuestion = useCallback(
    (questionId: string) => {
      setState((prev) => {
        if ((prev.solvedQuestions ?? []).includes(questionId)) {
          return prev;
        }
        const nextState: InvestigationState = {
          ...prev,
          solvedQuestions: [...(prev.solvedQuestions ?? []), questionId],
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  // Обнаружение активной зоны на фотографии (Hotspot)
  const discoverHotspot = useCallback(
    (evidenceId: string, hotspotId: string) => {
      setState((prev) => {
        if ((prev.discoveredHotspots ?? []).includes(hotspotId)) {
          return prev;
        }

        const doc = caseFile.documents.find((d) => d.id === evidenceId);
        const hotspot = doc?.hotspots?.find((h) => h.id === hotspotId);

        let nextViewed = prev.viewedEvidence ?? [];
        if (hotspot?.resultEvidenceId && !nextViewed.includes(hotspot.resultEvidenceId)) {
          nextViewed = [...nextViewed, hotspot.resultEvidenceId];
        }

        const nextHotspots = [...(prev.discoveredHotspots ?? []), hotspotId];

        const nextState: InvestigationState = {
          ...prev,
          discoveredHotspots: nextHotspots,
          viewedEvidence: nextViewed,
        };
        persistState(nextState);
        return nextState;
      });
    },
    [caseFile.documents, persistState]
  );

  // Задать вопрос на допросе
  const askQuestion = useCallback(
    (interviewId: string, questionId: string) => {
      setState((prev) => {
        if ((prev.askedQuestions ?? []).includes(questionId)) {
          return prev;
        }

        const interview = caseFile.interviews?.find((i) => i.id === interviewId);
        const question = interview?.questions.find((q) => q.id === questionId);

        let nextViewed = prev.viewedEvidence ?? [];
        if (question?.unlockedEvidenceId && !nextViewed.includes(question.unlockedEvidenceId)) {
          nextViewed = [...nextViewed, question.unlockedEvidenceId];
        }

        const nextState: InvestigationState = {
          ...prev,
          askedQuestions: [...(prev.askedQuestions ?? []), questionId],
          viewedEvidence: nextViewed,
        };
        persistState(nextState);
        return nextState;
      });
    },
    [caseFile.interviews, persistState]
  );

  // Предъявить улику свидетелю на допросе
  const presentClue = useCallback(
    (interviewId: string, questionId: string, clueId: string) => {
      const interview = caseFile.interviews?.find((i) => i.id === interviewId);
      const question = interview?.questions.find((q) => q.id === questionId);
      const reaction =
        question?.clueReactions?.find((r: any) => r.clueId === clueId) ??
        interview?.clueReactions?.find((r: any) => r.clueId === clueId);
      const clueKey = `${interviewId}:${questionId}:${clueId}`;

      let resultMatches = false;
      let reactionText =
        question?.defaultIrrelevantReaction ||
        'Свидетель внимательно осматривает материал, но отрицает связь с делом.';

      let unlocksQuestionId: string | undefined = undefined;
      let unlocksEvidenceId: string | undefined = undefined;

      if (reaction) {
        resultMatches = true;
        reactionText = reaction.reactionText || reaction.reaction || reactionText;
        unlocksQuestionId = reaction.unlocksQuestionId;
        unlocksEvidenceId = reaction.unlocksEvidenceId;
      }

      setState((prev) => {
        const nextPresented = Array.from(new Set([...(prev.presentedClues ?? []), clueKey, clueId]));
        let nextViewed = prev.viewedEvidence ?? [];
        if (unlocksEvidenceId && !nextViewed.includes(unlocksEvidenceId)) {
          nextViewed = [...nextViewed, unlocksEvidenceId];
        }

        const nextState: InvestigationState = {
          ...prev,
          presentedClues: nextPresented,
          viewedEvidence: nextViewed,
        };
        persistState(nextState);
        return nextState;
      });

      return {
        matches: resultMatches,
        reactionText,
        unlocksQuestionId,
        unlocksEvidenceId,
      };
    },
    [caseFile.interviews, persistState]
  );

  // Сопоставление двух улик (Дедукция)
  const completeDeduction = useCallback(
    (clueA: string, clueB: string) => {
      const rules = caseFile.deductions ?? [];
      const match = rules.find((rule) => {
        const [rA, rB] = rule.clueIds;
        return (rA === clueA && rB === clueB) || (rA === clueB && rB === clueA);
      });

      if (!match) {
        const foundRebuttal = caseFile.deductionRebuttals?.find((r) => {
          const [rA, rB] = r.clueIds;
          return (rA === clueA && rB === clueB) || (rA === clueB && rB === clueA);
        });

        return {
          success: false,
          conclusion:
            foundRebuttal?.rebuttal ??
            'Связи между этими материалами не обнаружено. Перепроверьте факты, хронологию и свидетельские показания.',
          error:
            foundRebuttal?.rebuttal ??
            'Связи между этими материалами не обнаружено. Перепроверьте факты, хронологию и свидетельские показания.',
        };
      }

      const key1 = `${clueA}+${clueB}`;
      const deductionId = match.id;

      setState((prev) => {
        const alreadyDone = (prev.completedDeductions ?? []).includes(deductionId);
        if (alreadyDone) {
          return prev;
        }

        let nextViewed = prev.viewedEvidence ?? [];
        if (match.resultEvidenceId && !nextViewed.includes(match.resultEvidenceId)) {
          nextViewed = [...nextViewed, match.resultEvidenceId];
        }

        const nextState: InvestigationState = {
          ...prev,
          completedDeductions: Array.from(
            new Set([...(prev.completedDeductions ?? []), deductionId, key1])
          ),
          viewedEvidence: nextViewed,
        };
        persistState(nextState);
        return nextState;
      });

      return {
        success: true,
        title: match.title,
        conclusion: match.conclusion,
        resultEvidenceId: match.resultEvidenceId,
        deduction: match,
      };
    },
    [caseFile.deductions, caseFile.deductionRebuttals, persistState]
  );

  // Исследование локации
  const exploreLocation = useCallback(
    (locationId: string) => {
      setState((prev) => {
        if ((prev.exploredLocations ?? []).includes(locationId)) {
          return prev;
        }

        const loc = caseFile.locations?.find((l) => l.id === locationId);
        let nextViewed = prev.viewedEvidence ?? [];
        if (loc?.scene?.unlockedEvidenceIds) {
          for (const evId of loc.scene.unlockedEvidenceIds) {
            if (!nextViewed.includes(evId)) {
              nextViewed = [...nextViewed, evId];
            }
          }
        }

        const nextState: InvestigationState = {
          ...prev,
          exploredLocations: [...(prev.exploredLocations ?? []), locationId],
          viewedEvidence: nextViewed,
        };
        persistState(nextState);
        return nextState;
      });
    },
    [caseFile.locations, persistState]
  );

  // Синхронизация заметок
  const syncNotes = useCallback(
    (notes: any[]) => {
      setState((prev) => {
        const nextState: InvestigationState = {
          ...prev,
          notes,
        };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  // 6. Отфильтрованные списки сущностей
  const availableDocuments = useMemo<CaseDocument[]>(() => {
    return caseFile.documents.filter((d) => engineResult.availableEvidenceIds.has(d.id));
  }, [caseFile.documents, engineResult.availableEvidenceIds]);

  const availableNotes = useMemo<CaseNote[]>(() => {
    return caseFile.notes.map((n) => ({
      ...n,
      locked: !engineResult.availableNoteIds.has(n.id),
    }));
  }, [caseFile.notes, engineResult.availableNoteIds]);

  const availableLocations = useMemo<Location[]>(() => {
    if (!caseFile.locations) return [];
    return caseFile.locations.map((loc) => ({
      ...loc,
      explored: loc.explored || engineResult.availableLocationIds.has(loc.id) || (state.exploredLocations ?? []).includes(loc.id),
    }));
  }, [caseFile.locations, engineResult.availableLocationIds, state.exploredLocations]);

  const availableQuestions = useMemo<HypothesisQuestion[]>(() => {
    if (!caseFile.terminal?.questions) return [];
    return caseFile.terminal.questions.filter((q) =>
      engineResult.availableQuestionIds.has(q.id)
    );
  }, [caseFile.terminal?.questions, engineResult.availableQuestionIds]);

  const availableInterviews = useMemo<Interview[]>(() => {
    if (!caseFile.interviews) return [];
    return caseFile.interviews.filter((it) =>
      engineResult.availableInterviewIds.has(it.id)
    );
  }, [caseFile.interviews, engineResult.availableInterviewIds]);

  const availableDeductions = useMemo<DeductionRule[]>(() => {
    return caseFile.deductions ?? [];
  }, [caseFile.deductions]);

  const availableRelations = useMemo<EvidenceRelation[]>(() => {
    if (!caseFile.relations) return [];
    return caseFile.relations.filter((r) =>
      r.id
        ? (engineResult.availableRelationIds?.has(r.id) ?? isConditionMet(r.unlockCondition, state))
        : isConditionMet(r.unlockCondition, state)
    );
  }, [caseFile.relations, engineResult.availableRelationIds, state]);

  // Хелпер проверки, решена ли дедукция
  const isDeductionCompleted = useCallback(
    (deductionId: string) => {
      return (state.completedDeductions ?? []).includes(deductionId);
    },
    [state.completedDeductions]
  );

  // Хелпер проверки, открыт ли hotspot
  const isHotspotDiscovered = useCallback(
    (hotspotId: string) => {
      return (state.discoveredHotspots ?? []).includes(hotspotId);
    },
    [state.discoveredHotspots]
  );

  return {
    state,
    isLoaded,
    engineResult,
    progressPercentage: engineResult.progressPercentage,
    availableDocuments,
    availableNotes,
    availableLocations,
    availableQuestions,
    availableInterviews,
    availableDeductions,
    availableRelations,
    isArchiveUnlocked: engineResult.isArchiveUnlocked,
    newlyUnlockedTitle,
    dismissUnlockNotification: () => setNewlyUnlockedTitle(null),
    markEvidenceViewed,
    solveQuestion,
    discoverHotspot,
    askQuestion,
    presentClue,
    completeDeduction,
    exploreLocation,
    syncNotes,
    isDeductionCompleted,
    isHotspotDiscovered,
  };
}
