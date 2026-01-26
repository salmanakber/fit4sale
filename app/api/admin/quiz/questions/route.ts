'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function getSupabaseClient(isServerAction = false) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        ...(isServerAction && {
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        }),
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select(
        `
        id,
        question_text,
        question_type,
        order_index,
        created_at,
        quiz_answer_options(id, option_text, option_value, order_index)
      `
      )
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    
    const adminSession = cookieStore.get('admin_session');

    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { question_text, question_type, options } = await request.json();

    // Get max order_index
    const { data: maxOrder } = await supabase
      .from('quiz_questions')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .insert({
        question_text,
        question_type,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert answer options
    if (options && options.length > 0) {
      const optionsData = options.map((opt: any, idx: number) => ({
        question_id: question.id,
        option_text: opt.option_text,
        option_value: opt.value || `option_${idx}`,
        order_index: idx,
      }));

      const { error: optionsError } = await supabase
        .from('quiz_answer_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
