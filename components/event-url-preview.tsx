"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ExternalLink, Image as ImageIcon, Calendar, MapPin } from "lucide-react"

interface EventUrlPreviewProps {
  url: string
  eventData?: {
    title?: string
    description?: string
    location?: string
    startTime?: string
    imageUrl?: string
  }
}

export function EventUrlPreview({ url, eventData }: EventUrlPreviewProps) {
  const [favicon, setFavicon] = useState<string>("")
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (url) {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname
        
        // Get favicon
        setFavicon(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`)
      } catch (e) {
        // Invalid URL
      }
    }
  }, [url])

  // Use actual image from event data if available
  const imageUrl = eventData?.imageUrl && !imageError ? eventData.imageUrl : null

  if (!url) return null

  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace('www.', '')

  return (
    <Card className="overflow-hidden border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      {/* Banner Image */}
      <div className="relative h-48 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={eventData?.title || "Event"} 
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Event Preview</p>
              </div>
            </div>
          </>
        )}
        
        {/* Dark overlay for better text visibility on real images */}
        {imageUrl && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        )}
        
        {/* Platform Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-full border border-slate-700/50">
          {favicon && (
            <img src={favicon} alt="" className="w-4 h-4 rounded" />
          )}
          <span className="text-xs text-slate-300 font-medium">{hostname}</span>
        </div>

        {/* External Link Button */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white transition-colors text-slate-900 text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Open Link
        </a>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-3">
        {eventData?.title && (
          <h3 className="text-xl font-bold text-white line-clamp-2">
            {eventData.title}
          </h3>
        )}

        {eventData?.description && (
          <p className="text-slate-400 text-sm line-clamp-3">
            {eventData.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          {eventData?.startTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300">
                {new Date(eventData.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {eventData?.location && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300 truncate max-w-[200px]">
                {eventData.location}
              </span>
            </div>
          )}
        </div>

        {/* URL Display */}
        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-500 truncate">
            {url}
          </p>
        </div>
      </div>
    </Card>
  )
}

