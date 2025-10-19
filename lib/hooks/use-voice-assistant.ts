"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface VoiceAssistantOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  autoSpeak?: boolean
  language?: string
}

export function useVoiceAssistant({
  onResult,
  onError,
  autoSpeak = true,
  language = "en-US"
}: VoiceAssistantOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setIsSupported(supported)

    if (supported) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = language

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript
        setTranscript(transcriptText)

        if (event.results[current].isFinal) {
          onResult?.(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        onError?.(event.error)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [language, onResult, onError])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      onError?.("Speech recognition not supported in this browser")
      return
    }

    try {
      // Stop any ongoing speech synthesis
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }

      setTranscript("")
      setIsListening(true)
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting recognition:", error)
      setIsListening(false)
    }
  }, [isSupported, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    if (!('speechSynthesis' in window)) {
      onError?.("Text-to-speech not supported in this browser")
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = options?.rate || 1.0
      utterance.pitch = options?.pitch || 1.0
      utterance.volume = options?.volume || 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        synthesisRef.current = null
        resolve()
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
        synthesisRef.current = null
        onError?.("Failed to speak")
        resolve()
      }

      synthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    })
  }, [language, onError])

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const toggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggle
  }
}

