import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function safeParseJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const MAX_ITEMS = 500;
const MAX_ITEM_LENGTH = 200;
const MAX_NOTES = 200;
const MAX_NOTES_JSON_LENGTH = 200_000;

/** Оставляет только непустые короткие строки, убирает дубликаты и ограничивает размер массива. */
function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > MAX_ITEM_LENGTH) continue;
    result.add(trimmed);
    if (result.size >= MAX_ITEMS) break;
  }
  return Array.from(result);
}

function sanitizeNotes(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  const notes = value.slice(0, MAX_NOTES);
  try {
    return JSON.stringify(notes).length <= MAX_NOTES_JSON_LENGTH ? notes : [];
  } catch {
    return [];
  }
}

function normalizeSlug(rawCaseId: string): string {
  const trimmed = rawCaseId.trim();
  return trimmed.startsWith('case-') ? trimmed : `case-${trimmed}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();

    // 1 & 2. Guest user response
    if (!user) {
      return NextResponse.json({
        isGuest: true,
      });
    }

    // 3. Authenticated user: extract and validate caseId
    const { searchParams } = new URL(request.url);
    const rawCaseId = searchParams.get('caseId');

    if (!rawCaseId || typeof rawCaseId !== 'string' || !rawCaseId.trim()) {
      return NextResponse.json(
        { error: 'Параметр caseId обязателен' },
        { status: 400 }
      );
    }

    const cleanCaseId = rawCaseId.trim();
    const slug = normalizeSlug(cleanCaseId);

    // 4. Find Case in database
    const caseItem = await prisma.case.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!caseItem) {
      return NextResponse.json(
        { error: 'Дело не найдено' },
        { status: 404 }
      );
    }

    // 5 & 6. Find GameProgress for userId + caseId
    const progressRecord = await prisma.gameProgress.findUnique({
      where: {
        userId_caseId: {
          userId: user.id,
          caseId: caseItem.id,
        },
      },
    });

    if (!progressRecord) {
      return NextResponse.json({
        isGuest: false,
        caseId: cleanCaseId,
        progress: 0,
        solvedQuestions: [],
        notes: [],
        viewedEvidence: [],
        openedAt: null,
        lastSeenAt: null,
        completedAt: null,
      });
    }

    return NextResponse.json({
      isGuest: false,
      caseId: cleanCaseId,
      progress: progressRecord.progress,
      solvedQuestions: safeParseJsonArray<string>(progressRecord.solvedQuestions),
      notes: safeParseJsonArray(progressRecord.notesData),
      viewedEvidence: safeParseJsonArray<string>(progressRecord.viewedEvidence),
      openedAt: progressRecord.openedAt,
      lastSeenAt: progressRecord.lastSeenAt,
      completedAt: progressRecord.completedAt,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1 & 2. Authentication check
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // 3. Parse JSON body safely
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Некорректное тело запроса' },
        { status: 400 }
      );
    }

    // 4. Validate caseId
    const rawCaseId = body.caseId;
    if (!rawCaseId || typeof rawCaseId !== 'string' || !rawCaseId.trim()) {
      return NextResponse.json(
        { error: 'Поле caseId обязательно и должно быть строкой' },
        { status: 400 }
      );
    }

    const cleanCaseId = rawCaseId.trim();
    const slug = normalizeSlug(cleanCaseId);

    // 5 & 6. Find Case
    const caseItem = await prisma.case.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!caseItem) {
      return NextResponse.json(
        { error: 'Дело не найдено' },
        { status: 404 }
      );
    }

    // Sanitize fields
    const progress = typeof body.progress === 'number' && !Number.isNaN(body.progress)
      ? Math.min(100, Math.max(0, Math.round(body.progress)))
      : 0;

    const solvedQuestions = sanitizeStringArray(body.solvedQuestions);
    const notes = sanitizeNotes(body.notes);
    const viewedEvidence = sanitizeStringArray(body.viewedEvidence);

    const now = new Date();

    const existing = await prisma.gameProgress.findUnique({
      where: { userId_caseId: { userId: user.id, caseId: caseItem.id } },
      select: { completedAt: true },
    });

    // 7, 8 & 9. Upsert GameProgress by userId + caseId
    const saved = await prisma.gameProgress.upsert({
      where: {
        userId_caseId: {
          userId: user.id,
          caseId: caseItem.id,
        },
      },
      update: {
        progress,
        solvedQuestions: JSON.stringify(solvedQuestions),
        notesData: JSON.stringify(notes),
        viewedEvidence: JSON.stringify(viewedEvidence),
        lastSeenAt: now,
        // Фиксируем момент завершения один раз: при первом достижении 100%.
        ...(progress >= 100 && !existing?.completedAt ? { completedAt: now } : {}),
      },
      create: {
        userId: user.id,
        caseId: caseItem.id,
        progress,
        solvedQuestions: JSON.stringify(solvedQuestions),
        notesData: JSON.stringify(notes),
        viewedEvidence: JSON.stringify(viewedEvidence),
        openedAt: now,
        lastSeenAt: now,
        ...(progress >= 100 ? { completedAt: now } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      caseId: cleanCaseId,
      progress: saved.progress,
      solvedQuestions: safeParseJsonArray<string>(saved.solvedQuestions),
      notes: safeParseJsonArray(saved.notesData),
      viewedEvidence: safeParseJsonArray<string>(saved.viewedEvidence),
      openedAt: saved.openedAt,
      lastSeenAt: saved.lastSeenAt,
      completedAt: saved.completedAt,
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
