import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get total users engaged (quiz_submissions table)
    const { count: totalEngaged } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })

    // Get submitted users (with answers)
    const { data: submissions, count: totalSubmitted } = await supabase
      .from('quiz_submissions')
      .select('id, submitted_at, created_at', { count: 'exact' })
      .not('answers', 'is', null)

    // Get today's submissions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayEngaged } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get approved submissions
    const { count: approved } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('full_evaluation_approved', true)

    // Calculate completion rate
    const completionRate = totalEngaged && totalEngaged > 0 
      ? Math.round((totalSubmitted! / totalEngaged) * 100)
      : 0

    // Get submissions over time (last 30 days)
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    const { data: submissionsTimeSeries } = await supabase
      .from('quiz_submissions')
      .select('created_at')
      .gte('created_at', last30Days.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const submissionsByDate: Record<string, number> = {}
    if (submissionsTimeSeries) {
      for (const submission of submissionsTimeSeries) {
        const date = new Date(submission.created_at).toLocaleDateString('en-CA')
        submissionsByDate[date] = (submissionsByDate[date] || 0) + 1
      }
    }

    // Convert to array format for chart
    const timeSeriesData = Object.entries(submissionsByDate).map(([date, count]) => ({
      date,
      count,
    }))

    // Get all submissions for table export
    const { data: allSubmissions } = await supabase
      .from('quiz_submissions')
      .select('id, patient_name, patient_email, participant_email, created_at, submitted_at, full_evaluation_approved')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      summary: {
        totalEngaged: totalEngaged || 0,
        totalSubmitted: totalSubmitted || 0,
        approved: approved || 0,
        completionRate,
        todayEngaged: todayEngaged || 0,
      },
      timeSeries: timeSeriesData,
      submissions: allSubmissions || [],
    })
  } catch (error) {
    console.error('[v0] Error generating analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
