'use client';

import React from 'react';
import CaseInvestigationLayout from '@/components/CaseInvestigationLayout';
import type { CaseFile } from '@/lib/archive-data';

export function CasePageClient({
  item,
  isGuest = false,
}: {
  item: CaseFile;
  isGuest?: boolean;
}) {
  return <CaseInvestigationLayout caseFile={item} />;
}

export default CasePageClient;
