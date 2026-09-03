import './globals.css';
import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Архив города Н. — дела детектива Орлова',
  description:
    'Интерактивный архив отдела внутренних расследований: дела, улики, заметки следователя и карта города Н.',
  openGraph: {
    title: 'Архив города Н. — дела детектива Орлова',
    description:
      'Изучайте материалы дел, находите несостыковки и делайте собственные выводы.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>
        <div className="flex min-h-screen flex-col bg-background">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
