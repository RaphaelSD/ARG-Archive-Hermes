import { type Location, type CaseLocation, locations } from '@/lib/locations-data';
import type {
  UnlockCondition,
  PhotoHotspot,
  Interview,
  InterviewQuestion,
  ClueReaction,
  DeductionRule,
  DeductionRebuttal,
  LocationScene,
} from '@/lib/engine/types';
export {
  type Location,
  type CaseLocation,
  locations,
  type UnlockCondition,
  type PhotoHotspot,
  type Interview,
  type InterviewQuestion,
  type ClueReaction,
  type DeductionRule,
  type DeductionRebuttal,
  type LocationScene,
};

export type CaseStatus = 'closed' | 'open' | 'locked';

export type PersonStatus =
  | 'MENTIONED'
  | 'IDENTIFIED'
  | 'CONNECTED'
  | 'PERSON_OF_INTEREST'
  | 'SUSPECT'
  | 'CLEARED';

export type CasePerson = {
  id: string;
  name: string;
  status: PersonStatus;
  role: string;
  description: string;
  phone?: string;
  relatedEvidenceIds?: string[];
};

export type EvidenceRelation = {
  id?: string;
  fromId: string;
  toId: string;
  sourceId?: string;
  targetId?: string;
  toType?: 'document' | 'person' | 'location' | 'call' | 'photo' | 'note';
  label: string;
  type?: string;
  unlockedByDefault?: boolean;
  unlockCondition?: UnlockCondition;
};

export type CaseDocument = {
  id: string;
  archiveId?: string;
  title: string;
  kind: 'document' | 'photo' | 'audio' | 'note' | 'map' | 'call';
  date?: string;
  source?: string;
  meta?: string;
  content?: string;
  mediaUrl?: string;
  duration?: string;
  locationId?: string;
  personIds?: string[];
  relatedIds?: string[];
  notes?: string;
  transcript?: string;
  unlockCondition?: UnlockCondition;
  hotspots?: PhotoHotspot[];
};

export type CaseNote = {
  id: string;
  title: string;
  locked?: boolean;
  body: string[];
  unlockCondition?: UnlockCondition;
};

export type TimelineEntry = {
  id?: string;
  date?: string;
  time: string;
  text: string;
  event?: string;
  sourceId?: string;
  sourceTitle?: string;
  relatedPeople?: string[];
  relatedLocations?: string[];
  relatedEvidenceIds?: string[];
  unlockedByDefault?: boolean;
  unlockCondition?: UnlockCondition;
};

export type CallLogRow = {
  id?: string;
  date: string;
  time: string;
  number: string;
  duration: string;
  type: string;
  direction?: 'INCOMING' | 'OUTGOING' | string;
  status?: 'NORMAL' | 'SUSPICIOUS' | 'UNANSWERED' | 'CRITICAL' | string;
  flagged?: boolean;
  caller?: string;
  recipient?: string;
  participants?: string[];
  summary?: string;
  transcript?: string;
  relatedIds?: string[];
  unlockCondition?: UnlockCondition;
};

export type HypothesisQuestion = {
  id: string;
  code: string;
  question: string;
  hint: string;
  acceptedKeywords: string[];
  solvedTitle: string;
  solvedContent: string;
  sourceEvidenceId?: string;
  unlockCondition?: UnlockCondition;
};

export type ForensicRecord = {
  title: string;
  record: string;
  classification: string;
  unlockedEvidenceId?: string;
};

export type TerminalQuery = {
  id: string;
  command: string;
  aliases: string[];
  responseText: string;
  isCritical?: boolean;
  unlockedByDefault?: boolean;
  unlockCondition?: UnlockCondition;
};

export type CaseTerminalConfig = {
  systemHeader?: string;
  description?: string;
  searchExamples?: string[];
  questions?: HypothesisQuestion[];
  databaseIndex?: Record<string, ForensicRecord>;
  queries?: TerminalQuery[];
  archiveUnlockCondition?: UnlockCondition;
};

export type StartingClue = {
  evidenceId: string;
  title: string;
  subtitle: string;
};

export type CaseIntroConfig = {
  investigator?: string;
  dateOpened?: string;
  lead?: string;
  details?: string;
  startingClues?: StartingClue[];
};

export type Contradiction = {
  title: string;
  text: string;
};

export type CaseFile = {
  id: string;
  number: string;
  archiveCode?: string;
  title: string;
  status: CaseStatus;
  cover?: string;
  summary: string;
  documents: CaseDocument[];
  notes: CaseNote[];
  timeline: TimelineEntry[];
  callLog?: {
    subject: string;
    rows: CallLogRow[];
    pin?: string;
    highlightedNumber?: string;
  };
  people?: CasePerson[];
  relations?: EvidenceRelation[];
  locations?: Location[];
  intro?: CaseIntroConfig;
  contradictions?: Contradiction[];
  terminal?: CaseTerminalConfig;
  interviews?: Interview[];
  deductions?: DeductionRule[];
  deductionRebuttals?: DeductionRebuttal[];
  uiTexts?: Record<string, string>;
  archive?: Array<any>;
};

import { getCaseById, getAllCases, uiTexts, archiveCases } from '@/lib/cases/loader';
export { getCaseById, getAllCases, uiTexts, archiveCases };

export const cases: CaseFile[] = getAllCases();


export type NewsItem = {
  id: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
};

export const news: NewsItem[] = [
  { id: 'n1', date: '28.08', tag: 'Обновление архива', title: 'Открыто дело №003 «Пепел и бумаги»', excerpt: 'Добавлены акт о пожаре, список утраченных дел и семь фотографий с места.' },
  { id: 'n2', date: '14.08', tag: 'Материалы', title: 'В дело №001 добавлена аудиозапись с автоответчика', excerpt: '47 секунд шума и один голос, который эксперты не смогли идентифицировать.' },
  { id: 'n3', date: '02.08', tag: 'Город', title: 'На карте появились две новые локации', excerpt: 'Старый порт и отель «Волга» доступны для изучения.' },
  { id: 'n4', date: '19.07', tag: 'Система', title: 'Заметки Орлова теперь открываются постепенно', excerpt: 'Часть записей заблокирована до продвижения по материалам дела.' },
];

export const detective = {
  name: 'Максим Орлов',
  age: '27 лет',
  role: 'Следователь',
  department: 'Следственный отдел по району',
  experience: '1 год 8 месяцев',
  specialization: 'Проверка первичных материалов, осмотр места происшествия, розыск без вести пропавших',
  bio: 'Молодой следователь районного отдела. Недавно приступил к самостоятельной работе после выпуска и первоначальной подготовки. Внимателен, аккуратен с протоколами, скрупулёзно перепроверяет каждую нестыковку. Не строит из себя гения, иногда ошибается и учится непосредственно в ходе расследования. Дело №001 — его первое крупное самостоятельное производство.',
  quote: 'Если факты не сходятся, значит, я упустил какую-то деталь. Нужно перепроверить снова.',
  extra: [
    'Тщательно фиксирует хронологию и поминутные интервалы между звонками.',
    'Склонен перепроверять показания свидетелей по официальным реестрам и биллингу.',
    'Не обладает высоким авторитетом среди руководства, поэтому опирается только на задокументированные факты.',
  ],
};

export function getCase(id: string): CaseFile | null {
  return getCaseById(id);
}
