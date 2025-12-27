export interface PortfolioSection {
  id: string
  type: 'about' | 'experience' | 'projects' | 'skills' | 'education' | 'testimonials' | 'contact' | 'custom'
  title: string
  content: string
  order: number
  metadata?: Record<string, any>
}

export interface Portfolio {
  id: string
  user_id: string
  slug: string
  title: string
  subtitle?: string | null
  bio?: string | null
  profile_image_url?: string | null
  cover_image_url?: string | null
  sections: PortfolioSection[]
  theme: 'modern' | 'minimal' | 'creative' | 'professional'
  is_public: boolean
  show_contact_info: boolean
  show_social_links: boolean
  created_at: string
  updated_at: string
}

export interface CreatePortfolioData {
  title: string
  subtitle?: string
  bio?: string
  profile_image_url?: string
  cover_image_url?: string
  sections?: PortfolioSection[]
  theme?: 'modern' | 'minimal' | 'creative' | 'professional'
  is_public?: boolean
  show_contact_info?: boolean
  show_social_links?: boolean
}

export interface UpdatePortfolioData extends Partial<CreatePortfolioData> {
  id: string
}

