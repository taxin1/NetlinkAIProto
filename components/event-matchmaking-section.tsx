"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  Loader2,
  Users,
  MessageCircle,
  Mail,
  Linkedin,
  ExternalLink,
  Crown,
  AlertCircle,
  UserPlus,
  Calendar,
  Target,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EventMatchmakingSectionProps {
  userId: string
}

interface CalendarEventOption {
  id: string
  title: string
  start_time: string
  location: string | null
}

interface EnrichedMatch {
  id: string
  type: "networker" | "contact"
  score: number
  reason: string
  icebreaker: string
  sharedInterests: string[]
  name: string
  title?: string | null
  company?: string | null
  email?: string | null
  linkedin?: string | null
  portfolioSlug?: string | null
}

interface UsageInfo {
  allowed: boolean
  usage: number
  limit: number | null
  remaining: number | null
  isPro: boolean
}

export function EventMatchmakingSection({ userId }: EventMatchmakingSectionProps) {
  const [goals, setGoals] = useState("")
  const [interestInput, setInterestInput] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [isDiscoverable, setIsDiscoverable] = useState(false)
  const [events, setEvents] = useState<CalendarEventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("none")
  const [matches, setMatches] = useState<EnrichedMatch[]>([])
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [isFindingMatches, setIsFindingMatches] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const fetchUsage = useCallback(async () => {
    const res = await fetch("/api/event-matchmaking/check-usage")
    if (res.ok) {
      const data = await res.json()
      setUsageInfo({
        allowed: data.allowed,
        usage: data.usage,
        limit: data.limit,
        remaining: data.remaining,
        isPro: data.isPro,
      })
    }
  }, [])

  const loadEvents = useCallback(async () => {
    const supabase = createClient()
    const now = new Date().toISOString()
    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, location")
      .eq("user_id", userId)
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(20)

    setEvents(data ?? [])
  }, [userId])

  useEffect(() => {
    const load = async () => {
      setIsLoadingPrefs(true)
      try {
        const [prefsRes] = await Promise.all([
          fetch("/api/event-matchmaking/preferences"),
          fetchUsage(),
          loadEvents(),
        ])
        if (prefsRes.ok) {
          const prefs = await prefsRes.json()
          setGoals(prefs.goals ?? "")
          setInterests(prefs.interests ?? [])
          setIsDiscoverable(prefs.isDiscoverable ?? false)
        }
      } catch {
        setError("Failed to load matchmaking settings")
      } finally {
        setIsLoadingPrefs(false)
      }
    }
    load()
  }, [fetchUsage, loadEvents])

  const addInterest = () => {
    const trimmed = interestInput.trim()
    if (!trimmed || interests.includes(trimmed) || interests.length >= 12) return
    setInterests([...interests, trimmed])
    setInterestInput("")
  }

  const removeInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item))
  }

  const savePreferences = async () => {
    setIsSavingPrefs(true)
    setError(null)
    setPrefsSaved(false)
    try {
      const res = await fetch("/api/event-matchmaking/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, interests, isDiscoverable }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save preferences")
      }
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences")
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const findMatches = async () => {
    if (!usageInfo?.allowed) {
      setError("You've reached your free matchmaking limit. Upgrade to Pro for unlimited AI matching.")
      return
    }

    setIsFindingMatches(true)
    setError(null)
    setMatches([])

    try {
      const res = await fetch("/api/event-matchmaking/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId === "none" ? null : selectedEventId,
          goals,
          interests,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.requiresPro) {
          throw new Error(data.error || "Upgrade to Pro for more AI matches")
        }
        throw new Error(data.error || "Failed to find matches")
      }

      setMatches(data.matches ?? [])
      await fetchUsage()

      if ((data.matches ?? []).length === 0) {
        setError(
          "No matches found yet. Add more public networkers or contacts, and enable discoverability so others can find you."
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find matches")
    } finally {
      setIsFindingMatches(false)
    }
  }

  if (isLoadingPrefs) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {usageInfo && !usageInfo.isPro && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertTitle>Free plan</AlertTitle>
          <AlertDescription>
            {usageInfo.remaining !== null
              ? `${usageInfo.remaining} of ${usageInfo.limit} AI match runs remaining this trial.`
              : "Unlimited AI matching on Pro."}
            {!usageInfo.allowed && (
              <span className="block mt-1">
                <Link href="/resources/pricing" className="text-primary underline">
                  Upgrade to Pro
                </Link>{" "}
                for unlimited event matchmaking.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-destructive/50 text-destructive [&>svg]:text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Your networking goals</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Tell the AI who you want to meet. Matches use your profile, contacts, and public networkers.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matchmaking-goals">What are you looking for at events?</Label>
            <Textarea
              id="matchmaking-goals"
              placeholder="e.g. Investors in SaaS, hiring managers, potential partners in fintech..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="matchmaking-interests">Interests & focus areas</Label>
            <div className="flex gap-2">
              <Input
                id="matchmaking-interests"
                placeholder="Add an interest and press Enter"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addInterest()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addInterest}>
                Add
              </Button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {interests.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeInterest(item)}
                  >
                    {item} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="discoverable-switch" className="font-medium">
                Let others find me
              </Label>
              <p className="text-sm text-muted-foreground">
                Opt in so other Netlink users can be matched with you at events
              </p>
            </div>
            <Switch
              id="discoverable-switch"
              checked={isDiscoverable}
              onCheckedChange={setIsDiscoverable}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={savePreferences} disabled={isSavingPrefs}>
              {isSavingPrefs ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save preferences
            </Button>
            {prefsSaved && (
              <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI match & connect</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Select an upcoming event (optional) and AI will rank the best people to connect with.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Event (optional)</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="General networking" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General networking — no specific event</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {ev.title}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {events.length === 0 && (
              <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/events" className="text-primary underline">
                  Create an event
                </Link>{" "}
                to get event-specific matches.
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={findMatches}
            disabled={isFindingMatches || !usageInfo?.allowed}
          >
            {isFindingMatches ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Finding matches...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Find AI matches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Your matches</h2>
            <Badge variant="outline">{matches.length}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <Card key={`${match.type}-${match.id}`} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{match.name}</h3>
                        <Badge variant={match.type === "networker" ? "default" : "secondary"}>
                          {match.type === "networker" ? "Global Networker" : "Your contact"}
                        </Badge>
                      </div>
                      {(match.title || match.company) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {[match.title, match.company].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <Badge
                      className="shrink-0 bg-primary/15 text-primary border-primary/30"
                      variant="outline"
                    >
                      {match.score}% fit
                    </Badge>
                  </div>

                  <p className="text-sm">{match.reason}</p>

                  {match.sharedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Icebreaker
                    </div>
                    <p className="text-sm italic">&ldquo;{match.icebreaker}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {match.email && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${match.email}`}>
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Email
                        </a>
                      </Button>
                    )}
                    {match.linkedin && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={match.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-3.5 w-3.5 mr-1" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {match.portfolioSlug && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/portfolio/${match.portfolioSlug}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Portfolio
                        </Link>
                      </Button>
                    )}
                    {match.type === "networker" && (
                      <Button size="sm" variant="secondary" asChild>
                        <Link href="/public/networkers">
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Directory
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
