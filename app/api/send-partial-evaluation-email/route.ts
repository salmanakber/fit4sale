import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'aschwanden@kmu-beratungen.ch',
        to,
        subject,
        html,
      }),
    })

    console.log('[v0] Resend API response status:', response.status)
    return { success: response.ok }
  } catch (error) {
    console.error('[v0] Error sending email with Resend:', error)
    return { success: false, error: String(error) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, participantEmail, score } = await request.json()

    if (!submissionId || !participantEmail || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate partial evaluation email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #a03a2a; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .score-card { background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: bold; color: #a03a2a; }
            .content { padding: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fit4Sale - Vorläufige Bewertung</h1>
            </div>
            <div class="content">
              <p>Hallo,</p>
              <p>vielen Dank für die Teilnahme an unserer Fit4Sale-Bewertung. Wir haben Ihre Antworten analysiert und berechnet eine vorläufige Bewertung.</p>
              
              <div class="score-card">
                <p>Ihre Fitnessnote:</p>
                <div class="score">${score}/100</div>
              </div>

              <p><strong>Nächste Schritte:</strong></p>
              <p>Ein Betreuer wird Ihre vollständige Bewertung prüfen und innerhalb von 2-3 Geschäftstagen eine detaillierte Bewertung mit personalisierten Empfehlungen senden.</p>
              
              <p>Falls Sie Fragen haben, kontaktieren Sie uns bitte unter aschwanden@kmu-beratungen.ch</p>
              
              <p>Mit freundlichen Grüßen,<br>Das Fit4Sale-Team</p>
            </div>
            <div class="footer">
              <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send the email
    const emailResult = await sendEmail(
      participantEmail,
      'Fit4Sale - Vorläufige Bewertung erhalten',
      html
    )

    if (!emailResult.success) {
      console.error('[v0] Failed to send partial evaluation email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the email in audit trail
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Update submission status
    await supabase
      .from('quiz_submissions')
      .update({ partial_evaluation_sent: true })
      .eq('id', submissionId)

    // Log email in audit
    await supabase.from('email_audit_logs').insert({
      submission_id: submissionId,
      recipient_email: participantEmail,
      email_type: 'partial',
      subject: 'Fit4Sale - Vorläufige Bewertung erhalten',
      sender_email: 'aschwanden@kmu-beratungen.ch',
      status: 'sent',
      admin_notified: false,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Partial evaluation email sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error sending partial evaluation email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
