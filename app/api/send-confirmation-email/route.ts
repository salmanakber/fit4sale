import { NextRequest, NextResponse } from 'next/server'

interface SendEmailBody {
  customerName: string
  customerEmail: string
  submissionId: string
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY not configured')
    return false
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
    return response.ok
  } catch (error) {
    console.error('[v0] Error sending email with Resend:', error)
    return false
  }
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
              <h1>Fit4Sale - Bewertung eingereicht</h1>
            </div>
            <div class="content">
              <p>Hallo ${body.customerName},</p>
              <p>vielen Dank, dass Sie unsere Fit4Sale-Bewertung abgeschlossen haben.</p>
              <p><strong>Ihre Eingabenummer:</strong> ${body.submissionId}</p>
              <p>Wir werden Ihre Antworten überprüfen und Ihnen in Kürze personalisierte Empfehlungen per E-Mail senden.</p>
              <p>Bei Fragen kontaktieren Sie uns bitte unter support@fit4sale.com</p>
              <p>Mit freundlichen Grüßen,<br>Das Fit4Sale-Team</p>
            </div>
            <div class="footer">
              <p>Dies ist eine automatisierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const emailSent = await sendEmail(
      body.customerEmail,
      'Fit4Sale - Bewertung eingereicht',
      html
    )

    if (!emailSent) {
      console.error('[v0] Failed to send email to:', body.customerEmail)
      return NextResponse.json(
        { error: 'Failed to send email' },
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
