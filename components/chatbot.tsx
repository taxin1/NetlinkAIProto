"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX, Sparkles, HelpCircle } from "lucide-react"
import { useVoiceAssistant } from "@/lib/hooks/use-voice-assistant"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface ChatbotProps {
  userId: string
}

async function sendMessageToAI(message: string): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    })

    if (!response.ok) {
      let errorMessage = "Failed to get response from AI"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        
        // Include details if available (for debugging)
        if (errorData.details) {
          console.error("AI API Error Details:", errorData.details)
        }
        
        // Provide more helpful error messages
        if (errorMessage.includes("GEMINI_API_KEY") || errorMessage.includes("not configured")) {
          errorMessage = "AI service is not configured. Please check your API key settings."
        } else if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE")) {
          errorMessage = "The AI service is temporarily overloaded. The system will automatically retry. Please wait a moment and try again if needed."
        } else if (errorMessage.includes("429")) {
          errorMessage = "Too many requests. Please wait a moment before trying again."
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "The AI request took too long. Please try again with a shorter message."
        } else if (errorMessage.includes("network") || errorMessage.includes("connect")) {
          errorMessage = "Unable to connect to AI service. Please check your internet connection."
        }
      } catch (parseError) {
        // If we can't parse the error, use the status text
        errorMessage = `AI service error (${response.status}): ${response.statusText || "Unknown error"}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    // Re-throw with better context
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while communicating with the AI service")
  }
}

export function Chatbot({ userId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. You can type or use voice commands. Try saying 'send email' or 'show my contacts'!",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [showHelp, setShowHelp] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const voiceCommands = [
    { category: "📧 Email", examples: ["Write an email to John about the meeting", "Send email to Sarah", "Create a campaign for product launch"] },
    { category: "👥 Contacts", examples: ["Add contact John Smith", "Show my contacts", "Search for contact Sarah"] },
    { category: "📅 Events", examples: ["What are my upcoming events?", "Show my calendar", "Create event tomorrow"] },
    { category: "📊 Stats", examples: ["Show my stats", "How many contacts do I have?", "View my campaigns"] },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Voice Assistant
  const handleVoiceResult = async (transcript: string) => {
    // Add user's voice message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: transcript,
      role: "user",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Process voice command
      const response = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: transcript, userId }),
      })

      if (!response.ok) throw new Error("Failed to process voice command")

      const intent = await response.json()

      // Handle different actions
      if (intent.action === "write_email" && intent.parameters.generatedEmail) {
        // Show generated email and ask for confirmation to send
        setPendingAction({
          ...intent,
          action: "send_email", // Convert to send_email action
          parameters: {
            ...intent.parameters,
            subject: intent.parameters.subject || `Message from Netlink`,
            body: intent.parameters.generatedEmail,
          }
        })
      } else if (intent.action === "send_email" && (intent.parameters.recipient || intent.parameters.contactEmail)) {
        setPendingAction(intent)
      } else if (intent.action === "create_campaign" && intent.parameters.campaignId) {
        // Ask if user wants to run the campaign
        setPendingAction(intent)
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: intent.response,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        await speak(intent.response)
      }
    } catch (error) {
      console.error("Voice command error:", error)
      const errorMsg = "Sorry, I had trouble understanding that. Could you try again?"
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      if (voiceEnabled) {
        await speak(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceError = (error: string) => {
    console.error("Voice error:", error)
  }

  const { isListening, isSpeaking, transcript, isSupported, toggle, speak, stopSpeaking } = 
    useVoiceAssistant({
      onResult: handleVoiceResult,
      onError: handleVoiceError,
      autoSpeak: voiceEnabled,
    })

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await sendMessageToAI(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      
      // Provide user-friendly error messages
      let errorContent = "Sorry, I encountered an error. Please try again."
      
      if (error instanceof Error) {
        errorContent = error.message
        
        // Add helpful suggestions based on error type
        if (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("UNAVAILABLE")) {
          errorContent = "The AI service is temporarily overloaded. The system automatically retried, but it's still busy.\n\n💡 Tip: Please wait a few moments and try again. This usually resolves quickly."
        } else if (error.message.includes("429")) {
          errorContent = "Too many requests sent too quickly.\n\n💡 Tip: Please wait a moment before trying again."
        } else if (error.message.includes("not configured") || error.message.includes("API key")) {
          errorContent += "\n\n💡 Tip: Make sure your AI API key is configured in the deployment settings."
        } else if (error.message.includes("timeout")) {
          errorContent += "\n\n💡 Tip: Try breaking your message into smaller parts."
        } else if (error.message.includes("network") || error.message.includes("connect")) {
          errorContent += "\n\n💡 Tip: Check your internet connection and try again."
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle email sending action
  const handleSendEmail = async () => {
    if (!pendingAction) return

    setIsLoading(true)
    try {
      // First, save the email to database
      const supabase = createClient()
      let emailId: string | null = null
      
      if (pendingAction.parameters.contactId) {
        const { data: savedEmail, error: saveError } = await supabase
          .from("emails")
          .insert({
            user_id: userId,
            contact_id: pendingAction.parameters.contactId,
            subject: pendingAction.parameters.subject || "Message from Netlink",
            body: pendingAction.parameters.body || pendingAction.parameters.message || "",
            status: "draft",
          })
          .select("id")
          .single()
        
        if (!saveError && savedEmail) {
          emailId = savedEmail.id
        }
      }

      // Then send the email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: emailId,
          contactEmail: pendingAction.parameters.contactEmail || pendingAction.parameters.recipient,
          subject: pendingAction.parameters.subject || "Message from Netlink",
          body: pendingAction.parameters.body || pendingAction.parameters.message || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to send email")
      }

      const successMsg = `Email sent successfully to ${pendingAction.parameters.contactName || pendingAction.parameters.recipient}!`
      const successMessage: Message = {
        id: Date.now().toString(),
        content: successMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, successMessage])
      if (voiceEnabled) {
        await speak(successMsg)
      }
      setPendingAction(null)
    } catch (error) {
      console.error("Error sending email:", error)
      const errorMsg = error instanceof Error 
        ? `Sorry, I couldn't send the email: ${error.message}`
        : "Sorry, I couldn't send the email. Please check your email settings."
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      if (voiceEnabled) {
        await speak(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle campaign creation and running
  const handleRunCampaign = async () => {
    if (!pendingAction || !pendingAction.parameters.campaignId) return

    setIsLoading(true)
    try {
      // Navigate to campaigns page or trigger campaign run
      const response = await fetch(`/api/run-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: pendingAction.parameters.campaignId,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to run campaign")
      }

      const successMsg = `Campaign "${pendingAction.parameters.campaign_name}" is now running!`
      const successMessage: Message = {
        id: Date.now().toString(),
        content: successMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, successMessage])
      if (voiceEnabled) {
        await speak(successMsg)
      }
      setPendingAction(null)
    } catch (error) {
      console.error("Error running campaign:", error)
      const errorMsg = error instanceof Error 
        ? `Sorry, I couldn't run the campaign: ${error.message}`
        : "Sorry, I couldn't run the campaign. Please try again."
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      if (voiceEnabled) {
        await speak(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const cancelAction = () => {
    setPendingAction(null)
    const cancelMsg = "Action cancelled."
    const cancelMessage: Message = {
      id: Date.now().toString(),
      content: cancelMsg,
      role: "assistant",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, cancelMessage])
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {isSupported && (
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? (
                  <>
                    <Mic className="h-3 w-3 mr-1 animate-pulse" />
                    Listening...
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                    Speaking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Voice Ready
                  </>
                )}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="h-8 w-8 p-0"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Voice Commands Help */}
        {showHelp && isSupported && (
          <div className="mt-3 p-3 bg-muted rounded-lg space-y-2 animate-slide-down">
            <p className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Command Examples
            </p>
            <div className="space-y-2 text-xs">
              {voiceCommands.map((cmd, idx) => (
                <div key={idx}>
                  <p className="font-medium text-muted-foreground">{cmd.category}</p>
                  <ul className="ml-3 space-y-1 text-muted-foreground">
                    {cmd.examples.map((ex, i) => (
                      <li key={i}>• "{ex}"</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Click the 🎤 button and speak your command!
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
        <div className="flex-1 mb-4 pr-4 overflow-y-auto overflow-x-hidden">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Pending Action Confirmation */}
        {pendingAction && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
            <p className="text-sm font-medium mb-2">Confirm Action</p>
            <p className="text-xs text-muted-foreground mb-3">
              {pendingAction.action === "send_email" && 
                `Send email to ${pendingAction.parameters.contactName || pendingAction.parameters.recipient}?`
              }
              {pendingAction.action === "create_campaign" && 
                `Start sending emails for campaign "${pendingAction.parameters.campaign_name}"?`
              }
            </p>
            {pendingAction.parameters.generatedEmail && (
              <div className="mb-3 p-2 bg-muted rounded text-xs max-h-32 overflow-y-auto">
                <p className="font-medium mb-1">Email Preview:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {pendingAction.parameters.generatedEmail.substring(0, 200)}
                  {pendingAction.parameters.generatedEmail.length > 200 ? "..." : ""}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={pendingAction.action === "create_campaign" ? handleRunCampaign : handleSendEmail} 
                size="sm" 
                className="flex-1"
              >
                {pendingAction.action === "create_campaign" ? "Start Campaign" : "Confirm & Send"}
              </Button>
              <Button onClick={cancelAction} size="sm" variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Live Transcript */}
        {isListening && transcript && (
          <div className="mb-2 p-2 bg-muted rounded-lg text-sm text-muted-foreground animate-pulse">
            {transcript}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type or speak your message..."}
            disabled={isLoading || isListening}
            className="flex-1"
          />
          
          {isSupported && (
            <>
              <Button
                onClick={toggle}
                disabled={isLoading}
                size="icon"
                variant={isListening ? "default" : "outline"}
                className={isListening ? "animate-pulse" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                size="icon"
                variant="outline"
                title={voiceEnabled ? "Mute responses" : "Unmute responses"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </>
          )}
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}