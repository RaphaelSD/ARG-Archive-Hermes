import type {
  CaseDocument,
  CaseFile,
  CaseNote,
  CaseStatus,
  TimelineEntry,
} from '@/lib/archive-data';
import { prisma } from '@/lib/db/prisma';

type BackendDocument = {
  id: number;
  caseId: number;
  title: string;
  kind: string;
  content: string | null;
  createdAt: Date;
};

type ArchiveCaseAdapterResult = CaseFile & {
  backendId: number;
  accessStatus?: string;
  progress?: number;
  mapPoints: Awaited<ReturnType<typeof prisma.mapPoint.findMany>>;
  evidence: Awaited<ReturnType<typeof prisma.evidenceItem.findMany>>;
  calls: Awaited<ReturnType<typeof prisma.call.findMany>>;
  unsupportedDocuments: BackendDocument[];
  caseAccess?: Awaited<ReturnType<typeof prisma.caseAccess.findFirst>>;
  gameProgress?: Awaited<ReturnType<typeof prisma.gameProgress.findFirst>>;
};

const sourceDocumentKinds = new Set<CaseDocument['kind']>([
  'document',
  'photo',
  'audio',
  'note',
  'map',
]);

function getCaseNumber(slug: string) {
  const match = slug.match(/^case-(\d+)$/);
  return `Дело №${match?.[1] ?? slug}`;
}

function mapCaseStatus(status: string): CaseStatus {
  if (status === 'unlocked') {
    return 'open';
  }

  if (status === 'closed') {
    return 'closed';
  }

  return 'locked';
}

function getCover(slug: string) {
  const match = slug.match(/^case-(00[1-3])$/);
  return match ? `/images/case-${match[1]}.jpg` : undefined;
}

function mapDocumentKind(kind: string): CaseDocument['kind'] | undefined {
  if (sourceDocumentKinds.has(kind as CaseDocument['kind'])) {
    return kind as CaseDocument['kind'];
  }

  if (kind === 'report' || kind === 'statement') {
    return 'document';
  }

  return undefined;
}

function mapDocuments(documents: BackendDocument[]) {
  const unsupportedDocuments: BackendDocument[] = [];
  const mappedDocuments: CaseDocument[] = [];

  for (const document of documents) {
    const kind = mapDocumentKind(document.kind);

    if (!kind) {
      unsupportedDocuments.push(document);
      continue;
    }

    mappedDocuments.push({
      id: String(document.id),
      title: document.title,
      kind,
    });
  }

  return { mappedDocuments, unsupportedDocuments };
}

function mapNotes(
  notes: Array<{ id: number; author: string; body: string }>,
): CaseNote[] {
  return notes.map((note, index) => ({
    id: String(note.id),
    title: `Заметка #${index + 1}`,
    body: note.body.split(/\r?\n/),
  }));
}

export async function getArchiveCaseBySlug(
  slug: string,
  userId?: number,
): Promise<ArchiveCaseAdapterResult | null> {
  const item = await prisma.case.findUnique({
    where: { slug },
    include: {
      documents: true,
      notes: true,
      calls: true,
      mapPoints: true,
      evidence: true,
      caseAccess: true,
      gameProgress: true,
    },
  });

  if (!item) {
    return null;
  }

  const { mappedDocuments, unsupportedDocuments } = mapDocuments(item.documents);
  const userAccess = userId === undefined
    ? undefined
    : item.caseAccess.find((access) => access.userId === userId);
  const userProgress = userId === undefined
    ? undefined
    : item.gameProgress.find((progress) => progress.userId === userId);

  const timeline: TimelineEntry[] = [];

  return {
    id: item.slug,
    backendId: item.id,
    number: getCaseNumber(item.slug),
    title: item.title,
    status: mapCaseStatus(item.status),
    cover: getCover(item.slug),
    summary: item.description ?? '',
    documents: mappedDocuments,
    notes: mapNotes(item.notes),
    timeline,
    mapPoints: item.mapPoints,
    evidence: item.evidence,
    calls: item.calls,
    unsupportedDocuments,
    accessStatus: userAccess?.status,
    progress: userProgress?.progress,
    caseAccess: userAccess,
    gameProgress: userProgress,
  };
}
