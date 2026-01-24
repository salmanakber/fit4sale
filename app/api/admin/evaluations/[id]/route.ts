import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch the evaluation with related submission
    const { data: evaluation, error } = await supabase
      .from('evaluation_results')
      .select(
        `id, submission_id, fitness_level_score, readiness_score, recommended_program, 
         safety_concerns, personalized_recommendations, program_duration, intensity_level, 
         special_modifications, evaluation_completed_at, 
         survey_submissions(patient_name, patient_email)`
      )
      .eq('id', params.id)
      .single()

    if (error || !evaluation) {
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { evaluation },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error fetching evaluation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
