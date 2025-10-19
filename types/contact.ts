export interface Contact {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  notes: string | null
  tags: string[] | null
  avatar_url: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateContactData {
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  tags?: string[]
  avatar_url?: string
  linkedin_url?: string
}

export interface UpdateContactData extends Partial<CreateContactData> {
  id: string
}
