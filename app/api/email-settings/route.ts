import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from("user_email_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
      throw error
    }

    // Don't send password to client
    if (settings) {
      const { email_password, ...safeSettings } = settings
      return NextResponse.json({ settings: safeSettings })
    }

    return NextResponse.json({ settings: null })
  } catch (error) {
    console.error("Error fetching email settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch email settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      email_provider,
      email_address,
      email_password,
      smtp_host,
      smtp_port,
      smtp_secure,
      from_name,
    } = await request.json()

    if (!email_provider || !email_address || !email_password) {
      return NextResponse.json(
        { error: "Email provider, address, and password are required" },
        { status: 400 }
      )
    }

    // Check if settings already exist
    const { data: existing } = await supabase
      .from("user_email_settings")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let result
    if (existing) {
      // Update existing settings
      result = await supabase
        .from("user_email_settings")
        .update({
          email_provider,
          email_address,
          email_password,
          smtp_host,
          smtp_port,
          smtp_secure,
          from_name,
          is_active: true,
        })
        .eq("user_id", user.id)
        .select()
        .single()
    } else {
      // Insert new settings
      result = await supabase
        .from("user_email_settings")
        .insert({
          user_id: user.id,
          email_provider,
          email_address,
          email_password,
          smtp_host,
          smtp_port,
          smtp_secure,
          from_name,
          is_active: true,
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    // Don't send password back to client
    const { email_password: _, ...safeSettings } = result.data
    
    return NextResponse.json({
      success: true,
      settings: safeSettings,
    })
  } catch (error) {
    console.error("Error saving email settings:", error)
    return NextResponse.json(
      { error: "Failed to save email settings" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("user_email_settings")
      .delete()
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email settings:", error)
    return NextResponse.json(
      { error: "Failed to delete email settings" },
      { status: 500 }
    )
  }
}
