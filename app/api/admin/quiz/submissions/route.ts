'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: submissions, error } = await supabase
      .from('quiz_submissions')
      .select('id, answers, submitted_at')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      submissions: submissions || [],
    });
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
