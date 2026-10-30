'use client';

import { useState } from 'react';
import { CreditCard, Loader2, ShieldAlert } from 'lucide-react';

import { AuthModal } from '@/components/auth-modal';
import { cn } from '@/lib/utils';

export function BuyCaseButton({
  caseId,
  priceRub,
  className,
}: {
  caseId: string;
  priceRub: number | null;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (!priceRub) {
    return (
      <span className="inline-flex items-center gap-2 border border-border bg-secondary px-5 py-2.5 text-xs font-display uppercase tracking-wider text-muted-foreground">
        Скоро в архиве
      </span>
    );
  }

  const startPurchase = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });

      if (res.status === 401) {
        setIsAuthOpen(true);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось начать оплату');
      }

      window.location.href = data.alreadyUnlocked ? data.redirectUrl : data.confirmationUrl;
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером архива');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={startPurchase}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center gap-2 border-2 border-primary bg-primary px-5 py-2.5 text-xs font-display uppercase tracking-wider text-primary-foreground font-bold shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100',
            className,
          )}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          <span>ПОЛУЧИТЬ ДОСТУП — {priceRub} ₽</span>
        </button>
        {error && (
          <span className="flex items-center gap-1.5 text-xs text-destructive">
            <ShieldAlert className="size-3.5" />
            {error}
          </span>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          setIsAuthOpen(false);
          startPurchase();
        }}
      />
    </>
  );
}
