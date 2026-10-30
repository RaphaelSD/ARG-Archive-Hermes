import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { isYooKassaConfigured } from '@/lib/payments/config';
import { syncPayment } from '@/lib/payments/service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isYooKassaConfigured()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const providerPaymentId = body?.object?.id;
  if (typeof providerPaymentId !== 'string') {
    return NextResponse.json({ ok: true });
  }

  const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  try {
    await syncPayment(payment);
  } catch (error) {
    console.error('Failed to sync YooKassa payment from webhook', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
