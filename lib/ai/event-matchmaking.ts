import { generateAIContent } from "@/lib/ai/providers"

export interface MatchCandidate {
  id: string
  type: "networker" | "contact"
  name: string
  title?: string | null
  company?: string | null
  email?: string | null
  linkedin?: string | null
  bio?: string | null
  interests?: string[]
  goals?: string | null
  portfolioSlug?: string | null
}

export interface EventMatchResult {
  id: string
  type: "networker" | "contact"
  score: number
  reason: string
  icebreaker: string
  sharedInterests: string[]
}

export interface EventContext {
  title: string
  description?: string | null
  location?: string | null
  startTime?: string | null
}

interface GenerateMatchesInput {
  userProfile: {
    name?: string | null
    title?: string | null
    company?: string | null
    goals?: string | null
    interests?: string[]
  }
  event?: EventContext | null
  candidates: MatchCandidate[]
}

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const objectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }
    const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }
    throw new Error("Could not parse AI matchmaking response")
  }
}

export async function generateEventMatches(
  input: GenerateMatchesInput
): Promise<EventMatchResult[]> {
  const { userProfile, event, candidates } = input

  if (candidates.length === 0) {
    return []
  }

  const candidateList = candidates.slice(0, 25).map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    title: c.title,
    company: c.company,
    interests: c.interests,
    goals: c.goals,
    bio: c.bio?.slice(0, 200),
  }))

  const systemPrompt = `You are an expert networking matchmaker for professional events.
Analyze the user's profile and goals, then rank the best connection opportunities from the candidate list.
Return ONLY valid JSON with this exact shape:
{
  "matches": [
    {
      "id": "candidate id string",
      "type": "networker" or "contact",
      "score": 0-100,
      "reason": "1-2 sentences why this is a good match",
      "icebreaker": "A natural conversation starter for meeting at the event",
      "sharedInterests": ["interest1", "interest2"]
    }
  ]
}
Return at most 8 matches, sorted by score descending. Only include candidates from the provided list.`

  const message = JSON.stringify({
    user: userProfile,
    event: event ?? null,
    candidates: candidateList,
  })

  const raw = await generateAIContent({
    message,
    systemPrompt,
    temperature: 0.4,
    maxTokens: 2048,
  })

  const parsed = extractJsonArray(raw) as { matches?: EventMatchResult[] } | EventMatchResult[]
  const matches = Array.isArray(parsed) ? parsed : parsed.matches ?? []

  const validIds = new Set(candidates.map((c) => c.id))

  return matches
    .filter(
      (m) =>
        m &&
        typeof m.id === "string" &&
        validIds.has(m.id) &&
        (m.type === "networker" || m.type === "contact")
    )
    .map((m) => ({
      id: m.id,
      type: m.type,
      score: Math.min(100, Math.max(0, Number(m.score) || 0)),
      reason: String(m.reason || "Good networking fit based on your profile."),
      icebreaker: String(m.icebreaker || "Hi! I'd love to connect and learn more about your work."),
      sharedInterests: Array.isArray(m.sharedInterests)
        ? m.sharedInterests.map(String).slice(0, 5)
        : [],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}
