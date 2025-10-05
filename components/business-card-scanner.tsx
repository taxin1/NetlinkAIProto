"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Scan, Loader2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { extractBusinessCardInfo } from "@/lib/gemini"

interface BusinessCardScannerProps {
  userId: string
}

export function BusinessCardScanner({ userId }: BusinessCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<any>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Extract info
    setIsScanning(true)
    setSuccess(false)
    setExtractedInfo(null)

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1]
          resolve(base64String)
        }
        reader.readAsDataURL(file)
      })

      console.log("[v0] Extracting business card info...")
      const info = await extractBusinessCardInfo(base64)
      console.log("[v0] Extracted info:", info)
      setExtractedInfo(info)

      // Save to database
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: userId,
          name: info.name || "Unknown",
          email: info.email,
          phone: info.phone,
          company: info.company,
          position: info.position,
          linkedin_url: info.linkedin_url,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error saving contact:", error)
        throw error
      }

      console.log("[v0] Contact saved:", data)

      // Log event
      await supabase.from("events").insert({
        user_id: userId,
        contact_id: data.id,
        event_type: "connection",
        description: "Added via business card scan",
      })

      setSuccess(true)
      setTimeout(() => {
        setPreview(null)
        setSuccess(false)
        setExtractedInfo(null)
      }, 3000)
    } catch (error) {
      console.error("[v0] Scan error:", error)
      alert("Failed to scan business card. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          {preview ? (
            <div className="w-full max-w-md">
              <img
                src={preview || "/placeholder.svg"}
                alt="Business card preview"
                className="w-full h-auto rounded-lg mb-6 shadow-lg"
              />
              {isScanning && (
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg font-medium">Scanning business card...</span>
                </div>
              )}
              {success && extractedInfo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-green-500">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-lg font-medium">Contact added successfully!</span>
                  </div>
                  <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
                    {extractedInfo.name && (
                      <p>
                        <span className="font-medium">Name:</span> {extractedInfo.name}
                      </p>
                    )}
                    {extractedInfo.company && (
                      <p>
                        <span className="font-medium">Company:</span> {extractedInfo.company}
                      </p>
                    )}
                    {extractedInfo.position && (
                      <p>
                        <span className="font-medium">Position:</span> {extractedInfo.position}
                      </p>
                    )}
                    {extractedInfo.email && (
                      <p>
                        <span className="font-medium">Email:</span> {extractedInfo.email}
                      </p>
                    )}
                    {extractedInfo.phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {extractedInfo.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-6 mb-6">
                <Scan className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Scan Business Card</h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Upload a photo of a business card and we&apos;ll automatically extract the contact information using AI
              </p>
              <label htmlFor="card-upload">
                <Button size="lg" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Business Card
                  </span>
                </Button>
              </label>
              <input id="card-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
