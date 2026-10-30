import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isMockPaymentEnabled } from '@/lib/payments/config';
import { markPaymentCanceled, markPaymentSucceeded } from '@/lib/payments/service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { paymentId: string } }) {
  if (!isMockPaymentEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: params.paymentId } });
  if (!payment || payment.userId !== user.id || payment.provider !== 'mock') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (payment.status !== 'pending') {
    return NextResponse.json({ status: payment.status });
  }

  const body = await request.json().catch(() => null);
  if (body?.action === 'succeed') {
    await markPaymentSucceeded(payment);
  } else if (body?.action === 'cancel') {
    await markPaymentCanceled(payment);
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const updated = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  return NextResponse.json({ status: updated.status });
}
