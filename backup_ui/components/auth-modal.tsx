'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, X, Lock, Mail, User, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  initialMode?: 'login' | 'register';
};

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error === 'Invalid credentials' ? 'Неверный служебный email или пароль доступа' : data.error || 'Ошибка входа');
        }
        onAuthSuccess(data.user);
        onClose();
      } else {
        if (password.length < 6) {
          throw new Error('Пароль допуска должен содержать не менее 6 символов');
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: name.trim() || 'Оператор ОВР' }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error === 'User already exists' ? 'Оператор с таким email уже зарегистрирован' : data.error || 'Ошибка регистрации');
        }
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером архива');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md border border-border/80 bg-card shadow-2xl overflow-hidden">
        {/* Top classified strip */}
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

        {/* Header content */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <span className="label-xs text-muted-foreground">ФОРМА УЧЁТА СОТРУДНИКОВ</span>
            <span className="border border-stamp/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stamp bg-stamp/10">
              ГРИФ «СЛУЖЕБНО»
            </span>
          </div>
          <h2 className="mt-2 font-display text-xl uppercase tracking-[0.06em] text-foreground">
            {mode === 'login' ? 'Вход в архив ОВР' : 'Регистрация оператора'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === 'login'
              ? 'Введите служебные реквизиты для доступа к закрытым материалам расследований.'
              : 'Создайте личный идентификатор исследователя для сохранения протоколов и заметок.'}
          </p>

          {/* Mode switch tabs */}
          <div className="mt-4 grid grid-cols-2 border-b border-border/70">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs uppercase tracking-wider transition-colors border-b-2 font-medium',
                mode === 'login'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={cn(
                'py-2 text-xs uppercase tracking-wider transition-colors border-b-2 font-medium',
                mode === 'register'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Регистрация
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block label-xs text-muted-foreground">
                Позывной / ФИО следователя
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="напр. Следователь Орлов / И. В. Смирнов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border/80 bg-secondary/50 px-3 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
                <User className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block label-xs text-muted-foreground">
              Служебный Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="investigator@ovr.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border/80 bg-secondary/50 px-3 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block label-xs text-muted-foreground">
              Пароль допуска
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border/80 bg-secondary/50 px-3 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <KeyRound className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-primary bg-primary/20 py-2.5 font-display text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Проверка реквизитов...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <Lock className="size-3.5" />
                <span>Авторизовать допуск</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5" />
                <span>Зарегистрировать профиль</span>
              </>
            )}
          </button>

          <p className="border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            {mode === 'login' ? (
              <span>
                Нет учетной записи? Переключитесь на «Регистрация» выше. Дело №001 доступно и в гостевом режиме.
              </span>
            ) : (
              <span>
                После создания профиля данные ваших расследований будут синхронизироваться с протоколами ОВР.
              </span>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
