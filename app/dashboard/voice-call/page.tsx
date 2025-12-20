"use client"

import { VoiceNetworkingCall } from "@/components/voice-networking-call"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Phone, Sparkles } from "lucide-react"

export default function VoiceCallPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setUserId(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500 rounded-full blur-[128px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-fuchsia-500 rounded-full blur-[128px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-6 shadow-2xl shadow-violet-500/30"
          >
            <Phone className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Voice Networking Calls
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Make professional networking calls with AI assistance. Build relationships, qualify opportunities, and schedule next steps.
            <span className="text-violet-400 font-medium"> Natural, human-like conversations.</span>
          </motion.p>
        </motion.div>

        {/* Voice Call Component */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: "spring" }}
        >
          <VoiceNetworkingCall userId={userId} />
        </motion.div>

        {/* Bottom hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Select a contact and generate your call plan to get started
          </p>
        </motion.div>
      </div>
    </div>
  )
}

