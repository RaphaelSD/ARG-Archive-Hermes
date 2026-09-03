import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CasePageClient } from './CasePageClient';
import { getCase } from '@/lib/archive-data';
import { getSessionUser } from '@/lib/auth/session';
import { getArchiveCaseBySlug } from '@/lib/cases/adapter';

type Props = { params: { caseId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getCase(params.caseId);

  if (!item || item.status === 'locked') {
    return {
      title: 'Дело недоступно — Архив города Н.',
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

  if (!user) {
    notFound();
  }

  const backendSlug = `case-${params.caseId}`;
  const item = await getArchiveCaseBySlug(backendSlug, user.id);

  if (!item || item.status === 'locked' || item.accessStatus !== 'unlocked') {
    notFound();
  }

  return <CasePageClient item={item} />;
}
