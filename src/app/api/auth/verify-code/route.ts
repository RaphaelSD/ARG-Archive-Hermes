import { NextResponse } from 'next/server';

import { normalizeEmail, verifyLoginCode } from '@/lib/auth/email-code';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const code = String(body?.code ?? '').trim();

  if (!email || !(await verifyLoginCode(email, code))) {
    return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, consentAt: new Date() },
  });

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name ?? '', role: user.role },
  });
}
