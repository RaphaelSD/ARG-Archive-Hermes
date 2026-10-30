import { notFound, redirect } from 'next/navigation';

import { getCase } from '@/lib/archive-data';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { formatRub, isMockPaymentEnabled } from '@/lib/payments/config';
import { MockCheckout } from './MockCheckout';

export const dynamic = 'force-dynamic';

export default async function MockPaymentPage({ searchParams }: { searchParams: { id?: string } }) {
  if (!isMockPaymentEnabled() || !searchParams.id) notFound();

  const user = await getSessionUser();
  if (!user) redirect('/');

  const payment = await prisma.payment.findUnique({
    where: { id: searchParams.id },
    include: { case: true },
  });
  if (!payment || payment.userId !== user.id || payment.provider !== 'mock') notFound();
  if (payment.status !== 'pending') redirect(`/payments/return?id=${payment.id}`);

  const canonical = getCase(payment.case.slug);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-3 border border-amber-500/60 bg-amber-950/40 px-3 py-2 font-mono text-[11px] uppercase text-amber-400">
        Тестовый режим: имитация страницы ЮKassa, деньги не списываются
      </div>
      <div className="space-y-5 bg-white p-6 text-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <span className="text-lg font-bold">ЮKassa</span>
          <span className="text-xs text-zinc-500">Тестовый магазин</span>
        </div>
        <div>
          <p className="text-sm text-zinc-500">
            Доступ к материалам: {canonical?.number ?? payment.case.slug} «{canonical?.title ?? payment.case.title}»
          </p>
          <p className="mt-1 text-3xl font-bold">{formatRub(payment.amount)}</p>
        </div>
        <MockCheckout paymentId={payment.id} />
      </div>
    </div>
  );
}
