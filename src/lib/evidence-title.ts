import { getAllCases } from '@/lib/cases/loader';

/** Человекочитаемое название материала вместо технического ID (D04, P02, clue_...). */
export function evidenceTitle(id: string): string {
  for (const c of getAllCases()) {
    const doc = c.documents?.find((d) => d.id === id);
    if (doc) return doc.title.replace(/^(Макро-)?[Фф]ото:\s*/, '');
  }
  return 'материал';
}
