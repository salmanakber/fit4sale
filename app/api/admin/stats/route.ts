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

    return NextResponse.json(
      {
        stats: {
          totalSubmissions: totalSubmissions ?? 0,
          pendingApprovals: pendingApprovals ?? 0,
          totalEvaluations: totalEvaluations ?? 0,
          partialEmailsSent: partialSent ?? 0,
          fullEmailsSent: fullSent ?? 0,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
