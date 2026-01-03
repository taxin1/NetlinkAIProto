"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Sparkles,
  User,
  Briefcase,
  Building2,
  Link as LinkIcon,
  ShieldCheck,
  Loader2,
  Info,
  ArrowRight,
  Lightbulb,
} from "lucide-react"

type OnboardingProfile = {
  name?: string | null
  title?: string | null
  company?: string | null
  email?: string | null
  linkedin?: string | null
  website?: string | null
  is_public_profile?: boolean | null
}

type OnboardingWizardProps = {
  userId: string
  initialEmail?: string
  existingProfile?: OnboardingProfile | null
}

export function OnboardingWizard({ userId, initialEmail = "", existingProfile }: OnboardingWizardProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: existingProfile?.name ?? "",
    title: existingProfile?.title ?? "",
    company: existingProfile?.company ?? "",
    email: existingProfile?.email ?? initialEmail,
    linkedin: existingProfile?.linkedin ?? "",
    website: existingProfile?.website ?? "",
    isPublicProfile: existingProfile?.is_public_profile ?? true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const normalizeUrl = (value: string) => {
    if (!value) return ""
    const trimmed = value.trim()
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
    return `https://${trimmed}`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("network_profiles")
        .upsert(
          {
            user_id: userId,
            name: form.name.trim() || null,
            title: form.title.trim() || null,
            company: form.company.trim() || null,
            email: form.email.trim() || initialEmail || null,
            linkedin: form.linkedin ? normalizeUrl(form.linkedin) : null,
            website: form.website ? normalizeUrl(form.website) : null,
            is_public_profile: form.isPublicProfile,
          },
          { onConflict: "user_id" },
        )

      if (error) {
        setMessage({ type: "error", text: error.message })
        return
      }

      setMessage({ type: "success", text: "Profile saved. You’re all set!" })
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error saving onboarding profile:", error)
      setMessage({ type: "error", text: "Could not save your profile. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
    router.refresh()
  }

  const guidelines = [
    "Use your real name and role so teammates recognize you.",
    "Add at least one link (LinkedIn or website) so people can reach you.",
    "Keep details short and clear — you can edit everything later.",
  ]

  const prompts = [
    { icon: <User className="h-4 w-4 text-primary" />, label: "Your name", hint: "How should people mention you?" },
    {
      icon: <Briefcase className="h-4 w-4 text-primary" />,
      label: "What you do",
      hint: "Role or specialty you want to be known for",
    },
    {
      icon: <Building2 className="h-4 w-4 text-primary" />,
      label: "Where you work",
      hint: "Company, project, or community you’re part of",
    },
    {
      icon: <LinkIcon className="h-4 w-4 text-primary" />,
      label: "Best link to connect",
      hint: "LinkedIn, portfolio, or any link you prefer",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome aboard</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Let’s set up your profile</h1>
            </div>
          </div>
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Skip anytime
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader>
              <CardTitle>Tell us the basics</CardTitle>
              <CardDescription>
                A few quick questions so we can help you connect faster. You can update these later from your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      placeholder="Alex Johnson"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">What you do</Label>
                    <Input
                      id="title"
                      placeholder="Product Designer"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      autoComplete="organization-title"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Where you work</Label>
                    <Input
                      id="company"
                      placeholder="Network Link AI Labs"
                      value={form.company}
                      onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                      autoComplete="organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn or main link</Label>
                    <Input
                      id="linkedin"
                      placeholder="linkedin.com/in/you"
                      value={form.linkedin}
                      onChange={(e) => setForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                      autoComplete="url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      placeholder="yourportfolio.com"
                      value={form.website}
                      onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                      autoComplete="url"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Make my profile discoverable
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Show your name, role, and links to other members in the network.
                    </p>
                  </div>
                  <Switch
                    checked={form.isPublicProfile}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublicProfile: checked }))}
                    aria-label="Toggle public profile visibility"
                  />
                </div>

                {message && (
                  <div
                    className={`text-sm rounded-md px-3 py-2 ${message.type === "error"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="sm:flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleSkip} className="sm:w-auto">
                    Skip for now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Quick guidelines
                </CardTitle>
                <CardDescription>Tips to finish in under a minute.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {guidelines.map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-primary" />
                  What we’ll ask
                </CardTitle>
                <CardDescription>Answer what you can, then continue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {prompts.map((prompt) => (
                  <div key={prompt.label} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                    <div className="mt-0.5">{prompt.icon}</div>
                    <div>
                      <p className="font-medium text-sm">{prompt.label}</p>
                      <p className="text-sm text-muted-foreground">{prompt.hint}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
