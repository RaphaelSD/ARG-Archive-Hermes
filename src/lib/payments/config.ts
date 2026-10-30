// Бесплатные демо-дела: доступны всем без входа и оплаты.
export const FREE_CASE_IDS = ['001'];

// Цены платных дел в рублях. Дела без цены купить нельзя (демо или ещё не выпущены).
export const CASE_PRICES_RUB: Record<string, number> = {
  '002': 299,
  '003': 299,
};

export type PaymentProvider = 'yookassa' | 'mock';

export function normalizeCaseId(caseId: string) {
  return caseId.replace(/^case-/, '');
}

export function getCasePriceRub(caseId: string): number | null {
  return CASE_PRICES_RUB[normalizeCaseId(caseId)] ?? null;
}

export function isYooKassaConfigured() {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

export function isMockPaymentEnabled() {
  return process.env.PAYMENT_MOCK_ENABLED === 'true';
}

export function getActivePaymentProvider(): PaymentProvider | null {
  if (isYooKassaConfigured()) return 'yookassa';
  if (isMockPaymentEnabled()) return 'mock';
  return null;
}

export function formatRub(amountKopecks: number) {
  const rub = amountKopecks / 100;
  return `${Number.isInteger(rub) ? rub : rub.toFixed(2)} ₽`;
}
