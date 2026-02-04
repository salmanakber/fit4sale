import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js' // Import standard client for pure admin
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

    // 1. PURE ADMIN CLIENT (Bypasses all RLS and Cookie issues guaranteed)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // 2. Fetch Submission Name
    const { data: submission } = await adminSupabase
      .from('quiz_submissions')
      .select('patient_name, first_name')
      .eq('id', id)
      .single()

    // 3. Fetch Results
    const { data: storedResults } = await adminSupabase
      .from('question_benchmark_results')
      .select('*')
      .eq('submission_id', id)

    // 4. Fetch All Benchmarks
    const { data: allBenchmarks } = await adminSupabase
      .from('benchmarks')
      .select('id, question_id, score')

    // --- ID Resolution ---
    const relevantQuestionIds = new Set<string>()

    storedResults?.forEach((res: any) => {
      if (res.question_id) relevantQuestionIds.add(String(res.question_id))
      else if (res.benchmark_id && allBenchmarks) {
        const bDef = allBenchmarks.find((b: any) => String(b.id) === String(res.benchmark_id))
        if (bDef?.question_id) relevantQuestionIds.add(String(bDef.question_id))
      }
    })

    const idsToFetch = Array.from(relevantQuestionIds).filter(Boolean)

    // --- AGGRESSIVE QUESTION FETCHING ---
    let questionMap = new Map<string, any>()
    let debugSampleRow = null
    let tableNameUsed = 'none'

    if (idsToFetch.length > 0) {
      // Strategy: Fetch raw rows first, then figure out which column holds the text

      // Attempt 1: 'quiz_questions'
      let { data: questionsData, error: qError } = await adminSupabase
        .from('quiz_questions')
        .select('*') // Fetch ALL columns to debug
        .in('id', idsToFetch)

      if (!qError && questionsData && questionsData.length > 0) {
        tableNameUsed = 'quiz_questions'
      } else {
        // Attempt 2: 'questions'
        const { data: qData2, error: qError2 } = await adminSupabase
          .from('questions')
          .select('*')
          .in('id', idsToFetch)

        if (!qError2 && qData2 && qData2.length > 0) {
          questionsData = qData2
          tableNameUsed = 'questions'
        }
      }

      // Process Found Questions
      if (questionsData && questionsData.length > 0) {
        questionsData.forEach((q: any) => {
          // Auto-detect the text column
          const text = q.question_text || q.question || q.title || q.label || q.text || q.name || 'Untitled'
          questionMap.set(String(q.id), { ...q, resolved_text: text })
        })
      } else {
        // DEBUGGING: If we found nothing, fetch ONE row from quiz_questions to see the schema
        const { data: sample } = await adminSupabase.from('quiz_questions').select('*').limit(1)
        if (sample && sample.length > 0) debugSampleRow = sample[0]
      }
    }

    // --- Construction ---
    const benchmarksByQuestion: Record<string, any[]> = {}
    allBenchmarks?.forEach((b: any) => {
      const bQId = String(b.question_id)
      if (!benchmarksByQuestion[bQId]) benchmarksByQuestion[bQId] = []
      benchmarksByQuestion[bQId].push(b)
    })

    const processedResults: Record<string, { achieved: number, isSelected: boolean }> = {}

    storedResults?.forEach((res: any) => {
      let qId: string | null = res.question_id ? String(res.question_id) : null
      if (!qId && res.benchmark_id && allBenchmarks) {
        const bDef = allBenchmarks.find((b: any) => String(b.id) === String(res.benchmark_id))
        qId = bDef?.question_id ? String(bDef.question_id) : null
      }

      if (qId) {
        if (!processedResults[qId]) processedResults[qId] = { achieved: 0, isSelected: false }

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
        question_name: qDef?.resolved_text || 'Unknown Question Name',
        achieved_score: qStats.achieved,
        benchmark_score: maxScore,
        is_selected_benchmark: qStats.isSelected,
      }
    })

    return NextResponse.json({
      submission_id: id,
      submission_name: submission?.patient_name || submission?.first_name || 'Participant',
      benchmark_data: finalReport,
      debug: {
        table_used: tableNameUsed,
        ids_searched: idsToFetch.length,
        names_found: questionMap.size,
        // IF THIS IS NOT NULL, IT SHOWS YOU THE CORRECT COLUMN NAMES:
        sample_row_from_db: debugSampleRow,
        // IF THIS IS EMPTY, YOUR IDS DO NOT EXIST IN DB:
        missing_ids_example: idsToFetch.length > 0 && questionMap.size === 0 ? idsToFetch[0] : null
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}