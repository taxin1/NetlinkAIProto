"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Network, RefreshCw, AlertTriangle, TrendingUp, Users, Mail, Phone, Handshake } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"

interface NetworkingEvent {
  id: string
  contact_id: string | null
  event_type: 'email_sent' | 'meeting' | 'call' | 'note' | 'connection'
  description: string | null
  created_at: string
  contact?: {
    name: string
    email: string | null
  }
}

interface NetworkingSummary {
  totalEvents: number
  recentEvents: NetworkingEvent[]
  eventBreakdown: {
    emails: number
    meetings: number
    calls: number
    connections: number
  }
  topContacts: Array<{
    contact_id: string
    name: string
    count: number
  }>
}

export function NetworkingEventsSummary({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<NetworkingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const isGuest = userId.startsWith('guest_')
      if (isGuest) {
        setSummary({
          totalEvents: 0,
          recentEvents: [],
          eventBreakdown: { emails: 0, meetings: 0, calls: 0, connections: 0 },
          topContacts: [],
        })
        return
      }

      const supabase = createClient()
      
      // Get networking events from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          contact:contacts(name, email)
        `)
        .eq("user_id", userId)
        .in("event_type", ["email_sent", "meeting", "call", "connection"])
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })

      if (eventsError) throw eventsError

      const networkingEvents = (events || []) as NetworkingEvent[]

      // Calculate breakdown
      const breakdown = {
        emails: networkingEvents.filter(e => e.event_type === 'email_sent').length,
        meetings: networkingEvents.filter(e => e.event_type === 'meeting').length,
        calls: networkingEvents.filter(e => e.event_type === 'call').length,
        connections: networkingEvents.filter(e => e.event_type === 'connection').length,
      }

      // Get top contacts
      const contactCounts = new Map<string, { name: string; count: number }>()
      networkingEvents.forEach(event => {
        if (event.contact_id && event.contact) {
          const existing = contactCounts.get(event.contact_id) || { name: event.contact.name, count: 0 }
          contactCounts.set(event.contact_id, { ...existing, count: existing.count + 1 })
        }
      })

      const topContacts = Array.from(contactCounts.entries())
        .map(([contact_id, data]) => ({ contact_id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setSummary({
        totalEvents: networkingEvents.length,
        recentEvents: networkingEvents.slice(0, 5),
        eventBreakdown: breakdown,
        topContacts,
      })
    } catch (err: any) {
      setError(err?.message || "Unable to load networking summary.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [userId])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSummary()
    setIsRefreshing(false)
  }

  const getEventIcon = (type: NetworkingEvent['event_type']) => {
    switch (type) {
      case 'email_sent':
        return <Mail className="h-4 w-4" />
      case 'meeting':
        return <Users className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'connection':
        return <Handshake className="h-4 w-4" />
      default:
        return <Network className="h-4 w-4" />
    }
  }

  const getEventTypeLabel = (type: NetworkingEvent['event_type']) => {
    switch (type) {
      case 'email_sent':
        return 'Email'
      case 'meeting':
        return 'Meeting'
      case 'call':
        return 'Call'
      case 'connection':
        return 'Connection'
      default:
        return type
    }
  }

  const getEventColor = (type: NetworkingEvent['event_type']) => {
    switch (type) {
      case 'email_sent':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
      case 'meeting':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
      case 'call':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      case 'connection':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <CardTitle>Networking Events Summary</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading networking summary...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : !summary || summary.totalEvents === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No networking events in the last 30 days. Start connecting to see your activity summary here!
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border/60 p-3 bg-background/60">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalEvents}</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
              
              <div className="rounded-lg border border-border/60 p-3 bg-background/60">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">Emails</span>
                </div>
                <div className="text-2xl font-bold">{summary.eventBreakdown.emails}</div>
              </div>
              
              <div className="rounded-lg border border-border/60 p-3 bg-background/60">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium text-muted-foreground">Meetings</span>
                </div>
                <div className="text-2xl font-bold">{summary.eventBreakdown.meetings}</div>
              </div>
              
              <div className="rounded-lg border border-border/60 p-3 bg-background/60">
                <div className="flex items-center gap-2 mb-1">
                  <Handshake className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">Connections</span>
                </div>
                <div className="text-2xl font-bold">{summary.eventBreakdown.connections}</div>
              </div>
            </div>

            {/* Recent Events */}
            {summary.recentEvents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
                <div className="space-y-2">
                  {summary.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border/60 p-3 bg-background/60 flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-md ${getEventColor(event.event_type)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${getEventColor(event.event_type)} text-xs`}>
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                          {event.contact && (
                            <span className="text-sm font-medium text-foreground">
                              {event.contact.name}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Contacts */}
            {summary.topContacts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Most Active Contacts</h4>
                <div className="space-y-2">
                  {summary.topContacts.map((contact, idx) => (
                    <div
                      key={contact.contact_id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-background/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">{contact.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {contact.count} {contact.count === 1 ? 'interaction' : 'interactions'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View All Link */}
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="w-full gap-2 text-sm">
                View detailed analytics
                <TrendingUp className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
