import type { UnlockCondition, InvestigationState, CaseEngineResult } from './types';
import type { CaseFile } from '@/lib/archive-data';

/**
 * Проверка выполнения условия разблокировки на основе текущего состояния расследования.
 * Чистая функция, не содержащая жёстких сюжетных идентификаторов.
 */
export function isConditionMet(
  condition: UnlockCondition | undefined,
  state: InvestigationState
): boolean {
  if (!condition || condition.type === 'ALWAYS') {
    return true;
  }

  switch (condition.type) {
    case 'EVIDENCE_VIEWED': {
      const id = condition.evidenceId ?? condition.targetId;
      return id ? (state.viewedEvidence ?? []).includes(id) : true;
    }

    case 'QUESTION_SOLVED': {
      const id = condition.questionId ?? condition.targetId;
      return id ? (state.solvedQuestions ?? []).includes(id) : true;
    }

    case 'CLUES_COMBINED': {
      const [a, b] = condition.clueIds;
      const key1 = `${a}+${b}`;
      const key2 = `${b}+${a}`;
      return (state.completedDeductions ?? []).some(
        (ded) => ded === key1 || ded === key2 || (ded.includes(a) && ded.includes(b))
      );
    }

    case 'DEDUCTION_COMPLETED': {
      const id = condition.deductionId ?? condition.targetId;
      return id ? (state.completedDeductions ?? []).includes(id) : true;
    }

    case 'LOCATION_EXPLORED': {
      const id = condition.locationId ?? condition.targetId;
      return id ? (state.exploredLocations ?? []).includes(id) : true;
    }

    case 'HOTSPOT_DISCOVERED': {
      const id = condition.hotspotId ?? condition.targetId;
      return id ? (state.discoveredHotspots ?? []).includes(id) : true;
    }

    case 'QUESTION_ASKED': {
      const id = condition.questionId ?? condition.targetId;
      return id ? (state.askedQuestions ?? []).includes(id) : true;
    }

    case 'CLUE_PRESENTED': {
      const id = condition.clueId ?? condition.targetId;
      return id
        ? (state.presentedClues ?? []).some((c) => c === id || c.endsWith(`:${id}`))
        : true;
    }

    case 'ALL_OF':
      return condition.conditions.every((c) => isConditionMet(c, state));

    case 'ANY_OF':
      return condition.conditions.some((c) => isConditionMet(c, state));

    default:
      return true;
  }
}

/**
 * Расчёт прогресса расследования в процентах (0–100).
 */
export function calculateProgress(
  caseFile: CaseFile,
  state: InvestigationState
): number {
  const totalDocs = caseFile.documents.length;
  const totalQuestions = caseFile.terminal?.questions?.length ?? 0;
  const totalDeductions = caseFile.deductions?.length ?? 0;
  const totalInterviews = (caseFile.interviews ?? []).reduce(
    (acc, it) => acc + it.questions.length,
    0
  );
  const totalUnits = totalDocs + totalQuestions + totalDeductions + totalInterviews;

  if (totalUnits === 0) return 0;

  const viewedDocsCount = caseFile.documents.filter((d) =>
    (state.viewedEvidence ?? []).includes(d.id)
  ).length;

  const solvedQuestionsCount = (caseFile.terminal?.questions ?? []).filter((q) =>
    (state.solvedQuestions ?? []).includes(q.id)
  ).length;

  const completedDeductionsCount = (caseFile.deductions ?? []).filter((d) => {
    const key1 = `${d.clueIds[0]}+${d.clueIds[1]}`;
    const key2 = `${d.clueIds[1]}+${d.clueIds[0]}`;
    return (state.completedDeductions ?? []).some(
      (ded) => ded === d.id || ded === key1 || ded === key2
    );
  }).length;

  const askedQuestionsCount = (state.askedQuestions ?? []).length;

  const completedUnits =
    viewedDocsCount + solvedQuestionsCount + completedDeductionsCount + Math.min(askedQuestionsCount, totalInterviews);
  return Math.min(100, Math.max(0, Math.round((completedUnits / totalUnits) * 100)));
}

/**
 * Главный чистый evaluator состояния дела.
 * Получает описание дела и состояние игрока, возвращает наборы доступных идентификаторов и процент прогресса.
 */
export function evaluateCaseState(
  caseFile: CaseFile,
  state: InvestigationState
): CaseEngineResult {
  const availableEvidenceIds = new Set<string>();
  const availableLocationIds = new Set<string>();
  const availableNoteIds = new Set<string>();
  const availableQuestionIds = new Set<string>();
  const availableInterviewIds = new Set<string>();
  const availableDeductionIds = new Set<string>();

  // 1. Документы / Улики
  for (const doc of caseFile.documents) {
    if (isConditionMet(doc.unlockCondition, state)) {
      availableEvidenceIds.add(doc.id);
    }
  }

  // Если у найденного hotspot есть resultEvidenceId, он автоматически становится доступным
  for (const doc of caseFile.documents) {
    if (doc.hotspots) {
      for (const hs of doc.hotspots) {
        if ((state.discoveredHotspots ?? []).includes(hs.id) && hs.resultEvidenceId) {
          availableEvidenceIds.add(hs.resultEvidenceId);
        }
      }
    }
  }

  // 2. Локации
  if (caseFile.locations) {
    for (const loc of caseFile.locations) {
      if (isConditionMet(loc.unlockCondition, state)) {
        availableLocationIds.add(loc.id);
      }
    }
  }

  // 3. Заметки Орлова
  for (const note of caseFile.notes) {
    if (isConditionMet(note.unlockCondition, state)) {
      availableNoteIds.add(note.id);
    }
  }

  // 4. Вопросы терминала
  if (caseFile.terminal?.questions) {
    for (const q of caseFile.terminal.questions) {
      if (isConditionMet(q.unlockCondition, state)) {
        availableQuestionIds.add(q.id);
      }
    }
  }

  // 5. Допросы (Interviews)
  if (caseFile.interviews) {
    for (const interview of caseFile.interviews) {
      if (isConditionMet(interview.unlockCondition, state)) {
        availableInterviewIds.add(interview.id);
      }
    }
  }

  // 6. Дедукции
  if (caseFile.deductions) {
    for (const deduction of caseFile.deductions) {
      if (isConditionMet(deduction.unlockCondition, state)) {
        availableDeductionIds.add(deduction.id);
      }
    }
  }

  // 7. Связи (Relations)
  const availableRelationIds = new Set<string>();
  if (caseFile.relations) {
    for (const rel of caseFile.relations) {
      if (isConditionMet(rel.unlockCondition, state)) {
        if (rel.id) availableRelationIds.add(rel.id);
      }
    }
  }

  const isArchiveUnlocked = isConditionMet(caseFile.terminal?.archiveUnlockCondition, state);
  const progressPercentage = calculateProgress(caseFile, state);

  return {
    availableEvidenceIds,
    availableLocationIds,
    availableNoteIds,
    availableQuestionIds,
    availableInterviewIds,
    availableDeductionIds,
    availableRelationIds,
    progressPercentage,
    isArchiveUnlocked,
  };
}
