import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcrypt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('id, admin_name, resend_api_key, updated_at')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { admin_name, password, resend_api_key } = body

    // Get current settings first
    const { data: currentSettings, error: fetchError } = await supabase
      .from('admin_settings')
      .select('id, password_hash')
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      )
    }

    let updateData: any = {
      admin_name,
      resend_api_key,
      updated_at: new Date().toISOString(),
    }

    // Only hash and update password if a new one is provided
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password_hash = hashedPassword
    }

    const { data, error } = await supabase
      .from('admin_settings')
      .update(updateData)
      .eq('id', currentSettings.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Don't return the password hash
    const { password_hash, ...safeData } = data
    return NextResponse.json({
      success: true,
      data: safeData,
    })
  } catch (error) {
    console.error('[v0] Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
