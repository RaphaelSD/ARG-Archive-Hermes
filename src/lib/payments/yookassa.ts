const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

export type YooKassaPaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';

export type YooKassaPayment = {
  id: string;
  status: YooKassaPaymentStatus;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID ?? '';
  const secretKey = process.env.YOOKASSA_SECRET_KEY ?? '';
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;
}

async function request<T>(path: string, init: RequestInit & { idempotenceKey?: string } = {}): Promise<T> {
  const { idempotenceKey, headers, ...rest } = init;
  const res = await fetch(`${YOOKASSA_API_URL}${path}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      ...(idempotenceKey ? { 'Idempotence-Key': idempotenceKey } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YooKassa ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function kopecksToValue(amountKopecks: number) {
  return (amountKopecks / 100).toFixed(2);
}

export async function createYooKassaPayment(params: {
  amountKopecks: number;
  description: string;
  returnUrl: string;
  idempotenceKey: string;
  metadata: Record<string, string>;
}) {
  return request<YooKassaPayment>('/payments', {
    method: 'POST',
    idempotenceKey: params.idempotenceKey,
    body: JSON.stringify({
      amount: { value: kopecksToValue(params.amountKopecks), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: params.returnUrl },
      description: params.description.slice(0, 128),
      metadata: params.metadata,
    }),
  });
}

export async function getYooKassaPayment(paymentId: string) {
  return request<YooKassaPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}
