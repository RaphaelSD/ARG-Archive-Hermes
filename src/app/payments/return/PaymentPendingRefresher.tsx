'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentPendingRefresher() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
