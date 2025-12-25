"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Linkedin,
  Twitter,
  Github,
  Globe,
  Instagram,
  QrCode,
  Share2,
  Copy,
  Smartphone,
  Nfc,
  Download,
  ExternalLink,
  User,
  Sparkles,
  Zap
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/lib/supabase/client"

interface SocialProfile {
  linkedin?: string
  twitter?: string
  github?: string
  instagram?: string
  website?: string
  name?: string
  title?: string
  company?: string
  email?: string
  phone?: string
}

export default function NetworkProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcWriting, setNfcWriting] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  
  const [profile, setProfile] = useState<SocialProfile>({
    linkedin: "",
    twitter: "",
    github: "",
    instagram: "",
    website: "",
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    loadProfile()
    checkNfcSupport()
  }, [])

  const checkNfcSupport = () => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setNfcSupported(true)
    }
  }

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setProfile(prev => ({ ...prev, email: user.email || "" }))
        
        // Load profile from database
        const { data: dbProfile, error: dbError } = await supabase
          .from("network_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        if (dbError && dbError.code !== "PGRST116") { // PGRST116 = no rows returned
          console.error("Error loading profile from database:", dbError)
          // Fallback to localStorage if database fails
          const saved = localStorage.getItem(`network-profile-${user.id}`)
          if (saved) {
            setProfile(JSON.parse(saved))
          }
        } else if (dbProfile) {
          // Load from database
          setProfile({
            name: dbProfile.name || "",
            title: dbProfile.title || "",
            company: dbProfile.company || "",
            email: dbProfile.email || user.email || "",
            phone: dbProfile.phone || "",
            linkedin: dbProfile.linkedin || "",
            twitter: dbProfile.twitter || "",
            github: dbProfile.github || "",
            instagram: dbProfile.instagram || "",
            website: dbProfile.website || "",
          })
        } else {
          // Try localStorage as fallback for migration
          const saved = localStorage.getItem(`network-profile-${user.id}`)
          if (saved) {
            const localProfile = JSON.parse(saved)
            setProfile(localProfile)
            // Migrate from localStorage to database
            await supabase.from("network_profiles").upsert({
              user_id: user.id,
              name: localProfile.name || null,
              title: localProfile.title || null,
              company: localProfile.company || null,
              email: localProfile.email || user.email || null,
              phone: localProfile.phone || null,
              linkedin: localProfile.linkedin || null,
              twitter: localProfile.twitter || null,
              github: localProfile.github || null,
              instagram: localProfile.instagram || null,
              website: localProfile.website || null,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      // Fallback to localStorage on error
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const saved = localStorage.getItem(`network-profile-${user.id}`)
          if (saved) {
            setProfile(JSON.parse(saved))
          }
        }
      } catch (fallbackError) {
        console.error("Error loading from localStorage fallback:", fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: "error", text: "User not authenticated" })
        return
      }

      // Save to database using upsert (insert or update)
      const { error: dbError } = await supabase
        .from("network_profiles")
        .upsert({
          user_id: user.id,
          name: profile.name || null,
          title: profile.title || null,
          company: profile.company || null,
          email: profile.email || user.email || null,
          phone: profile.phone || null,
          linkedin: profile.linkedin || null,
          twitter: profile.twitter || null,
          github: profile.github || null,
          instagram: profile.instagram || null,
          website: profile.website || null,
        }, {
          onConflict: "user_id"
        })

      if (dbError) {
        console.error("Database save error:", dbError)
        // Fallback to localStorage if database save fails
        localStorage.setItem(`network-profile-${user.id}`, JSON.stringify(profile))
        setMessage({ type: "error", text: "Failed to save to database, saved locally instead" })
      } else {
        // Also save to localStorage as backup
        localStorage.setItem(`network-profile-${user.id}`, JSON.stringify(profile))
        setMessage({ type: "success", text: "Profile saved successfully!" })
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setMessage({ type: "error", text: "Failed to save profile" })
      // Try localStorage as last resort
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          localStorage.setItem(`network-profile-${user.id}`, JSON.stringify(profile))
        }
      } catch (fallbackError) {
        console.error("Error saving to localStorage fallback:", fallbackError)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getLinkedInUrl = () => {
    if (!profile.linkedin) return ""
    if (profile.linkedin.startsWith("http")) return profile.linkedin
    return `https://linkedin.com/in/${profile.linkedin}`
  }

  const getVCardData = () => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${profile.name || ""}
TITLE:${profile.title || ""}
ORG:${profile.company || ""}
EMAIL:${profile.email || ""}
TEL:${profile.phone || ""}
URL:${profile.linkedin ? getLinkedInUrl() : profile.website || ""}
END:VCARD`
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedLink(label)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const downloadQRCode = () => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = "linkedin-qr.png"
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const writeToNfc = async () => {
    if (!nfcSupported) {
      setMessage({ type: "error", text: "NFC is not supported on this device" })
      return
    }

    setNfcWriting(true)
    setMessage(null)

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader()
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: getLinkedInUrl()
          }
        ]
      })
      setMessage({ type: "success", text: "NFC tag written successfully! Tap any NFC-enabled phone to share your LinkedIn." })
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setMessage({ type: "error", text: "NFC permission denied. Please allow NFC access." })
      } else if (error.name === "NotSupportedError") {
        setMessage({ type: "error", text: "NFC is not supported on this device." })
      } else {
        setMessage({ type: "error", text: "Failed to write NFC tag. Make sure a tag is nearby." })
      }
    } finally {
      setNfcWriting(false)
    }
  }

  const pushViaNfc = async () => {
    if (!nfcSupported) {
      setMessage({ type: "error", text: "NFC is not supported on this device" })
      return
    }

    setNfcWriting(true)
    setMessage(null)

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader()
      await ndef.scan()
      
      // Make phone ready to push data
      ndef.onreading = () => {
        setMessage({ type: "success", text: "Device detected! Your LinkedIn profile link has been shared." })
        setNfcWriting(false)
      }
      
      // Push the URL when another device is nearby
      await ndef.write({
        records: [
          { recordType: "url", data: getLinkedInUrl() }
        ]
      })
      
      setMessage({ type: "success", text: "Ready! Tap another phone to share your LinkedIn profile." })
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setMessage({ type: "error", text: "NFC permission denied. Please allow NFC access in your browser settings." })
      } else {
        setMessage({ type: "error", text: "Hold phones back-to-back to share via NFC." })
      }
      setNfcWriting(false)
    }
  }

  const shareProfile = async () => {
    const shareData = {
      title: `${profile.name || "My"} Network Profile`,
      text: `Connect with ${profile.name || "me"} on LinkedIn`,
      url: getLinkedInUrl()
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyToClipboard(getLinkedInUrl(), "share")
      }
    } else {
      copyToClipboard(getLinkedInUrl(), "share")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
        {/* Simple background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/15 dark:bg-cyan-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/8 rounded-full blur-3xl" />
        
        {/* Loading content */}
        <div className="relative z-10 text-center">
          <div className="mb-6">
            <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl backdrop-blur-sm border border-cyan-400/20 inline-block">
              <Share2 className="h-16 w-16 text-cyan-400" />
            </div>
          </div>
          <div className="text-cyan-600 dark:text-cyan-400 font-semibold text-lg mb-4">Loading Network Profile</div>
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simplified animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        
        {/* Simple gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/15 dark:bg-cyan-600/8 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-600/8 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="container max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Simplified Header */}
        <div className="relative">
          <div className="relative backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 rounded-3xl p-8 border border-white/60 dark:border-gray-800/60 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Network Profile
                </h1>
                <p className="text-muted-foreground text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-500" />
                  Share your profile instantly with QR codes & NFC
                </p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                <QrCode className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">QR Code Ready</span>
              </div>
              {nfcSupported && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <Nfc className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">NFC Enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message notification */}
        {message && (
          <div className="animate-slide-down">
            <Card className={`border-2 backdrop-blur-sm shadow-xl ${
              message.type === "success" 
                ? "border-green-500 bg-green-50/50 dark:bg-green-950/50" 
                : "border-red-500 bg-red-50/50 dark:bg-red-950/50"
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                  <p className={message.type === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                    {message.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Simplified Profile Form */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-xl">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <CardDescription>Your networking details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="John Doe"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="Software Engineer"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      placeholder="Acme Inc."
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  Social Links
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0077B5] rounded-lg">
                      <Linkedin className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/username or username"
                      className="h-11 rounded-xl flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black dark:bg-white rounded-lg">
                      <Twitter className="h-5 w-5 text-white dark:text-black" />
                    </div>
                    <Input
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="@username"
                      className="h-11 rounded-xl flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 dark:bg-gray-200 rounded-lg">
                      <Github className="h-5 w-5 text-white dark:text-black" />
                    </div>
                    <Input
                      value={profile.github}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      placeholder="github.com/username"
                      className="h-11 rounded-xl flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={profile.instagram}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                      placeholder="@username"
                      className="h-11 rounded-xl flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="yourwebsite.com"
                      className="h-11 rounded-xl flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg"
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-5 w-5" /> Save Profile</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* QR Code & Share Options */}
          <div className="space-y-6">
            {/* Simplified LinkedIn QR Code */}
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-xl">
              <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-[#0077B5]/5 to-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0077B5] rounded-lg shadow-md">
                    <Linkedin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">LinkedIn QR Code</CardTitle>
                    <CardDescription>Scan to connect instantly</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {profile.linkedin ? (
                  <div className="flex flex-col items-center space-y-6">
                    <div ref={qrRef} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <QRCodeSVG
                        value={getLinkedInUrl()}
                        size={200}
                        level="H"
                        includeMargin
                        fgColor="#0077B5"
                        imageSettings={{
                          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230077B5'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E",
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(getLinkedInUrl(), "linkedin")}
                        className="rounded-xl"
                      >
                        {copiedLink === "linkedin" ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Copied!</>
                        ) : (
                          <><Copy className="mr-2 h-4 w-4" /> Copy Link</>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={downloadQRCode}
                        className="rounded-xl"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download QR
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={shareProfile}
                        className="rounded-xl"
                      >
                        <Share2 className="mr-2 h-4 w-4" /> Share
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.open(getLinkedInUrl(), "_blank")}
                        className="rounded-xl"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> Open
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Add your LinkedIn URL to generate QR code</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simplified NFC Card */}
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-xl">
              <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
                      <Nfc className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">NFC Tap to Share</CardTitle>
                      <CardDescription>Write to NFC tag for instant sharing</CardDescription>
                    </div>
                  </div>
                  {nfcSupported ? (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30">
                      <Zap className="h-3 w-3 mr-1" /> Supported
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Available</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {nfcSupported 
                      ? "Write your LinkedIn profile to an NFC tag. Anyone can tap it with their phone to instantly connect with you!"
                      : "NFC is not supported on this device/browser. Use Chrome on Android for NFC support."}
                  </p>
                  
                  {nfcSupported && profile.linkedin && (
                    <div className="space-y-3">
                      <Button
                        onClick={pushViaNfc}
                        disabled={nfcWriting || !profile.linkedin}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                      >
                        {nfcWriting ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Tap phones together...</>
                        ) : (
                          <><Smartphone className="mr-2 h-5 w-5" /> Tap to Share (Phone-to-Phone)</>
                        )}
                      </Button>
                      <Button
                        onClick={writeToNfc}
                        variant="outline"
                        disabled={nfcWriting || !profile.linkedin}
                        className="w-full h-11 rounded-xl border-purple-500/50 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <Nfc className="mr-2 h-4 w-4" /> Write to NFC Tag/Sticker
                      </Button>
                    </div>
                  )}
                  
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      How NFC Works
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Get an NFC tag/sticker (cheap on Amazon)</li>
                      <li>Click "Write to NFC Tag" above</li>
                      <li>Hold the tag near your phone's NFC reader</li>
                      <li>Share by having others tap the tag!</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Share Buttons */}
            <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {profile.linkedin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border-[#0077B5]/30"
                      onClick={() => window.open(getLinkedInUrl(), "_blank")}
                    >
                      <Linkedin className="h-4 w-4 mr-1 text-[#0077B5]" /> LinkedIn
                    </Button>
                  )}
                  {profile.twitter && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => window.open(`https://twitter.com/${profile.twitter?.replace("@", "")}`, "_blank")}
                    >
                      <Twitter className="h-4 w-4 mr-1" /> Twitter
                    </Button>
                  )}
                  {profile.github && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => window.open(`https://github.com/${profile.github}`, "_blank")}
                    >
                      <Github className="h-4 w-4 mr-1" /> GitHub
                    </Button>
                  )}
                  {profile.instagram && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => window.open(`https://instagram.com/${profile.instagram?.replace("@", "")}`, "_blank")}
                    >
                      <Instagram className="h-4 w-4 mr-1" /> Instagram
                    </Button>
                  )}
                  {profile.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => window.open(profile.website?.startsWith("http") ? profile.website : `https://${profile.website}`, "_blank")}
                    >
                      <Globe className="h-4 w-4 mr-1" /> Website
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

