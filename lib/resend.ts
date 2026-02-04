export async function sendResendEmail(args: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  // const from = args.from || 'aschwanden@kmu-beratungen.ch'
  // Resend expects a verified sender. It's safest to use "Name <email@domain>" format.
  // See: https://resend.com/docs/send-with-nextjs
  const from = args.from || 'KMU-Beratungen <aschwanden@kmu-beratungen.ch>'

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

    const payload = await response.json().catch(() => null)
    console.log('[v0] Resend API response status:', response.status, payload)

    if (!response.ok) {
      return {
        success: false as const,
        error:
          (payload && (payload.message || payload.error?.message || JSON.stringify(payload))) ||
          `Resend error (${response.status})`,
      }
    }

    return { success: true as const, data: payload }
  } catch (error) {
    console.error('[v0] Error sending email with Resend:', error)
    return { success: false as const, error: String(error) }
  }
}
