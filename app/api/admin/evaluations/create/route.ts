import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface CreateEvaluationBody {
  submissionId: string
  fitnessLevelScore: number
  readinessScore: number
  recommendedProgram: string
  safetyConcerns: string
  personalizedRecommendations: string
  programDuration: string
  intensityLevel: string
  specialModifications: string
}

export async function POST(request: NextRequest) {
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

    const body: CreateEvaluationBody = await request.json()

    // Validate required fields
    if (!body.submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
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

    // Create evaluation record
    const { data, error } = await supabase
      .from('evaluation_results')
      .insert({
        submission_id: body.submissionId,
        fitness_level_score: body.fitnessLevelScore,
        readiness_score: body.readinessScore,
        recommended_program: body.recommendedProgram,
        safety_concerns: body.safetyConcerns,
        personalized_recommendations: body.personalizedRecommendations,
        program_duration: body.programDuration,
        intensity_level: body.intensityLevel,
        special_modifications: body.specialModifications,
        evaluation_completed_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create evaluation' },
        { status: 500 }
      )
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: adminSession.value,
      action: 'Created evaluation',
      submission_id: body.submissionId,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Evaluation created successfully',
        evaluationId: data?.[0]?.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Error creating evaluation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
