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

    // Initialize Supabase with SERVICE ROLE to bypass RLS policies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 1. Fetch Submission Info
    const { data: submission, error: subError } = await supabase
      .from('quiz_submissions')
      .select('patient_name, first_name, id')
      .eq('id', id)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 2. Fetch Stored Results
    const { data: storedResults, error: resError } = await supabase
      .from('question_benchmark_results')
      .select('*')
      .eq('submission_id', id)

    if (resError) {
      return NextResponse.json({ error: 'Error fetching results' }, { status: 500 })
    }

    // 3. Fetch All Benchmarks 
    const { data: allBenchmarks } = await supabase
      .from('benchmarks')
      .select('id, question_id, score')

    // --- ID Resolution ---

    // A. Identify all unique Question IDs involved
    const relevantQuestionIds = new Set<string>()

    storedResults?.forEach((res: any) => {
      if (res.question_id) {
        relevantQuestionIds.add(String(res.question_id))
      }
      else if (res.benchmark_id && allBenchmarks) {
        const bDef = allBenchmarks.find((b: any) => String(b.id) === String(res.benchmark_id))
        if (bDef?.question_id) {
          relevantQuestionIds.add(String(bDef.question_id))
        }
      }
    })

    const idsToFetch = Array.from(relevantQuestionIds).filter(Boolean)

    // B. Fetch Question Names (SMART FALLBACK STRATEGY)
    let questionMap = new Map<string, any>()

    if (idsToFetch.length > 0) {

      // Attempt 1: Try 'quiz_questions' table
      const { data: quizQuestionsData } = await supabase
        .from('quiz_questions')
        .select('id, question_text, label')
        .in('id', idsToFetch)

      if (quizQuestionsData) {
        quizQuestionsData.forEach((q: any) => questionMap.set(String(q.id), q))
      }

      // Attempt 2: If we are missing names, try 'questions' table
      // (This fixes the issue if the data is actually in the 'questions' table)
      const missingIds = idsToFetch.filter(id => !questionMap.has(id))

      if (missingIds.length > 0) {
        const { data: standardQuestionsData } = await supabase
          .from('questions')
          .select('id, question_text, label')
          .in('id', missingIds)

        if (standardQuestionsData) {
          standardQuestionsData.forEach((q: any) => questionMap.set(String(q.id), q))
        }
      }
    }

    // C. Group Benchmarks by Question (for max score calc)
    const benchmarksByQuestion: Record<string, any[]> = {}
    allBenchmarks?.forEach((b: any) => {
      const bQId = String(b.question_id)
      if (!benchmarksByQuestion[bQId]) benchmarksByQuestion[bQId] = []
      benchmarksByQuestion[bQId].push(b)
    })

    // --- Report Construction ---

    const processedResults: Record<string, { achieved: number, isSelected: boolean }> = {}

    storedResults?.forEach((res: any) => {
      let qId: string | null = res.question_id ? String(res.question_id) : null

      if (!qId && res.benchmark_id && allBenchmarks) {
        const bDef = allBenchmarks.find((b: any) => String(b.id) === String(res.benchmark_id))
        qId = bDef?.question_id ? String(bDef.question_id) : null
      }

      if (qId) {
        if (!processedResults[qId]) {
          processedResults[qId] = { achieved: 0, isSelected: false }
        }

        let scoreVal = res.score
        if (scoreVal === undefined && res.benchmark_id && allBenchmarks) {
          const bDef = allBenchmarks.find((b: any) => String(b.id) === String(res.benchmark_id))
          scoreVal = bDef?.score || 0
        }

        processedResults[qId].achieved += (scoreVal || 0)
        processedResults[qId].isSelected = true
      }
    })

    const finalReport = Object.keys(processedResults).map((qId) => {
      const qStats = processedResults[qId]
      const qDef = questionMap.get(qId)
      const potentialBenchmarks = benchmarksByQuestion[qId] || []

      const maxScore = Math.max(0, ...potentialBenchmarks.map((b) => b.score || 0))

      return {
        question_id: qId,
        question_name: qDef?.question_text || qDef?.label || 'Unknown Question Name',
        achieved_score: qStats.achieved,
        benchmark_score: maxScore,
        is_selected_benchmark: qStats.isSelected,
        // Removed 'alldata' to clean up response, but kept name logic
      }
    })

    return NextResponse.json({
      submission_id: id,
      submission_name: submission.patient_name || submission.first_name,
      benchmark_data: finalReport,
      debug: {
        total_ids_searched: idsToFetch.length,
        names_found: questionMap.size,
        missing_names: idsToFetch.length - questionMap.size
      }
    })

  } catch (error) {
    console.error('[v0] Error generating benchmark report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}