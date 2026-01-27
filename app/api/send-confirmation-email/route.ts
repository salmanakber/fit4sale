import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/resend'

interface SendEmailBody {
  customerName: string
  customerEmail: string
  submissionId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailBody = await request.json()

    // Validate input
    if (!body.customerEmail || !body.customerName || !body.submissionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { padding: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fit4Sale – Umfrage eingereicht</h1>
            </div>
            <div class="content">
              <p>Hallo ${body.customerName},</p>
              <p>vielen Dank, dass Sie unsere Sales-Umfrage abgeschlossen haben.</p>
              <p><strong>Ihre Eingabenummer:</strong> ${body.submissionId}</p>
              <p>Sie erhalten in Kürze eine vorläufige Auswertung per E-Mail. Die detaillierte Auswertung wird nach manueller Prüfung versendet.</p>
              <p>Bei Fragen kontaktieren Sie uns bitte unter aschwanden@kmu-beratungen.ch</p>
              <p>Mit freundlichen Grüßen,<br>KMU-Beratungen</p>
              <h1>Fit4Sale – Sales-Check eingereicht</h1>
            </div>
            <div class="content">
              <p>Hallo ${body.customerName},</p>
              <p>vielen Dank für Ihre Teilnahme am Fit4Sale Sales-Check.</p>
              <p><strong>Ihre Eingabenummer:</strong> ${body.submissionId}</p>
              <p>Sie erhalten in Kürze eine <strong>vorläufige Auswertung</strong> per E-Mail. Die <strong>vollständige Auswertung</strong> wird nach manueller Freigabe versendet.</p>
              <p>Bei Fragen: aschwanden@kmu-beratungen.ch</p>
              <p>Freundliche Grüße<br>KMU-Beratungen</p>
            </div>
            <div class="footer">
              <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const subject = 'Fit4Sale – Sales-Check eingereicht'
    const emailResult = await sendResendEmail({
      to: body.customerEmail,
      subject,
      html,
    })

    // Best-effort audit log (sent/failed)
    try {
      const cookieStore = await cookies()
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

      await supabase.from('email_audit_logs').insert({
        submission_id: body.submissionId,
        recipient_email: body.customerEmail,
        email_type: 'confirmation',
        subject,
        sender_email: 'aschwanden@kmu-beratungen.ch',
        status: emailResult.success ? 'sent' : 'failed',
        admin_notified: true,
      })
    } catch (e) {
      console.error('[v0] Failed to write confirmation email audit log:', e)
    }

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Confirmation email sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error sending email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
