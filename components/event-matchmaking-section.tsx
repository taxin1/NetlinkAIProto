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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Crown,
  AlertCircle,
  Calendar,
  Target,
  Lightbulb,
  Handshake,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MatchResultsGrid, type EnrichedMatch } from "@/components/match-results-grid"

interface EventMatchmakingSectionProps {
  userId: string
}

interface CalendarEventOption {
  id: string
  title: string
  start_time: string
  location: string | null
}

interface UsageInfo {
  allowed: boolean
  usage: number
  limit: number | null
  remaining: number | null
  isPro: boolean
}

const NEED_SUGGESTIONS = [
  "Funding / investors",
  "Hiring talent",
  "Clients & sales",
  "Partnerships",
  "Mentorship",
  "Co-founder",
  "Learning & advice",
]

export function EventMatchmakingSection({ userId }: EventMatchmakingSectionProps) {
  const [goals, setGoals] = useState("")
  const [needs, setNeeds] = useState("")
  const [interestInput, setInterestInput] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [isDiscoverable, setIsDiscoverable] = useState(false)
  const [events, setEvents] = useState<CalendarEventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [eventMatches, setEventMatches] = useState<EnrichedMatch[]>([])
  const [needsMatches, setNeedsMatches] = useState<EnrichedMatch[]>([])
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [isFindingEventMatches, setIsFindingEventMatches] = useState(false)
  const [isFindingNeedsMatches, setIsFindingNeedsMatches] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)
  const [needsError, setNeedsError] = useState<string | null>(null)
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
    if (data?.length) {
      setSelectedEventId((prev) => prev || data[0].id)
    }
  }, [userId])

  useEffect(() => {
    const load = async () => {
      setIsLoadingPrefs(true)
      try {
        const prefsRes = await fetch("/api/event-matchmaking/preferences")
        await Promise.all([fetchUsage(), loadEvents()])
        if (prefsRes.ok) {
          const prefs = await prefsRes.json()
          setGoals(prefs.goals ?? "")
          setNeeds(prefs.needs ?? "")
          setInterests(prefs.interests ?? [])
          setIsDiscoverable(prefs.isDiscoverable ?? false)
        }
      } catch {
        setEventError("Failed to load matchmaking settings")
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

  const appendNeedSuggestion = (suggestion: string) => {
    setNeeds((prev) => {
      if (prev.includes(suggestion)) return prev
      return prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`
    })
  }

  const savePreferences = async () => {
    setIsSavingPrefs(true)
    setEventError(null)
    setNeedsError(null)
    setPrefsSaved(false)
    try {
      const res = await fetch("/api/event-matchmaking/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, needs, interests, isDiscoverable }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save preferences")
      }
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save preferences"
      setEventError(msg)
      setNeedsError(msg)
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const runMatch = async (mode: "event" | "needs") => {
    if (!usageInfo?.allowed) {
      const msg =
        "You've reached your free matchmaking limit. Upgrade to Pro for unlimited AI matching."
      if (mode === "event") setEventError(msg)
      else setNeedsError(msg)
      return
    }

    if (mode === "event") {
      setIsFindingEventMatches(true)
      setEventError(null)
      setEventMatches([])
    } else {
      setIsFindingNeedsMatches(true)
      setNeedsError(null)
      setNeedsMatches([])
    }

    try {
      const res = await fetch("/api/event-matchmaking/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchMode: mode,
          eventId: mode === "event" ? selectedEventId : null,
          goals,
          needs,
          interests,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to find matches")
      }

      const results = data.matches ?? []
      if (mode === "event") {
        setEventMatches(results)
        if (results.length === 0) {
          setEventError(
            "No event matches found. Add contacts or public networkers, and try a different event."
          )
        }
      } else {
        setNeedsMatches(results)
        if (results.length === 0) {
          setNeedsError(
            "No needs-based matches found. Describe your needs in detail and enable discoverability."
          )
        }
      }
      await fetchUsage()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to find matches"
      if (mode === "event") setEventError(msg)
      else setNeedsError(msg)
    } finally {
      if (mode === "event") setIsFindingEventMatches(false)
      else setIsFindingNeedsMatches(false)
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
              ? `${usageInfo.remaining} of ${usageInfo.limit} AI match runs remaining.`
              : "Unlimited AI matching on Pro."}
            {!usageInfo.allowed && (
              <span className="block mt-1">
                <Link href="/resources/pricing" className="text-primary underline">
                  Upgrade to Pro
                </Link>{" "}
                for unlimited matchmaking.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Shared profile</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Interests and discoverability apply to both event and needs matching.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
                Share your goals and needs so others can match with you
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
              {isSavingPrefs && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save profile
            </Button>
            {prefsSaved && (
              <span className="text-sm text-green-600 dark:text-green-400">Saved</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="needs" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="needs" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            By Needs
          </TabsTrigger>
          <TabsTrigger value="event" className="gap-2">
            <Calendar className="h-4 w-4" />
            By Event
          </TabsTrigger>
        </TabsList>

        {/* Needs-based matching */}
        <TabsContent value="needs" className="space-y-6 mt-0">
          <Card className="border-violet-500/20 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-violet-500" />
                <CardTitle>Match by needs</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Describe what you need right now — funding, hiring, clients, partners — and AI
                finds people who can help, anytime (no event required).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matchmaking-needs">What do you need?</Label>
                <Textarea
                  id="matchmaking-needs"
                  placeholder="e.g. Seed investors in B2B SaaS, senior React engineers, enterprise clients in healthcare..."
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Quick add</Label>
                <div className="flex flex-wrap gap-2">
                  {NEED_SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => appendNeedSuggestion(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {needsError && (
                <Alert className="border-destructive/50 text-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{needsError}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={() => runMatch("needs")}
                disabled={isFindingNeedsMatches || !usageInfo?.allowed || !needs.trim()}
              >
                {isFindingNeedsMatches ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Matching by needs...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find matches by needs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {needsMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-violet-500" />
                <h2 className="text-2xl font-bold">Needs-based matches</h2>
                <Badge variant="outline">{needsMatches.length}</Badge>
              </div>
              <MatchResultsGrid matches={needsMatches} />
            </div>
          )}
        </TabsContent>

        {/* Event-based matching */}
        <TabsContent value="event" className="space-y-6 mt-0">
          <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Match by event</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick an upcoming event and set event-specific goals. AI ranks who to meet there.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matchmaking-goals">Event networking goals</Label>
                <Textarea
                  id="matchmaking-goals"
                  placeholder="e.g. Meet VCs at the startup pavilion, connect with product leaders..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Select event</Label>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/dashboard/events" className="text-primary underline">
                      Create an event
                    </Link>{" "}
                    to use event-based matching.
                  </p>
                ) : (
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          {ev.title}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {eventError && (
                <Alert className="border-destructive/50 text-destructive [&>svg]:text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{eventError}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => runMatch("event")}
                disabled={
                  isFindingEventMatches ||
                  !usageInfo?.allowed ||
                  !selectedEventId ||
                  events.length === 0
                }
              >
                {isFindingEventMatches ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Matching for event...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Find matches for event
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {eventMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Event matches</h2>
                <Badge variant="outline">{eventMatches.length}</Badge>
              </div>
              <MatchResultsGrid matches={eventMatches} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
