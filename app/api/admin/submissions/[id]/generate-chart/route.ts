import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateBenchmarkChartPNG } from '@/lib/chart-to-png'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
          setAll(cookiesToSet: any[]) {
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

    const { id } = await params

    // Get the submission with company name and evaluation results
    const { data: submission, error: submitError } = await supabase
      .from('quiz_submissions')
      .select(
        `id, company_name, evaluation_results(
          id, submission_id, question_benchmark_results(
            question_id, actual_score, benchmark_score, survey_question(question_text)
          )
        )`
      )
      .eq('id', id)
      .single()

    if (submitError || !submission) {
      console.error('[v0] Error fetching submission:', submitError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Get the evaluation results
    const evaluation = submission.evaluation_results as any
    if (!evaluation || evaluation.length === 0) {
      return NextResponse.json(
        { error: 'No evaluation results found' },
        { status: 404 }
      )
    }

    const evalResult = evaluation[0]
    const benchmarkResults = evalResult.question_benchmark_results || []

    // Transform data for chart
    const chartData = benchmarkResults.map((result: any) => ({
      questionName: result.survey_question?.question_text || 'Unknown',
      score: result.actual_score || 0,
      benchmark: result.benchmark_score || 0,
    }))

    if (chartData.length === 0) {
      return NextResponse.json(
        { error: 'No benchmark data available' },
        { status: 404 }
      )
    }

    // Generate PNG
    const pngBuffer = await generateBenchmarkChartPNG(
      chartData,
      submission.company_name || 'Musterfirma'
    )

    // Return as PNG image
    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="benchmark-report.png"',
      },
    })
  } catch (error) {
    console.error('[v0] Error generating chart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
