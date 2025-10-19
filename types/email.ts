export interface Email {
  id: string
  user_id: string
  contact_id: string
  subject: string
  body: string
  status: 'draft' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
  contact?: {
    name: string
    email: string | null
  }
}

export interface CreateEmailData {
  contact_id: string
  subject: string
  body: string
  status?: 'draft' | 'sent' | 'failed'
}

export interface UpdateEmailData extends Partial<CreateEmailData> {
  id: string
}
