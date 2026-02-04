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

    // 1. Auth Check
    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // 2. Fetch Submission (Just for name/email info)
    const { data: submission, error: subError } = await supabase
      .from('quiz_submissions')
      .select('patient_name, first_name, id')
      .eq('id', id)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 3. Fetch The Stored Results (The Source of Truth)
    // We want to see exactly what is in this table for this submission
    const { data: storedResults, error: resError } = await supabase
      .from('question_benchmark_results')
      .select('*') // Gets benchmark_id, score, question_id, etc.
      .eq('submission_id', id)

    if (resError) {
      console.error('Error fetching results:', resError)
      return NextResponse.json({ error: 'Error fetching benchmark results' }, { status: 500 })
    }

    // 4. Fetch Definitions (Questions and Benchmarks)
    // We fetch all because we need to calculate "Max Possible Score" for every question
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, question_text, label')

    const { data: allBenchmarks } = await supabase
      .from('benchmarks')
      .select('id, question_id, score')

    // --- Data Processing ---

    // A. Create Map for Questions (ID -> Data)
    const questionMap = new Map((allQuestions || []).map((q: any) => [q.id, q]))

    // B. Group All Benchmarks by Question (to calculate max possible scores)
    const benchmarksByQuestion: Record<string, any[]> = {}
    if (allBenchmarks) {
      for (const b of allBenchmarks) {
        if (!benchmarksByQuestion[b.question_id]) benchmarksByQuestion[b.question_id] = []
        benchmarksByQuestion[b.question_id].push(b)
      }
    }

    // C. Process the Stored Results
    // We assume 'storedResults' contains one row per benchmark hit. 
    // Sometimes a single question has multiple rows if multiple options were selected.

    // We group stored results by question_id first to handle multi-select summation
    const resultsByQuestion: Record<string, { achieved: number, isSelected: boolean }> = {}

    storedResults?.forEach((res: any) => {
      // Assuming 'question_id' is in question_benchmark_results table. 
      // If it's not, we must find it via the benchmark_id.
      let qId = res.question_id

      // Fallback: If question_id is missing in results table, find it via benchmark list
      if (!qId && res.benchmark_id && allBenchmarks) {
        const bDef = allBenchmarks.find((b: any) => b.id === res.benchmark_id)
        qId = bDef?.question_id
      }

      if (qId) {
        if (!resultsByQuestion[qId]) {
          resultsByQuestion[qId] = { achieved: 0, isSelected: false }
        }

        // Add up the scores (assuming stored 'score' column exists in results)
        // If the table doesn't have 'score', look it up in definitions
        let scoreToAdd = res.score
        if (scoreToAdd === undefined && res.benchmark_id) {
          const bDef = allBenchmarks?.find(b => b.id === res.benchmark_id)
          scoreToAdd = bDef?.score || 0
        }

        resultsByQuestion[qId].achieved += (scoreToAdd || 0)
        resultsByQuestion[qId].isSelected = true
      }
    })

    // D. Build Final Report Array
    const finalReport = Object.keys(resultsByQuestion).map((qId) => {
      const questionDef = questionMap.get(qId)
      const questionStats = resultsByQuestion[qId]
      const potentialBenchmarks = benchmarksByQuestion[qId] || []

      // Calculate Max Possible Score for this question
      const maxScore = Math.max(0, ...potentialBenchmarks.map((b) => b.score || 0))

      return {
        question_id: qId,
        question_name: questionDef?.question_text || questionDef?.label || 'Unknown Question',
        achieved_score: questionStats.achieved,
        benchmark_score: maxScore,
        is_selected_benchmark: questionStats.isSelected // True because it existed in the results table
      }
    })

    return NextResponse.json({
      submission_id: id,
      submission_name: submission.patient_name || submission.first_name,
      benchmark_data: finalReport,
      debug_count: storedResults?.length || 0 // Helpful to see if DB is returning rows
    })

  } catch (error) {
    console.error('[v0] Error generating benchmark report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}