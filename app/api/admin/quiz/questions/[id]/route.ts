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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const { data: question, error } = await supabase
      .from('quiz_questions')
      .select(
        `
        id,
        question_text,
        question_type,
        category,
        order_index,
        created_at,
        quiz_answer_options(id, option_text, option_value, score, order_index)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    // Backward-compatible shape for existing UI (expects option "value" and "score")
    const normalized = {
      ...question,
      quiz_answer_options: (question as any).quiz_answer_options?.map((opt: any) => ({
        ...opt,
        value: opt.option_value,
        score: opt.score || 0,
      })),
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check admin session cookie
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question_text, question_type, options, category } = await request.json();

    // Update question
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .update({
        question_text,
        question_type,
        category: category || 'general',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (questionError) throw questionError;

    // Delete existing options
    await supabase.from('quiz_answer_options').delete().eq('question_id', id);

    // Insert new options with scores
    if (options && options.length > 0) {
      const optionsData = options.map((opt: any, idx: number) => ({
        question_id: id,
        option_text: opt.option_text,
        option_value: opt.value || `option_${idx}`,
        score: opt.score || 0,
        order_index: idx,
      }));

      const { error: optionsError } = await supabase
        .from('quiz_answer_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check admin session cookie
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete answer options first
    await supabase.from('quiz_answer_options').delete().eq('question_id', id);

    // Delete question
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Reorder remaining questions
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id')
      .order('order_index', { ascending: true });

    if (questions) {
      for (let i = 0; i < questions.length; i++) {
        await supabase
          .from('quiz_questions')
          .update({ order_index: i })
          .eq('id', questions[i].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
