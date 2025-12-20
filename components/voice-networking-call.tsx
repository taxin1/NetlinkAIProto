"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, 
  PhoneOff,
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  User,
  Building2,
  Briefcase,
  Target,
  Sparkles,
  X,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { useElevenLabsVoice } from "@/lib/hooks/use-elevenlabs-voice"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import type {
  ContactCallData,
  CallContext,
  GeneratedCallPrompt,
  CallOutcome
} from "@/types/call"
import type { Contact as ContactType } from "@/types/contact"

interface VoiceNetworkingCallProps {
  userId: string
}

type CallStage = "preparation" | "ready" | "calling" | "in_call" | "ended" | "review"

interface ConversationMessage {
  id: string
  content: string
  role: "agent" | "contact"
  timestamp: Date
}

export function VoiceNetworkingCall({ userId }: VoiceNetworkingCallProps) {
  const [stage, setStage] = useState<CallStage>("preparation")
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [callContext, setCallContext] = useState<CallContext | null>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedCallPrompt | null>(null)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null)
  const [callId, setCallId] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<string>("")
  
  // Form fields
  const [callGoal, setCallGoal] = useState("")
  const [desiredOutcome, setDesiredOutcome] = useState("")
  const [topicMode, setTopicMode] = useState("")
  const [userProfile, setUserProfile] = useState({ name: "", role: "", organization: "" })
  const [customPrompt, setCustomPrompt] = useState("")
  
  // Phone number input option
  const [useManualPhone, setUseManualPhone] = useState(false)
  const [manualPhoneNumber, setManualPhoneNumber] = useState("")
  const [manualContactName, setManualContactName] = useState("")
  
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [isInitiatingCall, setIsInitiatingCall] = useState(false)
  const supabase = createClient()

  // Handle voice result function - defined before hook
  const handleVoiceResultRef = useRef<((text: string) => void) | null>(null)
  
  // Process contact response function - defined before hook
  const processContactResponseRef = useRef<((text: string) => Promise<void>) | null>(null)

  // ElevenLabs voice
  const { 
    speak, 
    stop: stopSpeaking,
    isSpeaking,
    isListening,
    toggleListening,
    transcript,
    isLoading: isVoiceLoading
  } = useElevenLabsVoice({
    onSpeechStart: () => console.log("Speaking started"),
    onSpeechEnd: () => {
      if (stage === "in_call" && !isListening) {
        // After speaking, start listening for contact response
        setTimeout(() => toggleListening(), 500)
      }
    },
    onTranscript: (text: string) => {
      if (handleVoiceResultRef.current) {
        handleVoiceResultRef.current(text)
      }
    },
    onError: (error) => console.error("Voice error:", error),
  })

  // Process contact response function
  useEffect(() => {
    processContactResponseRef.current = async (contactInput: string) => {
      if (!callContext) return

      try {
        const response = await fetch("/api/voice-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "conversation",
            context: callContext,
            conversationHistory: conversation,
            userInput: contactInput,
            userId
          })
        })

        const result = await response.json()
        
        if (result.success && result.speak) {
          // Add agent's reply to conversation
          const agentMessage: ConversationMessage = {
            id: (Date.now() + 1).toString(),
            content: result.speak,
            role: "agent",
            timestamp: new Date()
          }
          
          setConversation(prev => [...prev, agentMessage])
          
          // Speak the response
          if (speak) {
            await speak(result.speak)
          }
        }
      } catch (error) {
        console.error("Error processing contact response:", error)
      }
    }
  }, [callContext, conversation, userId, speak])

  // Define handleVoiceResult
  useEffect(() => {
    handleVoiceResultRef.current = (transcribedText: string) => {
      if (!transcribedText.trim() || stage !== "in_call") return
      
      // Add contact's response to conversation
      const contactMessage: ConversationMessage = {
        id: Date.now().toString(),
        content: transcribedText,
        role: "contact",
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, contactMessage])
      
      // Process response and generate agent reply
      if (processContactResponseRef.current) {
        processContactResponseRef.current(transcribedText)
      }
    }
  }, [stage])

  // Load contacts
  useEffect(() => {
    loadContacts()
    loadUserProfile()
  }, [userId])

  async function loadContacts() {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      
      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to get user metadata or use defaults
        setUserProfile({
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          role: user.user_metadata?.role || "",
          organization: user.user_metadata?.organization || ""
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }


  async function generateCallPrompt() {
    // Check if we have a contact or manual phone number
    const hasPhoneNumber = useManualPhone ? manualPhoneNumber.trim() : (selectedContact?.phone)
    const contactName = useManualPhone ? manualContactName : selectedContact?.name
    const contactCompany = selectedContact?.company || null
    const contactPosition = selectedContact?.position || null
    
    if (!hasPhoneNumber || !callGoal || !desiredOutcome) {
      alert("Please fill in all required fields: Phone Number (or select contact), Call Goal, and Desired Outcome")
      return
    }

    setIsGeneratingPrompt(true)

    try {
      const context: CallContext = {
        user_profile: {
          name: userProfile.name,
          role: userProfile.role,
          organization: userProfile.organization,
          short_background: "",
          goals: []
        },
        contact: {
          id: useManualPhone ? `manual_${Date.now()}` : (selectedContact?.id || ""),
          name: contactName || "Unknown Contact",
          company: contactCompany || null,
          title: contactPosition || null,
          phone: useManualPhone ? manualPhoneNumber.trim() : (selectedContact?.phone || null),
          email: useManualPhone ? null : (selectedContact?.email || null),
          notes_from_card_scan: useManualPhone ? null : (selectedContact?.notes || null)
        },
        call_goal: {
          type: callGoal as any || "general",
          desired_outcome: desiredOutcome,
          priority_questions: [],
          constraints: ""
        },
        topic_mode: topicMode ? {
          topic: topicMode,
          tone: "professional",
          boundaries: [],
          must_mention: [],
          must_avoid: []
        } : undefined
      }

      setCallContext(context)

      const response = await fetch("/api/voice-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_call_prompt",
          context,
          userId
        })
      })

      const result = await response.json()
      
      console.log("Call prompt generation result:", result)
      
      if (!response.ok) {
        const errorMsg = result.error || "Failed to generate call prompt"
        console.error("Call prompt generation failed:", errorMsg)
        alert(`Failed to generate call prompt: ${errorMsg}`)
        return
      }
      
      if (result.success && result.prompt) {
        setGeneratedPrompt(result.prompt)
        setStage("ready")
        console.log("Call prompt generated successfully, stage set to ready")
      } else {
        console.error("Invalid response from call prompt API:", result)
        alert("Failed to generate call prompt. Invalid response from server.")
      }
    } catch (error) {
      console.error("Error generating call prompt:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to generate call prompt: ${errorMsg}`)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  async function startCall() {
    const phoneNumber = useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone
    
    console.log("startCall called:", { 
      phoneNumber, 
      useManualPhone, 
      manualPhoneNumber, 
      selectedContact: selectedContact?.name,
      hasPrompt: !!generatedPrompt,
      hasContext: !!callContext,
      stage
    })
    
    if (!phoneNumber) {
      alert("Please provide a phone number (either select a contact with phone number or enter one manually)")
      return
    }
    
    // If no context or prompt, create a minimal context for the call
    if (!callContext) {
      const contactName = useManualPhone ? manualContactName : selectedContact?.name
      const minimalContext: CallContext = {
        user_profile: {
          name: userProfile.name || "User",
          role: userProfile.role || "",
          organization: userProfile.organization || "",
          short_background: "",
          goals: []
        },
        contact: {
          id: useManualPhone ? `manual_${Date.now()}` : (selectedContact?.id || ""),
          name: contactName || "Unknown Contact",
          company: selectedContact?.company || null,
          title: selectedContact?.position || null,
          phone: phoneNumber,
          email: selectedContact?.email || null,
          notes_from_card_scan: selectedContact?.notes || null
        },
        call_goal: {
          type: (callGoal || "general") as "general" | "networking" | "partnership" | "fundraising" | "hiring" | "product_demo" | "mentorship",
          desired_outcome: desiredOutcome || "Network and build relationship",
          priority_questions: [],
          constraints: ""
        },
        topic_mode: topicMode ? {
          topic: topicMode,
          tone: "professional",
          boundaries: [],
          must_mention: [],
          must_avoid: []
        } : undefined
      }
      setCallContext(minimalContext)
    }

    setIsInitiatingCall(true)
    setStage("calling")
    
    try {
      // Initiate phone call via ElevenLabs telephony
      const response = await fetch("/api/elevenlabs-telephony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          userId,
          context: callContext,
          customPrompt: customPrompt || undefined // Only send if user provided one
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate call")
      }

      if (result.success && result.callId) {
        setCallId(result.callId)
        setCallStatus(result.status || "calling")
        
        // Add opening message to conversation
        const openingMessage: ConversationMessage = {
          id: Date.now().toString(),
          content: generatedPrompt?.opening_line || "Hello, this is a networking call.",
          role: "agent",
          timestamp: new Date()
        }
        
        setConversation([openingMessage])
        setStage("in_call")
        
        // Start polling for call status
        pollCallStatus(result.callId)
      } else {
        throw new Error("Call initiated but no call ID received")
      }
    } catch (error) {
      console.error("Error initiating call:", error)
      alert(`Failed to initiate call: ${error instanceof Error ? error.message : "Unknown error"}`)
      setStage("ready")
    } finally {
      setIsInitiatingCall(false)
    }
  }

  async function pollCallStatus(callId: string) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/elevenlabs-telephony?callId=${callId}`)
        const result = await response.json()
        
        if (result.status) {
          setCallStatus(result.status)
          
          // If call ended, stop polling
          if (result.status === "ended" || result.status === "completed" || result.status === "failed") {
            clearInterval(interval)
            if (result.status === "completed" || result.status === "ended") {
              // Get conversation transcript if available
              if (result.transcript) {
                // Process transcript and update conversation
                // This would depend on ElevenLabs API response format
              }
            }
          }
        }
      } catch (error) {
        console.error("Error polling call status:", error)
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds

    // Store interval ID for cleanup
    return () => clearInterval(interval)
  }

  async function endCall() {
    if (isListening) toggleListening()
    if (isSpeaking) stopSpeaking()
    
    setStage("ended")
    
    // Generate call outcome
    if (callContext && conversation.length > 0) {
      try {
        const response = await fetch("/api/voice-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end_call",
            context: callContext,
            conversationHistory: conversation,
            userId
          })
        })

        const result = await response.json()
        
        if (result.success && result.outcome) {
          setCallOutcome(result.outcome)
          setStage("review")
        }
      } catch (error) {
        console.error("Error generating call outcome:", error)
        setStage("review")
      }
    } else {
      setStage("review")
    }
  }

  function resetCall() {
    console.log("Resetting call - going back to preparation stage")
    setStage("preparation")
    setConversation([])
    setCallOutcome(null)
    setGeneratedPrompt(null)
    setCallContext(null)
    // Keep phone number and contact selection when resetting
  }

  if (stage === "preparation") {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Phone className="w-6 h-6 text-violet-400" />
              Prepare Networking Call
            </h2>
            <p className="text-slate-400">Set up your call context and generate a call plan</p>
          </div>

          <div className="space-y-6">
            {/* Contact Selection or Manual Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white block">Contact / Phone Number *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseManualPhone(!useManualPhone)
                    if (useManualPhone) {
                      setManualPhoneNumber("")
                      setManualContactName("")
                    } else {
                      setSelectedContact(null)
                    }
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  {useManualPhone ? "Use Contact List" : "Enter Phone Number"}
                </Button>
              </div>

              {useManualPhone ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-slate-400 mb-1 block">Contact Name (Optional)</Label>
                    <Input
                      value={manualContactName}
                      onChange={(e) => setManualContactName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-slate-800 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-400 mb-1 block">Phone Number *</Label>
                    <Input
                      value={manualPhoneNumber}
                      onChange={(e) => setManualPhoneNumber(e.target.value)}
                      placeholder="+1234567890 or 08072497474"
                      className="bg-slate-800 border-white/10 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter phone number with country code (e.g., +44 807 249 7474)
                    </p>
                  </div>
                  {manualPhoneNumber && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Phone className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-400 font-mono">{manualPhoneNumber}</span>
                      </div>
                      {manualContactName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-4 h-4" />
                          <span>{manualContactName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {isLoadingContacts ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading contacts...
                    </div>
                  ) : (
                    <select
                      value={selectedContact?.id || ""}
                      onChange={(e) => {
                        const contact = contacts.find(c => c.id === e.target.value)
                        setSelectedContact(contact || null)
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                    >
                      <option value="">Select a contact...</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} {contact.company ? `- ${contact.company}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
              {!useManualPhone && selectedContact && (
                <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <User className="w-4 h-4" />
                    <span>{selectedContact.name}</span>
                    {selectedContact.position && (
                      <>
                        <Briefcase className="w-4 h-4 ml-2" />
                        <span>{selectedContact.position}</span>
                      </>
                    )}
                    {selectedContact.company && (
                      <>
                        <Building2 className="w-4 h-4 ml-2" />
                        <span>{selectedContact.company}</span>
                      </>
                    )}
                  </div>
                  {selectedContact.phone && (
                    <p className="mt-2 text-xs text-violet-400">
                      📞 {selectedContact.phone}
                    </p>
                  )}
                  {!selectedContact.phone && (
                    <p className="mt-2 text-xs text-yellow-400">
                      ⚠️ No phone number available
                    </p>
                  )}
                  {selectedContact.notes && (
                    <p className="mt-2 text-xs text-slate-400">{selectedContact.notes}</p>
                  )}
                </div>
              )}
              
              {/* Test Call Button for specific number */}
              <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Test Call</p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/elevenlabs-telephony/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phoneNumber: "08072497474" })
                      })
                      const result = await response.json()
                      if (result.success) {
                        alert(`✅ Call initiated to ${result.phoneNumber}!\nCall ID: ${result.callId}\nStatus: ${result.status}`)
                      } else {
                        // Show formatted instructions
                        const message = result.error 
                          ? `${result.error}\n\n${result.instructions?.join('\n') || result.details || ''}`
                          : JSON.stringify(result, null, 2)
                        alert(message)
                      }
                    } catch (error) {
                      alert(`❌ Test call error: ${error instanceof Error ? error.message : "Unknown error"}`)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
                >
                  <Phone className="w-3 h-3 mr-2" />
                  Test Call: 08072497474
                </Button>
              </div>
            </div>

            {/* User Profile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white mb-2 block">Your Name *</Label>
                <Input
                  value={userProfile.name}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Your Role</Label>
                <Input
                  value={userProfile.role}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="CEO"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Organization</Label>
                <Input
                  value={userProfile.organization}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Acme Inc"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Call Goal */}
            <div>
              <Label className="text-white mb-2 block">Call Goal Type</Label>
              <select
                value={callGoal}
                onChange={(e) => setCallGoal(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select goal type...</option>
                <option value="networking">Networking</option>
                <option value="partnership">Partnership</option>
                <option value="fundraising">Fundraising</option>
                <option value="hiring">Hiring</option>
                <option value="product_demo">Product Demo</option>
                <option value="mentorship">Mentorship</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Desired Outcome */}
            <div>
              <Label className="text-white mb-2 block">Desired Outcome *</Label>
              <Textarea
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="What do you want to achieve from this call? (e.g., Schedule a follow-up meeting, explore partnership opportunities, etc.)"
                className="bg-slate-800 border-white/10 text-white min-h-[100px]"
              />
            </div>

            {/* Topic Mode (Optional) */}
            <div>
              <Label className="text-white mb-2 block">Topic Focus (Optional)</Label>
              <Input
                value={topicMode}
                onChange={(e) => setTopicMode(e.target.value)}
                placeholder="Specific topic to focus on (e.g., fundraising, partnership discussion)"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>

            {/* Custom Agent Prompt (Optional) */}
            <div>
              <Label className="text-white mb-2 block">Custom Agent Instructions (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom instructions for the AI agent (e.g., 'Be very enthusiastic about our new product launch' or 'Focus on understanding their current challenges')"
                className="bg-slate-800 border-white/10 text-white min-h-[100px]"
              />
              <p className="text-xs text-slate-400 mt-1">
                Leave blank to use the generated call plan, or provide specific instructions for how the agent should behave during the call.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={generateCallPrompt}
                disabled={
                  isGeneratingPrompt || 
                  !(useManualPhone ? manualPhoneNumber.trim() : selectedContact) || 
                  !desiredOutcome || 
                  !userProfile.name
                }
                variant="outline"
                className="flex-1 border-white/10"
              >
                {isGeneratingPrompt ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
              
              <Button
                onClick={async () => {
                  const phoneNum = useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone
                  if (!phoneNum) {
                    alert("Please provide a phone number (either select a contact with phone number or enter one manually)")
                    return
                  }
                  // Set stage to ready and call directly
                  setStage("ready")
                  // Small delay to ensure state update, then start call
                  setTimeout(() => startCall(), 100)
                }}
                disabled={
                  isInitiatingCall ||
                  !(useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone)
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show ready stage with call plan OR allow direct call without plan
  if (stage === "ready") {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-6">
            {generatedPrompt ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Call Plan Ready</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Opening Line</h3>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{generatedPrompt.opening_line}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Key Talking Points</h3>
                <ul className="space-y-2">
                  {generatedPrompt.key_talking_points.map((point, idx) => (
                    <li key={idx} className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Smart Questions</h3>
                <ul className="space-y-2">
                  {generatedPrompt.smart_questions.map((question, idx) => (
                    <li key={idx} className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Objection Handling</h3>
                <div className="space-y-2">
                  {generatedPrompt.objection_handling.map((obj, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded-lg">
                      <p className="text-red-400 text-sm font-medium">Objection: {obj.objection}</p>
                      <p className="text-slate-300 mt-1">Reply: {obj.reply}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Closing Line</h3>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{generatedPrompt.closing_line}</p>
              </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={resetCall}
                    variant="outline"
                    className="flex-1 border-white/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Edit Plan
                  </Button>
                  <Button
                    onClick={() => {
                      const phoneNum = useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone
                      console.log("Call button clicked", { 
                        useManualPhone, 
                        manualPhoneNumber, 
                        selectedContact: selectedContact?.phone,
                        phoneNumber: phoneNum,
                        hasPrompt: !!generatedPrompt,
                        hasContext: !!callContext
                      })
                      startCall()
                    }}
                    disabled={isInitiatingCall}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50"
                  >
                    {isInitiatingCall ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Call {useManualPhone ? (manualPhoneNumber.trim() || "Number") : (selectedContact?.phone || selectedContact?.name || "Contact")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Call</h2>
                <p className="text-slate-400 mb-4">You can make a call directly.</p>
                
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      const phoneNum = useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone
                      console.log("Direct call button clicked", { phoneNum })
                      startCall()
                    }}
                    disabled={isInitiatingCall}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50"
                  >
                    {isInitiatingCall ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Call {useManualPhone ? (manualPhoneNumber.trim() || "Number") : (selectedContact?.phone || selectedContact?.name || "Contact")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {!(useManualPhone ? manualPhoneNumber.trim() : selectedContact?.phone) && (
              <p className="text-yellow-400 text-sm mt-2 text-center">
                ⚠️ Please provide a phone number (either select a contact with phone number or enter one manually).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stage === "calling" || stage === "in_call") {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
            >
              <Phone className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Call in Progress</h2>
            <p className="text-slate-400">
              {useManualPhone ? manualContactName || "Manual Contact" : selectedContact?.name} 
              {!useManualPhone && selectedContact?.company ? ` at ${selectedContact.company}` : ""}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {useManualPhone ? manualPhoneNumber : selectedContact?.phone}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? "bg-green-500" : isListening ? "bg-red-500" : "bg-slate-500"}`} />
              <span className="text-sm text-slate-400">
                {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Processing..."}
              </span>
            </div>
          </div>

          {/* Conversation */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "agent"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-white/5"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {transcript && isListening && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 max-w-[80%]">
                  <p className="text-sm text-slate-400 italic">"{transcript}"</p>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={endCall}
            className="w-full bg-red-600 hover:bg-red-500"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (stage === "review" && callOutcome) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Call Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-violet-400 mb-2">Summary</h3>
              <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{callOutcome.call_summary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-violet-400 mb-2">Lead Quality</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                callOutcome.lead_quality === "high" ? "bg-green-500/20 text-green-400" :
                callOutcome.lead_quality === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {callOutcome.lead_quality.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-violet-400 mb-2">Next Step</h3>
              <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{callOutcome.next_step}</p>
              {callOutcome.next_step_date && (
                <p className="text-sm text-slate-400 mt-2">Date: {callOutcome.next_step_date}</p>
              )}
            </div>

            {callOutcome.objections && callOutcome.objections.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Objections</h3>
                <ul className="space-y-2">
                  {callOutcome.objections.map((obj, idx) => (
                    <li key={idx} className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {callOutcome.personal_notes && (
              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Personal Notes</h3>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg">{callOutcome.personal_notes}</p>
              </div>
            )}

            {callOutcome.follow_up_message_draft && (
              <div>
                <h3 className="text-lg font-semibold text-violet-400 mb-2">Follow-up Email Draft</h3>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg whitespace-pre-wrap">
                  {callOutcome.follow_up_message_draft}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={resetCall}
              variant="outline"
              className="flex-1 border-white/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              New Call
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

