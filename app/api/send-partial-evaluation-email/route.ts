import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { submissionId, participantEmail, score } = await request.json()

    if (!submissionId || !participantEmail || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Load cached evaluation details for richer email content (category breakdown + recommendation)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { data: cached } = await supabase
      .from('evaluation_results_cache')
      .select('total_score, section_scores, recommendations')
      .eq('submission_id', submissionId)
      .single()

    // Fetch submission to get user info for proper greeting
    const { data: submissionData } = await supabase
      .from('quiz_submissions')
      .select('title, first_name, last_name')
      .eq('id', submissionId)
      .single()

    const totalScore = cached?.total_score ?? score
    const byCategory = (cached?.section_scores as any)?.byCategory as Record<string, number> | undefined
    const recommendationText = cached?.recommendations as string | undefined

    // Generate proper German greeting
    const title = submissionData?.title || null
    const firstName = submissionData?.first_name || null
    const lastName = submissionData?.last_name || null
    const greeting = title && lastName
      ? `Sehr ${title === 'Herr' ? 'geehrter' : 'geehrte'} ${lastName}`
      : firstName
        ? `Hallo ${firstName}`
        : 'Hallo'

    const categoryHtml = byCategory
      ? `
        <div style="margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Bereiche</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${Object.entries(byCategory)
              .map(
                ([cat, val]) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${cat}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${val}/100</strong></td>
                  </tr>
                `
              )
              .join('')}
          </table>
        </div>
      `
      : ''

    const recommendationHtml = recommendationText
      ? `<p><strong>Kurze Einschätzung:</strong> ${recommendationText}</p>`
      : ''

    // Generate partial report email HTML
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
              <h1>Fit4Sale – Vorläufige Auswertung</h1>
            </div>
            <div class="content">
              <p>Hallo,</p>
              <p>vielen Dank für Ihre Teilnahme an unserer Sales-Umfrage. Wir haben Ihre Antworten ausgewertet und eine vorläufige Einschätzung erstellt.</p>
              <p>${greeting},</p>
              <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check. Wir haben Ihre Angaben ausgewertet und eine vorläufige Auswertung erstellt.</p>
              
              <div class="score-card">
                <p>Ihr Score:</p>
                <div class="score">${totalScore}/100</div>
              </div>

              ${recommendationHtml}
              ${categoryHtml}

              <p><strong>Nächste Schritte:</strong></p>
              <p>Wir prüfen Ihre vollständige Auswertung manuell und senden Ihnen anschließend die detaillierte Auswertung per E-Mail.</p>
              <p>Die vollständige Auswertung wird nach manueller Freigabe per E-Mail versendet.</p>
              
              <p>Bei Fragen: aschwanden@kmu-beratungen.ch</p>
              
              <p>Mit freundlichen Grüßen,<br>KMU-Beratungen</p>
              <p>Freundliche Grüße<br>KMU-Beratungen</p>
            </div>
            <div class="footer">
              <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send the email (participant)
    const subject = 'Fit4Sale – Vorläufige Auswertung'
    const emailResult = await sendResendEmail({
      to: participantEmail,
      subject,
      html,
    })

    if (!emailResult.success) {
      console.error('[v0] Failed to send partial evaluation email:', emailResult.error)
      // audit failed attempt as well (so dashboard shows it)
      await supabase.from('email_audit_logs').insert({
        submission_id: submissionId,
        recipient_email: participantEmail,
        email_type: 'partial',
        subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: 'failed',
        admin_notified: true,
      })

      return NextResponse.json({ error: emailResult.error || 'Failed to send email' }, { status: 500 })
    }

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
      subject: 'Fit4Sale – Vorläufige Auswertung',
      subject,
      sender_email: 'aschwanden@kmu-beratungen.ch',
      status: 'sent',
      admin_notified: true,
    })

    // Admin log entry (notification trail)
    await supabase.from('admin_logs').insert({
      admin_id: null,
      action: `Partial report email sent to participant (${participantEmail})`,
      action: `Vorläufige Auswertung per E-Mail versendet (${participantEmail})`,
      submission_id: submissionId,
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
