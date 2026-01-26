import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get per-question benchmark results
    const { data: questionResults, error: questionError } = await supabase
      .from('question_benchmark_results')
      .select('*')
      .eq('submission_id', id)
      .order('question_id')

    if (questionError) {
      console.error('[v0] Error fetching question benchmark results:', questionError)
    }

    // Get evaluation cache with totals
    const { data: cache, error: cacheError } = await supabase
      .from('evaluation_results_cache')
      .select('total_score, total_benchmark_score, total_achieved_score, overall_deviation, question_breakdown')
      .eq('submission_id', id)
      .single()

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.error('[v0] Error fetching evaluation cache:', cacheError)
    }

    // Get question details for better readability
    const questionIds = questionResults?.map((r) => r.question_id) || []
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, question_text, order_index')
      .in('id', questionIds)

    const questionMap = new Map(questions?.map((q) => [q.id, q]) || [])

    // Helper to parse answer_value (may be JSON string for arrays)
    const parseAnswerValue = (value: string): string | string[] => {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : value
      } catch {
        return value
      }
    }

    // Combine results with question details
    const structuredResults = {
      summary: {
        total_benchmark_score: cache?.total_benchmark_score || 0,
        total_achieved_score: cache?.total_achieved_score || 0,
        overall_deviation: cache?.overall_deviation || 0,
        total_score: cache?.total_score || 0,
        question_count: questionResults?.length || 0,
      },
      questions: (questionResults || []).map((result) => ({
        question_id: result.question_id,
        question_text: questionMap.get(result.question_id)?.question_text || 'Unknown Question',
        order_index: questionMap.get(result.question_id)?.order_index || 0,
        answer_value: parseAnswerValue(result.answer_value),
        benchmark_score: result.benchmark_score,
        achieved_score: result.achieved_score,
        deviation: result.deviation,
      })),
      breakdown: cache?.question_breakdown || [],
    }

    return NextResponse.json(structuredResults, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching benchmark results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
