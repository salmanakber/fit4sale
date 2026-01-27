import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/resend'

// --- Helper Functions ---

async function calculateEvaluation(supabase: any, submissionId: string, answers: any) {
  // Fetch benchmarks for all questions
  const { data: benchmarks } = await supabase
    .from('benchmarks')
    .select('question_id, answer_value, score, category')

  // Calculate total score based on answers and benchmarks
  let totalAchievedScore = 0
  let totalBenchmarkScore = 0
  const questionScores: Record<string, number> = {}
  const questionBreakdown: Array<{
    question_id: string
    benchmark_score: number
    achieved_score: number
    deviation: number
    answer_value: string | string[]
  }> = []
  const categoryScores: Record<string, { total: number; count: number }> = {}

  // First, calculate benchmark scores (max possible score) per question
  const questionBenchmarks: Record<string, number> = {}
  if (benchmarks) {
    for (const benchmark of benchmarks) {
      const qId = benchmark.question_id
      if (!questionBenchmarks[qId] || benchmark.score > questionBenchmarks[qId]) {
        questionBenchmarks[qId] = benchmark.score
      }
    }
  }

  // Process each answer and validate against benchmarks
  for (const [questionId, answer] of Object.entries(answers)) {
    if (questionId === 'participant_email') continue

    const relevantBenchmarks = benchmarks?.filter(
      (b: any) => b.question_id === questionId
    ) || []

    // Log if no benchmarks found for this question (for debugging)
    if (relevantBenchmarks.length === 0) {
      console.warn(`[v0] No benchmarks found for question ${questionId}`)
    }

    // Get benchmark score (max possible for this question)
    const benchmarkScore = questionBenchmarks[questionId] || 0
    totalBenchmarkScore += benchmarkScore

    let achievedScore = 0
    let answerValue: string | string[] = ''
    let matchedBenchmark: any = null

    if (Array.isArray(answer)) {
      // Multiple choice - average the scores
      const scores = answer
        .map((a: string) => {
          const benchmark = relevantBenchmarks.find((b: any) => b.answer_value === a)
          if (benchmark) {
            matchedBenchmark = benchmark
          } else {
            console.warn(`[v0] No benchmark found for answer value "${a}" in question ${questionId}`)
          }
          return benchmark?.score || 0
        })
        .filter((s: number) => s > 0)

      achievedScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      answerValue = answer
    } else {
      // Single answer
      const benchmark = relevantBenchmarks.find((b: any) => b.answer_value === answer)
      if (benchmark) {
        matchedBenchmark = benchmark
        achievedScore = benchmark.score
      } else {
        console.warn(`[v0] No benchmark found for answer value "${answer}" in question ${questionId}. Available benchmarks:`, 
          relevantBenchmarks.map((b: any) => b.answer_value))
        achievedScore = 0
      }
      answerValue = answer as string
    }

    // Calculate deviation (benchmark - achieved)
    const deviation = benchmarkScore - achievedScore

    // Store per-question result
    totalAchievedScore += achievedScore
    questionScores[questionId] = achievedScore

    questionBreakdown.push({
      question_id: questionId,
      benchmark_score: benchmarkScore,
      achieved_score: achievedScore,
      deviation: deviation,
      answer_value: answerValue,
    })

    // Store in database for per-question tracking
    const answerValueForDb = Array.isArray(answerValue) 
      ? JSON.stringify(answerValue) 
      : (answerValue || '')
    
    await supabase
      .from('question_benchmark_results')
      .upsert({
        submission_id: submissionId,
        question_id: questionId,
        answer_value: answerValueForDb,
        benchmark_score: benchmarkScore,
        achieved_score: achievedScore,
        deviation: deviation,
        updated_at: new Date().toISOString(),
      })

    // Category/section rollup
    const category = relevantBenchmarks.find((b: any) => b?.category)?.category
    if (category) {
      if (!categoryScores[category]) categoryScores[category] = { total: 0, count: 0 }
      categoryScores[category].total += achievedScore
      categoryScores[category].count += 1
    }
  }

  // Calculate final average score
  const questionCount = Object.keys(questionScores).length
  const finalScore = questionCount > 0 ? Math.round(totalAchievedScore / questionCount) : 0

  // Calculate overall deviation
  const overallDeviation = totalBenchmarkScore - totalAchievedScore

  // Calculate category averages
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
      total_benchmark_score: totalBenchmarkScore,
      total_achieved_score: totalAchievedScore,
      overall_deviation: overallDeviation,
      section_scores: { byQuestion: questionScores, byCategory: categoryAverages },
      question_breakdown: questionBreakdown,
      recommendations: generateRecommendations(finalScore),
      updated_at: new Date().toISOString(),
    })

  if (cacheError) {
    console.error('[v0] Error caching evaluation:', cacheError)
  }

  return {
    totalScore: finalScore,
    totalBenchmarkScore,
    totalAchievedScore,
    overallDeviation,
    questionScores,
    questionBreakdown,
    categoryScores: categoryAverages,
  }
}

function generateRecommendations(score: number): string {
  if (score >= 80) return 'Sehr gute Verkaufs-Readiness: Sie sind gut positioniert – nächste Optimierungen bringen schnell messbare Effekte.'
  if (score >= 60) return 'Gute Verkaufs-Readiness: Solide Basis – mit gezielten Anpassungen lässt sich der Abschluss- und Lead-Flow verbessern.'
  if (score >= 40) return 'Mittlere Verkaufs-Readiness: Es gibt klare Hebel – strukturierte Maßnahmen erhöhen Conversion und Konsistenz.'
  return 'Niedrige Verkaufs-Readiness: Wir empfehlen, die Grundlagen (Angebot, Zielgruppe, Prozess) zuerst sauber zu definieren.'
}

function generateGermanGreeting(title: string | null, firstName: string | null, lastName: string | null): string {
  if (title && lastName) {
    const titleText = title === 'Herr' ? 'geehrter' : 'geehrte'
    return `Sehr ${titleText} ${lastName}`
  }
  if (firstName) return `Hallo ${firstName}`
  return 'Hallo'
}

// --- Main API Handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const participantEmail = body.participant_email
    const title = body.title || null
    const firstName = body.first_name || null
    const lastName = body.last_name || null
    const answers = body.answers || body

    const participantName = firstName && lastName 
      ? `${firstName} ${lastName}`.trim()
      : body.participant_name || null

    console.log(body)

    if (!participantEmail || !answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'Email and answers are required' }, { status: 400 })
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('[v0] Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Check for existing submission to prevent duplicates
    const { data: existingSubmission } = await supabase
      .from('quiz_submissions')
      .select('id, submitted_at')
      .eq('participant_email', participantEmail)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSubmission?.id) {
      return NextResponse.json({ error: 'A submission with this email already exists' }, { status: 409 })
    }

    // Insert new submission
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
      return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 })
    }

    const submissionId = submission?.[0]?.id
    if (!submissionId) {
      return NextResponse.json({ error: 'Failed to get submission ID' }, { status: 500 })
    }

    // Calculate evaluation
    const evaluation = await calculateEvaluation(supabase, submissionId, answers)

    // --- Send Partial Report Email ---
    try {
      // Load cached evaluation details
      const { data: cached } = await supabase
        .from('evaluation_results_cache')
        .select('total_score, section_scores, recommendations')
        .eq('submission_id', submissionId)
        .single()

      const totalScore = cached?.total_score ?? evaluation.totalScore
      const byCategory = (cached?.section_scores as any)?.byCategory as Record<string, number> | undefined
      const recommendationText = cached?.recommendations as string | undefined

      const categoryHtml = byCategory
        ? `
          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Bereiche</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(byCategory)
                .map(([cat, val]) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${val}/100</strong></td>
                    </tr>
                  `).join('')}
            </table>
          </div>`
        : ''

      const recommendationHtml = recommendationText
        ? `<p><strong>Kurze Einschätzung:</strong> ${recommendationText}</p>`
        : ''

      const emailSubject = 'Fit4Sale – Vorläufige Auswertung';
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
                <p>Wir prüfen Ihre vollständige Auswertung manuell und senden Ihnen anschließend die detaillierte Auswertung per E-Mail.</p>

                <p>Fragen? Schreiben Sie uns an aschwanden@kmu-beratungen.ch</p>
                <p>Mit freundlichen Grüßen,<br />KMU-Beratungen</p>
              </div>
              <div class="footer">
                <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
                <p>Die vollständige Auswertung wird nach manueller Freigabe per E-Mail versendet.</p>
                <p>Bei Fragen: aschwanden@kmu-beratungen.ch</p>
              </div>
            </div>
          </body>
        </html>
      `

      const emailResult = await sendResendEmail({
        to: participantEmail,
        subject: emailSubject,
        html,
      })

      if (emailResult.success) {
        await supabase
          .from('quiz_submissions')
          .update({ partial_evaluation_sent: true })
          .eq('id', submissionId)

        await supabase.from('admin_logs').insert({
          admin_id: null,
          action: `Partial report email sent to participant (${participantEmail})`,
          submission_id: submissionId,
        })
      } else {
        console.error('[v0] Failed to send partial email:', emailResult.error)
        
        await supabase.from('admin_logs').insert({
          admin_id: null,
          action: `Fehler beim Versand der vorläufigen Auswertung (${participantEmail})`,
          submission_id: submissionId,
        })
      }

      // Audit log always happens
      await supabase.from('email_audit_logs').insert({
        submission_id: submissionId,
        recipient_email: participantEmail,
        email_type: 'partial',
        subject: emailSubject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: emailResult.success ? 'sent' : 'failed',
        admin_notified: true,
      })

    } catch (emailError) {
      console.error('[v0] Error sending partial email:', emailError)
    }

    // --- Send Confirmation Email (Simplified) ---
    try {
      const confirmationSubject = 'Fit4Sale – Sales-Check eingereicht'
      const confirmationHtml = `
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
                <p>Sie erhalten eine <strong>vorläufige Auswertung</strong> automatisch per E-Mail.</p>
                <p>Freundliche Grüße<br>KMU-Beratungen</p>
              </div>
              <div class="footer">
                <p>Dies ist eine automatisierte Nachricht.</p>
              </div>
            </div>
          </body>
        </html>
      `

      const confResult = await sendResendEmail({
        to: participantEmail,
        subject: confirmationSubject,
        html: confirmationHtml,
      })

      await supabase.from('email_audit_logs').insert({
        submission_id: submissionId,
        recipient_email: participantEmail,
        email_type: 'confirmation',
        subject: confirmationSubject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: confResult.success ? 'sent' : 'failed',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
