export interface Event {
  id: string
  user_id: string
  contact_id: string | null
  event_type: 'email_sent' | 'meeting' | 'call' | 'note' | 'connection'
  description: string | null
  created_at: string
  contact?: {
    name: string
    email: string | null
  }
}

export interface CreateEventData {
  contact_id?: string
  event_type: 'email_sent' | 'meeting' | 'call' | 'note' | 'connection'
  description?: string
}
