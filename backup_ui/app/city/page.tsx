import type { Metadata } from 'next';

import { CityMap } from '@/components/city-map';
import { Panel } from '@/components/archive-ui';

export const metadata: Metadata = {
  title: 'Город Н. — карта расследования',
  description:
    'Карта города Н.: полицейский участок, старый порт, завод «Север» и другие локации расследования.',
  openGraph: {
    title: 'Город Н. — карта расследования',
    description: 'Локации, связанные с делами детектива Орлова.',
  },
};

export default function CityPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <Panel title="Город Н." back="Назад к архиву" backTo="/">
        <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted-foreground">
          Отмечены места, связанные с материалами дел. Нажмите на метку, чтобы прочитать справку.
        </p>
        <CityMap />
      </Panel>
    </div>
  );
}
