import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateEvaluationEmail } from '@/lib/email-service'
import { sendResendEmail } from '@/lib/resend'

interface SendEvaluationEmailBody {
  evaluationId: string
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
         special_modifications, safety_concerns, submission_id, quiz_submissions(patient_name, patient_email, participant_email, full_evaluation_approved)`
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
    const submission = evaluation.quiz_submissions as any
    const patientName = submission?.patient_name || 'Teilnehmer/in'
    const patientEmail = submission?.patient_email || submission?.participant_email
    
    // Fetch full user info for proper greeting
    const { data: submissionData } = await supabase
      .from('quiz_submissions')
      .select('title, first_name, last_name')
      .eq('id', evaluation.submission_id)
      .single()
    
    const title = submissionData?.title || null
    const firstName = submissionData?.first_name || null
    const lastName = submissionData?.last_name || null
    const greeting = title && lastName
      ? `Sehr ${title === 'Herr' ? 'geehrter' : 'geehrte'} ${lastName}`
      : firstName
        ? `Hallo ${firstName}`
        : 'Hallo'

    if (!patientEmail) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse nicht gefunden' },
        { status: 400 }
      )
    }

    if (!submission?.full_evaluation_approved) {
      return NextResponse.json(
        { error: 'Noch nicht freigegeben' },
        { status: 400 }
      )
    }

    // Generate email template with proper greeting
    const emailTemplate = generateEvaluationEmail({
      greeting,
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
    const emailResult = await sendResendEmail({
      to: patientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    })

    if (!emailResult.success) {
      console.error('[v0] Failed to send email to:', patientEmail, emailResult.error)
      await supabase.from('email_audit_logs').insert({
        submission_id: evaluation.submission_id,
        recipient_email: patientEmail,
        email_type: 'full',
        subject: emailTemplate.subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: 'failed',
        admin_notified: true,
      })
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Audit log (notification trail)
    await supabase.from('email_audit_logs').insert({
      submission_id: evaluation.submission_id,
      recipient_email: patientEmail,
      email_type: 'full',
      subject: emailTemplate.subject,
      sender_email: 'aschwanden@kmu-beratungen.ch',
      status: 'sent',
      admin_notified: true,
    })

    // Log the action
    await supabase.from('admin_logs').insert({
      admin_id: adminSession.value,
      action: 'Vollständige Auswertung per E-Mail versendet',
      submission_id: evaluation.submission_id,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'E-Mail erfolgreich versendet',
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
