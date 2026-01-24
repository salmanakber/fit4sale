import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    // Check admin authentication
    if (!adminSession?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }



    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              console.error('[v0] Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Fetch all submissions
    const { data: submissions, error } = await supabase
      .from('quiz_submissions')
      .select(
        'id, patient_name, patient_email, participant_email, created_at, submitted_at, partial_evaluation_sent, full_evaluation_pending, full_evaluation_approved'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { submissions: submissions || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
