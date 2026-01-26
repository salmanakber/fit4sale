import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    const { error: updateError } = await supabase
      .from('quiz_submissions')
      .update({
        full_evaluation_pending: false,
        full_evaluation_approved: true,
        approved_by_admin: adminSession.value,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('[v0] Database error:', updateError)
      return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
    }

    await supabase.from('admin_logs').insert({
      admin_id: adminSession.value,
      action: 'Vollständige Auswertung freigegeben',
      submission_id: id,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error approving submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
