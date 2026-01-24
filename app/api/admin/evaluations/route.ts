import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Fetch all evaluations with submission data
    const { data: evaluations, error } = await supabase
      .from('evaluation_results')
      .select(
        `id, submission_id, recommended_program, fitness_level_score, readiness_score, evaluation_completed_at, created_at, survey_submissions(patient_name)`
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: 500 }
      )
    }

    // Map the data to include patient_name
    const mappedEvaluations = evaluations?.map((evaluation: any) => ({
      ...evaluation,
      patient_name: evaluation.survey_submissions?.patient_name || 'Unknown',
    })) || []

    return NextResponse.json(
      { evaluations: mappedEvaluations },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error fetching evaluations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
