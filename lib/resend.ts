export async function sendResendEmail(args: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const from = args.from || 'aschwanden@kmu-beratungen.ch'

  if (!process.env.RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY not configured')
    return { success: false as const, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    })

    console.log('[v0] Resend API response status:', response.status)
    return { success: response.ok as const }
  } catch (error) {
    console.error('[v0] Error sending email with Resend:', error)
    return { success: false as const, error: String(error) }
  }
}
