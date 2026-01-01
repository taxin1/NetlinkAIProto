"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sparkles, WifiOff, MailCheck, Lightbulb, Loader2, CheckCircle2, AlertCircle, Crown } from "lucide-react"
import { BusinessCardScanner } from "./business-card-scanner"
import Link from "next/link"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface NetworkingModeSectionProps {
  userId: string
}

interface UsageInfo {
  allowed: boolean
  usage: number
  limit: number | null
  remaining: number | null
  isPro: boolean
}

export function NetworkingModeSection({ userId }: NetworkingModeSectionProps) {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState(
    "Great meeting you! I'd love to stay in touch and share my links."
  )
  const [emailTemplate, setEmailTemplate] = useState<string | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<string | null>(null)
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false)
  const [templatePrepared, setTemplatePrepared] = useState(false)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [isLoadingUsage, setIsLoadingUsage] = useState(true)

  // Fetch usage info on mount and when enabled changes
  useEffect(() => {
    fetchUsageInfo()
  }, [enabled])

  const fetchUsageInfo = async () => {
    try {
      setIsLoadingUsage(true)
      const response = await fetch("/api/networking-mode/check-usage")
      if (!response.ok) throw new Error("Failed to fetch usage")
      const data = await response.json()
      setUsageInfo(data)
      
      // If usage limit reached and user tries to enable, disable it
      if (!data.allowed && enabled) {
        setEnabled(false)
      }
    } catch (error) {
      console.error("Error fetching usage info:", error)
    } finally {
      setIsLoadingUsage(false)
    }
  }

  const handleToggleEnabled = async (checked: boolean) => {
    // Check usage before enabling
    if (checked) {
      const response = await fetch(`/api/networking-mode/check-usage?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (!data.allowed) {
          alert(`You've reached your free trial limit of 100 networking mode uses. Please upgrade to Pro for unlimited usage.`)
          return
        }
        setUsageInfo({
          ...data,
          isPro: data.remaining === null,
        })
      }
    }
    setEnabled(checked)
  }


  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Networking Mode (Connect Faster)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {enabled ? <MailCheck className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
            <Label htmlFor="networking-mode-switch" className="text-sm cursor-pointer">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="networking-mode-switch"
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
              aria-label="Enable networking mode"
              disabled={!usageInfo?.allowed && !isLoadingUsage}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Before the event:</strong> Prepare your email template below. 
          <strong>At the event:</strong> When enabled, scanning cards will automatically send customized emails using your prepared template.
        </p>
        {/* Usage Info */}
        {!isLoadingUsage && usageInfo && (
          <div className="mt-3 pt-3 border-t">
            {usageInfo.isPro ? (
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Pro Plan: Unlimited networking mode usage</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Free Trial: {usageInfo.usage} / {usageInfo.limit} uses
                </span>
                {usageInfo.remaining !== null && (
                  <Badge variant={usageInfo.remaining > 10 ? "default" : "destructive"}>
                    {usageInfo.remaining} remaining
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upgrade Alert */}
        {!isLoadingUsage && usageInfo && !usageInfo.allowed && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Free Trial Limit Reached</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              You've used all {usageInfo.limit} free networking mode uses. Upgrade to Pro for unlimited usage and access to all premium features.
              <div className="mt-3">
                <Link href="/checkout?plan=professional">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {/* Step 1: Prepare Email Template (Before Event) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Lightbulb className="h-3 w-3" />
                Step 1: Prepare Email Template (Before Event)
              </Badge>
              {templatePrepared && (
                <Badge variant="default" className="gap-1 bg-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Prepared
                </Badge>
              )}
            </div>
            <Button
              onClick={async () => {
                if (!message.trim()) {
                  alert("Please enter your context message first")
                  return
                }
                setIsGeneratingTemplate(true)
                try {
                  const response = await fetch("/api/generate-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contactName: "Sample Contact",
                      contactCompany: "Sample Company",
                      purpose: message.trim(),
                      userId,
                    }),
                  })
                  if (!response.ok) throw new Error("Failed to generate template")
                  const { emailBody } = await response.json()
                  setEmailTemplate(emailBody)
                  setEditedTemplate(emailBody)
                  setTemplatePrepared(true)
                  setIsEditingTemplate(false)
                } catch (error) {
                  alert("Failed to generate template. Please try again.")
                } finally {
                  setIsGeneratingTemplate(false)
                }
              }}
              disabled={isGeneratingTemplate || !message.trim()}
              size="sm"
              className="gap-2"
            >
              {isGeneratingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Template
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setTemplatePrepared(false)
              setEmailTemplate(null)
            }}
            placeholder="Great meeting you at the Tech Conference today! I'd love to stay in touch and share my links. Let's connect about potential collaboration opportunities."
            className="min-h-[100px] resize-none"
          />
          {emailTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Email Template:</Label>
                <div className="flex gap-2">
                  {!isEditingTemplate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingTemplate(true)
                        setEditedTemplate(emailTemplate)
                      }}
                      className="gap-2"
                    >
                      <Sparkles className="h-3 w-3" />
                      Edit Template
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingTemplate(false)
                          setEditedTemplate(emailTemplate)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editedTemplate?.trim()) {
                            setEmailTemplate(editedTemplate)
                            setIsEditingTemplate(false)
                            setTemplatePrepared(true)
                            // Preview will be hidden automatically when templatePrepared is true
                          }
                        }}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Save & Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {isEditingTemplate ? (
                <Textarea
                  value={editedTemplate || emailTemplate}
                  onChange={(e) => setEditedTemplate(e.target.value)}
                  className="min-h-[200px] resize-none font-mono text-sm"
                  placeholder="Edit your email template here..."
                />
              ) : templatePrepared && !isEditingTemplate ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Template saved and ready. Start scanning cards below.</span>
                </div>
              ) : (
                <Card className="border-primary/20 bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap text-foreground">{emailTemplate}</p>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      This template will be customized for each contact when scanning at the event.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Be specific about the event, what you'll discuss, or why you're connecting. 
              Generate a template to preview how it will look.
            </p>
          </div>
        </div>

        {/* Step 2: Scan at Event - Main Focus */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Step 2: Scan Cards at Event
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {enabled && templatePrepared
                  ? "✅ Ready! Scan cards below - emails will be sent automatically."
                  : enabled
                  ? "⚠️ Please prepare your email template first (Step 1) before scanning."
                  : "Enable networking mode above and prepare your template to start scanning."}
              </p>
            </div>
            {enabled && templatePrepared && (
              <Badge variant="default" className="bg-green-500 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
          
          {/* Scanner - Main Focus Area */}
          <div className="rounded-xl border-2 border-primary/50 p-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 shadow-lg">
            <BusinessCardScanner
              userId={userId}
              networkingModeEnabled={enabled && templatePrepared}
              networkingMessage={emailTemplate || message}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
