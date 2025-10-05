"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, LinkIcon, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { fetchUrlPreview } from "@/lib/gemini"
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
      const preview = await fetchUrlPreview(formData.eventUrl)
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
      router.push("/events")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error creating event:", error)
      alert("Failed to create event. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventUrl">Event URL (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="eventUrl"
                type="url"
                placeholder="https://example.com/event"
                value={formData.eventUrl}
                onChange={(e) => setFormData({ ...formData, eventUrl: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchPreview}
                disabled={!formData.eventUrl || isFetchingPreview}
              >
                {isFetchingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              </Button>
            </div>
            {urlPreview && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">{urlPreview.title}</h4>
                <p className="text-sm text-muted-foreground">{urlPreview.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              required
              placeholder="Team meeting, Conference, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Office, Zoom, etc."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId">Related Contact</Label>
            <select
              id="contactId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
            >
              <option value="">None</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                  {contact.company && ` (${contact.company})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notification">Enable Notification</Label>
              <p className="text-sm text-muted-foreground">Get reminded 15 minutes before</p>
            </div>
            <Switch
              id="notification"
              checked={formData.notificationEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notificationEnabled: checked })}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
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
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
