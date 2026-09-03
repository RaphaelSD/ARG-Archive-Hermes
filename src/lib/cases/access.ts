import { prisma } from '@/lib/db/prisma';

export async function getCaseAccessForUser(userId: number, caseId: number) {
  return prisma.caseAccess.findUnique({
    where: {
      userId_caseId: {
        userId,
        caseId,
      },
    },
  });
}

export async function getAvailableCases(userId: number) {
  return prisma.caseAccess.findMany({
    where: { userId },
    include: { case: true },
    orderBy: { createdAt: 'asc' },
  });
}
