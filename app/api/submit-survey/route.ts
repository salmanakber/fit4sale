import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/resend'

async function calculateEvaluation(supabase: any, submissionId: string, answers: any) {
  // Fetch benchmarks for all questions
  const { data: benchmarks } = await supabase
    .from('benchmarks')
    .select('question_id, answer_value, score, category')

  // Calculate total score based on answers and benchmarks
  let totalScore = 0
  const questionScores: Record<string, number> = {}
  const categoryScores: Record<string, { total: number; count: number }> = {}

  for (const [questionId, answer] of Object.entries(answers)) {
    if (questionId === 'participant_email') continue

    const relevantBenchmarks = benchmarks?.filter(
      (b: any) => b.question_id === questionId
    ) || []

    if (Array.isArray(answer)) {
      // Multiple choice - average the scores
      const scores = answer
        .map((a: string) => {
          const benchmark = relevantBenchmarks.find((b: any) => b.answer_value === a)
          return benchmark?.score || 0
        })
        .filter((s: number) => s > 0)

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      totalScore += avgScore
      questionScores[questionId] = avgScore
    } else {
      // Single answer
      const benchmark = relevantBenchmarks.find((b: any) => b.answer_value === answer)
      const score = benchmark?.score || 0
      totalScore += score
      questionScores[questionId] = score
    }

    // Category/section rollup (optional; depends on benchmarks having a category)
    const category = relevantBenchmarks.find((b: any) => b?.category)?.category
    if (category) {
      if (!categoryScores[category]) categoryScores[category] = { total: 0, count: 0 }
      categoryScores[category].total += questionScores[questionId] || 0
      categoryScores[category].count += 1
    }
  }

  const finalScore = Math.round(totalScore / Object.keys(questionScores).length) || 0
  const categoryAverages: Record<string, number> = {}
  for (const [cat, agg] of Object.entries(categoryScores)) {
    categoryAverages[cat] = agg.count ? Math.round(agg.total / agg.count) : 0
  }

  // Store evaluation results in cache
  const { error: cacheError } = await supabase
    .from('evaluation_results_cache')
    .upsert({
      submission_id: submissionId,
      total_score: finalScore,
      section_scores: { byQuestion: questionScores, byCategory: categoryAverages },
      recommendations: generateRecommendations(finalScore),
    })

  if (cacheError) {
    console.error('[v0] Error caching evaluation:', cacheError)
  }

  return { totalScore: finalScore, questionScores, categoryScores: categoryAverages }
}

function generateRecommendations(score: number): string {
  if (score >= 80) {
    return 'Sehr gut: Ihr Vertrieb ist stark aufgestellt – gezielte Optimierungen bringen schnell Wirkung.'
  } else if (score >= 60) {
    return 'Gut: Solide Basis – mit klaren Maßnahmen steigern Sie Abschlussquote und Prozessqualität.'
  } else if (score >= 40) {
    return 'Mittel: Es gibt mehrere Hebel – strukturierte Schritte erhöhen Konsistenz und Conversion.'
  } else {
    return 'Ausbaufähig: Wir empfehlen, Angebot/Zielgruppe/Prozess zuerst sauber zu definieren und zu standardisieren.'
  }
}

function generateGermanGreeting(title: string | null, firstName: string | null, lastName: string | null): string {
  // Formal: "Sehr geehrte(r) [Title] [Last Name]"
  if (title && lastName) {
    const titleText = title === 'Herr' ? 'geehrter' : 'geehrte'
    return `Sehr ${titleText} ${lastName}`
  }
  // Informal: "Hallo [First Name]"
  if (firstName) {
    return `Hallo ${firstName}`
  }
  // Fallback
  return 'Hallo'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const participantEmail = body.participant_email
    const title = body.title || null // 'Herr' | 'Frau' | null
    const firstName = body.first_name || null
    const lastName = body.last_name || null
    const answers = body.answers || body

    // Construct full name for backward compatibility
    const participantName = firstName && lastName 
      ? `${firstName} ${lastName}`.trim()
      : body.participant_name || null

    console.log(body)

    // Validate required fields
    if (!participantEmail || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Email and answers are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              ;(cookiesToSet as any[]).forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              console.error('[v0] Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Insert quiz submission with email
    // Prevent accidental duplicate spam (same email submitted repeatedly)
    const { data: existingSubmission } = await supabase
      .from('quiz_submissions')
      .select('id, submitted_at')
      .eq('participant_email', participantEmail)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSubmission?.id) {
      return NextResponse.json(
        { error: 'A submission with this email already exists' },
        { status: 409 }
      )
    }

    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .insert({
        patient_name: participantName || null,
        patient_email: participantEmail,
        participant_email: participantEmail,
        title: title,
        first_name: firstName,
        last_name: lastName,
        answers: answers,
        submitted_at: new Date().toISOString(),
        partial_evaluation_sent: false,
        full_evaluation_pending: true,
      })
      .select()

    if (submissionError) {
      console.error('[v0] Database error:', submissionError)
      return NextResponse.json(
        { error: 'Failed to submit survey' },
        { status: 500 }
      )
    }

    const submissionId = submission?.[0]?.id
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Failed to get submission ID' },
        { status: 500 }
      )
    }

    // Calculate evaluation automatically
    const evaluation = await calculateEvaluation(supabase, submissionId, answers)

    // Send partial evaluation email automatically (direct Resend call + audit log)
    try {
      // Load cached evaluation details for richer email content (category breakdown + recommendation)
      const { data: cached } = await supabase
        .from('evaluation_results_cache')
        .select('total_score, section_scores, recommendations')
        .eq('submission_id', submissionId)
        .single()

      const totalScore = cached?.total_score ?? evaluation.totalScore
      const byCategory = (cached?.section_scores as any)?.byCategory as
        | Record<string, number>
        | undefined
      const recommendationText = cached?.recommendations as string | undefined

      const categoryHtml = byCategory
        ? `
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Teilbereiche</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(byCategory)
                .map(
                  ([cat, val]) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${val}/100</strong></td>
                    </tr>
                  `
                )
                .join('')}
            </table>
          </div>
        `
        : ''

      const recommendationHtml = recommendationText
        ? `<p><strong>Kurze Einschätzung:</strong> ${recommendationText}</p>`
        : ''

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0B1120; color: white; padding: 20px; text-align: center; border-radius: 8px; }
              .score-card { background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .score { font-size: 48px; font-weight: bold; color: #0B1120; }
              .content { padding: 20px 0; }
              .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Fit4Sale – Vorläufige Auswertung</h1>
              </div>
              <div class="content">
                <p>${generateGermanGreeting(title, firstName, lastName)},</p>
                <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check. Wir haben Ihre Angaben ausgewertet und eine vorläufige Auswertung erstellt.</p>
                
                <div class="score-card">
                  <p>Ihr Score:</p>
                  <div class="score">${totalScore}/100</div>
                </div>

                ${recommendationHtml}
                ${categoryHtml}

                <p><strong>Nächste Schritte:</strong></p>
                <p>Die vollständige Auswertung wird nach manueller Freigabe per E-Mail versendet.</p>
                
                <p>Bei Fragen: aschwanden@kmu-beratungen.ch</p>
                
                <p>Freundliche Grüße<br>KMU-Beratungen</p>
              </div>
              <div class="footer">
                <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
              </div>
            </div>
          </body>
        </html>
      `

      const subject = 'Fit4Sale – Vorläufige Auswertung'
      const emailResult = await sendResendEmail({
        to: participantEmail,
        subject,
        html,
      })

      if (emailResult.success) {
        await supabase
          .from('quiz_submissions')
          .update({ partial_evaluation_sent: true })
          .eq('id', submissionId)
      }

      await supabase.from('email_audit_logs').insert({
        submission_id: submissionId,
        recipient_email: participantEmail,
        email_type: 'partial',
        subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: emailResult.success ? 'sent' : 'failed',
        admin_notified: true,
      })

      await supabase.from('admin_logs').insert({
        admin_id: null,
        action: emailResult.success
          ? `Vorläufige Auswertung per E-Mail versendet (${participantEmail})`
          : `Fehler beim Versand der vorläufigen Auswertung (${participantEmail})`,
        submission_id: submissionId,
      })
    } catch (emailError) {
      console.error('[v0] Error sending partial evaluation email:', emailError)
    }

    // Send confirmation email (direct Resend call + audit log)
    try {
      const subject = 'Fit4Sale – Sales-Check eingereicht'
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0B1120; color: white; padding: 20px; text-align: center; border-radius: 8px; }
              .content { padding: 20px 0; }
              .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Fit4Sale – Eingabe erhalten</h1>
              </div>
              <div class="content">
                <p>${generateGermanGreeting(title, firstName, lastName)},</p>
                <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.</p>
                <p><strong>Ihre Eingabenummer:</strong> ${submissionId}</p>
                <p>Sie erhalten eine <strong>vorläufige Auswertung</strong> automatisch per E-Mail. Die <strong>vollständige Auswertung</strong> wird nach manueller Freigabe versendet.</p>
                <p>Bei Fragen: aschwanden@kmu-beratungen.ch</p>
                <p>Freundliche Grüße<br>KMU-Beratungen</p>
              </div>
              <div class="footer">
                <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
              </div>
            </div>
          </body>
        </html>
      `

      const emailResult = await sendResendEmail({
        to: participantEmail,
        subject,
        html,
      })

      await supabase.from('email_audit_logs').insert({
        submission_id: submissionId,
        recipient_email: participantEmail,
        email_type: 'confirmation',
        subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: emailResult.success ? 'sent' : 'failed',
        admin_notified: true,
      })
    } catch (emailError) {
      console.error('[v0] Error sending confirmation email:', emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Eingabe erfolgreich. Vorläufige Auswertung wurde per E-Mail versendet.',
        submissionId,
        evaluation,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Error processing survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
