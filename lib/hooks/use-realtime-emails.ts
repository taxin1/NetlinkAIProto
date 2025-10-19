"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Email } from '@/types/email'

interface UseRealtimeEmailsProps {
  userId: string
}

export function useRealtimeEmails({ userId }: UseRealtimeEmailsProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    const fetchEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('emails')
          .select(`
            *,
            contact:contacts(name, email)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setEmails(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch emails')
      } finally {
        setLoading(false)
      }
    }

    fetchEmails()

    // Set up real-time subscription
    const channel = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time email update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setEmails(prev => [payload.new as Email, ...prev])
              break
            case 'UPDATE':
              setEmails(prev => 
                prev.map(email => 
                  email.id === payload.new.id ? payload.new as Email : email
                )
              )
              break
            case 'DELETE':
              setEmails(prev => 
                prev.filter(email => email.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { emails, loading, error, setEmails }
}
