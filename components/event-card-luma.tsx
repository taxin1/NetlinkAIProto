"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Users, ExternalLink, Trash2, Bell } from "lucide-react"
import { format, formatDistance } from "date-fns"

interface EventCardLumaProps {
  event: {
    id: string
    title: string
    description: string | null
    event_url: string | null
    url_preview_image: string | null
    start_time: string
    end_time: string | null
    location: string | null
    notification_enabled: boolean
    contacts: {
      name: string
      company: string | null
    } | null
  }
  onDelete: (id: string) => void
}

export function EventCardLuma({ event, onDelete }: EventCardLumaProps) {
  const startDate = new Date(event.start_time)
  const endDate = event.end_time ? new Date(event.end_time) : null
  const isPast = startDate < new Date()
  const isToday = format(startDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const isUpcoming = !isPast && !isToday
  
  return (
    <Card className="group relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated Border Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
      
      <div className="relative p-6">
        {/* Header with Date and Status */}
        <div className="flex items-start justify-between mb-4">
          {/* Date Badge with Gradient */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex flex-col items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-110">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              <div className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-wider">
                {format(startDate, 'MMM')}
              </div>
              <div className="text-2xl font-bold text-primary-foreground leading-none">
                {format(startDate, 'd')}
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent line-clamp-2 leading-tight mb-2 group-hover:from-primary group-hover:to-foreground transition-all duration-300">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {isToday && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-sm animate-pulse">
                    Today
                  </span>
                )}
                {isUpcoming && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/30 text-primary text-xs font-semibold shadow-sm">
                    Upcoming
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-foreground/60 text-xs font-medium">
                    Past
                  </span>
                )}
                {event.notification_enabled && (
                  <div className="relative">
                    <Bell className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/30 blur-sm rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button with Hover Effect */}
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 rounded-xl text-foreground/60 hover:text-destructive hover:bg-gradient-to-br hover:from-destructive/10 hover:to-destructive/5 border border-transparent hover:border-destructive/20 transition-all duration-300 hover:scale-110"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-card-foreground/70 mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event Details with Gradient Icons */}
        <div className="space-y-3 mb-6">
          {/* Time */}
          <div className="flex items-center gap-3 group/item">
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center group-hover/item:shadow-lg group-hover/item:shadow-primary/20 transition-all duration-300 group-hover/item:scale-110">
              <Clock className="h-4 w-4 text-primary relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">
                {format(startDate, 'EEEE, MMM d · h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </div>
              <div className="text-xs text-card-foreground/60 font-medium">
                {formatDistance(startDate, new Date(), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 group/item">
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center group-hover/item:shadow-lg group-hover/item:shadow-primary/20 transition-all duration-300 group-hover/item:scale-110">
                <MapPin className="h-4 w-4 text-primary relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm text-foreground truncate font-medium">
                {event.location}
              </span>
            </div>
          )}

          {/* Attendee */}
          {event.contacts && (
            <div className="flex items-center gap-3 group/item">
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center group-hover/item:shadow-lg group-hover/item:shadow-primary/20 transition-all duration-300 group-hover/item:scale-110">
                <Users className="h-4 w-4 text-primary relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate font-medium">
                  {event.contacts.name}
                </div>
                {event.contacts.company && (
                  <div className="text-xs text-card-foreground/60 truncate">
                    {event.contacts.company}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button with Gradient */}
        {event.event_url && (
          <Button
            asChild
            className="relative w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl h-11 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 overflow-hidden group/btn border border-primary/20"
          >
            <a href={event.event_url} target="_blank" rel="noopener noreferrer">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <ExternalLink className="mr-2 h-4 w-4 relative z-10 group-hover/btn:rotate-12 transition-transform" />
              <span className="relative z-10">View Event Details</span>
            </a>
          </Button>
        )}
      </div>

      {/* Animated Accent Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
        isToday 
          ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 group-hover:w-1.5 shadow-lg shadow-emerald-500/50' 
          : isPast 
          ? 'bg-gradient-to-b from-foreground/20 via-foreground/30 to-foreground/20 group-hover:w-1.5' 
          : 'bg-gradient-to-b from-primary/60 via-primary to-primary/60 group-hover:w-1.5 shadow-lg shadow-primary/50'
      }`} />
      
      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] transition-all duration-500" />
    </Card>
  )
}
