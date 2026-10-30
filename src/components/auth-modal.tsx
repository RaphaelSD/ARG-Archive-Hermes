'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, X, Mail, KeyRound, Loader2 } from 'lucide-react';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
};

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const requestCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось отправить код');
      setDevCode(data.devCode ?? null);
      setCode('');
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером архива');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Неверный код');
      onAuthSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером архива');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') requestCode();
    else verifyCode();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md border border-border/80 bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/70 bg-secondary/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="font-display text-xs uppercase tracking-[0.14em] text-primary">
              ОВР // ТЕРМИНАЛ ДОПУСКА
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-border/60 p-1 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
            title="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="label-xs text-muted-foreground">ФОРМА УЧЁТА СОТРУДНИКОВ</span>
            <span className="border border-stamp/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stamp bg-stamp/10">
              ГРИФ «СЛУЖЕБНО»
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl uppercase tracking-[0.06em] text-foreground">
            {step === 'email' ? 'Вход в архив ОВР' : 'Подтверждение допуска'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 'email'
              ? 'Укажите email — мы пришлём код входа. Пароль не нужен, аккаунт создаётся автоматически.'
              : `Код отправлен на ${email}. Введите его, чтобы войти.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {step === 'email' ? (
            <>
              <label className="block">
                <span className="label-xs text-muted-foreground">EMAIL</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@mail.ru"
                    className="w-full border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>
              </label>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[hsl(var(--primary))]"
                />
                <span>
                  Я согласен на обработку персональных данных в соответствии с{' '}
                  <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
                    политикой обработки персональных данных
                  </Link>
                </span>
              </label>
            </>
          ) : (
            <>
              {devCode && (
                <div className="border border-amber-500/50 bg-amber-950/30 px-3 py-2 font-mono text-xs text-amber-300">
                  ТЕСТОВЫЙ РЕЖИМ: письма не отправляются. Ваш код: <b className="tracking-[0.3em]">{devCode}</b>
                </div>
              )}
              <label className="block">
                <span className="label-xs text-muted-foreground">КОД ИЗ ПИСЬМА</span>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border border-border/80 bg-background/60 py-2.5 pl-9 pr-3 font-mono text-lg tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </label>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => setStep('email')} className="text-muted-foreground hover:text-foreground">
                  ← Другой email
                </button>
                <button type="button" onClick={requestCode} disabled={loading} className="text-primary hover:underline disabled:opacity-50">
                  Отправить код ещё раз
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <ShieldAlert className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (step === 'email' ? !consent || !email : code.length !== 6)}
            className="flex w-full items-center justify-center gap-2 border border-primary bg-primary/90 py-2.5 font-display text-sm uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {step === 'email' ? 'Получить код' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
