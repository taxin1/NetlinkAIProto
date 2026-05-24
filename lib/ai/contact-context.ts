import { createClient } from "@/lib/supabase/server"

export interface ContactForAI {
  id: string
  name: string
  email: string | null
  company: string | null
  position: string | null
  notes: string | null
  where_met: string | null
  met_at: string | null
  tags: string[] | null
  linkedin_url: string | null
  created_at: string
}

export interface EmailForAI {
  subject: string | null
  body: string | null
  status: string | null
  created_at: string
  contact_id: string | null
  contacts?: { name: string } | null
}

export interface AIMemory {
  memory_type: string
  memory_key: string
  memory_value: string
  importance_score: number
}

export interface UserAIContext {
  contacts: ContactForAI[]
  recentEmails: EmailForAI[]
  aiMemories: AIMemory[]
  stats: {
    totalContacts: number
    sentEmails: number
  }
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text
  return text.slice(0, max) + "..."
}

function formatMetDate(metAt: string | null): string {
  if (!metAt) return ""
  try {
    return new Date(metAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return metAt
  }
}

function daysSinceMet(metAt: string | null): number | null {
  if (!metAt) return null
  const met = new Date(metAt)
  if (Number.isNaN(met.getTime())) return null
  return Math.floor((Date.now() - met.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatContactForAI(contact: ContactForAI): string {
  const parts: string[] = [contact.name]

  if (contact.company) parts.push(`at ${contact.company}`)
  if (contact.position) parts.push(`(${contact.position})`)
  if (contact.email) parts.push(`<${contact.email}>`)

  const meeting: string[] = []
  if (contact.where_met) meeting.push(`met at: ${contact.where_met}`)
  if (contact.met_at) {
    const days = daysSinceMet(contact.met_at)
    const dateStr = formatMetDate(contact.met_at)
    meeting.push(`date met: ${dateStr}${days !== null ? ` (${days} days ago)` : ""}`)
  }
  if (meeting.length > 0) parts.push(`[${meeting.join("; ")}]`)

  if (contact.notes) parts.push(`notes: ${truncate(contact.notes)}`)
  if (contact.tags?.length) parts.push(`tags: ${contact.tags.join(", ")}`)

  return parts.join(" | ")
}

export function findRelevantContacts(
  message: string,
  contacts: ContactForAI[],
  limit = 8
): ContactForAI[] {
  const lower = message.toLowerCase()
  const scored = contacts.map((contact) => {
    let score = 0
    const name = contact.name?.toLowerCase() || ""
    const company = contact.company?.toLowerCase() || ""
    const whereMet = contact.where_met?.toLowerCase() || ""

    if (name && lower.includes(name)) score += 10
    name.split(/\s+/).forEach((word) => {
      if (word.length > 2 && lower.includes(word)) score += 3
    })
    if (company && lower.includes(company)) score += 5
    if (whereMet && lower.includes(whereMet)) score += 4

    return { contact, score }
  })

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.contact)

  if (matched.length > 0) return matched
  return contacts.slice(0, limit)
}

export function buildContactUtilizationGuide(): string {
  return `CONTACT UTILIZATION GUIDANCE (apply when advising the user):
- Always reference where and when they met a contact when suggesting follow-ups or emails
- For contacts met within 7 days: suggest a warm follow-up email referencing the specific event or context
- For contacts met 7-30 days ago: suggest a value-add touchpoint (share article, intro, invite)
- For contacts met 30+ days ago: suggest re-engagement with a specific reason tied to their company/role
- Suggest concrete actions: send follow-up email, schedule call, LinkedIn connect, invite to event, make intro
- Group contacts by where_met when user asks about an event or conference follow-ups
- If meeting context is missing for a contact, recommend adding where_met and met_at in their contact profile
- Prioritize contacts with no recent email activity for outreach suggestions`
}

export function buildAIContextPrompt(context: UserAIContext, userMessage?: string): string {
  const { contacts, recentEmails, aiMemories, stats } = context

  const relevantContacts = userMessage
    ? findRelevantContacts(userMessage, contacts)
    : contacts.slice(0, 15)

  const contactLines = relevantContacts.map((c) => `- ${formatContactForAI(c)}`).join("\n")

  const emailLines =
    recentEmails.length > 0
      ? recentEmails
          .slice(0, 8)
          .map((e) => {
            const recipient = e.contacts?.name || "Unknown"
            return `- To ${recipient}: "${e.subject || "No subject"}" (${e.status}, ${formatMetDate(e.created_at)})`
          })
          .join("\n")
      : "No recent emails"

  const insightMemories = aiMemories.filter(
    (m) => m.memory_type === "contact_insight" || m.memory_type === "event_context"
  )
  const styleMemories = aiMemories.filter((m) => m.memory_type === "email_style")

  let memoryBlock = ""
  if (insightMemories.length > 0) {
    memoryBlock += `\nLearned relationship insights:\n${insightMemories
      .slice(0, 10)
      .map((m) => `- ${m.memory_key}: ${truncate(m.memory_value, 200)}`)
      .join("\n")}`
  }
  if (styleMemories.length > 0) {
    memoryBlock += `\nUser communication style:\n${styleMemories
      .slice(0, 5)
      .map((m) => `- ${m.memory_key}: ${m.memory_value}`)
      .join("\n")}`
  }

  const meetingGroups = contacts.reduce<Record<string, number>>((acc, c) => {
    if (c.where_met) {
      acc[c.where_met] = (acc[c.where_met] || 0) + 1
    }
    return acc
  }, {})
  const eventSummary =
    Object.keys(meetingGroups).length > 0
      ? Object.entries(meetingGroups)
          .map(([event, count]) => `${event} (${count} contacts)`)
          .join(", ")
      : "No event grouping yet — encourage adding where_met when saving contacts"

  return `USER'S NETWORK DATA (${stats.totalContacts} contacts, ${stats.sentEmails} sent emails):

Contacts${userMessage ? " (most relevant to this message)" : ""}:
${contactLines || "No contacts yet"}

Meeting/event groups: ${eventSummary}

Recent emails:
${emailLines}${memoryBlock}`
}

export async function loadUserAIContext(userId: string): Promise<UserAIContext> {
  const supabase = await createClient()

  const [contactsResult, emailsResult, memoriesResult, sentCountResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, name, email, company, position, notes, where_met, met_at, tags, linkedin_url, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("emails")
      .select("subject, body, status, created_at, contact_id, contacts(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("ai_trainer_memories")
      .select("memory_type, memory_key, memory_value, importance_score")
      .eq("user_id", userId)
      .order("importance_score", { ascending: false })
      .limit(25),
    supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "sent"),
  ])

  const contacts = (contactsResult.data || []) as ContactForAI[]

  return {
    contacts,
    recentEmails: (emailsResult.data || []) as EmailForAI[],
    aiMemories: (memoriesResult.data || []) as AIMemory[],
    stats: {
      totalContacts: contacts.length,
      sentEmails: sentCountResult.count || 0,
    },
  }
}
