"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EngagementToast } from "@/components/ui/toast"
import { Bot, MessageSquare, Sparkles, User, X, Loader2 } from "lucide-react"


type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

interface PageConfig {
  title: string
  description: string
  focusSuggestions: string[]
}

interface ContextualChatWidgetProps {
  userId?: string
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  "/dashboard": {
    title: "Ask Network Link AI about your dashboard",
    description: "Get insights on your networking activity and what to do next.",
    focusSuggestions: [
      "Who should I follow up with next?",
      "Summarize my recent networking activity.",
      "How can I get more value from my network?",
    ],
  },
  "/dashboard/contacts": {
    title: "Ask about your contacts",
    description: "Get help prioritizing, drafting outreach, or organizing relationships.",
    focusSuggestions: [
      "Who are my most important contacts right now?",
      "Help me draft a follow-up message.",
      "Suggest ways to re-engage cold contacts.",
    ],
  },
  "/dashboard/emails": {
    title: "Ask about your emails",
    description: "Summarize threads, plan follow-ups, or improve your messaging.",
    focusSuggestions: [
      "Summarize my recent email conversations.",
      "Suggest follow-ups for unanswered emails.",
      "Help improve the tone of my outreach.",
    ],
  },
  "/dashboard/events": {
    title: "Ask about your events",
    description: "Plan event follow-ups and stay on top of your commitments.",
    focusSuggestions: [
      "What events should I prepare for this week?",
      "Suggest follow-ups for recent events.",
      "Help me make the most of upcoming events.",
    ],
  },
  "/dashboard/event-matchmaking": {
    title: "Ask about AI matchmaking",
    description: "Refine needs-based or event-based matches and outreach.",
    focusSuggestions: [
      "Who can help with my current needs?",
      "Who should I prioritize at my next event?",
      "Suggest icebreakers for my top matches.",
    ],
  },
  "/dashboard/voice-agent": {
    title: "Ask alongside the voice agent",
    description: "Use chat for deeper planning while you use the voice agent.",
    focusSuggestions: [
      "Summarize what I discussed with the voice agent.",
      "Turn my voice notes into an action plan.",
      "Suggest next steps from recent voice sessions.",
    ],
  },
  "/dashboard/ai-assistant": {
    title: "Ask the AI assistant with context",
    description: "Give Network Link AI extra context about this page for better answers.",
    focusSuggestions: [
      "Explain how to use this AI assistant effectively.",
      "Suggest prompts tailored to my workflow.",
      "Help me create a daily AI-assisted routine.",
    ],
  },
}

function getPageConfig(pathname: string | null): PageConfig {
  if (!pathname) {
    return {
      title: "Ask Network Link AI anything",
      description: "Get contextual help based on where you are in the app.",
      focusSuggestions: [
        "What should I focus on today?",
        "How can I grow my network this week?",
        "Help me prioritize follow-ups.",
      ],
    }
  }

  const match = Object.entries(PAGE_CONFIGS).find(([key]) =>
    pathname.startsWith(key),
  )

  if (match) {
    return match[1]
  }

  return {
    title: "Ask Network Link AI about this page",
    description: "Network Link AI will use your current page as context for answers.",
    focusSuggestions: [
      "Explain what I can do on this page.",
      "Suggest next steps from here.",
      "Help me use this page more effectively.",
    ],
  }
}

export function ContextualChatWidget({ userId }: ContextualChatWidgetProps) {
  const pathname = usePathname()
  const pageConfig = useMemo(() => getPageConfig(pathname), [pathname])

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focusContext, setFocusContext] = useState<string | null>(null)
  const [showEngagementToast, setShowEngagementToast] = useState(false)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length])

  useEffect(() => {
    setMessages([])
    setInput("")
    setFocusContext(null)
    setShowEngagementToast(false)
    resetIdleTimer()
  }, [pathname])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [isOpen])

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    if (isOpen) {
      setShowEngagementToast(false)
      return
    }

    idleTimerRef.current = setTimeout(() => {
      setShowEngagementToast(true)
    }, 60000)
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowEngagementToast(false)
    resetIdleTimer()

    try {
      const contextLines = [
        `User is on page: ${pageConfig.title}`,
        `Route: ${pathname}`,
        focusContext ? `Current focus: ${focusContext}` : "Current focus: general",
        "",
        `User message: ${trimmed}`,
      ]

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextLines.join("\n"),
          userId: userId || "anonymous",
          contacts: [],
          recentEmails: [],
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()
      const aiResponse = data.response

      const assistantText =
        typeof aiResponse === "string"
          ? aiResponse
          : aiResponse && typeof aiResponse.content === "string"
            ? aiResponse.content
            : "I could not generate a helpful answer right now."

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? `There was an error: ${error.message}`
            : "There was an unexpected error.",
      }

      setMessages((prev) => [...prev, message])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFocusContext(suggestion)
    setIsOpen(true)
    setShowEngagementToast(false)
    resetIdleTimer()
    sendMessage(suggestion)
  }

  return (
    <>
      <EngagementToast
        open={showEngagementToast}
        title="Need help making the most of this page?"
        description={pageConfig.description}
        actions={[
          {
            label: "Ask a quick question",
            onClick: () => {
              setIsOpen(true)
              setShowEngagementToast(false)
              resetIdleTimer()
            },
          },
          {
            label: "Show suggestions",
            onClick: () => {
              setIsOpen(true)
              setShowEngagementToast(false)
              resetIdleTimer()
              if (pageConfig.focusSuggestions[0]) {
                sendMessage(pageConfig.focusSuggestions[0])
              }
            },
          },
        ]}
        onDismiss={() => {
          setShowEngagementToast(false)
          resetIdleTimer()
        }}
      />

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {isOpen && (
          <Card className="w-[360px] shadow-2xl border-primary/40 bg-background/95 backdrop-blur flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <span>Network Link AI Contextual Assistant</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      Beta
                    </Badge>
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    {pageConfig.title}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() => {
                  setIsOpen(false)
                  setShowEngagementToast(false)
                  resetIdleTimer()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 mb-1">
                {pageConfig.focusSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>
                      Ask Network Link AI questions about this page, and it will use your
                      current context to answer.
                    </span>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                        }`}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted/70">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-2 flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value)
                    resetIdleTimer()
                  }}
                  placeholder="Ask a question about this page..."
                  className="h-9 text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={isLoading || !input.trim()}
                  className="h-9 w-9"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Button
          type="button"
          size="lg"
          variant={isOpen ? "secondary" : "default"}
          className="shadow-lg shadow-primary/25 rounded-full px-4 py-2 h-11 flex items-center gap-2"
          onClick={() => {
            const nextOpen = !isOpen
            setIsOpen(nextOpen)
            if (!nextOpen) {
              setShowEngagementToast(false)
            }
            resetIdleTimer()
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isOpen ? "Hide contextual assistant" : "Ask Network Link AI about this page"}
          </span>
        </Button>
      </div>
    </>
  )
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 14-7-7 14-2-5-5-2z" />
    </svg>
  )
}
