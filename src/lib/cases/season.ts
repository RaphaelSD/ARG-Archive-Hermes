import { prisma } from '@/lib/db/prisma';

export async function getActiveSeason() {
  return prisma.season.findFirst({
    orderBy: { createdAt: 'asc' },
    include: {
      cases: {
        orderBy: { order: 'asc' },
      },
    },
  });
}
