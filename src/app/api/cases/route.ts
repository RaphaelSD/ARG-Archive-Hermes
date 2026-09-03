import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const season = await prisma.season.findFirst({
    where: { slug: 'season-1' },
    include: {
      cases: {
        orderBy: { order: 'asc' },
      },
    },
  });

  const caseAccess = await prisma.caseAccess.findMany({
    where: { userId: user.id },
  });

  const progressRows = await prisma.gameProgress.findMany({
    where: { userId: user.id },
  });

  const byCaseId = new Map(caseAccess.map((item) => [item.caseId, item]));
  const progressByCaseId = new Map(progressRows.map((item) => [item.caseId, item.progress]));

  const cases = (season?.cases ?? []).map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    status: item.status,
    accessStatus: byCaseId.get(item.id)?.status ?? 'locked',
    progress: byCaseId.get(item.id) ? progressByCaseId.get(item.id) ?? 0 : 0,
  }));

  return NextResponse.json({ cases });
}
