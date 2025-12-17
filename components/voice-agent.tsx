"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Mail,
  Users,
  Calendar,
  Search,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  X,
  Check,
} from "lucide-react"
import { useVoiceAssistant } from "@/lib/hooks/use-voice-assistant"
import { useElevenLabsVoice } from "@/lib/hooks/use-elevenlabs-voice"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  action?: string
  data?: any
}

interface VoiceAgentProps {
  userId: string
}

// Animated Mascot Component
function AriaMascot({ 
  isListening, 
  isSpeaking, 
  isProcessing,
  mood = "idle"
}: { 
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  mood?: "idle" | "happy" | "thinking" | "talking"
}) {
  const currentMood = isListening ? "listening" : isSpeaking ? "talking" : isProcessing ? "thinking" : mood

  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* Outer glow rings */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.3, 1] : isSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: isListening ? 0.8 : 2, repeat: Infinity }}
        className={`absolute inset-0 rounded-full ${
          isListening ? "bg-red-500" : isSpeaking ? "bg-green-500" : "bg-violet-500"
        } blur-xl`}
      />
      <motion.div
        animate={{
          scale: isListening ? [1.1, 1.4, 1.1] : isSpeaking ? [1.1, 1.3, 1.1] : [1.02, 1.08, 1.02],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{ duration: isListening ? 1 : 2.5, repeat: Infinity, delay: 0.2 }}
        className={`absolute inset-0 rounded-full ${
          isListening ? "bg-red-400" : isSpeaking ? "bg-emerald-400" : "bg-fuchsia-500"
        } blur-2xl`}
      />

      {/* Main body */}
      <motion.div
        animate={{
          y: isSpeaking ? [0, -5, 0, -3, 0] : [0, -4, 0],
          scale: isListening ? [1, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: isSpeaking ? 0.5 : 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-full h-full"
      >
        {/* Body gradient sphere */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 shadow-2xl shadow-violet-500/50">
          {/* Shine effect */}
          <div className="absolute top-3 left-6 w-8 h-8 bg-white/30 rounded-full blur-md" />
          <div className="absolute top-5 left-8 w-3 h-3 bg-white/50 rounded-full" />
        </div>

        {/* Face container */}
        <div className="absolute inset-4 flex items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-5 -mt-2">
            {/* Left eye */}
            <motion.div
              animate={{
                scaleY: isSpeaking ? [1, 0.8, 1] : isProcessing ? [1, 0.2, 1] : 1,
              }}
              transition={{ 
                duration: isSpeaking ? 0.3 : 2.5, 
                repeat: isSpeaking || isProcessing ? Infinity : 0,
                repeatDelay: isProcessing ? 0.5 : 0
              }}
              className="relative"
            >
              <div className="w-6 h-7 bg-white rounded-full flex items-center justify-center shadow-inner">
                <motion.div
                  animate={{
                    x: isListening ? [-2, 2, -2] : 0,
                    y: isProcessing ? [0, 2, 0] : 0,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-slate-900 rounded-full"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full ml-0.5 mt-0.5" />
                </motion.div>
              </div>
            </motion.div>

            {/* Right eye */}
            <motion.div
              animate={{
                scaleY: isSpeaking ? [1, 0.8, 1] : isProcessing ? [1, 0.2, 1] : 1,
              }}
              transition={{ 
                duration: isSpeaking ? 0.3 : 2.5, 
                repeat: isSpeaking || isProcessing ? Infinity : 0,
                repeatDelay: isProcessing ? 0.5 : 0,
                delay: 0.1
              }}
              className="relative"
            >
              <div className="w-6 h-7 bg-white rounded-full flex items-center justify-center shadow-inner">
                <motion.div
                  animate={{
                    x: isListening ? [-2, 2, -2] : 0,
                    y: isProcessing ? [0, 2, 0] : 0,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-slate-900 rounded-full"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full ml-0.5 mt-0.5" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mouth */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.div
                key="speaking"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  scaleY: [1, 1.5, 0.8, 1.3, 1],
                }}
                exit={{ scale: 0 }}
                transition={{ 
                  scaleY: { duration: 0.4, repeat: Infinity }
                }}
                className="w-6 h-6 bg-slate-900 rounded-full"
              />
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-8 h-8 border-4 border-slate-900 rounded-full bg-red-400/50"
              />
            ) : (
              <motion.div
                key="smile"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-8 h-3 border-b-4 border-slate-900 rounded-b-full"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Blush marks */}
        <div className="absolute bottom-14 left-6 w-4 h-2 bg-pink-400/40 rounded-full blur-sm" />
        <div className="absolute bottom-14 right-6 w-4 h-2 bg-pink-400/40 rounded-full blur-sm" />
      </motion.div>

      {/* Sound waves when speaking */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0, 0.5, 0],
                  scale: [0.9, 1.3 + i * 0.15, 1.5 + i * 0.15],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="absolute inset-0 rounded-full border-2 border-green-400"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Listening pulse rings */}
      <AnimatePresence>
        {isListening && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.6, 0],
                  scale: [1, 1.8],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Sparkles around when idle */}
      {!isListening && !isSpeaking && !isProcessing && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute"
              style={{
                top: `${20 + Math.random() * 20}%`,
                left: `${10 + i * 25}%`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}

// Speech bubble component
function SpeechBubble({ text, isVisible }: { text: string; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full max-w-xs"
        >
          <div className="relative bg-white text-slate-900 px-4 py-2 rounded-2xl shadow-xl text-sm font-medium">
            {text}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function VoiceAgent({ userId }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [pendingAction, setPendingAction] = useState<any>(null)
  const [currentBubbleText, setCurrentBubbleText] = useState("Hey! I'm ARIA 👋 How can I help you today?")
  const [showBubble, setShowBubble] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // ElevenLabs TTS
  const { speak: elevenLabsSpeak, stop: stopSpeaking, isSpeaking } = useElevenLabsVoice({
    onSpeechStart: () => console.log("Speaking started"),
    onSpeechEnd: () => console.log("Speaking ended"),
  })

  // Speech Recognition
  const handleVoiceResult = useCallback(async (transcript: string) => {
    await processCommand(transcript)
  }, [])

  const { isListening, transcript, isSupported, toggle: toggleListening } = useVoiceAssistant({
    onResult: handleVoiceResult,
    onError: (error) => console.error("Voice error:", error),
  })

  // Update bubble text based on state
  useEffect(() => {
    if (isListening) {
      setCurrentBubbleText("I'm listening... 🎤")
      setShowBubble(true)
    } else if (isProcessing) {
      setCurrentBubbleText("Let me think... 🤔")
      setShowBubble(true)
    } else if (isSpeaking) {
      setShowBubble(false)
    }
  }, [isListening, isProcessing, isSpeaking])

  // Show transcript in bubble
  useEffect(() => {
    if (transcript && isListening) {
      setCurrentBubbleText(`"${transcript}"`)
    }
  }, [transcript, isListening])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const processCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: command,
      role: "user",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)
    setShowBubble(true)
    setCurrentBubbleText("Processing... ✨")

    try {
      const response = await fetch("/api/voice-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, userId }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.response || result.error || "Failed to process command")
      }

      if (result.needsConfirmation) {
        setPendingAction(result)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        role: "assistant",
        timestamp: new Date(),
        action: result.action,
        data: result.data,
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update bubble and speak
      setCurrentBubbleText(result.response.slice(0, 60) + (result.response.length > 60 ? "..." : ""))
      setShowBubble(true)

      if (voiceEnabled && result.response) {
        await elevenLabsSpeak(result.response)
      }

      // Hide bubble after speaking
      setTimeout(() => {
        setShowBubble(false)
      }, 3000)
    } catch (error) {
      console.error("Command processing error:", error)
      const errorMsg = error instanceof Error ? error.message : "Oops! Something went wrong. Try again?"
      setCurrentBubbleText(errorMsg)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      if (voiceEnabled) {
        await elevenLabsSpeak(errorMsg)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isProcessing) return
    processCommand(inputMessage)
    setInputMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const confirmAction = async () => {
    if (!pendingAction) return
    setIsProcessing(true)
    try {
      let successMsg = ""
      switch (pendingAction.action) {
        case "send_email":
        case "send_cold_email": {
          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              to: pendingAction.parameters.recipient || pendingAction.parameters.to,
              subject: pendingAction.parameters.subject || "Message from Netlink",
              body: pendingAction.parameters.body || pendingAction.parameters.message || "",
            }),
          })
          if (!emailResponse.ok) throw new Error("Failed to send email")
          successMsg = "Email sent! ✉️"
          break
        }
        case "create_event":
        case "schedule_meeting": {
          const { error } = await supabase.from("calendar_events").insert({
            user_id: userId,
            title: pendingAction.parameters.title,
            event_date: pendingAction.parameters.date || new Date().toISOString(),
            location: pendingAction.parameters.location,
            description: pendingAction.parameters.description,
          })
          if (error) throw error
          successMsg = "Event created! 📅"
          break
        }
        case "add_contact": {
          const { error } = await supabase.from("contacts").insert({
            user_id: userId,
            name: pendingAction.parameters.name,
            email: pendingAction.parameters.email,
            company: pendingAction.parameters.company,
            phone: pendingAction.parameters.phone,
            notes: pendingAction.parameters.notes,
          })
          if (error) throw error
          successMsg = `Added ${pendingAction.parameters.name}! 🎉`
          break
        }
        default:
          successMsg = "Done! ✅"
      }

      setCurrentBubbleText(successMsg)
      setShowBubble(true)
      const successMessage: Message = {
        id: Date.now().toString(),
        content: successMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, successMessage])
      if (voiceEnabled) {
        await elevenLabsSpeak(successMsg)
      }
    } catch (error) {
      console.error("Action error:", error)
      const errorMsg = "Couldn't complete that. Try again?"
      setCurrentBubbleText(errorMsg)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      if (voiceEnabled) {
        await elevenLabsSpeak(errorMsg)
      }
    } finally {
      setPendingAction(null)
      setIsProcessing(false)
    }
  }

  const cancelAction = () => {
    setPendingAction(null)
    setCurrentBubbleText("Cancelled! 👍")
    setShowBubble(true)
    setTimeout(() => setShowBubble(false), 2000)
  }

  const quickActions = [
    { icon: Mail, label: "Email", command: "Help me send an email", color: "bg-blue-500" },
    { icon: Users, label: "Contacts", command: "Find contacts with similar interests", color: "bg-green-500" },
    { icon: Target, label: "Investors", command: "Help me find potential investors", color: "bg-purple-500" },
    { icon: Calendar, label: "Schedule", command: "Schedule a meeting", color: "bg-orange-500" },
    { icon: TrendingUp, label: "Growth", command: "Give me networking advice", color: "bg-rose-500" },
    { icon: Search, label: "Search", command: "Search my contacts", color: "bg-cyan-500" },
    { icon: BarChart3, label: "Analyze", command: "Analyze my network", color: "bg-amber-500" },
    { icon: Lightbulb, label: "Cold Email", command: "Help write a cold email", color: "bg-indigo-500" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Mascot & Controls */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[500px]">
          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 px-4 py-1.5 rounded-full text-xs font-semibold ${
              isListening 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : isSpeaking 
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : isProcessing
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-violet-500/20 text-violet-400 border border-violet-500/30"
            }`}
          >
            {isListening ? "🎤 Listening..." : isSpeaking ? "🔊 Speaking" : isProcessing ? "⚡ Processing" : "✨ Ready"}
          </motion.div>

          {/* Mascot with speech bubble */}
          <div className="relative mb-8">
            <SpeechBubble text={currentBubbleText} isVisible={showBubble} />
            <AriaMascot 
              isListening={isListening} 
              isSpeaking={isSpeaking} 
              isProcessing={isProcessing}
            />
          </div>

          {/* Main mic button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={isProcessing || isSpeaking}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? "bg-red-500 shadow-lg shadow-red-500/50" 
                : "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-4 border-red-400"
              />
            )}
          </motion.button>

          <p className="mt-4 text-sm text-slate-400">
            {isListening ? "Tap to stop" : "Tap to speak"}
          </p>

          {/* Voice toggle */}
          <Button
            onClick={() => {
              if (isSpeaking) stopSpeaking()
              setVoiceEnabled(!voiceEnabled)
            }}
            variant="ghost"
            size="sm"
            className="mt-4 text-slate-400 hover:text-white"
          >
            {voiceEnabled ? (
              <><Volume2 className="w-4 h-4 mr-2" /> Voice On</>
            ) : (
              <><VolumeX className="w-4 h-4 mr-2" /> Voice Off</>
            )}
          </Button>

          {/* Quick actions */}
          <div className="mt-8 w-full">
            <p className="text-xs text-slate-500 mb-3 text-center">Quick Actions</p>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => processCommand(action.command)}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-400">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Chat */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Chat header */}
        <div className="p-4 border-b border-white/10 bg-slate-800/30">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            Conversation
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4"
              >
                <Sparkles className="w-8 h-8 text-violet-400" />
              </motion.div>
              <p className="text-slate-400 text-sm">Start a conversation with ARIA!</p>
              <p className="text-slate-500 text-xs mt-1">Tap the mic or type below</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-white/5"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.data.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="text-xs bg-slate-800/60 rounded-lg px-3 py-2 flex items-center gap-2">
                          <Users className="h-3 w-3 text-violet-400" />
                          <span className="text-white">{item.name}</span>
                          {item.company && <span className="text-slate-500">• {item.company}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))
          )}

          {/* Processing indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-white/5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Pending action */}
        <AnimatePresence>
          {pendingAction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-4 mb-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl"
            >
              <p className="text-sm font-medium text-white mb-2">Confirm Action?</p>
              <p className="text-xs text-slate-400 mb-3">
                {pendingAction.action?.includes("email") 
                  ? `Send email to ${pendingAction.parameters?.recipient || pendingAction.parameters?.to}?`
                  : pendingAction.action?.includes("event") || pendingAction.action?.includes("meeting")
                  ? `Create: ${pendingAction.parameters?.title}?`
                  : "Proceed with action?"}
              </p>
              <div className="flex gap-2">
                <Button onClick={confirmAction} size="sm" className="flex-1 bg-violet-600 hover:bg-violet-500">
                  <Check className="w-4 h-4 mr-1" /> Yes
                </Button>
                <Button onClick={cancelAction} size="sm" variant="outline" className="flex-1 border-white/10">
                  <X className="w-4 h-4 mr-1" /> No
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-slate-800/30">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isProcessing || isListening}
              className="flex-1 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
