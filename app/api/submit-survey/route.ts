import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const participantEmail = body.participant_email
    const participantName = body.participant_name
    const answers = body.answers || body
    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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

    // Send partial evaluation email automatically
    try {
      await fetch(`${origin}/api/send-partial-evaluation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          participantEmail,
          score: evaluation.totalScore,
        }),
      })
    } catch (emailError) {
      console.error('[v0] Error sending partial evaluation email:', emailError)
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
