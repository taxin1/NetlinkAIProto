"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, Loader2, Sparkles, FileText, DollarSign, BrainCircuit, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function QuotationFormPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    projectBudget: "",
    clientNeeds: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Free Web Speech API State
  const [isListening, setIsListening] = useState(false)
  const [rawTranscript, setRawTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize SpeechRecognition on component mount
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }

          if (finalTranscript) {
            setRawTranscript(prev => prev ? prev + " " + finalTranscript : finalTranscript)
            setFormData(prev => ({
              ...prev,
              clientNeeds: prev.clientNeeds ? prev.clientNeeds + " " + finalTranscript : finalTranscript
            }))
            toast.success("Voice transcribed and added!")
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
          toast.error(`Voice error: ${event.error}`)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      } else {
        toast.error("Speech recognition not supported in this browser.")
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!recognitionRef.current) {
        toast.error("Speech recognition is not supported in this browser.")
        return
      }
      setRawTranscript("") // clear previous per session, or keep it? We are appending above.
      recognitionRef.current.start()
      setIsListening(true)
      toast.info("Listening... Speak your requirements.")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    if (!formData.projectName || !formData.clientNeeds) {
      toast.error("Please provide at least a project name and your requirements.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rawTranscript
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast.success("Quotation request sent to cognisor.ai@gmail.com!")
      } else {
        throw new Error(data.error || "Failed to send quotation")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative z-10 flex flex-col items-center text-center max-w-md"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Request Sent Successfully!</h1>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Thank you for sharing your project details. We have forwarded your requirements to <span className="text-emerald-400 font-medium">cognisor.ai@gmail.com</span> and our team will get back to you shortly with a tailored quotation.
          </p>
          <Button 
            onClick={() => {
              setIsSubmitted(false)
              setFormData({ projectName: "", projectBudget: "", clientNeeds: "" })
              setRawTranscript("")
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          >
            Submit Another Request
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 shadow-inner backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
          <span className="text-sm font-medium text-blue-300">AI-Powered Quotation</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight"
        >
          Project Requirements
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl"
        >
          Tell us about your project. You can type out the details or use our <span className="text-cyan-400 font-medium">Voice AI Assistant</span> to simply explain what you need.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-7 space-y-6"
        >
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="projectName" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <Input 
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="e.g., E-commerce Website Revamp"
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="projectBudget" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Estimated Budget (Optional)
                  </label>
                  <Input 
                    id="projectBudget"
                    name="projectBudget"
                    value={formData.projectBudget}
                    onChange={handleChange}
                    placeholder="e.g., $5,000 - $10,000"
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-12"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label htmlFor="clientNeeds" className="text-sm font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-purple-400" />
                      Client Needs & Requirements <span className="text-red-400">*</span>
                    </span>
                    {isListening && (
                      <span className="text-xs text-red-400 animate-pulse font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Listening...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Textarea 
                      id="clientNeeds"
                      name="clientNeeds"
                      value={formData.clientNeeds}
                      onChange={handleChange}
                      placeholder="Describe what you want to achieve, features needed, target audience, etc..."
                      className={`bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 min-h-[200px] resize-y p-4 transition-all duration-300 ${isListening ? 'ring-2 ring-red-500/50 border-red-500/50' : 'focus-visible:ring-purple-500'}`}
                      required
                    />
                    
                    {/* Pulsing effect when listening */}
                    {isListening && (
                      <div className="absolute inset-0 pointer-events-none rounded-md overflow-hidden">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-red-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isListening}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-lg rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending Request...</>
                  ) : (
                    <><Send className="w-5 h-5 mr-2" /> Send to cognisor.ai</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Voice AI Interaction */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 relative"
        >
          {/* Decorative background for the voice widget */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-transparent rounded-3xl blur-xl" />
          
          <Card className="bg-slate-900/60 backdrop-blur-2xl border-slate-800/60 shadow-2xl overflow-hidden relative z-10 h-full">
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px] lg:min-h-[500px]">
              
              <div className="text-center mb-10">
                <h3 className="text-xl font-semibold text-white mb-2">Voice AI Assistant</h3>
                <p className="text-slate-400 text-sm">
                  Too much to type? Just tell us what you need. Tap the microphone and speak naturally.
                </p>
              </div>

              {/* Central Voice Button */}
              <div className="relative mb-12">
                {/* Background ripples when listening */}
                <AnimatePresence>
                  {isListening && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.5, 0], scale: [1, 2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-red-500/30"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.3, 0], scale: [1, 2.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-rose-500/20"
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Main Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  disabled={isSubmitting}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isListening
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] border-4 border-red-400/50"
                      : "bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-2 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-cyan-400" />
                  )}
                </motion.button>
              </div>

              {/* Status Text */}
              <div className="h-16 flex items-center justify-center text-center px-4 w-full">
                {isListening ? (
                  <p className="text-red-400 font-medium tracking-wide animate-pulse">
                    Listening... Speak now.
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {rawTranscript ? "Voice recorded successfully. Tap to add more." : "Tap to start recording"}
                  </p>
                )}
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

