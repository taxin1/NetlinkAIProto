import 'server-only'
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let profilePictureUrl: string | null = null

    // Option 1: Try to get from auth.identities FIRST (Supabase stores OAuth data here - most reliable)
    if (user.identities && user.identities.length > 0) {
      console.log("[Sync Google Picture] Checking identities:", user.identities.length)
      const googleIdentity = user.identities.find(
        (identity: any) => identity.provider === 'google'
      )
      if (googleIdentity) {
        console.log("[Sync Google Picture] Found Google identity")
        const identityData = googleIdentity.identity_data || {}
        console.log("[Sync Google Picture] Identity data keys:", Object.keys(identityData))
        
        if (identityData.avatar_url) {
          profilePictureUrl = identityData.avatar_url
          console.log("[Sync Google Picture] Found in identity_data.avatar_url:", profilePictureUrl)
        } else if (identityData.picture) {
          profilePictureUrl = identityData.picture
          console.log("[Sync Google Picture] Found in identity_data.picture:", profilePictureUrl)
        } else {
          console.log("[Sync Google Picture] No avatar_url or picture in identity_data")
        }
      } else {
        console.log("[Sync Google Picture] No Google identity found in identities")
      }
    }

    // Option 2: Try to get from Supabase Auth metadata (if signed in with Google)
    if (!profilePictureUrl) {
      const userMetadata = user.user_metadata
      console.log("[Sync Google Picture] Checking user_metadata, keys:", Object.keys(userMetadata || {}))
      
      if (userMetadata?.avatar_url) {
        profilePictureUrl = userMetadata.avatar_url
        console.log("[Sync Google Picture] Found in user_metadata.avatar_url:", profilePictureUrl)
      } else if (userMetadata?.picture) {
        profilePictureUrl = userMetadata.picture
        console.log("[Sync Google Picture] Found in user_metadata.picture:", profilePictureUrl)
      }
    }

    // Note: Gmail API tokens don't include userinfo scope, so we can't use Gmail connection
    // to get profile picture. The picture is only available if user signed in with Google OAuth.

    if (!profilePictureUrl) {
      console.error("[Sync Google Picture] No profile picture found after checking all sources")
      return NextResponse.json(
        { 
          error: "No Google profile picture found. If you signed in with Google OAuth, please try signing out and signing back in with Google. If you only connected Gmail, the profile picture sync requires signing in with Google OAuth." 
        },
        { status: 404 }
      )
    }

    // If we have a URL, we need to download it and upload to our storage
    // For now, let's return the URL - the client can handle downloading/uploading
    // Or we can download it here and upload to Supabase Storage
    try {
      // Download the image
      const imageResponse = await fetch(profilePictureUrl)
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image from Google")
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(imageBuffer)

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileName = `${user.id}/google-profile-${timestamp}-${randomString}.jpg`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("portfolios")
        .getPublicUrl(fileName)

      return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        originalUrl: profilePictureUrl
      })
    } catch (error) {
      console.error("Error processing Google profile picture:", error)
      return NextResponse.json(
        { error: "Failed to process Google profile picture" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error syncing Google picture:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

