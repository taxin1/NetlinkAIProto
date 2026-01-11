"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isGuest } from '@/lib/guest-trial'
import type { Contact } from '@/types/contact'

interface UseRealtimeContactsProps {
  userId: string
}

export function useRealtimeContacts({ userId }: UseRealtimeContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isGuest(userId)) {
      const fetchGuestContacts = () => {
        try {
          const stored = localStorage.getItem(`contacts_${userId}`)
          if (stored) {
            setContacts(JSON.parse(stored))
          }
        } catch (err) {
          setError('Failed to fetch guest contacts')
        } finally {
          setLoading(false)
        }
      }
      fetchGuestContacts()
      
      // LocalStorage listener for "real-time" updates between tabs/components
      const handleStorage = (e: StorageEvent) => {
        if (e.key === `contacts_${userId}` && e.newValue) {
          setContacts(JSON.parse(e.newValue))
        }
      }
      window.addEventListener('storage', handleStorage)
      
      // Also listen for custom events if we update within the same window
      const handleCustomUpdate = () => {
        const stored = localStorage.getItem(`contacts_${userId}`)
        if (stored) setContacts(JSON.parse(stored))
      }
      window.addEventListener('guest-contacts-updated', handleCustomUpdate)
      
      return () => {
        window.removeEventListener('storage', handleStorage)
        window.removeEventListener('guest-contacts-updated', handleCustomUpdate)
      }
    }

    const supabase = createClient()

    // Initial fetch
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setContacts(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()

    // Set up real-time subscription
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time contact update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setContacts(prev => [payload.new as Contact, ...prev])
              break
            case 'UPDATE':
              setContacts(prev => 
                prev.map(contact => 
                  contact.id === payload.new.id ? payload.new as Contact : contact
                )
              )
              break
            case 'DELETE':
              setContacts(prev => 
                prev.filter(contact => contact.id !== payload.old.id)
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

  return { contacts, loading, error, setContacts }
}
