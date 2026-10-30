'use client';

import React from 'react';
import CaseInvestigationLayout from '@/components/CaseInvestigationLayout';
import type { CaseFile } from '@/lib/archive-data';

export function CasePageClient({
  item,
  playerEmail,
}: {
  item: CaseFile;
  isGuest?: boolean;
  playerEmail?: string;
}) {
  return <CaseInvestigationLayout caseFile={item} playerEmail={playerEmail} />;
}

export default CasePageClient;
