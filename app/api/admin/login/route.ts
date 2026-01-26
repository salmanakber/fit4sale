import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/password-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Create Supabase client to query admin_users table
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 🔥 IMPORTANT
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




    // Query admin_users table
    const { data: adminUser, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (queryError) {
      console.error('[v0] Query error:', queryError)
      return NextResponse.json({ error: 'Invalid email or password 123 ok' + queryError }, { status: 401 })
    }

    if (!adminUser) {
      console.error('[v0] Admin user not found for email:', email)
      return NextResponse.json({ error: 'Invalid email or password 1234' }, { status: 401 })
    }

    // Verify password against bcrypt hash
    const isPasswordValid = await verifyPassword(password, adminUser.password_hash)

    if (!isPasswordValid) {
      console.error('[v0] Password verification failed for:', email)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Create session token (simple JWT-like approach)
    const sessionToken = Buffer.from(
      JSON.stringify({
        adminId: adminUser.id,
        email: adminUser.email,
        iat: Date.now(),
      })
    ).toString('base64')

    // Set secure session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    })

    response.cookies.set({
      name: 'admin_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[v0] Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
