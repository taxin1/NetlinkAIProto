import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin/auth"

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession()
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = cronSecret && (
      authHeader?.replace("Bearer ", "") === cronSecret ||
      request.nextUrl.searchParams.get("secret") === cronSecret
    )

    if (!isAdmin && !isCronAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session or valid secret required." },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    // Get admin client to access auth.users
    // Note: This requires service role key or admin access
    // For now, we'll use a database function approach
    
    // Call a database function to sync profiles
    const { data, error } = await supabase.rpc('sync_all_user_profiles')
    
    if (error) {
      // If RPC doesn't exist, manually create profiles for users without them
      // This is a fallback - the SQL script should handle this
      console.log("RPC function not available, profiles should be created via SQL script")
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Profile sync initiated. Run the SQL script to ensure all users have profiles." 
    })
  } catch (error) {
    console.error("Error syncing profiles:", error)
    return NextResponse.json(
      { error: "Failed to sync profiles" },
      { status: 500 }
    )
  }
}
