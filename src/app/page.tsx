import ArchiveHome from '@/components/ArchiveHome';

export const metadata = {
  title: 'Архив дел — Архив города Н.',
  description:
    'Интерактивный архив детектива Максима Орлова: материалы дел, улики, заметки и карта города Н.',
  openGraph: {
    title: 'Архив дел — Архив города Н.',
    description:
      'Изучайте материалы дел, находите несостыковки и делайте собственные выводы.',
  },
};

export default function HomePage() {
  return <ArchiveHome />;
}
