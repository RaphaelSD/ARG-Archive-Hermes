import { prisma } from '@/lib/db/prisma';

export async function getProgressForUser(userId: number, caseId: number) {
  return prisma.gameProgress.findUnique({
    where: {
      userId_caseId: {
        userId,
        caseId,
      },
    },
  });
}

export async function updateProgress(userId: number, caseId: number, progress: number) {
  return prisma.gameProgress.upsert({
    where: {
      userId_caseId: {
        userId,
        caseId,
      },
    },
    update: {
      progress,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      caseId,
      progress,
      openedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
}
