export type UnlockCondition =
  | { type: 'ALWAYS' }
  | { type: 'EVIDENCE_VIEWED'; evidenceId?: string; targetId?: string }
  | { type: 'QUESTION_SOLVED'; questionId?: string; targetId?: string }
  | { type: 'CLUES_COMBINED'; clueIds: [string, string] }
  | { type: 'DEDUCTION_COMPLETED'; deductionId?: string; targetId?: string }
  | { type: 'LOCATION_EXPLORED'; locationId?: string; targetId?: string }
  | { type: 'HOTSPOT_DISCOVERED'; hotspotId?: string; targetId?: string }
  | { type: 'QUESTION_ASKED'; questionId?: string; targetId?: string }
  | { type: 'CLUE_PRESENTED'; clueId?: string; targetId?: string }
  | { type: 'ALL_OF'; conditions: UnlockCondition[] }
  | { type: 'ANY_OF'; conditions: UnlockCondition[] };

export type PhotoHotspot = {
  id: string;
  title: string;
  description: string;
  x: number; // 0.0 - 1.0 (относительные координаты)
  y: number; // 0.0 - 1.0
  width: number; // 0.0 - 1.0 (ширина области)
  height: number; // 0.0 - 1.0 (высота области)
  resultEvidenceId?: string; // Открываемая улика при нахождении
};

export type ClueReaction = {
  clueId: string;
  reactionText: string;
  reaction?: string;
  unlocksQuestionId?: string;
  unlocksEvidenceId?: string;
};

export type InterviewQuestion = {
  id: string;
  text: string;
  answer: string;
  unlockCondition?: UnlockCondition;
  unlockedEvidenceId?: string;
  clueReactions?: ClueReaction[];
  defaultIrrelevantReaction?: string;
};

export type Interview = {
  id: string;
  personId: string;
  title: string;
  role?: string;
  avatarUrl?: string;
  introduction?: string;
  unlockedByDefault?: boolean;
  questions: InterviewQuestion[];
  clueReactions?: ClueReaction[];
  unlockCondition?: UnlockCondition;
};

export type DeductionRule = {
  id: string;
  title: string;
  clueIds: [string, string];
  conclusion: string;
  resultEvidenceId?: string;
  unlockCondition?: UnlockCondition;
};

export type DeductionRebuttal = {
  clueIds: [string, string];
  rebuttal: string;
};

export type LocationScene = {
  locationId: string;
  sceneTitle: string;
  sceneDescription: string;
  findings: string[];
  unlockedEvidenceIds?: string[];
};

export type InvestigationState = {
  viewedEvidence: string[];
  solvedQuestions: string[];
  completedDeductions: string[];
  exploredLocations: string[];
  discoveredHotspots: string[];
  askedQuestions: string[];
  presentedClues: string[]; // Формат: "interviewId:questionId:clueId" или "clueId"
  notes?: any[];
};

export type CaseEngineResult = {
  availableEvidenceIds: Set<string>;
  availableLocationIds: Set<string>;
  availableNoteIds: Set<string>;
  availableQuestionIds: Set<string>;
  availableInterviewIds: Set<string>;
  availableDeductionIds: Set<string>;
  availableRelationIds?: Set<string>;
  progressPercentage: number;
  isArchiveUnlocked: boolean;
};
