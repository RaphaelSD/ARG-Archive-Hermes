'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, LogOut, UserRound, ShieldCheck, KeyRound } from 'lucide-react';
import { AuthModal, type AuthUser } from '@/components/auth-modal';

const nav = [
  { href: '/', label: 'Архив дел' },
  { href: '/detective', label: 'Детектив Орлов' },
  { href: '/city', label: 'Город' },
  { href: '/news', label: 'Новости' },
  { href: '/about', label: 'О проекте' },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (!pathname?.startsWith('/cases')) {
      fetchCurrentUser();
    }
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Early return ONLY after all hooks
  if (pathname?.startsWith('/cases')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsMenuOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const handleAuthSuccess = (newUser: AuthUser) => {
    setUser(newUser);
    router.refresh();
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            {/* SVG Герб Отдела Внутренних Расследований */}
            <svg
              width="32"
              height="38"
              viewBox="0 0 34 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 transition-transform group-hover:scale-105"
            >
              <path
                d="M17 1.5 L31.5 5.5 V18 C31.5 28.5 22 36.5 17 38.5 C12 36.5 2.5 28.5 2.5 18 V5.5 L17 1.5 Z"
                stroke="#c5a059"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M17 4.5 L28.5 7.8 V17.5 C28.5 26 21 33.2 17 35 C13 33.2 5.5 26 5.5 17.5 V7.8 L17 4.5 Z"
                stroke="#c5a059"
                strokeWidth="0.8"
                strokeOpacity="0.6"
                fill="none"
              />
              <line x1="17" y1="8" x2="17" y2="30" stroke="#c5a059" strokeWidth="1.2" />
              <circle cx="17" cy="8" r="1.2" fill="#c5a059" />
              <line x1="13" y1="12" x2="21" y2="12" stroke="#c5a059" strokeWidth="1.2" />
              <path
                d="M11 15 C11 20, 14 24, 17 26 C20 24, 23 20, 23 15"
                stroke="#c5a059"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M8.5 13 C8.5 21, 13 27, 17 29 C21 27, 25.5 21, 25.5 13"
                stroke="#c5a059"
                strokeWidth="0.8"
                strokeOpacity="0.7"
                fill="none"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-100 leading-tight">
                АРХИВ ГОРОДА Н.
              </span>
              <span className="text-[11px] text-zinc-400 font-normal leading-tight">
                Отдел внутренних расследований
              </span>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="label-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User profile / Login control */}
          <div className="relative ml-auto lg:ml-0" ref={menuRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 border border-primary/50 bg-primary/10 px-3 py-2 text-foreground transition-colors hover:border-primary hover:bg-primary/15"
                title="Профиль оператора ОВР"
              >
                <ShieldCheck className="size-4 text-primary" />
                <span className="label-xs max-w-[120px] truncate sm:max-w-[180px]">{user.name}</span>
                <span className="hidden sm:inline border border-primary/60 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-primary">
                  ОВР
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 border border-border/70 bg-secondary/30 px-3 py-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                title="Войти в систему архива"
              >
                <UserRound className="size-4" />
                <span className="label-xs">Вход в архив</span>
              </button>
            )}

            {/* Dropdown Menu for Authenticated User */}
            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 border border-border/80 bg-card p-3 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                <div className="border-b border-border/60 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="label-xs text-muted-foreground">УЧЕТНАЯ ЗАПИСЬ</span>
                    <span className="border border-stamp/50 px-1.5 py-0.5 font-mono text-[9px] uppercase text-stamp">
                      ДОПУСК
                    </span>
                  </div>
                  <div className="mt-1 font-display text-sm uppercase text-foreground">{user.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-[11px] text-primary/80">
                    Статус: Оператор архива ({user.role})
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border border-border/60 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="size-3.5" />
                    <span>Выйти из архива</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex gap-5 overflow-x-auto border-t border-border/60 px-4 py-2 lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="label-xs whitespace-nowrap text-muted-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Auth modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
