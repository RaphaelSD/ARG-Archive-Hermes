import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CasePageClient } from './CasePageClient';
import { CaseLockedView } from '@/components/case-locked-view';
import { getCase } from '@/lib/archive-data';
import { getSessionUser } from '@/lib/auth/session';
import { getArchiveCaseBySlug } from '@/lib/cases/adapter';
import { isDemoAllowedForCase } from '@/lib/cases/loader';

type Props = { params: { caseId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getCase(params.caseId);

  if (!item) {
    return {
      title: 'Дело не найдено — Архив города Н.',
      robots: { index: false },
    };
  }

  if (item.status === 'locked') {
    return {
      title: `Доступ ограничен: ${item.number} — Архив города Н.`,
      robots: { index: false },
    };
  }

  const title = `${item.number}: ${item.title} — Архив города Н.`;
  return {
    title,
    description: item.summary,
    openGraph: {
      title,
      description: item.summary,
    },
  };
}

export default async function CasePage({ params }: Props) {
  const user = await getSessionUser();
  const caseId = params.caseId.replace(/^case-/, '');
  const isDevMode = process.env.NODE_ENV === 'development';
  const isDemoAllowed = isDemoAllowedForCase(caseId) || isDevMode;

  const backendSlug = `case-${caseId}`;
  const item = await getArchiveCaseBySlug(backendSlug, user?.id);

  // If case does not exist in the archive at all: genuine 404
  if (!item) {
    notFound();
  }

  // In dev environment: grant full access to inspect materials without barriers
  if (isDevMode) {
    return <CasePageClient item={{ ...item, status: 'open' }} isGuest={!user} />;
  }

  // If case is locked or user has no clearance: show archival restricted access screen / teaser
  if (item.status === 'locked' || (item.accessStatus !== 'unlocked' && !isDemoAllowed)) {
    return <CaseLockedView item={item} isGuest={!user} />;
  }

  return <CasePageClient item={item} isGuest={!user} />;
}
