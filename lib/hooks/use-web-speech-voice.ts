"use client"

import { useState, useCallback, useRef } from "react"

interface VoiceOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  voice?: string // Voice name for TTS (e.g., "Google UK English Female")
  lang?: string // Language code (e.g., "en-GB", "en-US")
}

/**
 * Web Speech API Voice Hook
 * 
 * Uses browser's built-in Web Speech API for:
 * - Text-to-Speech (TTS) via SpeechSynthesis
 * - Speech-to-Text (STT) via SpeechRecognition
 * 
 * No external API keys required - works entirely in the browser.
 */
export function useWebSpeechVoice({
  onSpeechStart,
  onSpeechEnd,
  onTranscript,
  onError,
  voice,
  lang = "en-US",
}: VoiceOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if Web Speech API is available
  const isSupported = typeof window !== "undefined" && 
    ("speechSynthesis" in window) && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // Text-to-Speech using Web Speech API
  const speak = useCallback(async (text: string) => {
    if (!text || isLoading || !isSupported) {
      if (!isSupported) {
        onError?.("Web Speech API not supported in this browser")
      }
      return
    }

    // Stop any current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    setIsLoading(true)

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      // Set voice if specified
      if (voice) {
        const voices = window.speechSynthesis.getVoices()
        const selectedVoice = voices.find(v => v.name.includes(voice))
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.lang = lang
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsLoading(false)
        onSpeechStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
        onSpeechEnd?.()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        setIsLoading(false)
        onError?.(`Speech synthesis error: ${event.error}`)
      }

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("TTS error:", error)
      setIsLoading(false)
      onError?.(error instanceof Error ? error.message : "Failed to speak")
    }
  }, [isLoading, voice, lang, onSpeechStart, onSpeechEnd, onError, isSupported])

  // Speech-to-Text using Web Speech API
  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      if (!isSupported) {
        onError?.("Web Speech API not supported in this browser")
      }
      return
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = lang

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript("")
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcriptText = event.results[0][0].transcript
        setTranscript(transcriptText)
        onTranscript?.(transcriptText)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        
        let errorMessage = "Speech recognition error"
        if (event.error === "no-speech") {
          errorMessage = "No speech detected"
        } else if (event.error === "audio-capture") {
          errorMessage = "No microphone found"
        } else if (event.error === "not-allowed") {
          errorMessage = "Microphone permission denied"
        }
        
        onError?.(errorMessage)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      setIsListening(false)
      onError?.(error instanceof Error ? error.message : "Failed to start listening")
    }
  }, [isListening, lang, onTranscript, onError, isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const stop = useCallback(() => {
    // Stop TTS
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    
    // Stop STT
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setIsLoading(false)
  }, [isListening])

  return {
    // TTS
    speak,
    stop,
    isSpeaking,
    // STT
    startListening,
    stopListening,
    toggleListening,
    isListening,
    transcript,
    // Common
    isLoading,
    isSupported,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

// Speech Recognition types (for browsers that support it)
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
