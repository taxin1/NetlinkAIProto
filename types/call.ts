export interface UserProfile {
  name: string
  role: string
  organization: string
  short_background?: string
  goals?: string[]
}

export interface ContactCallData {
  id: string
  name: string
  company: string | null
  title: string | null
  phone: string | null
  email: string | null
  notes_from_card_scan?: string | null
}

export interface RelationshipData {
  where_met?: string
  event_name?: string
  date_met?: string
  last_interaction?: string
  tags?: string[] | null
}

export interface CallGoal {
  type: "networking" | "partnership" | "fundraising" | "hiring" | "product_demo" | "mentorship" | "general"
  desired_outcome: string
  priority_questions?: string[]
  constraints?: string
}

export interface TopicMode {
  topic: string
  tone: "professional" | "casual" | "friendly" | "formal"
  boundaries?: string[]
  must_mention?: string[]
  must_avoid?: string[]
}

export interface DynamicPrompt {
  generated_call_angle: string
  key_points: string[]
  suggested_questions: string[]
}

export interface CallContext {
  user_profile: UserProfile
  contact: ContactCallData
  relationship?: RelationshipData
  call_goal: CallGoal
  topic_mode?: TopicMode
  dynamic_prompt?: DynamicPrompt
}

export interface GeneratedCallPrompt {
  opening_line: string
  key_talking_points: string[]
  smart_questions: string[]
  objection_handling: Array<{
    objection: string
    reply: string
  }>
  closing_line: string
}

export interface CallOutcome {
  call_summary: string
  lead_quality: "low" | "medium" | "high"
  next_step: string
  objections?: string[]
  personal_notes?: string
  follow_up_message_draft?: string
  next_step_date?: string
  tags?: string[]
}

export interface CallActions {
  call_summary: string
  lead_quality: "low" | "medium" | "high"
  next_step: string
  objections?: string[]
  personal_notes?: string
  follow_up_message_draft?: string
  next_step_date?: string
  tags?: string[]
}
