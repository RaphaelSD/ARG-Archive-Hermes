import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ has_access: false, error: 'Email не указан' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      // Если переменные Supabase не заданы в .env, возвращаем false (или dev доступ)
      return NextResponse.json({
        has_access: false,
        email,
        configured: false,
        message: 'Supabase не сконфигурирован в .env',
      });
    }

    const { data: player, error } = await supabaseAdmin
      .from('players')
      .select('email, has_access')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.warn('[check-access] Supabase query error:', error);
      return NextResponse.json({ has_access: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      has_access: Boolean(player?.has_access),
      email,
      configured: true,
    });
  } catch (error: any) {
    console.error('[check-access] Error:', error);
    return NextResponse.json({ has_access: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email ? String(body.email).toLowerCase().trim() : '';

    if (!email) {
      return NextResponse.json({ has_access: false, error: 'Email не указан' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        has_access: false,
        email,
        configured: false,
      });
    }

    const { data: player, error } = await supabaseAdmin
      .from('players')
      .select('email, has_access')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ has_access: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      has_access: Boolean(player?.has_access),
      email,
      configured: true,
    });
  } catch (error: any) {
    return NextResponse.json({ has_access: false, error: error?.message }, { status: 500 });
  }
}
