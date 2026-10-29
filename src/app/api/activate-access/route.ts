import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email ? String(body.email).toLowerCase().trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email не указан или некорректен' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      // Ищем или создаем игрока с has_access: true
      const { data: existingPlayer } = await supabaseAdmin
        .from('players')
        .select('id, has_access')
        .eq('email', email)
        .maybeSingle();

      if (existingPlayer) {
        await supabaseAdmin
          .from('players')
          .update({
            has_access: true,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
      } else {
        await supabaseAdmin.from('players').insert([
          {
            email,
            has_access: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      has_access: true,
      email,
    });
  } catch (error: any) {
    console.error('[activate-access] Error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
