"use client"

import { useState, useCallback, useRef } from "react"
import { useElevenLabsVoice } from "./use-elevenlabs-voice"

interface VoiceAssistantOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  autoSpeak?: boolean
  language?: string
}

/**
 * Voice Assistant Hook using ElevenLabs
 * 
 * This hook wraps useElevenLabsVoice to provide a consistent interface
 * for voice interactions across the application.
 */
export function useVoiceAssistant({
  onResult,
  onError,
  autoSpeak = true,
  language = "en-US"
}: VoiceAssistantOptions = {}) {
  const [isSupported, setIsSupported] = useState(true) // ElevenLabs is always supported if API key is configured

  const {
    speak: elevenLabsSpeak,
    stop: stopSpeaking,
    isSpeaking,
    isListening,
    startListening,
    stopListening,
    toggleListening,
    transcript,
    isLoading
  } = useElevenLabsVoice({
    onSpeechStart: () => {
      // Speech started
    },
    onSpeechEnd: () => {
      // Speech ended
    },
    onTranscript: (text: string) => {
      if (text && onResult) {
        onResult(text)
      }
    },
    onError: (error: string) => {
      onError?.(error)
    },
  })

  const speak = useCallback(async (text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    if (autoSpeak && text) {
      await elevenLabsSpeak(text)
    }
  }, [autoSpeak, elevenLabsSpeak])

  const toggle = useCallback(() => {
    toggleListening()
  }, [toggleListening])

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

