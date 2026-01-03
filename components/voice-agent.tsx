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
import { useElevenLabsVoice } from "@/lib/hooks/use-elevenlabs-voice"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

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
  mood = "idle",
  onInteract
}: {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  mood?: "idle" | "happy" | "thinking" | "talking"
  onInteract?: () => void
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPoked, setIsPoked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const { left, top, width, height } = containerRef.current.getBoundingClientRect()
      const centerX = left + width / 2
      const centerY = top + height / 2

      // Calculate distance from center normalized to -1 to 1
      const x = (e.clientX - centerX) / (window.innerWidth / 2)
      const y = (e.clientY - centerY) / (window.innerHeight / 2)

      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleInteract = () => {
    setIsPoked(true)
    if (onInteract) onInteract()
    setTimeout(() => setIsPoked(false), 800)
  }

  return (
    <div
      className="relative w-64 h-64 mx-auto perspective-1000 cursor-pointer group"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInteract}
    >
      {/* Tooltip hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap z-20 pointer-events-none backdrop-blur-sm"
      >
        Activate Assistant
      </motion.div>

      {/* Dynamic Background Glow / Aura */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.2, 1] : isSpeaking ? [1, 1.1, 1] : isPoked ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isListening ? [0.4, 0.6, 0.4] : [0.2, 0.4, 0.2],
        }}
        transition={{ duration: isListening ? 1.5 : isPoked ? 0.8 : 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full blur-[60px] transition-colors duration-500 ${isListening ? "bg-red-500/40" :
          isSpeaking ? "bg-emerald-500/40" :
            isProcessing ? "bg-amber-500/40" :
              isPoked ? "bg-cyan-500/40" :
                "bg-indigo-500/30"
          }`}
      />

      {/* High-tech rings - accelerate on interact */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: isHovered ? 10 : 20, repeat: Infinity, ease: "linear" }}
          className={`w-[120%] h-[120%] border border-dashed rounded-full opacity-20 transition-colors duration-300 ${isListening ? "border-red-400" : "border-violet-400"
            }`}
        />
        <motion.div
          animate={{ rotate: -360, scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: isHovered ? 7 : 15, repeat: Infinity, ease: "linear" }}
          className={`absolute w-[140%] h-[140%] border border-dotted rounded-full opacity-10 transition-colors duration-300 ${isListening ? "border-red-400" : "border-cyan-400"
            }`}
        />
      </div>

      {/* 3D Animated Code-Based Robot Body V2 - High Fidelity */}
      <motion.div
        animate={{
          y: isPoked ? [0, -8, 0] : isSpeaking ? [0, -4, 0] : [0, -6, 0],
          rotateX: mousePosition.y * 8,
          rotateY: mousePosition.x * 8,
        }}
        transition={{
          y: { duration: isPoked ? 0.4 : 3, repeat: Infinity, ease: "easeInOut" },
          rotateX: { type: "spring", stiffness: 60, damping: 25 },
          rotateY: { type: "spring", stiffness: 60, damping: 25 },
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full z-10 flex flex-col items-center justify-center pointer-events-none"
      >
        {/* -- HEAD ASSEMBLY -- */}
        <div className="relative z-30 mb-[-10px]" style={{ transformStyle: "preserve-3d" }}>
          {/* Neck Joint */}
          <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-700 rounded-full shadow-inner -z-10" />

          {/* Cranium */}
          <div className="relative w-36 h-36 rounded-full bg-slate-100 shadow-[inset_-8px_-8px_20px_rgba(0,0,0,0.15),inset_8px_8px_20px_rgba(255,255,255,1),0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden border border-white/80">

            {/* Brain Glow */}
            <motion.div
              animate={{ rotate: 360, opacity: isProcessing ? 0.8 : 0.3 }}
              transition={{ duration: isProcessing ? 2 : 10, repeat: Infinity, ease: "linear" }}
              className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-tr ${isListening ? "from-red-400 via-rose-300 to-transparent" :
                isSpeaking ? "from-emerald-400 via-teal-300 to-transparent" :
                  "from-indigo-400 via-blue-300 to-transparent"
                } blur-2xl`}
            />

            {/* Visor Area */}
            <div className="absolute top-[20%] left-[15%] right-[15%] bottom-[20%] rounded-[2rem] bg-slate-900 overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]" />

              {/* Face UI */}
              <div className="relative z-10 flex flex-col gap-3 items-center w-full">
                <div className="flex gap-4 justify-center w-full">
                  <Eye isBlinking={false} mood={isListening ? "angry" : isSpeaking ? "happy" : "neutral"} color={isListening ? "#ef4444" : isSpeaking ? "#10b981" : "#06b6d4"} />
                  <Eye isBlinking={false} mood={isListening ? "angry" : isSpeaking ? "happy" : "neutral"} color={isListening ? "#ef4444" : isSpeaking ? "#10b981" : "#06b6d4"} />
                </div>

                {/* Voice Equalizer */}
                <div className="h-4 flex items-end justify-center gap-[3px]">
                  {isSpeaking ? (
                    [...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 16 + Math.random() * 10, 4] }}
                        transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
                        className="w-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"
                      />
                    ))
                  ) : (
                    // Idle Status Line
                    <div className={`w-8 h-1 rounded-full ${isListening ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-cyan-500/50"}`} />
                  )}
                </div>
              </div>
            </div>

            {/* Specular Highlight */}
            <div className="absolute top-4 left-6 w-12 h-6 bg-gradient-to-br from-white to-transparent rounded-full blur-[1px] opacity-80" />
          </div>

          {/* Ear Pods */}
          <div className="absolute top-12 -left-3 w-4 h-12 bg-slate-200 rounded-l-lg border-r border-slate-300 shadow-lg" />
          <div className="absolute top-12 -right-3 w-4 h-12 bg-slate-200 rounded-r-lg border-l border-slate-300 shadow-lg" />
        </div>

        {/* -- TORSO ASSEMBLY -- */}
        <div className="relative z-20 flex flex-col items-center w-32">

          {/* Upper Chest Plate */}
          <div className="relative w-full h-24 bg-gradient-to-b from-white to-slate-200 rounded-[2.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.2),inset_0_-5px_10px_rgba(0,0,0,0.05)] border border-white flex flex-col items-center justify-start pt-6 z-20">
            {/* Arc Reactor */}
            <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-200 flex items-center justify-center shadow-[inset_0_0_10px_black]">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-5 h-5 rounded-full blur-[2px] ${isListening ? "bg-red-500 shadow-[0_0_15px_#ef4444]" :
                  isSpeaking ? "bg-emerald-500 shadow-[0_0_15px_#10b981]" :
                    "bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
                  }`}
              />
            </div>
          </div>

          {/* Mid-Section / Spine */}
          <div className="w-16 h-12 bg-slate-700 rounded-b-3xl -mt-6 z-10 shadow-inner flex flex-col items-center gap-1 pt-7">
            <div className="w-12 h-1 bg-slate-600 rounded-full" />
            <div className="w-10 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* -- ARMS (Connected to Torso) -- */}

          {/* Left Arm Assembly */}
          <motion.div
            animate={{ rotate: isSpeaking ? [0, -15, 0] : [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 -left-3 origin-top-right z-10"
          >
            <div className="w-8 h-8 rounded-full bg-slate-300 shadow-md transform -translate-x-1" /> {/* Shoulder Joint */}
            <div className="w-6 h-16 bg-white rounded-full border border-slate-200 -mt-2 ml-1 shadow-sm flex flex-col items-center justify-end pb-2"> {/* Upper Arm */}
              <div className="w-4 h-16 bg-slate-200 rounded-full -mb-10 shadow-inner border border-white/50" /> {/* Forearm */}
              <div className="w-6 h-7 bg-slate-300 rounded-full -mb-[46px] border border-white" /> {/* Hand */}
            </div>
          </motion.div>

          {/* Right Arm Assembly */}
          <motion.div
            animate={{ rotate: isSpeaking ? [0, 15, 0] : [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-4 -right-3 origin-top-left z-10"
          >
            <div className="w-8 h-8 rounded-full bg-slate-300 shadow-md transform translate-x-1" /> {/* Shoulder Joint */}
            <div className="w-6 h-16 bg-white rounded-full border border-slate-200 -mt-2 ml-[-4px] shadow-sm flex flex-col items-center justify-end pb-2"> {/* Upper Arm */}
              <div className="w-4 h-16 bg-slate-200 rounded-full -mb-10 shadow-inner border border-white/50" /> {/* Forearm */}
              <div className="w-6 h-7 bg-slate-300 rounded-full -mb-[46px] border border-white" /> {/* Hand */}
            </div>
          </motion.div>
        </div>

        {/* -- LEGS ASSEMBLY -- */}
        <div className="relative flex gap-8 -mt-2 z-10">
          {/* Left Leg */}
          <motion.div
            animate={{ y: [0, 4, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <div className="w-6 h-6 bg-slate-700 rounded-full -mb-3 z-0" /> {/* Hip Joint */}
            <div className="w-8 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm z-10 flex items-end justify-center pb-1"> {/* Thigh */}
              <div className="w-6 h-1 bg-slate-300" />
            </div>
            <div className="w-8 h-10 bg-slate-200 rounded-b-xl shadow-inner -mt-1 pt-1 flex justify-center"> {/* Lower Leg */}
              <div className="w-10 h-6 bg-slate-800 rounded-lg mt-auto shadow-lg" /> {/* Foot */}
            </div>
            {/* Thruster */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-4 h-4 mt-1 bg-cyan-400 blur-md rounded-full"
            />
          </motion.div>

          {/* Right Leg */}
          <motion.div
            animate={{ y: [0, 4, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="flex flex-col items-center"
          >
            <div className="w-6 h-6 bg-slate-700 rounded-full -mb-3 z-0" /> {/* Hip Joint */}
            <div className="w-8 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm z-10 flex items-end justify-center pb-1"> {/* Thigh */}
              <div className="w-6 h-1 bg-slate-300" />
            </div>
            <div className="w-8 h-10 bg-slate-200 rounded-b-xl shadow-inner -mt-1 pt-1 flex justify-center"> {/* Lower Leg */}
              <div className="w-10 h-6 bg-slate-800 rounded-lg mt-auto shadow-lg" /> {/* Foot */}
            </div>
            {/* Thruster */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              className="w-4 h-4 mt-1 bg-cyan-400 blur-md rounded-full"
            />
          </motion.div>
        </div>

        {/* Orbiting Rings container (larger now) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-slate-400/20 -z-20 pointer-events-none"
        />

      </motion.div>

      {/* Active Voice Visualization (Waves) */}
      <AnimatePresence>
        {isSpeaking && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [0.8, 1.4 + i * 0.2],
                  borderColor: ["rgba(52, 211, 153, 0)", "rgba(52, 211, 153, 0.5)", "rgba(52, 211, 153, 0)"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut" as const
                }}
                className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Processing Particles */}
      {isProcessing && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -40, -80],
                x: Math.sin(i) * 20,
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut" as const
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)]"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Procedural Eye Component
function Eye({ isBlinking, mood, color }: { isBlinking: boolean, mood: string, color: string }) {
  const [blink, setBlink] = useState(false)

  // Random blink logic
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, Math.random() * 3000 + 2000)
    return () => clearInterval(interval)
  }, [])

  const eyeVariants = {
    neutral: { height: 12, borderRadius: 20 },
    happy: { height: 18, borderRadius: "50% 50% 0 0", scaleY: 0.8 }, // Upside down U shape illusion via container? Or just simple arc
    angry: { height: 8, borderRadius: 0, rotate: 10 },
  }

  return (
    <div className="relative">
      <motion.div
        animate={{
          height: blink ? 2 : mood === "happy" ? 14 : mood === "angry" ? 8 : 16,
          backgroundColor: color,
          scaleY: blink ? 0.1 : 1
        }}
        className="w-8 rounded-full shadow-[0_0_8px_currentColor]"
        style={{ color: color }}
      />
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

  // ElevenLabs for both TTS and STT
  const handleVoiceResult = useCallback(async (transcribedText: string) => {
    if (transcribedText.trim()) {
      await processCommand(transcribedText)
    }
  }, [])

  const {
    speak: elevenLabsSpeak,
    stop: stopSpeaking,
    isSpeaking,
    isListening,
    transcript,
    toggleListening,
    isLoading: isVoiceLoading
  } = useElevenLabsVoice({
    onSpeechStart: () => console.log("Speaking started"),
    onSpeechEnd: () => console.log("Speaking ended"),
    onTranscript: handleVoiceResult,
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
              subject: pendingAction.parameters.subject || "Message from Network Link AI",
              body: pendingAction.parameters.body || pendingAction.parameters.message || "",
            }),
          })
          if (!emailResponse.ok) throw new Error("Failed to send email")
          successMsg = "Email sent! ✉️"
          break
        }
        case "create_event":
        case "schedule_meeting": {
          const eventTitle = pendingAction.parameters.title
          const eventDate = pendingAction.parameters.date || new Date().toISOString()

          // Check for duplicate events: same title and start_time within 1 minute
          const startTime = new Date(eventDate)
          const oneMinuteBefore = new Date(startTime.getTime() - 60000)
          const oneMinuteAfter = new Date(startTime.getTime() + 60000)

          const { data: existingEvents, error: checkError } = await supabase
            .from("calendar_events")
            .select("id, title, start_time")
            .eq("user_id", userId)
            .eq("title", eventTitle.trim())
            .gte("start_time", oneMinuteBefore.toISOString())
            .lte("start_time", oneMinuteAfter.toISOString())
            .limit(1)

          if (checkError) {
            console.error("Error checking for duplicates:", checkError)
          }

          if (existingEvents && existingEvents.length > 0) {
            successMsg = "Event already exists! 📅"
            break
          }

          const { error } = await supabase.from("calendar_events").insert({
            user_id: userId,
            title: eventTitle,
            start_time: eventDate,
            location: pendingAction.parameters.location || null,
            description: pendingAction.parameters.description || null,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Left: Mascot & Controls */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
        <CardContent className="p-6 flex flex-col items-center justify-between min-h-[600px]">
          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 px-4 py-1.5 rounded-full text-xs font-semibold ${isListening
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
          <div className="relative mb-8 flex-shrink-0">
            <SpeechBubble text={currentBubbleText} isVisible={showBubble} />
            <AriaMascot
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              onInteract={() => {
                const interactions = [
                  "System online. �",
                  "Awaiting command. ⌨️",
                  "Ready to assist. 🤝",
                  "How may I help? �",
                  "Listening... 🎙️",
                  "At your service. ⚡"
                ]
                const randomMsg = interactions[Math.floor(Math.random() * interactions.length)]
                setCurrentBubbleText(randomMsg)
                setShowBubble(true)

                // Optional: Play a subtle UI sound
                if (voiceEnabled && !isSpeaking && !isListening) {
                  setTimeout(() => {
                    // Play "active" sound
                  }, 100)
                }

                // Clear bubble after a few seconds
                setTimeout(() => {
                  if (!isSpeaking && !isListening && !isProcessing) {
                    setShowBubble(false)
                  }
                }, 2500)
              }}
            />
          </div>

          {/* Main mic button */}
          <div className="flex flex-col items-center mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing || isSpeaking}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening
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

            <p className="mt-4 text-sm text-slate-400 text-center">
              {isListening ? "Tap to stop" : "Tap to speak"}
            </p>
          </div>

          {/* Voice toggle */}
          <div className="mb-6">
            <Button
              onClick={() => {
                if (isSpeaking) stopSpeaking()
                setVoiceEnabled(!voiceEnabled)
              }}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              {voiceEnabled ? (
                <><Volume2 className="w-4 h-4 mr-2" /> Voice On</>
              ) : (
                <><VolumeX className="w-4 h-4 mr-2" /> Voice Off</>
              )}
            </Button>
          </div>

          {/* Quick actions */}
          <div className="mt-auto w-full pt-4">
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
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px]">
        {/* Chat header */}
        <div className="p-4 border-b border-white/10 bg-slate-800/30 flex-shrink-0">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            Conversation
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                className={`flex gap-3 $                ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col ${message.role === "user" ? "order-first items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${message.role === "user"
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    : "bg-slate-800 text-slate-100 border border-white/5"
                    }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                    <div className="mt-2 space-y-1 w-full">
                      {message.data.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="text-xs bg-slate-800/60 rounded-lg px-3 py-2 flex items-center gap-2">
                          <Users className="h-3 w-3 text-violet-400 flex-shrink-0" />
                          <span className="text-white">{item.name}</span>
                          {item.company && <span className="text-slate-500">• {item.company}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] text-slate-500 mt-1 px-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
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
                className="flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-white/5">
                  <div className="flex gap-1 items-center">
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
              className="mx-4 mb-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl flex-shrink-0"
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
        <div className="p-4 border-t border-white/10 bg-slate-800/30 flex-shrink-0">
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
