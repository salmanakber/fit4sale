import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateEvaluationEmail } from '@/lib/email-service'
import { sendResendEmail } from '@/lib/resend'
import { ImageResponse } from '@vercel/og' // 👈 Import the image generator

interface SendEvaluationEmailBody {
  evaluationId: string
}

// 1. HELPER: Generate HTML Table for Email Body
function generateScoreTableHtml(benchmarkData: any[]) {
  if (!benchmarkData || !Array.isArray(benchmarkData)) return ''

  const rows = benchmarkData
    .filter((item) => item.benchmark_score > 0 || item.achieved_score > 0)
    .map((item) => {
      const delta = (item.achieved_score - item.benchmark_score).toFixed(1)
      const isPositive = parseFloat(delta) >= 0
      const color = isPositive ? '#166534' : '#b91c1c' // green-700 : red-700
      const bg = isPositive ? '#dcfce7' : '#fee2e2'    // green-100 : red-100
      const prefix = parseFloat(delta) > 0 ? '+' : ''

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-family: sans-serif; color: #334155; font-size: 13px;">${item.question_name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; text-align: center; color: #ea580c; font-size: 13px;">${item.achieved_score}</td>
          <td style="padding: 10px; font-family: monospace; text-align: center; color: #64748b; font-size: 13px;">${item.benchmark_score}</td>
          <td style="padding: 10px; text-align: right;">
            <span style="background-color: ${bg}; color: ${color}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; font-size: 12px;">
              ${prefix}${delta}
            </span>
          </td>
        </tr>
      `
    })
    .join('')

  return `
    <div style="margin-top: 25px; margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #f8fafc; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-weight: bold; color: #0f172a; font-size: 14px;">
        Ihre Detail-Ergebnisse
      </div>
      <table style="width: 100%; border-collapse: collapse; background-color: white;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px; text-align: left; font-family: sans-serif; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Kategorie</th>
            <th style="padding: 10px; text-align: center; font-family: sans-serif; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Ihr Wert</th>
            <th style="padding: 10px; text-align: center; font-family: sans-serif; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Markt</th>
            <th style="padding: 10px; text-align: right; font-family: sans-serif; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Abweichung</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SendEvaluationEmailBody = await request.json()

    if (!body.evaluationId) {
      return NextResponse.json({ error: 'Missing evaluation ID' }, { status: 400 })
    }

    // --- A. Database Fetching ---
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
             // Admin route doesn't need to set cookies usually, but boilerplate kept
          },
        },
      }
    )

    const { data: evaluation, error: evalError } = await supabase
      .from('evaluation_results')
      .select(
        `id, recommended_program, intensity_level, program_duration, personalized_recommendations, 
         special_modifications, safety_concerns, benchmark_data, submission_id, 
         quiz_submissions(patient_name, patient_email, participant_email, full_evaluation_approved)`
      )
      .eq('id', body.evaluationId)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    const submission = evaluation.quiz_submissions as any
    const patientName = submission?.patient_name || 'Teilnehmer/in'
    const patientEmail = submission?.patient_email || submission?.participant_email

    if (!patientEmail) return NextResponse.json({ error: 'No email found' }, { status: 400 })

    // Fetch User Details for Greeting
    const { data: submissionData } = await supabase
      .from('quiz_submissions')
      .select('title, first_name, last_name')
      .eq('id', evaluation.submission_id)
      .single()

    const title = submissionData?.title
    const firstName = submissionData?.first_name
    const lastName = submissionData?.last_name
    const greeting = title && lastName
      ? `Sehr ${title === 'Herr' ? 'geehrter' : 'geehrte'} ${lastName}`
      : firstName ? `Hallo ${firstName}` : 'Hallo'


    // --- B. Generate Chart Image (In-Memory) ---
    let attachments: Array<{ filename: string; content: Buffer }> = []

    try {
      console.log('[Email] Generating Chart Image in-memory...')
      
      // 1. Prepare Data
      const rawData = evaluation.benchmark_data || []
      const data = rawData
        .filter((d: any) => d.benchmark_score > 0 || d.achieved_score > 0)
        .map((d: any) => ({
          label: d.question_name.length > 25 ? d.question_name.substring(0, 25) + '...' : d.question_name,
          user: d.achieved_score,
          bench: d.benchmark_score,
        }))

      if (data.length > 0) {
        // 2. Fetch Font (Required by @vercel/og / Satori)
        // We use a public CDN to ensure it works in serverless environment
        const fontData = await fetch(new URL('https://rsms.me/inter/inter-ui-regular.woff', import.meta.url))
          .then((res) => res.arrayBuffer())

        // 3. Chart Dimensions & Logic
        const width = 800
        const height = 600
        const padding = { top: 80, right: 50, bottom: 50, left: 250 }
        const chartWidth = width - padding.left - padding.right
        const chartHeight = height - padding.top - padding.bottom
        
        // Calculate max scale (min 5) + 10% padding
        const maxScore = Math.max(...data.map((d: any) => Math.max(d.user, d.bench)), 5) * 1.1
        const rowHeight = chartHeight / data.length
        
        const getX = (score: number) => padding.left + (score / maxScore) * chartWidth
        const getY = (index: number) => padding.top + (index * rowHeight) + (rowHeight / 2)

        const userPoints = data.map((d: any, i: number) => `${getX(d.user)},${getY(i)}`).join(' ')
        const benchPoints = data.map((d: any, i: number) => `${getX(d.bench)},${getY(i)}`).join(' ')

        // 4. Create ImageResponse (JSX -> SVG -> PNG)
        const imageResponse = new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1e293b', // Slate-900
                color: '#cbd5e1', 
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
              }}>
              {/* Header */}
              <div style={{ position: 'absolute', top: 30, left: 30, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Verkaufsattraktivität Analyse</div>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>IST-Zustand vs. Markt-Standard</div>
              </div>

              {/* Legend */}
              <div style={{ position: 'absolute', top: 30, right: 50, display: 'flex', gap: 20, fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f97316' }}></div>
                  <span style={{ color: '#fdba74' }}>IST (Ihr Wert)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#84cc16' }}></div>
                  <span style={{ color: '#bef264' }}>Potential</span>
                </div>
              </div>

              {/* SVG Layer */}
              <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Vertical Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                  const x = padding.left + (tick * chartWidth)
                  return <line key={tick} x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                })}

                {/* Benchmark Line (Green) */}
                <polyline points={benchPoints} fill="none" stroke="#84cc16" strokeWidth="3" />
                {/* User Line (Orange) */}
                <polyline points={userPoints} fill="none" stroke="#f97316" strokeWidth="4" />

                {/* Dots */}
                {data.map((d: any, i: number) => {
                  const y = getY(i)
                  return (
                    <g key={i}>
                      <circle cx={getX(d.bench)} cy={y} r="5" fill="#1e293b" stroke="#84cc16" strokeWidth="2" />
                      <circle cx={getX(d.user)} cy={y} r="6" fill="#f97316" stroke="white" strokeWidth="2" />
                    </g>
                  )
                })}
              </svg>

              {/* Y-Axis Labels */}
              <div style={{
                position: 'absolute', top: padding.top, left: 20, width: padding.left - 40, height: chartHeight,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                {data.map((d: any, i: number) => (
                  <div key={i} style={{ 
                    height: rowHeight, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', 
                    textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#e2e8f0'
                  }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          ),
          {
            width,
            height,
            fonts: [{ name: 'Inter', data: fontData, style: 'normal' }],
          }
        )

        // 5. Convert Stream to Buffer
        const arrayBuffer = await imageResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        attachments.push({
          filename: 'verkaufsattraktivitaet-analyse.png',
          content: buffer,
        })
      }
    } catch (err) {
      console.warn('[Email] Failed to generate chart image:', err)
      // We continue; don't fail the whole email just for the image
    }

    // --- C. Construct Email & Send ---

    const scoreTableHtml = generateScoreTableHtml(evaluation.benchmark_data)
    
    // Inject table into the recommendations block
    const existingRecs = evaluation.personalized_recommendations || ''
    
    const emailTemplate = generateEvaluationEmail({
      greeting,
      patientName,
      patientEmail,
      recommendedProgram: evaluation.recommended_program || '',
      intensityLevel: evaluation.intensity_level || '',
      programDuration: evaluation.program_duration || '',
      personalizedRecommendations: existingRecs + scoreTableHtml, 
      safetyConcerns: evaluation.safety_concerns || '',
      specialModifications: evaluation.special_modifications || '',
    })

    const emailResult = await sendResendEmail({
      to: patientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (!emailResult.success) {
      await supabase.from('email_audit_logs').insert({
        submission_id: evaluation.submission_id,
        recipient_email: patientEmail,
        email_type: 'full',
        subject: emailTemplate.subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: 'failed',
        admin_notified: true,
      })
      return NextResponse.json({ error: emailResult.error || 'Failed to send' }, { status: 500 })
    }

    // Success Audit
    await supabase.from('email_audit_logs').insert({
      submission_id: evaluation.submission_id,
      recipient_email: patientEmail,
      email_type: 'full',
      subject: emailTemplate.subject,
      sender_email: 'aschwanden@kmu-beratungen.ch',
      status: 'sent',
      admin_notified: true,
    })

    await supabase.from('admin_logs').insert({
      admin_id: adminSession.value,
      action: 'Sent full report email',
      submission_id: evaluation.submission_id,
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('[Email] Internal Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}