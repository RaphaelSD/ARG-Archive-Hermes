import Link from 'next/link';
import { ChevronDown, ShieldHalf, UserRound } from 'lucide-react';

const nav = [
  { href: '/', label: 'Архив дел' },
  { href: '/detective', label: 'Детектив Орлов' },
  { href: '/city', label: 'Город' },
  { href: '/news', label: 'Новости' },
  { href: '/about', label: 'О проекте' },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center border border-border/80 bg-secondary text-primary">
            <ShieldHalf className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base uppercase tracking-[0.14em] text-foreground">
              Архив города Н.
            </span>
            <span className="block label-xs text-muted-foreground">Отдел внутренних расследований</span>
          </span>
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

        <button
          type="button"
          className="ml-auto flex items-center gap-2 border border-border/70 px-3 py-2 text-muted-foreground transition-colors hover:text-foreground lg:ml-0"
        >
          <UserRound className="size-4" />
          <span className="label-xs">Пользователь</span>
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-t border-border/60 px-4 py-2 lg:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="label-xs whitespace-nowrap text-muted-foreground">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
