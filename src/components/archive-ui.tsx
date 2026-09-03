import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { CaseStatus } from '@/lib/archive-data';

export function Panel({
  title,
  back,
  backTo,
  action,
  className,
  children,
}: {
  title: string;
  back?: string;
  backTo?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'border border-border/70 bg-card/60 p-5 shadow-[0_20px_60px_-40px_oklch(0_0_0/1)] sm:p-6',
        className,
      )}
    >
      {back ? (
        <Link
          href={backTo ?? '/'}
          className="mb-3 inline-flex items-center gap-1 label-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-3" />
          {back}
        </Link>
      ) : null}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase tracking-[0.08em] text-foreground sm:text-3xl">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const statusLabel: Record<CaseStatus, string> = {
  closed: 'Закрыто',
  open: 'В работе',
  locked: 'Заблокировано',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        'inline-block border px-2.5 py-1 label-xs',
        status === 'locked'
          ? 'border-destructive/50 text-destructive'
          : status === 'open'
            ? 'border-primary/50 text-primary'
            : 'border-foreground/25 bg-foreground/10 text-foreground/80',
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
