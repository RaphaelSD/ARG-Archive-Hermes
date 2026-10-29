'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface EmailAccessModalProps {
  isOpen: boolean;
  onAccessGranted: (email: string) => void;
  caseTitle?: string;
  caseNumber?: string;
}

export function EmailAccessModal({
  isOpen,
  onAccessGranted,
  caseTitle = 'КОМНАТА 12',
  caseNumber = 'ДЕЛО №001',
}: EmailAccessModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);
  const [mode, setMode] = useState<'checkout' | 'verify'>('checkout');

  if (!isOpen) return null;

  // 1. Отправка email для инициализации платежа
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatusMessage({
        type: 'error',
        text: 'ОШИБКА: Введите корректный адрес электронной почты.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'ИНИЦИАЛИЗАЦИЯ: Регистрация запроса в реестре ОВР...',
    });

    try {
      // a) Сохраняем email в Supabase (has_access: false)
      if (isSupabaseConfigured) {
        try {
          const { error: sbError } = await supabase.from('players').upsert(
            {
              email: cleanEmail,
              has_access: false,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );
          if (sbError) {
            console.warn('[EmailAccessModal] Supabase save notice:', sbError.message);
          }
        } catch (err) {
          console.warn('[EmailAccessModal] Supabase client warning:', err);
        }
      }

      // Сохраняем почту в localStorage для проверки после возврата
      try {
        localStorage.setItem('arg_player_email', cleanEmail);
      } catch {}

      // b) Вызываем API-роут оплаты
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сформировать счет на оплату');
      }

      setStatusMessage({
        type: 'success',
        text: 'СЧЕТ СФОРМИРОВАН: Перенаправление на защищенный шлюз ЮKassa...',
      });

      // Перенаправляем на confirmationUrl
      if (data.confirmationUrl) {
        setTimeout(() => {
          window.location.href = data.confirmationUrl;
        }, 800);
      } else {
        // Fallback: мгновенное открытие
        onAccessGranted(cleanEmail);
      }
    } catch (err: any) {
      console.error('[EmailAccessModal] Payment error:', err);
      setStatusMessage({
        type: 'error',
        text: `ОТКАЗ СИСТЕМЫ: ${err?.message || 'Сервер оплаты временно недоступен'}`,
      });
      setIsLoading(false);
    }
  };

  // 2. Проверка уже существующего доступа по email
  const handleCheckExistingAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: 'Введите email для проверки действующего допуска.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'ЗАПРОС В БАЗУ ДАННЫХ: Проверка реестра допусков ОВР...',
    });

    try {
      const res = await fetch(`/api/check-access?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (data.has_access) {
        setStatusMessage({
          type: 'success',
          text: 'ДОПУСК ПОДТВЕРЖДЕН: Загрузка секретных материалов дела...',
        });
        try {
          localStorage.setItem('arg_has_access', 'true');
          localStorage.setItem('arg_player_email', cleanEmail);
        } catch {}
        setTimeout(() => {
          onAccessGranted(cleanEmail);
        }, 700);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'ДОСТУП НЕ НАЙДЕН: Для данного email оплата не зафиксирована. Перейдите к получению доступа.',
        });
        setMode('checkout');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'СБОЙ СЕТИ: Не удалось связаться с сервером проверки допусков.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Быстрый режим разработчика / демо
  const handleDevBypass = () => {
    const demoEmail = email || 'investigator.demo@ovr.local';
    try {
      localStorage.setItem('arg_has_access', 'true');
      localStorage.setItem('arg_player_email', demoEmail);
    } catch {}
    onAccessGranted(demoEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0e1015]/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Контейнер модального терминала */}
      <div className="w-full max-w-xl bg-[#101319] border-2 border-[#c5a059]/70 shadow-[0_0_50px_rgba(197,160,89,0.15)] rounded-xs overflow-hidden flex flex-col font-sans">
        {/* Шапка терминала */}
        <div className="bg-[#141820] border-b border-[#1e232d] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Герб */}
            <svg
              width="22"
              height="26"
              viewBox="0 0 34 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M17 1.5 L31.5 5.5 V18 C31.5 28.5 22 36.5 17 38.5 C12 36.5 2.5 28.5 2.5 18 V5.5 L17 1.5 Z"
                stroke="#c5a059"
                strokeWidth="2"
                fill="none"
              />
              <line x1="17" y1="8" x2="17" y2="30" stroke="#c5a059" strokeWidth="1.5" />
              <circle cx="17" cy="8" r="1.5" fill="#c5a059" />
            </svg>
            <div>
              <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#c5a059] font-bold">
                АРХИВ ГОРОДА Н. — ТЕРМИНАЛ ОВР
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                СЛЕДСТВЕННЫЙ ПРОТОКОЛ АВТОРИЗАЦИИ
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-red-950 bg-red-950/40 px-2 py-0.5 rounded-xs text-[10px] font-mono text-red-400 uppercase tracking-wider">
            <Lock className="size-3" />
            <span>ДОСТУП ОГРАНИЧЕН</span>
          </div>
        </div>

        {/* Тело терминала */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Плашка дела */}
          <div className="border border-[#1e232d] bg-[#0b0d11] p-3.5 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#c5a059] uppercase tracking-wider">
                {caseNumber}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                ГРИФ: ДЛЯ СЛУЖЕБНОГО ПОЛЬЗОВАНИЯ
              </span>
            </div>
            <div className="text-base font-bold text-white tracking-wide uppercase">
              {caseTitle}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Для ознакомления со следственными материалами, допросами, вещественными доказательствами и схемой места преступления требуется авторизованный допуск исследователя.
            </p>
          </div>

          {/* Вкладки: Оплата или Проверка */}
          <div className="flex border-b border-[#1e232d] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMode('checkout');
                setStatusMessage(null);
              }}
              className={`pb-2 px-3 border-b-2 uppercase tracking-wider transition-colors ${
                mode === 'checkout'
                  ? 'border-[#c5a059] text-[#c5a059] font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              1. Получить допуск (ЮKassa)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('verify');
                setStatusMessage(null);
              }}
              className={`pb-2 px-3 border-b-2 uppercase tracking-wider transition-colors ${
                mode === 'verify'
                  ? 'border-[#c5a059] text-[#c5a059] font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              2. Уже есть доступ (Проверка)
            </button>
          </div>

          {/* Форма режима 1: Оплата */}
          {mode === 'checkout' ? (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300">
                  Электронная почта исследователя (Email):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@example.com"
                    disabled={isLoading}
                    className="w-full bg-[#0b0d11] border border-[#1e232d] focus:border-[#c5a059] rounded-xs px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 font-mono focus:outline-none transition-colors"
                  />
                </div>
                <div className="text-[11px] text-zinc-500">
                  На указанную почту будет привязано разрешение и сохранен игровой прогресс в базе данных.
                </div>
              </div>

              {/* Стоимость и шлюз */}
              <div className="flex items-center justify-between border border-[#1e232d] bg-[#141820] px-3.5 py-2.5 rounded-xs">
                <div>
                  <div className="text-xs text-zinc-400 font-mono uppercase">
                    Тариф расследования:
                  </div>
                  <div className="text-sm font-bold text-white">
                    Полный доступ к делу №001
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 line-through font-mono">590 ₽</div>
                  <div className="text-base font-bold text-[#c5a059] font-mono">290 ₽</div>
                </div>
              </div>

              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#c5a059] hover:bg-[#d4af66] active:scale-99 disabled:opacity-50 text-[#0e1015] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xs text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>СВЯЗЬ С ПЛАТЕЖНЫМ ШЛЮЗОМ...</span>
                  </>
                ) : (
                  <>
                    <span>ПОЛУЧИТЬ ДОСТУП К ДЕЛУ ЧЕРЕЗ ЮKASSA</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Форма режима 2: Проверка */
            <form onSubmit={handleCheckExistingAccess} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300">
                  Введите email, указанный при покупке:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@example.com"
                    disabled={isLoading}
                    className="w-full bg-[#0b0d11] border border-[#1e232d] focus:border-[#c5a059] rounded-xs px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 font-mono focus:outline-none transition-colors"
                  />
                </div>
                <div className="text-[11px] text-zinc-500">
                  Система обратится к базе данных Supabase и проверит активный статус допуска.
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#181c24] hover:bg-[#202530] border border-[#c5a059]/60 text-[#c5a059] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xs text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>СВЕРКА С РЕЕСТРОМ ОВР...</span>
                  </>
                ) : (
                  <>
                    <span>ПРОВЕРИТЬ ДОПУСК В БАЗЕ ДАННЫХ</span>
                    <KeyRound className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Сообщения обратной связи */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xs text-xs font-mono border flex items-start gap-2.5 animate-in fade-in ${
                statusMessage.type === 'error'
                  ? 'border-red-500/80 bg-red-950/40 text-red-300'
                  : statusMessage.type === 'success'
                  ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
                  : 'border-[#c5a059]/60 bg-[#161a22] text-[#c5a059]'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertTriangle className="size-4 shrink-0 text-red-400 mt-0.5" />
              ) : statusMessage.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <Terminal className="size-4 shrink-0 text-[#c5a059] mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Футер терминала */}
          <div className="border-t border-[#1e232d] pt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>АРХИВ ОВР — ЗАЩИЩЕННОЕ СОЕДИНЕНИЕ</span>
            <button
              type="button"
              onClick={handleDevBypass}
              className="text-[#c5a059]/80 hover:text-[#c5a059] underline hover:no-underline transition-colors"
            >
              [DEV — ДЕМО-ДОСТУП]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailAccessModal;
