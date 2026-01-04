"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Settings as SettingsIcon,
  Trash2,
  Eye,
  EyeOff,
  Server,
  Shield,
  Zap,
  Sparkles,
  Languages
} from "lucide-react"
import { GoogleCalendarSettings } from "@/components/google-calendar-settings"
import { GmailSettings } from "@/components/gmail-settings"
import { AITrainer } from "@/components/ai-trainer"
import { SubscriptionManagement } from "@/components/subscription-management"
import { useTranslations } from "@/lib/hooks/use-translations"

interface EmailSettings {
  id?: string
  email_provider: string
  email_address: string
  smtp_host?: string
  smtp_port?: number
  smtp_secure?: boolean
  from_name?: string
  is_active?: boolean
}

export default function SettingsPage() {
  const { t, lang, changeLanguage } = useTranslations()
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  
  const [settings, setSettings] = useState<EmailSettings>({
    email_provider: "gmail",
    email_address: "",
    from_name: "",
  })
  const [emailPassword, setEmailPassword] = useState("")
  const [hasExistingSettings, setHasExistingSettings] = useState(false)

  useEffect(() => {
    // Safety timeout to ensure loading state is cleared after 3 seconds max
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    // Get user ID
    const getUser = async () => {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()

    loadSettings()

    return () => {
      clearTimeout(safetyTimeout)
    }
  }, [])

  const loadSettings = async () => {
    try {
      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const response = await fetch("/api/email-settings", {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
          setHasExistingSettings(true)
        }
      } else {
        // If API returns error, still continue (settings might not exist yet)
        console.log("Email settings not found, continuing...")
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("Settings API request timed out")
      } else {
        console.error("Error loading settings:", error)
      }
      // Don't block the page from loading if API call fails
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings.email_address || !emailPassword) {
      setMessage({ type: "error", text: "Email address and password are required" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/email-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          email_password: emailPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      const data = await response.json()
      setSettings(data.settings)
      setHasExistingSettings(true)
      setEmailPassword("") // Clear password field after save
      setMessage({ type: "success", text: "Email settings saved successfully!" })
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to save settings" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your email settings?")) {
      return
    }

    setIsDeleting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/email-settings", {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete settings")
      }

      setSettings({
        email_provider: "gmail",
        email_address: "",
        from_name: "",
      })
      setEmailPassword("")
      setHasExistingSettings(false)
      setMessage({ type: "success", text: "Email settings deleted successfully!" })
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to delete settings" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTestEmail = async () => {
    if (!settings.email_address) {
      setMessage({ type: "error", text: "Please save your settings first" })
      return
    }

    setIsTesting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send test email")
      }

      setMessage({ type: "success", text: "Test email sent successfully! Check your inbox." })
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to send test email" 
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 animate-gradient-shift" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="container max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header with gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-20 animate-pulse-slow" />
          <div className="relative backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 rounded-2xl p-8 border border-white/60 dark:border-gray-800/60 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg animate-bounce-slow">
                <SettingsIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your account settings and preferences ✨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-fade-in-up">
          <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-lg">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {t("language")}
                </CardTitle>
                <CardDescription className="mt-1">
                  Choose your preferred language for the application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-3 max-w-xs">
              <Label htmlFor="app-language" className="text-base font-semibold">
                Select Language
              </Label>
              <select
                id="app-language"
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as any)}
                className="flex h-12 w-full rounded-xl border-2 border-input bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 hover:border-blue-400 cursor-pointer"
              >
                <option value="en">🇺🇸 {t("english")}</option>
                <option value="ja">🇯🇵 {t("japanese")}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management Card - Moved to top */}
        <div id="subscription-management">
          {userId ? (
            <SubscriptionManagement userId={userId} />
          ) : (
            <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Message notification with animation */}
        {message && (
          <div className="animate-slide-down">
            <Card className={`border-2 backdrop-blur-sm shadow-xl ${
              message.type === "success" 
                ? "border-green-500 bg-green-50/50 dark:bg-green-950/50" 
                : "border-red-500 bg-red-50/50 dark:bg-red-950/50"
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    message.type === "success" ? "bg-green-500/20" : "bg-red-500/20"
                  } animate-pulse`}>
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <p className={`font-medium ${
                    message.type === "success" 
                      ? "text-green-700 dark:text-green-300" 
                      : "text-red-700 dark:text-red-300"
                  }`}>
                    {message.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Main configuration card with glass effect */}
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-fade-in-up">
        <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Email Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Set up your email account to send personalized emails
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="space-y-6">
            {/* Provider selection with icons */}
            <div className="grid gap-3 group">
              <Label htmlFor="email-provider" className="text-base font-semibold flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Email Provider
              </Label>
              <select
                id="email-provider"
                value={settings.email_provider}
                onChange={(e) => setSettings({ ...settings, email_provider: e.target.value })}
                className="flex h-12 w-full rounded-xl border-2 border-input bg-background/50 backdrop-blur-sm px-4 py-2 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 hover:border-blue-400 cursor-pointer"
              >
                <option value="gmail">📧 Gmail</option>
                <option value="outlook">📨 Outlook</option>
                <option value="smtp">⚙️ Custom SMTP</option>
              </select>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="relative text-sm text-muted-foreground bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  {settings.email_provider === "gmail" && 
                    "🔐 For Gmail, you'll need to use an App Password. Go to Google Account → Security → 2-Step Verification → App Passwords"
                  }
                  {settings.email_provider === "outlook" && 
                    "✅ Use your Outlook/Hotmail email and regular password"
                  }
                  {settings.email_provider === "smtp" && 
                    "⚙️ Configure your custom SMTP server settings below"
                  }
                </p>
              </div>
            </div>

            {/* Email address input with gradient border on focus */}
            <div className="grid gap-3 group">
              <Label htmlFor="email-address" className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email-address"
                  type="email"
                  value={settings.email_address}
                  onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                  placeholder="your.email@example.com"
                  className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm px-4 transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
            </div>

            {/* Password input with toggle */}
            <div className="grid gap-3 group">
              <Label htmlFor="email-password" className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                {settings.email_provider === "gmail" ? "App Password" : "Email Password"}
              </Label>
              <div className="relative">
                <Input
                  id="email-password"
                  type={showPassword ? "text" : "password"}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={hasExistingSettings ? "Enter new password to update" : "Enter password"}
                  className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm px-4 pr-12 transition-all duration-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-green-400"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-green-500/10 transition-all duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-green-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600" />
                  )}
                </Button>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
              {hasExistingSettings && !emailPassword && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Leave blank to keep existing password
                </p>
              )}
            </div>

            {/* From name input */}
            <div className="grid gap-3 group">
              <Label htmlFor="from-name" className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                From Name <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="from-name"
                  type="text"
                  value={settings.from_name || ""}
                  onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                  placeholder="Your Name or Company"
                  className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm px-4 transition-all duration-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 hover:border-yellow-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
              <p className="text-sm text-muted-foreground">
                This name will appear in the "From" field of your emails
              </p>
            </div>

            {settings.email_provider === "smtp" && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border-2 border-indigo-200/50 dark:border-indigo-800/50 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Custom SMTP Configuration</h3>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="smtp-host" className="text-base font-semibold">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    type="text"
                    value={settings.smtp_host || ""}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.example.com"
                    className="h-12 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="smtp-port" className="text-base font-semibold">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                    placeholder="587"
                    className="h-12 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={settings.smtp_secure || false}
                    onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                    className="h-5 w-5 rounded border-2 border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all duration-300"
                  />
                  <Label htmlFor="smtp-secure" className="text-base font-medium cursor-pointer flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    Use SSL/TLS Encryption
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons with gradients and animations */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !settings.email_address || (!emailPassword && !hasExistingSettings)}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Save Settings
                </>
              )}
            </Button>

            {hasExistingSettings && (
              <>
                <Button 
                  variant="outline"
                  onClick={handleTestEmail} 
                  disabled={isTesting}
                  className="h-12 rounded-xl border-2 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 font-semibold shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      Test
                    </>
                  )}
                </Button>

                <Button 
                  variant="destructive"
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="h-12 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  {isDeleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status card with gradient and animation */}
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl overflow-hidden animate-fade-in-up delay-200">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-blue-400/10 to-purple-400/10 animate-gradient-x" />
        <CardContent className="relative p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shadow-lg ${
                hasExistingSettings 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse-slow" 
                  : "bg-gradient-to-br from-yellow-500 to-orange-600"
              }`}>
                {hasExistingSettings ? (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">Email Configuration Status</h3>
                <p className="text-sm text-muted-foreground">Current setup status</p>
              </div>
            </div>
            {hasExistingSettings ? (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-base shadow-lg animate-pulse-slow">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Active & Ready
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 text-base shadow-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                Setup Required
              </Badge>
            )}
          </div>
          
          <div className={`p-4 rounded-xl border-2 ${
            hasExistingSettings
              ? "bg-green-50/50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : "bg-yellow-50/50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
          }`}>
            <p className="text-sm leading-relaxed">
              {hasExistingSettings 
                ? "✨ Your email is configured and ready to use! All emails will be sent from your personal account, making your communications more authentic and professional."
                : "⚙️ Configure your email settings above to start sending personalized emails from your own address. This helps build trust with your recipients."
              }
            </p>
          </div>

          {hasExistingSettings && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Active</p>
              </div>
              <div className="text-center p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100">Secure</p>
              </div>
              <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-green-900 dark:text-green-100">Ready</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Trainer Card */}
      {userId && (
        <AITrainer userId={userId} />
      )}

      {/* Gmail Integration Card */}
      <GmailSettings />

      {/* Google Calendar Integration Card */}
      <GoogleCalendarSettings />
      </div>
    </div>
  )
}
