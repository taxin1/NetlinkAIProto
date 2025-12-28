import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const imageType = formData.get("imageType") as string // "profile" or "cover"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    // Use the actual file type (may be WebP if compressed) instead of original extension
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    let fileExtension = 'jpg'
    if (file.type === 'image/webp') {
      fileExtension = 'webp'
    } else if (file.type === 'image/png') {
      fileExtension = 'png'
    } else if (file.type === 'image/gif') {
      fileExtension = 'gif'
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      fileExtension = 'jpg'
    } else {
      // Fallback to extracting from filename if type is not recognized
      fileExtension = file.name.split('.').pop() || 'jpg'
    }
    const fileName = `${user.id}/${imageType}-${timestamp}-${randomString}.${fileExtension}`

    // Upload to Supabase Storage (portfolios bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("portfolios")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload image"
      if (uploadError.message) {
        errorMessage = uploadError.message
      } else if (uploadError.statusCode === "404") {
        errorMessage = "Storage bucket 'portfolios' not found. Please configure the storage bucket in Supabase."
      } else if (uploadError.statusCode === "403") {
        errorMessage = "Permission denied. Please check storage bucket permissions."
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("portfolios")
      .getPublicUrl(fileName)

    if (!publicUrl) {
      return NextResponse.json({ error: "Failed to generate public URL" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: fileName
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

