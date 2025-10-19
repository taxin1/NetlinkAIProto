"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/event'

interface UseRealtimeEventsProps {
  userId: string
  limit?: number
}

export function useRealtimeEvents({ userId, limit = 50 }: UseRealtimeEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            contact:contacts(name, email)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        setEvents(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Set up real-time subscription
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time event update:', payload)
          
          // Add new event to the beginning of the list
          setEvents(prev => {
            const newEvent = payload.new as Event
            const updated = [newEvent, ...prev]
            
            // Keep only the latest events if limit is set
            return limit ? updated.slice(0, limit) : updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, limit])

  return { events, loading, error, setEvents }
}
