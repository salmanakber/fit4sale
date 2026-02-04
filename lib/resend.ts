import { createClient } from '@supabase/supabase-js'

export async function sendResendEmail(args: {
  to: string
  subject: string
  html: string
  from?: string
  apiKey?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}) {
  // const from = args.from || 'aschwanden@kmu-beratungen.ch'
  // Resend expects a verified sender. It's safest to use "Name <email@domain>" format.
  // See: https://resend.com/docs/send-with-nextjs
  const from = args.from || 'KMU-Beratungen <aschwanden@fit4sale.ch>'

  // Try to get API key from parameter, database, or environment variable
  let apiKey = args.apiKey || process.env.RESEND_API_KEY

  if (!apiKey) {
    // Try to fetch from database if not provided
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )
      const { data } = await supabase
        .from('admin_settings')
        .select('resend_api_key')
        .single()

      apiKey = data?.resend_api_key
    } catch (error) {
      console.error('[v0] Error fetching API key from database:', error)
    }
  }

  if (!apiKey) {
    console.error('[v0] RESEND_API_KEY not configured')
    return { success: false as const, error: 'Email service not configured' }
  }

  try {
    const emailBody: any = {
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }

    // Add attachments if provided
    if (args.attachments && args.attachments.length > 0) {
      emailBody.attachments = args.attachments.map((att) => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
      }))
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailBody),
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
