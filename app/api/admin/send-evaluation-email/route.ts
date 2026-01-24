import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateEvaluationEmail } from '@/lib/email-service'

interface SendEvaluationEmailBody {
  evaluationId: string
}

// Stub implementation - Replace with your email service
async function sendEmail(to: string, emailData: { subject: string; html: string; text: string }) {
  // TODO: Implement actual email sending
  console.log('[v0] Email would be sent to:', to)
  console.log('[v0] Subject:', emailData.subject)
  return true
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

    const body: SendEvaluationEmailBody = await request.json()

    if (!body.evaluationId) {
      return NextResponse.json(
        { error: 'Missing evaluation ID' },
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

    // Get evaluation and submission data
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluation_results')
      .select(
        `id, recommended_program, intensity_level, program_duration, personalized_recommendations, 
         special_modifications, safety_concerns, survey_submissions(patient_name, patient_email)`
      )
      .eq('id', body.evaluationId)
      .single()

    if (evalError || !evaluation) {
      console.error('[v0] Database error:', evalError)
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    // Extract data
    const submission = evaluation.survey_submissions as any
    const patientName = submission?.patient_name || 'Customer'
    const patientEmail = submission?.patient_email

    if (!patientEmail) {
      return NextResponse.json(
        { error: 'Patient email not found' },
        { status: 400 }
      )
    }

    // Generate email template
    const emailTemplate = generateEvaluationEmail({
      patientName,
      patientEmail,
      recommendedProgram: evaluation.recommended_program || '',
      intensityLevel: evaluation.intensity_level || '',
      programDuration: evaluation.program_duration || '',
      personalizedRecommendations:
        evaluation.personalized_recommendations || '',
      safetyConcerns: evaluation.safety_concerns || '',
      specialModifications: evaluation.special_modifications || '',
    })

    // Send email
    const emailSent = await sendEmail(patientEmail, emailTemplate)

    if (!emailSent) {
      console.error('[v0] Failed to send email to:', patientEmail)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from('admin_logs').insert({
      admin_id: adminSession.value,
      action: 'Sent evaluation email',
      submission_id: evaluation.submission_id,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Evaluation email sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error sending email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
