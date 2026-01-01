"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Scan, Loader2, CheckCircle2, Camera, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { checkUsageLimitClient } from "@/lib/plan-features-client"

interface BusinessCardScannerProps {
  userId: string
  networkingModeEnabled?: boolean
  networkingMessage?: string
}

type ScanMode = "upload" | "camera"

export function BusinessCardScanner({
  userId,
  networkingModeEnabled = false,
  networkingMessage,
}: BusinessCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<any>(null)
  const [scanMode, setScanMode] = useState<ScanMode>("upload")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [autoDetect, setAutoDetect] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastContactId, setLastContactId] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const autoDetectIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsCameraLoading(true)
      setIsCameraActive(false)
      
      // Optimize for faster startup - use reasonable resolution that's fast to initialize
      // This still provides good quality for business card scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
        },
      })
      
      streamRef.current = stream
      
      // Set active state - useEffect will handle attaching stream to video element
      setIsCameraActive(true)
      setIsCameraLoading(false)
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : "Failed to access camera. Please ensure your device has a camera and try again."
      )
      setIsCameraActive(false)
      setIsCameraLoading(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsCameraLoading(false)
    stopAutoDetect()
  }

  // Start auto-detection
  const startAutoDetect = () => {
    stopAutoDetect()
    autoDetectIntervalRef.current = setInterval(() => {
      if (!isScanning && videoRef.current) {
        captureAndScan()
      }
    }, 3000) // Scan every 3 seconds
  }

  // Stop auto-detection
  const stopAutoDetect = () => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current)
      autoDetectIntervalRef.current = null
    }
  }

  // Capture frame from video
  const captureFrame = (): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    return canvas.toDataURL("image/jpeg", 0.9).split(",")[1]
  }

  // Process image (shared between file upload and camera capture)
  const processImage = useCallback(async (base64: string) => {
    setIsScanning(true)
    setSuccess(false)
    setExtractedInfo(null)

    try {
      console.log("[v0] Extracting business card info...")
      
      // Call API route to extract business card info
      const response = await fetch("/api/scan-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64, userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to extract business card information")
      }

      const result = await response.json()
      const info = result.data
      
      // Check if we got valid contact information
      if (!info || (!info.name && !info.email && !info.phone)) {
        console.log("[v0] No valid contact info detected")
        setIsScanning(false)
        return // Don't save if no valid info
      }

      console.log("[v0] Extracted info:", info)
      setExtractedInfo(info)

      // Check contact limit before saving
      const contactLimitCheck = await checkUsageLimitClient(userId, 'contacts')
      if (!contactLimitCheck.allowed) {
        alert(contactLimitCheck.message || "Contact limit reached. Please upgrade your plan.")
        setIsScanning(false)
        return
      }

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
      setLastContactId(data?.id || null)

      // Log event
      await supabase.from("events").insert({
        user_id: userId,
        contact_id: data.id,
        event_type: "connection",
        description: "Added via business card scan",
      })

      setSuccess(true)
      
      // Auto-send email if networking mode is enabled and email exists
      if (networkingModeEnabled && info.email && networkingMessage) {
        await autoSendNetworkingEmail(data, info)
      }
      
      // Don't stop camera automatically - let user decide
      // They can continue capturing or manually close the camera
      
      setTimeout(() => {
        setPreview(null)
        setSuccess(false)
        setExtractedInfo(null)
      }, 5000) // Increased timeout to give more time to see the result
    } catch (error) {
      console.error("[v0] Scan error:", error)
      
      // Show more specific error message
      let errorMessage = "Failed to scan business card. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("No AI API keys configured")) {
          errorMessage = "No AI API keys configured. Please add GEMINI_API_KEY to your .env.local file."
        } else if (error.message.includes("API key not configured") || error.message.includes("GEMINI_API_KEY")) {
          errorMessage = "API key not configured. Please set up your AI API key in the environment variables."
        } else if (error.message.includes("API request failed")) {
          errorMessage = "API request failed. Please check your internet connection and try again."
        } else if (error.message.includes("No image data")) {
          errorMessage = "Invalid image file. Please select a valid image."
        } else if (error.message.includes("All AI providers failed")) {
          errorMessage = "All AI providers failed. Please check your API keys and internet connection."
        } else {
          errorMessage = `Scan failed: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsScanning(false)
    }
  }, [userId, scanMode])

  const autoSendNetworkingEmail = useCallback(
    async (contactRecord: any, info: any) => {
      if (!networkingModeEnabled || !info?.email || !networkingMessage?.trim()) return

      try {
        // Check usage limit before sending
        const usageCheckRes = await fetch("/api/networking-mode/check-usage")
        if (!usageCheckRes.ok) {
          const errorData = await usageCheckRes.json().catch(() => ({}))
          if (errorData.requiresPro) {
            alert(`You've reached your free trial limit of 100 networking mode emails. Please upgrade to Professional for unlimited networking mode.`)
            return
          }
          throw new Error("Failed to check usage")
        }

        const usageCheck = await usageCheckRes.json()
        if (!usageCheck.allowed) {
          alert(usageCheck.requiresPro 
            ? `You've reached your free trial limit of 100 networking mode emails. Please upgrade to Professional for unlimited networking mode.`
            : "Networking mode limit reached. Please upgrade to continue.")
          return
        }

        // Increment usage before sending
        const incrementRes = await fetch("/api/networking-mode/increment-usage", {
          method: "POST"
        })
        
        if (!incrementRes.ok) {
          const errorData = await incrementRes.json().catch(() => ({}))
          if (errorData.requiresPro) {
            alert(`You've reached your free trial limit of 100 networking mode emails. Please upgrade to Professional for unlimited networking mode.`)
            return
          }
          throw new Error("Failed to increment usage")
        }
        let purpose = networkingMessage.trim()
        
        // If the message looks like a full email template (contains greeting/signature), 
        // use it as a base template to customize
        if (purpose.length > 200 && (purpose.includes("Hi") || purpose.includes("Hello") || purpose.includes("Dear"))) {
          purpose = `Use this email template as the base and customize it for ${info.name || "the contact"}${info.company ? ` from ${info.company}` : ""}:\n\n${purpose}\n\nCustomize the greeting, add specific details about meeting them, and personalize the content while keeping the same tone and structure.`
        }

        // Generate customized email for this specific contact
        const generateRes = await fetch("/api/generate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: info.name || "there",
            contactCompany: info.company || "",
            purpose,
            contactId: contactRecord?.id,
            userId,
          }),
        })

        if (!generateRes.ok) {
          const err = await generateRes.json().catch(() => ({}))
          console.error("Failed to generate email:", err)
          return
        }

        const { emailBody } = await generateRes.json()
        if (!emailBody) {
          console.error("No email body returned")
          return
        }

        // Auto-send the customized email
        const subject =
          purpose.length > 80
            ? `${purpose.substring(0, 77)}...`
            : purpose || "Great to meet you!"

        const sendRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactEmail: info.email,
            subject,
            body: emailBody,
            emailId: null,
          }),
        })

        if (!sendRes.ok) {
          const err = await sendRes.json().catch(() => ({}))
          console.error("Failed to send email:", err)
        } else {
          console.log("Email sent successfully to", info.email)
          
          // Increment networking mode usage after successful email send
          try {
            await fetch("/api/networking-mode/increment-usage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            })
          } catch (usageError) {
            console.error("Failed to increment usage:", usageError)
            // Don't fail the whole operation if usage tracking fails
          }
          
          // Increment networking mode usage count
          try {
            await fetch("/api/networking-mode/increment-usage", {
              method: "POST",
            })
          } catch (usageError) {
            console.error("Failed to increment usage:", usageError)
            // Don't fail the whole operation if usage tracking fails
          }
        }
      } catch (error) {
        console.error("Networking auto-send error:", error)
      }
    },
    [networkingModeEnabled, networkingMessage, userId]
  )

  // Capture and scan
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || isScanning) return

    const base64 = captureFrame()
    if (!base64) return

    // Show preview
    setPreview(`data:image/jpeg;base64,${base64}`)

    await processImage(base64)
  }, [isScanning, processImage])

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Convert to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1]
        resolve(base64String)
      }
      reader.readAsDataURL(file)
    })

    await processImage(base64)
  }

  // Effect to attach stream to video element when both are ready
  useEffect(() => {
    if (videoRef.current && streamRef.current && isCameraActive && !isCameraLoading) {
      const video = videoRef.current
      const stream = streamRef.current
      
      // Only set if not already set
      if (video.srcObject !== stream) {
        video.srcObject = stream
        
        // Start playing
        video.play().catch((err) => {
          console.error("Video play error:", err)
        })
      }
    }
  }, [isCameraActive, isCameraLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Handle auto-detect toggle
  useEffect(() => {
    if (autoDetect && isCameraActive) {
      stopAutoDetect() // Clear any existing interval
      autoDetectIntervalRef.current = setInterval(() => {
        if (!isScanning && videoRef.current) {
          captureAndScan()
        }
      }, 3000) // Scan every 3 seconds
    } else {
      stopAutoDetect()
    }
    
    return () => {
      stopAutoDetect()
    }
  }, [autoDetect, isCameraActive, isScanning, captureAndScan])

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
      <CardContent className="p-4 sm:p-6 lg:p-12">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Mode toggle buttons */}
          {!preview && (
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 w-full sm:w-auto">
              <Button
                variant={scanMode === "upload" ? "default" : "outline"}
                onClick={() => {
                  if (scanMode === "camera") {
                    stopCamera()
                  }
                  setScanMode("upload")
                }}
                className="flex-1 sm:flex-initial text-sm sm:text-base"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button
                variant={scanMode === "camera" ? "default" : "outline"}
                onClick={() => {
                  setScanMode("camera")
                  if (!isCameraActive && !isCameraLoading) {
                    startCamera()
                  }
                }}
                className="flex-1 sm:flex-initial text-sm sm:text-base"
                size="sm"
              >
                <Camera className="mr-2 h-4 w-4" />
                Camera
              </Button>
            </div>
          )}

          {/* Camera view */}
          {scanMode === "camera" && (
            <div className="w-full max-w-md space-y-3 sm:space-y-4">
              {/* Always render video element when in camera mode for ref availability */}
              <div className={`relative rounded-lg overflow-hidden border-2 border-primary/30 bg-black ${isCameraLoading ? 'min-h-[200px] sm:min-h-[300px]' : ''}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
                {isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-lg font-medium">Starting camera...</span>
                    </div>
                  </div>
                )}
                {isScanning && !isCameraLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-lg font-medium">Detecting text...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Show camera controls when active and no preview */}
              {isCameraActive && !preview && !isCameraLoading && (
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Button
                      onClick={captureAndScan}
                      disabled={isScanning}
                      size="lg"
                      className="flex-1 text-sm sm:text-base"
                    >
                      <Scan className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Capture & Scan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopCamera()
                        setScanMode("upload")
                      }}
                      size="lg"
                      className="px-3 sm:px-4"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  <label className="flex items-center justify-center gap-2 cursor-pointer px-2">
                    <input
                      type="checkbox"
                      checked={autoDetect}
                      onChange={(e) => setAutoDetect(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">Auto-detect (scans every 3 seconds)</span>
                  </label>
                </div>
              )}
              
              {/* Show preview when available */}
              {preview && !isCameraLoading && (
                <>
                  {/* Preview with camera controls */}
                  <div className="relative w-full">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Business card preview"
                      className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="flex items-center gap-3 text-white">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-lg font-medium">Scanning business card...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
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
                      {networkingModeEnabled && extractedInfo.email && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Email sent automatically!</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Camera controls when preview is shown */}
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Button
                        onClick={() => {
                          setPreview(null)
                          setSuccess(false)
                          setExtractedInfo(null)
                        }}
                        variant="outline"
                        size="lg"
                        className="flex-1 text-sm sm:text-base"
                      >
                        <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Capture Another
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          stopCamera()
                          setScanMode("upload")
                          setPreview(null)
                          setSuccess(false)
                          setExtractedInfo(null)
                        }}
                        size="lg"
                        className="px-3 sm:px-4"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {cameraError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {cameraError}
                </div>
              )}
            </div>
          )}

          {/* Preview (from file upload only) */}
          {preview && scanMode === "upload" && (
            <div className="w-full max-w-md">
              <img
                src={preview || "/placeholder.svg"}
                alt="Business card preview"
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg mb-4 sm:mb-6 shadow-lg"
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
                  {networkingModeEnabled && extractedInfo.email && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Email sent automatically!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload mode (default view) */}
          {scanMode === "upload" && !preview && !isCameraActive && (
            <>
              <div className="rounded-full bg-primary/10 p-4 sm:p-6 mb-4 sm:mb-6">
                <Scan className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Scan Business Card</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md px-2">
                Upload a photo or use your camera to scan a business card and we&apos;ll automatically extract the contact information using AI
              </p>
              <label htmlFor="card-upload">
                <Button size="lg" className="cursor-pointer text-sm sm:text-base" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Upload Business Card
                  </span>
                </Button>
              </label>
              <input id="card-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </>
          )}
        </div>
        
        {/* Hidden canvas for capturing video frames */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
