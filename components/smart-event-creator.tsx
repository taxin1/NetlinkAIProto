"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Sparkles, Calendar, Plus, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EventUrlPreview } from "@/components/event-url-preview"

interface SmartEventCreatorProps {
  userId: string
  contacts: Array<{ id: string; name: string; company?: string }>
}

export function SmartEventCreator({ userId, contacts }: SmartEventCreatorProps) {
  const router = useRouter()
  const [eventUrl, setEventUrl] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    contactId: "",
    notificationEnabled: true,
  })

  const parseUrlClientSide = (url: string) => {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      const pathname = urlObj.pathname
      
      // Zoom meeting
      if (hostname.includes('zoom.us') || hostname.includes('zoom.com')) {
        const meetingId = pathname.match(/\/j\/(\d+)/)?.[1] || urlObj.searchParams.get('confno')
        return {
          title: meetingId ? `Zoom Meeting #${meetingId}` : "Zoom Meeting",
          description: "Online video conference via Zoom",
          location: "Zoom (Online)",
        }
      }
      
      // Google Meet
      if (hostname.includes('meet.google.com')) {
        const meetingCode = pathname.replace('/', '')
        return {
          title: meetingCode ? `Google Meet - ${meetingCode}` : "Google Meet",
          description: "Online video conference via Google Meet",
          location: "Google Meet (Online)",
        }
      }
      
      // Microsoft Teams
      if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) {
        return {
          title: "Microsoft Teams Meeting",
          description: "Online video conference via Microsoft Teams",
          location: "Microsoft Teams (Online)",
        }
      }
      
      // Eventbrite
      if (hostname.includes('eventbrite.com')) {
        const eventName = pathname.split('/').find(part => part.length > 3 && !part.match(/^\d+$/))
        return {
          title: eventName ? eventName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Eventbrite Event",
          description: "Event registration via Eventbrite",
          location: "TBD",
        }
      }
      
      // Meetup
      if (hostname.includes('meetup.com')) {
        const eventName = pathname.split('/').pop()?.replace(/-/g, ' ')
        return {
          title: eventName || "Meetup Event",
          description: "Community meetup event",
          location: "TBD",
        }
      }
      
      return null
    } catch (e) {
      return null
    }
  }

  const handleSmartExtract = async () => {
    if (!eventUrl.trim()) return

    setIsExtracting(true)
    try {
      console.log("Starting extraction for URL:", eventUrl)

      // First try client-side parsing for meeting platforms (they don't have event details on page)
      const clientParsed = parseUrlClientSide(eventUrl)
      const hostname = new URL(eventUrl).hostname.toLowerCase()
      
      // Only use client-side parsing for video conference platforms (Zoom, Meet, Teams)
      // These don't have event details on their join pages
      const isVideoConference = hostname.includes('zoom') || 
                                hostname.includes('meet.google') || 
                                hostname.includes('teams.microsoft') ||
                                hostname.includes('teams.live')
      
      if (clientParsed && isVideoConference) {
        console.log("Using client-side parsing for video conference platform")
        setExtractedData(clientParsed)
        setFormData({
          title: clientParsed.title || "",
          description: clientParsed.description || "",
          startTime: "",
          endTime: "",
          location: clientParsed.location || "",
          contactId: "",
          notificationEnabled: true,
        })
        setIsExtracting(false)
        return
      }

      // For all other URLs, scrape the actual webpage and use AI to extract event data
      console.log("Fetching webpage content and analyzing with AI...")
      const response = await fetch("/api/scrape-event-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: eventUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to extract event data")
      }

      const result = await response.json()
      const data = result.eventData

      console.log("=== FRONTEND: AI EXTRACTED DATA ===")
      console.log("Full data:", data)
      console.log("Image URL:", data.imageUrl || "NO IMAGE URL")
      console.log("Title:", data.title)
      console.log("Description:", data.description)

      setExtractedData(data)
      setFormData({
        title: data.title || "",
        description: data.description || "",
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        location: data.location || "",
        contactId: "",
        notificationEnabled: true,
      })
    } catch (error) {
      console.error("Error extracting event data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to extract event data"
      
      // Provide helpful error messages
      let userMessage = errorMessage
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        userMessage = "⚠️ The website is blocking automated access. This happens with some URLs.\n\nYou can:\n1. Enter event details manually below\n2. Try a different event URL\n3. For Zoom/Meet links, just use the generic title"
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userMessage = "⚠️ Access to this webpage is restricted.\n\nPlease enter the event details manually."
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        userMessage = "⚠️ The webpage was not found. Please check the URL and try again."
      }
      
      alert(userMessage)
      
      // Even if extraction fails, keep the URL so user can still create event
      setExtractedData({ title: '', description: '', location: '' })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleQuickCreate = async () => {
    if (!formData.title || !formData.startTime) {
      alert("Title and start time are required")
      return
    }

    setIsCreating(true)
    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      alert("You must be logged in to create events")
      setIsCreating(false)
      return
    }

    console.log("Current user:", user.id)

    try {
      // Convert datetime-local format to ISO 8601 for PostgreSQL
      const formatDateTime = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return null
        // datetime-local format: "YYYY-MM-DDTHH:mm"
        // Convert to ISO 8601: "YYYY-MM-DDTHH:mm:ss.sssZ"
        try {
          const date = new Date(dateTimeLocal)
          return date.toISOString()
        } catch (e) {
          console.error("Error parsing date:", e)
          return null
        }
      }

      // Prepare insert data, only include contact_id if it has a value
      const insertData: any = {
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        event_url: eventUrl || null,
        start_time: formatDateTime(formData.startTime),
        end_time: formatDateTime(formData.endTime),
        location: formData.location || null,
        notification_enabled: formData.notificationEnabled,
        url_preview_title: extractedData?.title || null,
        url_preview_description: extractedData?.description || null,
        url_preview_image: extractedData?.imageUrl || null,
      }

      // Only add contact_id if it's not empty
      if (formData.contactId && formData.contactId.trim()) {
        insertData.contact_id = formData.contactId
      }

      console.log("Attempting to insert event data:", insertData)

      const { data, error } = await supabase
        .from("calendar_events")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error("Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        
        // Specific error messages
        let errorMsg = "Failed to create event"
        if (error.code === "PGRST301") {
          errorMsg = "Database table not found. Please run the SQL migration scripts."
        } else if (error.code === "23503") {
          errorMsg = "Invalid contact reference. Please select a valid contact."
        } else if (error.code === "42501") {
          errorMsg = "Permission denied. Please check your authentication."
        } else if (error.message) {
          errorMsg = error.message
        } else if (error.details) {
          errorMsg = error.details
        } else if (error.hint) {
          errorMsg = error.hint
        }
        
        throw new Error(errorMsg)
      }

      console.log("Event created successfully:", data)

      // Ask about campaign
      const shouldCreateCampaign = eventUrl && confirm("Event created! Would you like to prepare an email campaign to invite contacts?")
      
      if (shouldCreateCampaign) {
        const campaignData = {
          name: `${formData.title} Invitation Campaign`,
          purpose: `Invite contacts to: ${formData.title}. Event link: ${eventUrl}`,
          subject: `You're invited: ${formData.title}`,
        }
        sessionStorage.setItem('campaignData', JSON.stringify(campaignData))
        router.push("/dashboard#ai-agent")
      } else {
        router.refresh()
        // Reset form
        setEventUrl("")
        setExtractedData(null)
        setFormData({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          location: "",
          contactId: "",
          notificationEnabled: true,
        })
      }
    } catch (error) {
      console.error("Error creating event:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create event"
      alert(`Failed to create event: ${errorMessage}. Please try again.`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Smart URL Input */}
          <div className="space-y-2">
            <Label htmlFor="eventUrl" className="text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Event URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="eventUrl"
                type="url"
                placeholder="Paste any event link (Zoom, Google Meet, Eventbrite, etc.)"
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && eventUrl.trim()) {
                    handleSmartExtract()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSmartExtract}
                disabled={!eventUrl.trim() || isExtracting}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 whitespace-nowrap"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Extract
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              AI will fetch the webpage and extract event details automatically (works with Eventbrite, Meetup, Zoom, etc.)
            </p>
          </div>

          {/* Live URL Preview */}
          {eventUrl && (
            <div className="space-y-4">
              <EventUrlPreview 
                url={eventUrl} 
                eventData={extractedData ? {
                  title: extractedData.title,
                  description: extractedData.description,
                  location: extractedData.location,
                  startTime: formData.startTime,
                  imageUrl: extractedData.imageUrl
                } : undefined}
              />

              {/* Extraction Status */}
              {extractedData && (
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cyan-400 mb-2">AI Extraction Complete!</p>
                      <div className="space-y-1 text-xs text-slate-400">
                        <p>✓ Title, description, and location extracted</p>
                        {formData.startTime ? (
                          <p>✓ Date/time extracted and filled</p>
                        ) : (
                          <p className="text-yellow-400">⚠️ Date/time not found - please add manually below</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Editable Form Fields */}
          {extractedData && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-slate-300">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="bg-slate-800/50 border-slate-700/50 text-white"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime" className="text-slate-300 flex items-center gap-2">
                      Start Time *
                      {!formData.startTime && (
                        <span className="text-xs text-yellow-400">(Required - Add manually)</span>
                      )}
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className={`bg-slate-800/50 border-slate-700/50 text-white ${!formData.startTime ? 'ring-2 ring-yellow-400/50' : ''}`}
                      placeholder="YYYY-MM-DD HH:MM"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endTime" className="text-slate-300">End Time (Optional)</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="bg-slate-800/50 border-slate-700/50 text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-slate-300">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Physical address or virtual platform"
                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contactId" className="text-slate-300">Related Contact</Label>
                  <select
                    id="contactId"
                    className="flex h-10 w-full rounded-md border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-white"
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  >
                    <option value="" className="bg-slate-800">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id} className="bg-slate-800">
                        {contact.name}
                        {contact.company && ` (${contact.company})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification" className="text-slate-300">Enable Notification</Label>
                    <p className="text-sm text-slate-500">Get reminded 15 minutes before</p>
                  </div>
                  <Switch
                    id="notification"
                    checked={formData.notificationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, notificationEnabled: checked })}
                  />
                </div>
              </div>

              <Button
                onClick={handleQuickCreate}
                disabled={isCreating || !formData.title || !formData.startTime}
                className="w-full bg-white text-slate-900 hover:bg-slate-100"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!extractedData && !eventUrl && (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="font-medium mb-2">Paste any event URL and let AI extract the details</p>
              <p className="text-sm text-slate-500 mt-2">
                ✨ AI will visit the page and read event information
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Works with Eventbrite, Meetup, Zoom, Google Meet, and most event pages
              </p>
            </div>
          )}
          
          {/* Manual Entry Option */}
          {eventUrl && !extractedData && !isExtracting && (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Want to enter details manually?</p>
              <Button
                onClick={() => setExtractedData({ title: '', description: '', location: '' })}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Enter Manually
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

