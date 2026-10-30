import { NextResponse } from 'next/server';

import { getCase } from '@/lib/archive-data';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getActivePaymentProvider, getCasePriceRub, normalizeCaseId } from '@/lib/payments/config';
import { ensureCaseRecord, hasCaseAccess } from '@/lib/payments/service';
import { createYooKassaPayment } from '@/lib/payments/yookassa';

export const dynamic = 'force-dynamic';

function getAppOrigin(request: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const caseId = normalizeCaseId(String(body?.caseId ?? ''));
  const canonical = getCase(caseId);
  const priceRub = getCasePriceRub(caseId);

  if (!canonical || !priceRub) {
    return NextResponse.json({ error: 'Это дело недоступно для покупки' }, { status: 400 });
  }

  if (await hasCaseAccess(user.id, caseId)) {
    return NextResponse.json({ alreadyUnlocked: true, redirectUrl: `/cases/${caseId}` });
  }

  const provider = getActivePaymentProvider();
  if (!provider) {
    return NextResponse.json({ error: 'Оплата временно недоступна' }, { status: 503 });
  }

  const dbCase = await ensureCaseRecord(caseId);
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      caseId: dbCase.id,
      amount: priceRub * 100,
      provider,
    },
  });

  if (provider === 'mock') {
    const confirmationUrl = `/payments/mock?id=${payment.id}`;
    await prisma.payment.update({ where: { id: payment.id }, data: { confirmationUrl } });
    return NextResponse.json({ confirmationUrl });
  }

  try {
    const remote = await createYooKassaPayment({
      amountKopecks: payment.amount,
      description: `Доступ к материалам: ${canonical.number} «${canonical.title}»`,
      returnUrl: `${getAppOrigin(request)}/payments/return?id=${payment.id}`,
      idempotenceKey: payment.id,
      metadata: { paymentId: payment.id, userId: String(user.id), caseId },
    });

    const confirmationUrl = remote.confirmation?.confirmation_url;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: remote.id, confirmationUrl },
    });

    if (!confirmationUrl) {
      throw new Error('YooKassa did not return confirmation_url');
    }

    return NextResponse.json({ confirmationUrl });
  } catch (error) {
    console.error('Failed to create YooKassa payment', error);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    return NextResponse.json({ error: 'Не удалось создать платёж. Попробуйте позже.' }, { status: 502 });
  }
}
