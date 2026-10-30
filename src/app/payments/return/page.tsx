import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

import { getCase } from '@/lib/archive-data';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { formatRub } from '@/lib/payments/config';
import { syncPayment } from '@/lib/payments/service';
import { PaymentPendingRefresher } from './PaymentPendingRefresher';

export const dynamic = 'force-dynamic';

export default async function PaymentReturnPage({ searchParams }: { searchParams: { id?: string } }) {
  if (!searchParams.id) notFound();

  const user = await getSessionUser();
  if (!user) redirect('/');

  const stored = await prisma.payment.findUnique({ where: { id: searchParams.id }, include: { case: true } });
  if (!stored || stored.userId !== user.id) notFound();

  let payment = stored;
  try {
    payment = { ...(await syncPayment(stored)), case: stored.case };
  } catch (error) {
    console.error('Failed to sync payment', error);
  }

  const caseId = payment.case.slug.replace(/^case-/, '');
  const canonical = getCase(caseId);
  const caseLabel = `${canonical?.number ?? payment.case.slug} «${canonical?.title ?? payment.case.title}»`;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="space-y-5 border border-border/80 bg-card p-6 sm:p-8 shadow-2xl">
        {payment.status === 'succeeded' && (
          <>
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="size-7" />
              <h1 className="font-display text-xl uppercase tracking-wider">Доступ открыт</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Оплата {formatRub(payment.amount)} получена. Материалы {caseLabel} переданы в ваш архив.
            </p>
            <Link
              href={`/cases/${caseId}`}
              className="inline-flex border-2 border-primary bg-primary px-5 py-2.5 text-xs font-display uppercase tracking-wider text-primary-foreground font-bold"
            >
              Открыть дело
            </Link>
          </>
        )}

        {payment.status === 'pending' && (
          <>
            <PaymentPendingRefresher />
            <div className="flex items-center gap-3 text-primary">
              <Clock className="size-7 animate-pulse" />
              <h1 className="font-display text-xl uppercase tracking-wider">Ожидаем подтверждение оплаты</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Страница обновится автоматически, как только платёжная система подтвердит оплату {caseLabel}.
            </p>
            {payment.confirmationUrl && (
              <a href={payment.confirmationUrl} className="inline-flex border border-border bg-secondary px-4 py-2.5 text-xs font-display uppercase tracking-wider hover:border-primary hover:text-primary">
                Вернуться к оплате
              </a>
            )}
          </>
        )}

        {(payment.status === 'canceled' || payment.status === 'failed') && (
          <>
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="size-7" />
              <h1 className="font-display text-xl uppercase tracking-wider">Оплата не прошла</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Платёж за {caseLabel} отменён. Деньги не списаны. Можно попробовать ещё раз.
            </p>
            <Link
              href={`/cases/${caseId}`}
              className="inline-flex border-2 border-primary bg-primary px-5 py-2.5 text-xs font-display uppercase tracking-wider text-primary-foreground font-bold"
            >
              Попробовать снова
            </Link>
          </>
        )}

        <Link href="/" className="block text-xs text-muted-foreground hover:text-primary">
          ← В архив
        </Link>
      </div>
    </div>
  );
}
