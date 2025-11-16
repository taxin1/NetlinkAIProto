"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Scan, Loader2, CheckCircle2, Camera, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface BusinessCardScannerProps {
  userId: string
}

type ScanMode = "upload" | "camera"

export function BusinessCardScanner({ userId }: BusinessCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<any>(null)
  const [scanMode, setScanMode] = useState<ScanMode>("upload")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [autoDetect, setAutoDetect] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  
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
        body: JSON.stringify({ imageBase64: base64 }),
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
          errorMessage = "No AI API keys configured. Please add GEMINI_API_KEY or DEEPSEEK_API_KEY to your .env.local file."
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
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Mode toggle buttons */}
          {!preview && (
            <div className="flex gap-3 mb-6">
              <Button
                variant={scanMode === "upload" ? "default" : "outline"}
                onClick={() => {
                  if (scanMode === "camera") {
                    stopCamera()
                  }
                  setScanMode("upload")
                }}
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
              >
                <Camera className="mr-2 h-4 w-4" />
                Camera
              </Button>
            </div>
          )}

          {/* Camera view */}
          {scanMode === "camera" && (
            <div className="w-full max-w-md space-y-4">
              {/* Always render video element when in camera mode for ref availability */}
              <div className={`relative rounded-lg overflow-hidden border-2 border-primary/30 bg-black ${isCameraLoading ? 'min-h-[300px]' : ''}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={captureAndScan}
                      disabled={isScanning}
                      size="lg"
                      className="flex-1"
                    >
                      <Scan className="mr-2 h-5 w-5" />
                      Capture & Scan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopCamera()
                        setScanMode("upload")
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <label className="flex items-center justify-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDetect}
                      onChange={(e) => setAutoDetect(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Auto-detect (scans every 3 seconds)</span>
                  </label>
                </div>
              )}
              
              {/* Show preview when available */}
              {preview && !isCameraLoading && (
                <>
                  {/* Preview with camera controls */}
                  <div className="relative">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Business card preview"
                      className="w-full h-auto rounded-lg shadow-lg"
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
                    </div>
                  )}
                  
                  {/* Camera controls when preview is shown */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={() => {
                          setPreview(null)
                          setSuccess(false)
                          setExtractedInfo(null)
                        }}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        <Camera className="mr-2 h-5 w-5" />
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
                      >
                        <X className="h-5 w-5" />
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
          )}

          {/* Upload mode (default view) */}
          {scanMode === "upload" && !preview && !isCameraActive && (
            <>
              <div className="rounded-full bg-primary/10 p-6 mb-6">
                <Scan className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Scan Business Card</h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Upload a photo or use your camera to scan a business card and we&apos;ll automatically extract the contact information using AI
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
        
        {/* Hidden canvas for capturing video frames */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
