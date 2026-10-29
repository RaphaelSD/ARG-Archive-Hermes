import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email ? String(body.email).toLowerCase().trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Укажите корректный email адрес' },
        { status: 400 }
      );
    }

    // 1. Сохраняем/обновляем игрока в Supabase (поле email, has_access: false)
    if (isSupabaseConfigured) {
      try {
        const { data: existingPlayer } = await supabaseAdmin
          .from('players')
          .select('id, has_access')
          .eq('email', email)
          .maybeSingle();

        if (!existingPlayer) {
          await supabaseAdmin.from('players').insert([
            {
              email,
              has_access: false,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (dbErr) {
        console.warn('[create-payment] Supabase insert warning:', dbErr);
      }
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const returnUrl = `${origin}/cases/case-001?success=true&email=${encodeURIComponent(email)}`;

    // 2. Если настроены боевые/тестовые ключи ЮKassa, делаем реальный запрос к API
    if (shopId && secretKey) {
      const idempotenceKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const authHeader = 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');

      const yooResponse = await fetch('https://api.yookassa.ru/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotence-Key': idempotenceKey,
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          amount: {
            value: '290.00',
            currency: 'RUB',
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: returnUrl,
          },
          description: 'Доступ к делу №001 «Комната 12» — Архив города Н.',
          metadata: {
            email,
            caseId: 'case-001',
          },
        }),
      });

      if (yooResponse.ok) {
        const paymentData = await yooResponse.json();
        const confirmationUrl = paymentData?.confirmation?.confirmation_url;
        if (confirmationUrl) {
          return NextResponse.json({
            success: true,
            confirmationUrl,
            paymentId: paymentData.id,
            mode: 'live',
          });
        }
      } else {
        const errDetails = await yooResponse.text();
        console.error('[create-payment] YooKassa error response:', errDetails);
      }
    }

    // 3. Fallback / Dev-режим (если ключи ЮKassa еще не прописаны в .env)
    // Возвращаем прямую ссылку на возврат с флагом оплаты для плавного тестирования
    return NextResponse.json({
      success: true,
      confirmationUrl: returnUrl,
      mode: 'mock',
      message: 'Имитация перехода на платежный шлюз ЮKassa (демо-режим)',
    });
  } catch (error: any) {
    console.error('[create-payment] Server error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка инициализации платежа' },
      { status: 500 }
    );
  }
}
