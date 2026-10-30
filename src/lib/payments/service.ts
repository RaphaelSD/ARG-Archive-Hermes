import type { Payment } from '@prisma/client';

import { getCase } from '@/lib/archive-data';
import { prisma } from '@/lib/db/prisma';
import { normalizeCaseId } from '@/lib/payments/config';
import { getYooKassaPayment, kopecksToValue } from '@/lib/payments/yookassa';

export async function ensureCaseRecord(caseId: string) {
  const id = normalizeCaseId(caseId);
  const slug = `case-${id}`;
  const existing = await prisma.case.findUnique({ where: { slug } });
  if (existing) return existing;

  const canonical = getCase(id);
  const season = await prisma.season.upsert({
    where: { slug: 'season-1' },
    update: {},
    create: { slug: 'season-1', title: 'Season 1' },
  });

  return prisma.case.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      seasonId: season.id,
      number: canonical?.number,
      title: canonical?.title ?? slug,
      description: canonical?.summary,
      status: 'unlocked',
      order: Number.parseInt(id, 10) || 0,
    },
  });
}

export async function grantCaseAccess(userId: number, caseId: string) {
  const dbCase = await ensureCaseRecord(caseId);
  return prisma.caseAccess.upsert({
    where: { userId_caseId: { userId, caseId: dbCase.id } },
    update: { status: 'unlocked', startedAt: new Date() },
    create: { userId, caseId: dbCase.id, status: 'unlocked', startedAt: new Date() },
  });
}

export async function hasCaseAccess(userId: number, caseId: string) {
  const slug = `case-${normalizeCaseId(caseId)}`;
  const access = await prisma.caseAccess.findFirst({
    where: { userId, case: { slug } },
  });
  return access?.status === 'unlocked';
}

export async function markPaymentSucceeded(payment: Payment) {
  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: 'succeeded' } },
    data: { status: 'succeeded', paidAt: new Date() },
  });

  const dbCase = await prisma.case.findUniqueOrThrow({ where: { id: payment.caseId } });
  await grantCaseAccess(payment.userId, dbCase.slug);

  return updated.count > 0;
}

export async function markPaymentCanceled(payment: Payment) {
  await prisma.payment.updateMany({
    where: { id: payment.id, status: 'pending' },
    data: { status: 'canceled' },
  });
}

// Статус берётся из API ЮKassa, а не из тела уведомления, чтобы подделанный запрос не открыл доступ.
export async function syncPayment(payment: Payment): Promise<Payment> {
  if (payment.status !== 'pending' || payment.provider !== 'yookassa' || !payment.providerPaymentId) {
    return payment;
  }

  const remote = await getYooKassaPayment(payment.providerPaymentId);
  const amountMatches =
    remote.amount.value === kopecksToValue(payment.amount) && remote.amount.currency === payment.currency;

  if (remote.status === 'succeeded' && remote.paid && amountMatches) {
    await markPaymentSucceeded(payment);
  } else if (remote.status === 'canceled') {
    await markPaymentCanceled(payment);
  }

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}
