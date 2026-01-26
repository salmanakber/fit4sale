import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verification endpoint to check if benchmarks are properly configured and applied
 * This helps confirm that benchmarks match answer values correctly
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get all questions with their answer options
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        question_text,
        question_type,
        order_index,
        quiz_answer_options(id, option_text, option_value, order_index)
      `)
      .order('order_index', { ascending: true })

    if (questionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: questionsError },
        { status: 500 }
      )
    }

    // Get all benchmarks
    const { data: benchmarks, error: benchmarksError } = await supabase
      .from('benchmarks')
      .select('id, question_id, answer_value, score, category, benchmark_name')
      .order('question_id', { ascending: true })
      .order('score', { ascending: false })

    if (benchmarksError) {
      return NextResponse.json(
        { error: 'Failed to fetch benchmarks', details: benchmarksError },
        { status: 500 }
      )
    }

    // Create a map of benchmarks by question_id
    const benchmarksByQuestion = new Map<string, any[]>()
    benchmarks?.forEach((benchmark) => {
      const qId = benchmark.question_id
      if (!benchmarksByQuestion.has(qId)) {
        benchmarksByQuestion.set(qId, [])
      }
      benchmarksByQuestion.get(qId)!.push(benchmark)
    })

    // Verify each question has matching benchmarks
    const verificationResults = questions?.map((question) => {
      const questionBenchmarks = benchmarksByQuestion.get(question.id) || []
      const answerOptions = question.quiz_answer_options || []
      
      // Check which answer options have benchmarks
      const optionBenchmarkStatus = answerOptions.map((option: any) => {
        const matchingBenchmark = questionBenchmarks.find(
          (b) => b.answer_value === option.option_value
        )
        return {
          option_text: option.option_text,
          option_value: option.option_value,
          has_benchmark: !!matchingBenchmark,
          benchmark_score: matchingBenchmark?.score || null,
          benchmark_name: matchingBenchmark?.benchmark_name || null,
        }
      })

      // Find max benchmark score for this question
      const maxBenchmark = questionBenchmarks.length > 0
        ? Math.max(...questionBenchmarks.map((b) => b.score))
        : null

      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        order_index: question.order_index,
        total_benchmarks: questionBenchmarks.length,
        max_benchmark_score: maxBenchmark,
        options_with_benchmarks: optionBenchmarkStatus.filter((o) => o.has_benchmark).length,
        total_options: answerOptions.length,
        coverage: answerOptions.length > 0
          ? Math.round((optionBenchmarkStatus.filter((o) => o.has_benchmark).length / answerOptions.length) * 100)
          : 0,
        option_details: optionBenchmarkStatus,
        all_benchmarks: questionBenchmarks.map((b) => ({
          answer_value: b.answer_value,
          score: b.score,
          benchmark_name: b.benchmark_name,
          category: b.category,
        })),
      }
    }) || []

    // Summary statistics
    const summary = {
      total_questions: questions?.length || 0,
      questions_with_benchmarks: verificationResults.filter((q) => q.total_benchmarks > 0).length,
      questions_without_benchmarks: verificationResults.filter((q) => q.total_benchmarks === 0).length,
      total_benchmarks: benchmarks?.length || 0,
      average_coverage: verificationResults.length > 0
        ? Math.round(
            verificationResults.reduce((sum, q) => sum + q.coverage, 0) / verificationResults.length
          )
        : 0,
    }

    return NextResponse.json(
      {
        summary,
        questions: verificationResults,
        verification_status: summary.questions_without_benchmarks === 0
          ? 'All questions have benchmarks configured'
          : `${summary.questions_without_benchmarks} question(s) missing benchmarks`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error verifying benchmarks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
