"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, LinkIcon, Calendar, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AddEventFormProps {
  userId: string
  contacts: Array<{ id: string; name: string; company?: string }>
}

export function AddEventForm({ userId, contacts }: AddEventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPreview, setIsFetchingPreview] = useState(false)
  const [urlPreview, setUrlPreview] = useState<any>(null)
  const [showCampaignOption, setShowCampaignOption] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventUrl: "",
    startTime: "",
    endTime: "",
    location: "",
    contactId: "",
    notificationEnabled: true,
  })

  const handleFetchPreview = async () => {
    if (!formData.eventUrl) return

    setIsFetchingPreview(true)
    try {
      console.log("[v0] Fetching URL preview...")
      
      const response = await fetch("/api/url-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.eventUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch URL preview")
      }

      const result = await response.json()
      const preview = result.preview
      
      console.log("[v0] Preview fetched:", preview)
      setUrlPreview(preview)
      if (preview.title && !formData.title) {
        setFormData((prev) => ({ ...prev, title: preview.title || "" }))
      }
      if (preview.description && !formData.description) {
        setFormData((prev) => ({ ...prev, description: preview.description || "" }))
      }
    } catch (error) {
      console.error("[v0] Error fetching preview:", error)
    } finally {
      setIsFetchingPreview(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          user_id: userId,
          title: formData.title,
          description: formData.description,
          event_url: formData.eventUrl || null,
          url_preview_title: urlPreview?.title || null,
          url_preview_description: urlPreview?.description || null,
          url_preview_image: urlPreview?.imageType
            ? `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(urlPreview.imageType)}`
            : null,
          start_time: formData.startTime,
          end_time: formData.endTime || null,
          location: formData.location || null,
          contact_id: formData.contactId || null,
          notification_enabled: formData.notificationEnabled,
        })
        .select()
        .single()

      if (error) throw error

      console.log("[v0] Event created:", data)
      
      // Ask if user wants to prepare an email campaign for this event
      if (formData.eventUrl) {
        setShowCampaignOption(true)
      } else {
        router.push("/events")
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error creating event:", error)
      alert("Failed to create event. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrepareCampaign = () => {
    // Redirect to dashboard with campaign pre-filled
    const campaignData = {
      name: `${formData.title} Invitation Campaign`,
      purpose: `Invite contacts to: ${formData.title}. Event link: ${formData.eventUrl}`,
      subject: `You're invited: ${formData.title}`,
      eventUrl: formData.eventUrl,
      eventTitle: formData.title,
      eventDescription: formData.description
    }
    
    // Store in sessionStorage to pre-fill AI agent
    sessionStorage.setItem('campaignData', JSON.stringify(campaignData))
    router.push("/dashboard#ai-agent")
    router.refresh()
  }

  const handleSkipCampaign = () => {
    router.push("/events")
    router.refresh()
  }

  // Show campaign preparation dialog if event was created with URL
  if (showCampaignOption) {
    return (
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-cyan-500/10 p-4">
                <Mail className="h-12 w-12 text-cyan-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Event Created Successfully!</h3>
              <p className="text-slate-400">
                Would you like to prepare an email campaign to invite contacts to this event?
              </p>
            </div>

            {urlPreview && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-left">
                <p className="text-xs text-slate-500 mb-2 uppercase font-medium">Event Preview</p>
                <h4 className="font-semibold text-white mb-1">{urlPreview.title || formData.title}</h4>
                <p className="text-sm text-slate-400">{urlPreview.description || formData.description}</p>
                <a 
                  href={formData.eventUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
                >
                  {formData.eventUrl}
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handlePrepareCampaign}
                className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
              >
                <Mail className="mr-2 h-4 w-4" />
                Prepare Email Campaign
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipCampaign}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800/50"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
            <Label htmlFor="eventUrl" className="text-slate-300">Event URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="eventUrl"
                type="url"
                placeholder="https://example.com/event"
                value={formData.eventUrl}
                onChange={(e) => setFormData({ ...formData, eventUrl: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchPreview}
                disabled={!formData.eventUrl || isFetchingPreview}
                className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
              >
                {isFetchingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              </Button>
            </div>
            {urlPreview && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <h4 className="font-semibold text-white mb-1">{urlPreview.title}</h4>
                <p className="text-sm text-slate-400">{urlPreview.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">Event Title *</Label>
            <Input
              id="title"
              required
              placeholder="Team meeting, Conference, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              placeholder="Event details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-slate-300">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-slate-300">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-slate-300">Location</Label>
            <Input
              id="location"
              placeholder="Office, Zoom, etc."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId" className="text-slate-300">Related Contact</Label>
            <select
              id="contactId"
              className="flex h-10 w-full rounded-md border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
            >
              <option value="" className="bg-slate-800 text-white">None</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id} className="bg-slate-800 text-white">
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

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
