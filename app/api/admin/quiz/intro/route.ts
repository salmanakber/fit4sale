'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    const { data, error } = await supabase
      .from('quiz_intro_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default if not set
    if (!data) {
      return NextResponse.json({
        title: 'Fit4Sale Sales-Check',
        description: 'Beantworten Sie ein paar Fragen zu Ihrem Vertrieb – Sie erhalten eine vorläufige Auswertung per E-Mail.',
        description: 'Beantworten Sie ein paar Fragen zu Ihrem Sales-Prozess – Sie erhalten eine vorläufige Auswertung per E-Mail.',
        estimated_time: '8-10 minutes',
        button_text: 'Start',
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching intro settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intro settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { title, description, estimated_time, button_text } =
      await request.json();

    // Get existing settings
    const { data: existing } = await supabase
      .from('quiz_intro_settings')
      .select('id')
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from('quiz_intro_settings')
        .update({
          title,
          description,
          estimated_time,
          button_text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('quiz_intro_settings')
        .insert({
          title,
          description,
          estimated_time,
          button_text,
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating intro settings:', error);
    return NextResponse.json(
      { error: 'Failed to update intro settings.  ' },
      { status: 500 }
    );
  }
}
