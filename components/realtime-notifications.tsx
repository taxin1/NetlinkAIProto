"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Mail, Users, Calendar, CheckCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  icon?: React.ReactNode
}

interface RealtimeNotificationsProps {
  userId: string
}

export function RealtimeNotifications({ userId }: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to all relevant table changes
    const contactsChannel = supabase
      .channel('contacts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const contact = payload.new as any
          addNotification({
            type: 'success',
            title: 'New Contact Added',
            message: `${contact.name} has been added to your network`,
            icon: <Users className="h-4 w-4" />,
          })
        }
      )

    const emailsChannel = supabase
      .channel('emails-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emails',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const email = payload.new as any
          if (email.status === 'sent') {
            addNotification({
              type: 'success',
              title: 'Email Sent',
              message: `Email "${email.subject}" has been sent successfully`,
              icon: <Mail className="h-4 w-4" />,
            })
          }
        }
      )

    const eventsChannel = supabase
      .channel('events-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event = payload.new as any
          addNotification({
            type: 'info',
            title: 'New Activity',
            message: `${event.event_type.replace('_', ' ')}: ${event.description || 'Activity recorded'}`,
            icon: <Calendar className="h-4 w-4" />,
          })
        }
      )

    contactsChannel.subscribe()
    emailsChannel.subscribe()
    eventsChannel.subscribe()

    return () => {
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(emailsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [userId])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]) // Keep only 5 notifications

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card key={notification.id} className="border-border bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${
                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                notification.type === 'error' ? 'bg-red-100 text-red-600' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {notification.icon || <CheckCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeNotification(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
