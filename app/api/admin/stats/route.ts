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

    // Calculate date ranges
    const now = new Date()
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Current month stats
    const [{ count: totalSubmissions }, { count: pendingApprovals }, { count: totalEvaluations }] =
      await Promise.all([
        supabase.from('quiz_submissions').select('*', { count: 'exact', head: true }),
        supabase
          .from('quiz_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('full_evaluation_approved', false),
        supabase.from('evaluation_results').select('*', { count: 'exact', head: true }),
      ])

    const [{ count: partialSent }, { count: fullSent }] = await Promise.all([
      supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', 'partial')
        .eq('status', 'sent'),
      supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', 'full')
        .eq('status', 'sent'),
    ])

    // Previous month stats (for trend calculation)
    const [
      { count: lastMonthSubmissions },
      { count: lastMonthPending },
      { count: lastMonthEvaluations },
      { count: lastMonthPartialSent },
      { count: lastMonthFullSent },
    ] = await Promise.all([
      supabase
        .from('quiz_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lte('created_at', lastDayOfLastMonth.toISOString()),
      supabase
        .from('quiz_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('full_evaluation_approved', false)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lte('created_at', lastDayOfLastMonth.toISOString()),
      supabase
        .from('evaluation_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lte('created_at', lastDayOfLastMonth.toISOString()),
      supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', 'partial')
        .eq('status', 'sent')
        .gte('sent_at', firstDayOfLastMonth.toISOString())
        .lte('sent_at', lastDayOfLastMonth.toISOString()),
      supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email_type', 'full')
        .eq('status', 'sent')
        .gte('sent_at', firstDayOfLastMonth.toISOString())
        .lte('sent_at', lastDayOfLastMonth.toISOString()),
    ])

    // Helper function to calculate percentage change
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const current = {
      totalSubmissions: totalSubmissions ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
      totalEvaluations: totalEvaluations ?? 0,
      partialEmailsSent: partialSent ?? 0,
      fullEmailsSent: fullSent ?? 0,
    }

    const previous = {
      totalSubmissions: lastMonthSubmissions ?? 0,
      pendingApprovals: lastMonthPending ?? 0,
      totalEvaluations: lastMonthEvaluations ?? 0,
      partialEmailsSent: lastMonthPartialSent ?? 0,
      fullEmailsSent: lastMonthFullSent ?? 0,
    }

    return NextResponse.json(
      {
        stats: {
          ...current,
          trends: {
            totalSubmissions: calculateTrend(current.totalSubmissions, previous.totalSubmissions),
            pendingApprovals: calculateTrend(current.pendingApprovals, previous.pendingApprovals),
            totalEvaluations: calculateTrend(current.totalEvaluations, previous.totalEvaluations),
            partialEmailsSent: calculateTrend(current.partialEmailsSent, previous.partialEmailsSent),
            fullEmailsSent: calculateTrend(current.fullEmailsSent, previous.fullEmailsSent),
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
