import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Decode session token
    try {
      const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'))
      
      // Verify token is not expired (optional - add expiry logic if needed)
      return NextResponse.json({
        authenticated: true,
        adminId: sessionData.adminId,
        email: sessionData.email,
      })
    } catch (err) {
      console.error('[v0] Session token decode error:', err)
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (err) {
    console.error('[v0] Auth check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
