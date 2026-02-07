import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface QuestionResult {
  questionId: string
  questionText: string
  category: string
  answerValue: string
  achievedScore: number
  benchmarkScore: number
  deviation: number
}

interface CategoryResult {
  category: string
  totalScore: number
  benchmarkScore: number
  percentage: number
  questionCount: number
}

interface EvaluationResult {
  submissionId: string
  participantName: string
  participantEmail: string
  submittedAt: string
  totalScore: number
  benchmarkScore: number
  deviation: number
  questionResults: QuestionResult[]
  categoryResults: CategoryResult[]
}

export async function GET() {
  try {
    // Fetch all submissions with their responses
    const { data: submissions, error: submissionsError } = await supabase
      .from('quiz_submissions')
      .select(`
        id,
        participant_name,
        participant_email,
        created_at,
        quiz_responses (
          id,
          quiz_question_id,
          answer_value,
          quiz_questions (
            id,
            question_text,
            category,
            quiz_answer_options (
              value,
              score
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (submissionsError) throw submissionsError

    // Fetch benchmarks
    const { data: benchmarks, error: benchmarksError } = await supabase
      .from('question_benchmark_results')
      .select('question_id, answer_value, benchmark_score')

    if (benchmarksError) throw benchmarksError

    // Process submissions into evaluation results
    const evaluationResults: EvaluationResult[] = submissions.map((submission: any) => {
      const questionResults: QuestionResult[] = []
      const categoryScoreMap = new Map<string, { total: number; benchmark: number; count: number }>()

      let totalAchievedScore = 0
      let totalBenchmarkScore = 0

      // Process each response
      submission.quiz_responses.forEach((response: any) => {
        const question = response.quiz_questions
        const questionId = question.id
        const questionText = question.question_text
        const category = question.category || 'general'

        // Find the score for this answer
        const answerOption = question.quiz_answer_options?.find(
          (opt: any) => opt.value === response.answer_value
        )
        const achievedScore = answerOption?.score || 0

        // Find benchmark score
        const benchmark = benchmarks?.find(
          (b: any) => b.question_id === questionId && b.answer_value === response.answer_value
        )
        const benchmarkScore = benchmark?.benchmark_score || 0

        const deviation = achievedScore - benchmarkScore

        questionResults.push({
          questionId,
          questionText,
          category,
          answerValue: response.answer_value,
          achievedScore,
          benchmarkScore,
          deviation,
        })

        totalAchievedScore += achievedScore
        totalBenchmarkScore += benchmarkScore

        // Aggregate by category
        const categoryData = categoryScoreMap.get(category) || { total: 0, benchmark: 0, count: 0 }
        categoryScoreMap.set(category, {
          total: categoryData.total + achievedScore,
          benchmark: categoryData.benchmark + benchmarkScore,
          count: categoryData.count + 1,
        })
      })

      // Build category results
      const categoryResults: CategoryResult[] = Array.from(categoryScoreMap.entries()).map(
        ([category, data]) => ({
          category,
          totalScore: Math.round(data.total / data.count),
          benchmarkScore: Math.round(data.benchmark / data.count),
          percentage: Math.round((data.total / data.benchmark) * 100),
          questionCount: data.count,
        })
      )

      return {
        submissionId: submission.id,
        participantName: submission.participant_name,
        participantEmail: submission.participant_email,
        submittedAt: submission.created_at,
        totalScore: totalAchievedScore,
        benchmarkScore: totalBenchmarkScore,
        deviation: totalAchievedScore - totalBenchmarkScore,
        questionResults,
        categoryResults,
      }
    })

    return NextResponse.json(evaluationResults)
  } catch (error) {
    console.error('[v0] Error fetching evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}
