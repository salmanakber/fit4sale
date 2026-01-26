'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    // Get intro settings
    const { data: intro } = await supabase
      .from('quiz_intro_settings')
      .select('*')
      .single();

    // Get all questions with their options
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select(
        `
        id,
        question_text,
        question_type,
        order_index,
        quiz_answer_options(id, option_text, option_value, order_index)
      `
      )
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      intro: intro || {
        title: 'Fit4Sale Sales-Check',
        description:
          'Beantworten Sie ein paar Fragen zu Ihrem Vertrieb – Sie erhalten eine vorläufige Auswertung per E-Mail.',
          'Beantworten Sie ein paar Fragen zu Ihrem Sales-Prozess – Sie erhalten eine vorläufige Auswertung per E-Mail.',
        estimated_time: '8-10 minutes',
        button_text: 'Start',
      },
      questions: questions || [],
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
