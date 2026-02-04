import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface BenchmarkData {
  question_name: string
  question_id: string
  benchmark_score: number
  achieved_score: number
  is_selected_benchmark: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    console.log('submission ___ Id', id)

    // Fetch submission
    const { data: submission } = await supabase
      .from('quiz_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Fetch all questions with their benchmarks
    const { data: questions } = await supabase.from('questions').select('*')
    const { data: benchmarks } = await supabase.from('benchmarks').select('*')
    const { data: selectedBenchmarks } = await supabase
      .from('question_benchmark_results')
      .select('*')
      .eq('submission_id', id)

    // Build benchmark report data
    const benchmarkData: BenchmarkData[] = []
    const questionMap = new Map((questions || []).map((q: any) => [q.id, q]))
    const selectedBenchmarkSet = new Set((selectedBenchmarks || []).map((b: any) => b.benchmark_id))

    // Group benchmarks by question and calculate achieved vs benchmark
    const benchmarksByQuestion: Record<string, any[]> = {}
    if (benchmarks) {
      for (const benchmark of benchmarks) {
        if (!benchmarksByQuestion[benchmark.question_id]) {
          benchmarksByQuestion[benchmark.question_id] = []
        }
        benchmarksByQuestion[benchmark.question_id].push(benchmark)
      }
    }

    // Build the report
    const answers = submission.answers || {}
    for (const [questionId, answer] of Object.entries(answers)) {
      if (questionId === 'participant_email') continue

      const question = questionMap.get(questionId)
      const questionBenchmarks = benchmarksByQuestion[questionId] || []

      if (!question || questionBenchmarks.length === 0) continue

      // Get max benchmark score for this question
      const maxBenchmarkScore = Math.max(
        0,
        ...questionBenchmarks.map((b: any) => b.score || 0)
      )

      // Calculate achieved score
      let achievedScore = 0
      if (Array.isArray(answer)) {
        const scores = answer
          .map((a: string) => {
            const benchmark = questionBenchmarks.find((b: any) => b.answer_value === a)
            return benchmark?.score || 0
          })
          .filter((s: number) => s > 0)
        achievedScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      } else {
        const benchmark = questionBenchmarks.find((b: any) => b.answer_value === answer)
        achievedScore = benchmark?.score || 0
      }

      // Check if any selected benchmark exists for this question
      const isSelectedBenchmark = questionBenchmarks.some((b: any) =>
        selectedBenchmarkSet.has(b.id)
      )

      benchmarkData.push({
        question_name: question.question_text || question.label || questionId,
        question_id: questionId,
        benchmark_score: maxBenchmarkScore,
        achieved_score: achievedScore,
        is_selected_benchmark: isSelectedBenchmark,
      })
    }

    return NextResponse.json({
      submission_id: id,
      submission_name: submission.patient_name || submission.first_name,
      benchmark_data: benchmarkData,
    })
  } catch (error) {
    console.error('[v0] Error generating benchmark report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
