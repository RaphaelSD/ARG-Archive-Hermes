'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function MockCheckout({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState<'succeed' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: 'succeed' | 'cancel') => {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Не удалось обработать тестовый платёж');
      window.location.href = `/payments/return?id=${paymentId}`;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 font-mono text-sm">
        <input readOnly value="5555 5555 5555 4477" className="border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-700" />
        <div className="grid grid-cols-2 gap-2">
          <input readOnly value="12 / 30" className="border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-700" />
          <input readOnly value="123" className="border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-700" />
        </div>
      </div>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => submit('succeed')}
        className="flex w-full items-center justify-center gap-2 bg-[#0070f0] py-3 text-sm font-semibold text-white hover:bg-[#005ed0] disabled:opacity-70"
      >
        {loading === 'succeed' && <Loader2 className="size-4 animate-spin" />}
        Заплатить
      </button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => submit('cancel')}
        className="flex w-full items-center justify-center gap-2 border border-zinc-300 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-70"
      >
        {loading === 'cancel' && <Loader2 className="size-4 animate-spin" />}
        Отменить оплату
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
