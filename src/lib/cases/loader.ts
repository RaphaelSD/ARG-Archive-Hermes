import type {
  CaseFile,
  CaseDocument,
  CaseNote,
  CallLogRow,
  CasePerson,
  TimelineEntry,
  EvidenceRelation,
  CaseTerminalConfig,
  Interview,
  DeductionRule,
  DeductionRebuttal,
  Location,
} from '@/lib/archive-data';
import { locations } from '@/lib/locations-data';

// Import Case 001 structured content from content/cases/case-001/
import case001Meta from '../../../content/cases/case-001/case.json';
import case001Docs from '../../../content/cases/case-001/documents.json';
import case001Calls from '../../../content/cases/case-001/calls.json';
import case001People from '../../../content/cases/case-001/people.json';
import case001Timeline from '../../../content/cases/case-001/timeline.json';
import case001Relations from '../../../content/cases/case-001/relations.json';
import case001Terminal from '../../../content/cases/case-001/terminal.json';
import case001Interviews from '../../../content/cases/case-001/interviews.json';
import case001Deductions from '../../../content/cases/case-001/deductions.json';
import case001Locations from '../../../content/cases/case-001/locations.json';
import case001UITexts from '../../../content/cases/case-001/ui_texts.json';
import case001Archive from '../../../content/cases/case-001/archive.json';

export const uiTexts = case001UITexts as Record<string, string>;
export const archiveCases = case001Archive as Array<any>;

export const DEMO_CASE_IDS = new Set(['001']);

export function isDemoAllowedForCase(caseId: string): boolean {
  // Global check: in development environment, full access is always granted
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  const normalizedId = caseId.replace(/^case-/, '');
  return DEMO_CASE_IDS.has(normalizedId);
}

// Build unified CaseFile for Case 001 with flexible schema adaptation
const meta = case001Meta as Record<string, any>;
const rawDocs = (Array.isArray(case001Docs) ? case001Docs : []) as Array<Record<string, any>>;
const rawLocations = (Array.isArray(case001Locations) ? case001Locations : []) as Array<Record<string, any>>;

export const case001: CaseFile = {
  id: meta.id ?? '001',
  number: meta.number ?? 'Дело №001',
  archiveCode: meta.archiveCode ?? 'АРХ-001 / 2009-К12',
  title: meta.title ?? 'Комната 12',
  status: (meta.status?.toLowerCase() === 'closed' ? 'closed' : meta.status?.toLowerCase() === 'locked' ? 'locked' : 'open') as CaseFile['status'],
  cover: meta.cover ?? '/images/case-001.jpg',
  summary: meta.summary ?? '',
  intro: meta.intro ?? {
    investigator: meta.investigator ?? 'М. Орлов',
    dateOpened: meta.dateOpened ?? '17.05.2009',
    lead: meta.summary ?? '',
    startingClues: Array.isArray(meta.startingClues)
      ? meta.startingClues.map((c: any) =>
          typeof c === 'string'
            ? {
                evidenceId: c,
                title: c,
                subtitle: `Материал ${c}`,
              }
            : c
        )
      : [],
  },
  contradictions: Array.isArray(meta.contradictions)
    ? meta.contradictions.map((c: any) =>
        typeof c === 'string'
          ? { title: 'Противоречие в материалах', text: c }
          : c
      )
    : [],
  notes: Array.isArray(meta.notes)
    ? meta.notes.map((n: any, idx: number) => ({
        id: n.id ?? `n${idx + 1}`,
        title: n.title ?? `Заметка #${idx + 1}`,
        body: Array.isArray(n.body) ? n.body : n.text ? [n.text] : [],
        locked: n.unlockedByDefault === false || n.locked === true,
        unlockCondition: n.unlockCondition
          ? {
              type: n.unlockCondition.type,
              ...(n.unlockCondition.targetId ? {
                evidenceId: n.unlockCondition.targetId,
                hotspotId: n.unlockCondition.targetId,
                locationId: n.unlockCondition.targetId,
                questionId: n.unlockCondition.targetId,
                targetId: n.unlockCondition.targetId,
              } : {}),
              ...n.unlockCondition,
            }
          : n.unlockedByDefault === false
          ? undefined
          : { type: 'ALWAYS' as const },
      }))
    : [],
  documents: rawDocs.map((doc: any) => ({
    id: doc.id,
    archiveId: doc.archiveId ?? `АРХ-${doc.id}`,
    title: doc.title,
    kind: (doc.kind ?? (doc.type === 'photo' ? 'photo' : 'document')) as CaseDocument['kind'],
    date: doc.date,
    source: doc.source,
    meta: doc.meta ?? doc.description,
    content: doc.content,
    mediaUrl: doc.mediaUrl ?? (doc.type === 'photo' || doc.kind === 'photo' ? doc.content : undefined),
    duration: doc.duration,
    locationId: doc.locationId,
    personIds: doc.personIds ?? [],
    relatedIds: doc.relatedIds ?? [],
    notes: doc.notes,
    transcript: doc.transcript,
    unlockCondition: doc.unlockCondition
      ? {
          type: doc.unlockCondition.type,
          ...(doc.unlockCondition.targetId ? {
            evidenceId: doc.unlockCondition.targetId,
            hotspotId: doc.unlockCondition.targetId,
            locationId: doc.unlockCondition.targetId,
            questionId: doc.unlockCondition.targetId,
            targetId: doc.unlockCondition.targetId,
          } : {}),
          ...doc.unlockCondition,
        }
      : doc.unlockedByDefault === false
      ? undefined
      : { type: 'ALWAYS' as const },
    hotspots: Array.isArray(doc.hotspots)
      ? doc.hotspots.map((hs: any) => ({
          id: hs.id,
          title: hs.label ?? hs.title ?? hs.id,
          description: hs.description ?? hs.systemMessage ?? '',
          x: hs.x > 1 ? hs.x / 100 : hs.x,
          y: hs.y > 1 ? hs.y / 100 : hs.y,
          width: hs.width > 1 ? hs.width / 100 : hs.width,
          height: hs.height > 1 ? hs.height / 100 : hs.height,
          resultEvidenceId: hs.resultEvidenceId,
        }))
      : undefined,
  })),
  callLog: {
    subject: (case001Calls as any).subject ?? 'Детализация телефонных звонков (Биллинг базовой станции)',
    pin: (case001Calls as any).pin ?? 'ОВР-БИЛЛИНГ',
    highlightedNumber: (case001Calls as any).highlightedNumber ?? '+1 (555) 382-91-04',
    rows: (Array.isArray(case001Calls)
      ? case001Calls
      : Array.isArray((case001Calls as any).rows)
      ? (case001Calls as any).rows
      : []
    ).map((row: any) => ({
      id: row.id,
      date: row.date ?? (row.time && row.time < '06:00' ? '17.05' : '16.05'),
      time: row.time,
      number: row.number,
      duration: row.duration,
      type: row.type ?? (row.direction === 'INCOMING' ? 'Входящий' : row.direction === 'OUTGOING' ? 'Исходящий' : row.direction ?? 'Вызов'),
      direction: row.direction,
      status: row.status,
      flagged: row.flagged ?? (row.status === 'SUSPICIOUS' || row.status === 'CRITICAL'),
      caller: row.caller,
      recipient: row.recipient,
      participants: row.participants ?? [row.caller, row.recipient].filter(Boolean),
      summary: row.summary,
      transcript: row.transcript,
      relatedIds: row.relatedIds ?? [],
    })) as CallLogRow[],
  },
  people: (Array.isArray(case001People) ? case001People : []).map((p: any) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    role: p.role,
    description: p.description,
    phone: p.phone,
    relatedEvidenceIds: p.linkedEvidence ?? p.relatedEvidenceIds ?? [],
  })) as CasePerson[],
  timeline: (Array.isArray(case001Timeline) ? case001Timeline : []).map((t: any) => ({
    id: t.id,
    date: t.date ?? (t.time && t.time < '06:00' ? '17.05' : '16.05'),
    time: t.time,
    text: t.event ?? t.text ?? '',
    event: t.event ?? t.text ?? '',
    sourceId: t.sourceId,
    sourceTitle: t.sourceTitle,
    unlockedByDefault: t.unlockedByDefault,
    unlockCondition: t.unlockCondition
      ? {
          type: t.unlockCondition.type,
          ...(t.unlockCondition.targetId ? {
            evidenceId: t.unlockCondition.targetId,
            hotspotId: t.unlockCondition.targetId,
            locationId: t.unlockCondition.targetId,
            questionId: t.unlockCondition.targetId,
            targetId: t.unlockCondition.targetId,
          } : {}),
          ...t.unlockCondition,
        }
      : t.unlockedByDefault === false
      ? undefined
      : { type: 'ALWAYS' as const },
  })) as TimelineEntry[],
  relations: (Array.isArray(case001Relations) ? case001Relations : []).map((r: any) => ({
    id: r.id,
    fromId: r.fromId ?? r.sourceId ?? '',
    toId: r.toId ?? r.targetId ?? '',
    sourceId: r.sourceId ?? r.fromId,
    targetId: r.targetId ?? r.toId,
    label: r.label,
    type: r.type,
    unlockedByDefault: r.unlockedByDefault,
    unlockCondition: r.unlockCondition
      ? {
          ...(r.unlockCondition.targetId ? {
            evidenceId: r.unlockCondition.targetId,
            locationId: r.unlockCondition.targetId,
            questionId: r.unlockCondition.targetId,
            targetId: r.unlockCondition.targetId,
          } : {}),
          ...r.unlockCondition,
        }
      : r.unlockedByDefault === false
      ? undefined
      : { type: 'ALWAYS' as const },
  })) as EvidenceRelation[],
  interviews: (Array.isArray(case001Interviews) ? case001Interviews : []).map((it: any) => ({
    id: it.id,
    personId: it.personId,
    title: it.title,
    role: it.role ?? 'Свидетель / Фигурант',
    avatarUrl: it.avatarUrl,
    introduction: it.introduction ?? '',
    unlockedByDefault: it.unlockedByDefault,
    questions: (Array.isArray(it.questions) ? it.questions : []).map((q: any) => ({
      id: q.id,
      text: q.text,
      answer: q.answer,
      unlockCondition: q.unlockCondition,
      unlockedEvidenceId: q.unlockedEvidenceId,
      clueReactions: q.clueReactions,
      defaultIrrelevantReaction: q.defaultIrrelevantReaction,
    })),
    clueReactions: Array.isArray(it.clueReactions)
      ? it.clueReactions.map((r: any) => ({
          clueId: r.clueId,
          reactionText: r.reactionText ?? r.reaction ?? '',
          reaction: r.reaction ?? r.reactionText,
          unlocksQuestionId: r.unlocksQuestionId,
          unlocksEvidenceId: r.unlocksEvidenceId,
        }))
      : undefined,
    unlockCondition: it.unlockCondition
      ? {
          type: it.unlockCondition.type,
          ...(it.unlockCondition.targetId ? {
            evidenceId: it.unlockCondition.targetId,
            hotspotId: it.unlockCondition.targetId,
            locationId: it.unlockCondition.targetId,
            questionId: it.unlockCondition.targetId,
            targetId: it.unlockCondition.targetId,
          } : {}),
          ...it.unlockCondition,
        }
      : it.unlockedByDefault === false
      ? undefined
      : { type: 'ALWAYS' as const },
  })) as Interview[],
  deductions: (Array.isArray(case001Deductions) ? case001Deductions : []).map((d: any) => ({
    id: d.id,
    title: d.title,
    clueIds: d.clueIds ?? d.cluePair ?? [],
    conclusion: d.conclusion,
    resultEvidenceId: d.resultEvidenceId,
    unlockCondition: d.unlockCondition
      ? {
          type: d.unlockCondition.type,
          ...(d.unlockCondition.targetId ? {
            evidenceId: d.unlockCondition.targetId,
            hotspotId: d.unlockCondition.targetId,
            locationId: d.unlockCondition.targetId,
            questionId: d.unlockCondition.targetId,
            targetId: d.unlockCondition.targetId,
          } : {}),
          ...d.unlockCondition,
        }
      : d.unlockedByDefault === false
      ? undefined
      : { type: 'ALWAYS' as const },
  })) as DeductionRule[],
  deductionRebuttals: Array.isArray(meta.deductionRebuttals)
    ? meta.deductionRebuttals.map((r: any) => ({
        clueIds: r.cluePair ?? r.clueIds ?? [],
        rebuttal: r.message ?? r.rebuttal ?? '',
      }))
    : [],
  locations: rawLocations.map((loc: any) => ({
    id: loc.id,
    name: loc.title ?? loc.name ?? loc.id,
    x: loc.coordinates?.x ?? loc.x ?? 50,
    y: loc.coordinates?.y ?? loc.y ?? 50,
    explored: loc.exploredByDefault ?? loc.explored ?? false,
    description: loc.description ?? '',
    address: loc.address,
    relatedEvidenceIds: loc.linkedEvidenceId
      ? [loc.linkedEvidenceId]
      : loc.relatedEvidenceIds ?? [],
    relatedPeople: loc.relatedPeople ?? [],
    unlockCondition: loc.unlockCondition
      ? {
          type: loc.unlockCondition.type,
          ...(loc.unlockCondition.targetId ? {
            evidenceId: loc.unlockCondition.targetId,
            hotspotId: loc.unlockCondition.targetId,
            locationId: loc.unlockCondition.targetId,
            questionId: loc.unlockCondition.targetId,
            targetId: loc.unlockCondition.targetId,
          } : {}),
          ...loc.unlockCondition,
        }
      : loc.exploredByDefault === false && !loc.unlockCondition
      ? undefined
      : { type: 'ALWAYS' as const },
    scene: loc.scene ?? (loc.findings ? {
      locationId: loc.id,
      sceneTitle: loc.title ?? loc.name ?? loc.id,
      sceneDescription: loc.description ?? '',
      findings: loc.findings ?? [],
      unlockedEvidenceIds: loc.linkedEvidenceId ? [loc.linkedEvidenceId] : [],
    } : undefined),
  })),
  terminal: {
    systemHeader: 'СЛУЖЕБНЫЙ ТЕРМИНАЛ ОВР // АРХИВ-СВЯЗЬ v2.0',
    description: 'Поисковый модуль следственного терминала отдела внутренних расследований. Вводите ключевые слова, сигнатуры или команды поиска для сверки с архивной базой данных ОВР.',
    searchExamples: ['ЗЕРКАЛО', 'ТКАНЬ', 'ЧАСЫ', '03:00', 'КОЛЬЦО', 'ПАТТЕРН', 'СЕРИЯ'],
    questions: Array.isArray(case001Terminal) ? [] : (case001Terminal as any).questions ?? [],
    databaseIndex: Array.isArray(case001Terminal) ? {} : (case001Terminal as any).databaseIndex ?? {},
    queries: Array.isArray(case001Terminal)
      ? (case001Terminal as any[]).map((q) => ({
          id: q.id,
          command: q.command,
          aliases: q.aliases ?? [],
          responseText: q.responseText,
          isCritical: q.isCritical,
          unlockedByDefault: q.unlockedByDefault,
          unlockCondition: q.unlockCondition
            ? {
                type: q.unlockCondition.type,
                ...(q.unlockCondition.targetId ? {
                  evidenceId: q.unlockCondition.targetId,
                  hotspotId: q.unlockCondition.targetId,
                  locationId: q.unlockCondition.targetId,
                  questionId: q.unlockCondition.targetId,
                  targetId: q.unlockCondition.targetId,
                } : {}),
                ...q.unlockCondition,
              }
            : q.unlockedByDefault === false
            ? undefined
            : { type: 'ALWAYS' as const },
        }))
      : [],
    archiveUnlockCondition: {
      type: 'EVIDENCE_VIEWED',
      targetId: 'note_trophy',
    },
  },
  uiTexts: case001UITexts as Record<string, string>,
  archive: case001Archive as Array<any>,
};

// Registered cases catalog (Case 001 loaded from content/, 002-005 stubs for subsequent stages)
const caseCatalog: Record<string, CaseFile> = {
  '001': case001,
  '002': {
    id: '002',
    number: 'Дело №002',
    archiveCode: 'АРХ-002 / 2009-ОГ',
    title: 'Крыша Огонька',
    status: 'locked',
    cover: '/images/case-002.jpg',
    summary: 'Тело найдено на крыше бара, где Клара Вэнс провела свой последний вечер. Местные говорят о странных звуках, полиция списывает на несчастный случай. Требуется независимый анализ.',
    documents: [
      { id: 'd1', title: 'Заключение эксперта', kind: 'document', meta: '6 стр.' },
      { id: 'd2', title: 'Схема помещения', kind: 'map', meta: 'схема' },
      { id: 'd3', title: 'Фото с места', kind: 'photo', meta: '12 кадров' },
      { id: 'd4', title: 'Журнал дежурств', kind: 'document', meta: 'выписка' },
    ],
    notes: [
      { id: 'n1', title: 'Заметка #1', body: ['Свет в цехе горел. Сторож обходил склад с фонарём — зачем?', 'Кто-то был там до него.'] },
      { id: 'n2', title: 'Заметка #2', locked: true, body: ['Материал закрыт.'] },
    ],
    timeline: [
      { time: '03.09, 23:10', text: 'Начало смены.' },
      { time: '04.09, 01:40', text: 'Обрыв записи камеры у ворот.' },
      { time: '04.09, 06:20', text: 'Тело обнаружено сменщиком.' },
    ],
    contradictions: [],
  },
  '003': {
    id: '003',
    number: 'Дело №003',
    archiveCode: 'АРХ-003 / 2009-С',
    title: 'Пепел и бумаги',
    status: 'open',
    cover: '/images/case-003.jpg',
    summary: 'Пожар в архиве городской администрации уничтожил документы за 1998–2004 годы. Ровно те, что запрашивал Орлов.',
    documents: [
      { id: 'd1', title: 'Акт о пожаре', kind: 'document', meta: '3 стр.' },
      { id: 'd2', title: 'Список утраченных дел', kind: 'document', meta: '9 стр.' },
      { id: 'd3', title: 'Фото пепелища', kind: 'photo', meta: '7 кадров' },
    ],
    notes: [
      { id: 'n1', title: 'Заметка #1', body: ['Сгорело именно то, что я запрашивал за неделю до пожара.', 'Совпадений такого размера не бывает.'] },
    ],
    timeline: [
      { time: '21.11', text: 'Запрос Орлова в архив администрации.' },
      { time: '28.11, 04:12', text: 'Возгорание в правом крыле.' },
      { time: '29.11', text: 'Комиссия признаёт причиной неисправную проводку.' },
    ],
    contradictions: [],
  },
  '004': {
    id: '004',
    number: 'Дело №004',
    archiveCode: 'АРХ-004 / 2009-С',
    title: 'Тихая улица',
    status: 'locked',
    summary: 'Материалы засекречены.',
    documents: [],
    notes: [],
    timeline: [],
    contradictions: [],
  },
  '005': {
    id: '005',
    number: 'Дело №005',
    archiveCode: 'АРХ-005 / 2009-С',
    title: 'Тихая вода',
    status: 'locked',
    summary: 'Материалы засекречены.',
    documents: [],
    notes: [],
    timeline: [],
    contradictions: [],
  },
};

/**
 * Единый загрузчик дела по ID (например "001" или "case-001").
 * Возвращает унифицированный объект CaseFile.
 */
export function getCaseById(id: string): CaseFile | null {
  const normalizedId = id.replace(/^case-/, '');
  const caseFile = caseCatalog[normalizedId];
  if (!caseFile) {
    return null;
  }
  return caseFile;
}

/**
 * Получить список всех дел архива.
 */
export function getAllCases(): CaseFile[] {
  return Object.values(caseCatalog);
}
