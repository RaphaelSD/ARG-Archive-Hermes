import { NextResponse } from 'next/server';

import { issueLoginCode, normalizeEmail, revokeLoginCodes } from '@/lib/auth/email-code';
import { isDevCodeDisplayEnabled, isMailConfigured, sendLoginCodeEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: 'Укажите корректный email' }, { status: 400 });
  }
  if (body?.consent !== true) {
    return NextResponse.json({ error: 'Нужно согласие на обработку персональных данных' }, { status: 400 });
  }

  const mailReady = isMailConfigured();
  const showDevCode = !mailReady && isDevCodeDisplayEnabled();
  if (!mailReady && !showDevCode) {
    return NextResponse.json({ error: 'Вход временно недоступен' }, { status: 503 });
  }

  const result = await issueLoginCode(email);
  if (!result.ok) {
    return NextResponse.json(
      { error: `Код уже отправлен. Повторить можно через ${result.retryAfterSec} с`, retryAfterSec: result.retryAfterSec },
      { status: 429 }
    );
  }

  if (showDevCode) {
    return NextResponse.json({ ok: true, devCode: result.code });
  }

  try {
    await sendLoginCodeEmail(email, result.code);
  } catch (error) {
    console.error('[auth] failed to send login code', error);
    await revokeLoginCodes(email);
    return NextResponse.json({ error: 'Не удалось отправить письмо. Попробуйте позже' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
