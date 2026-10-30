import { createHmac, randomInt, timingSafeEqual } from 'crypto';

import { prisma } from '@/lib/db/prisma';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown) {
  const email = String(value ?? '').trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : null;
}

function getCodeSecret() {
  const secret = process.env.AUTH_CODE_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_CODE_SECRET is not set');
  }
  return secret ?? 'arg-archive-dev-secret';
}

function hashCode(email: string, code: string) {
  return createHmac('sha256', getCodeSecret())
    .update(`${email}:${code}`)
    .digest('hex');
}

export type IssueCodeResult = { ok: true; code: string } | { ok: false; retryAfterSec: number };

export async function issueLoginCode(email: string): Promise<IssueCodeResult> {
  const now = Date.now();
  const recent = await prisma.emailLoginCode.findMany({
    where: { email, createdAt: { gt: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const last = recent[0]?.createdAt.getTime();
  if (last && now - last < RESEND_INTERVAL_MS) {
    return { ok: false, retryAfterSec: Math.ceil((RESEND_INTERVAL_MS - (now - last)) / 1000) };
  }
  if (recent.length >= MAX_CODES_PER_HOUR) {
    const oldest = recent[recent.length - 1].createdAt.getTime();
    return { ok: false, retryAfterSec: Math.ceil((oldest + 60 * 60 * 1000 - now) / 1000) };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.$transaction([
    prisma.emailLoginCode.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date(now) },
    }),
    prisma.emailLoginCode.create({
      data: { email, codeHash: hashCode(email, code), expiresAt: new Date(now + CODE_TTL_MS) },
    }),
  ]);

  return { ok: true, code };
}

export async function revokeLoginCodes(email: string) {
  await prisma.emailLoginCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export async function verifyLoginCode(email: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;

  const record = await prisma.emailLoginCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record || record.attempts >= MAX_ATTEMPTS) return false;

  const expected = new Uint8Array(Buffer.from(record.codeHash, 'hex'));
  const actual = new Uint8Array(Buffer.from(hashCode(email, code), 'hex'));
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.emailLoginCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  const consumed = await prisma.emailLoginCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1;
}
