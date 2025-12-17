"use client"

import { useState, useCallback, useRef } from "react"

interface ElevenLabsVoiceOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onError?: (error: string) => void
  voiceId?: string
}

export function useElevenLabsVoice({
  onSpeechStart,
  onSpeechEnd,
  onError,
  voiceId = "21m00Tcm4TlvDq8ikWAM", // Rachel - default
}: ElevenLabsVoiceOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text || isLoading) return

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/elevenlabs-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      })

      if (!response.ok) {
        // Fallback to browser TTS if ElevenLabs fails
        console.warn("ElevenLabs TTS failed, falling back to browser TTS")
        fallbackSpeak(text)
        return
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsSpeaking(true)
        setIsLoading(false)
        onSpeechStart?.()
      }

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        onSpeechEnd?.()
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setIsLoading(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        // Fallback to browser TTS
        fallbackSpeak(text)
      }

      await audio.play()
    } catch (error) {
      console.error("ElevenLabs TTS error:", error)
      setIsLoading(false)
      // Fallback to browser TTS
      fallbackSpeak(text)
    }
  }, [isLoading, voiceId, onSpeechStart, onSpeechEnd])

  const fallbackSpeak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      onError?.("Text-to-speech not supported")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsLoading(false)
      onSpeechStart?.()
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      onSpeechEnd?.()
    }

    window.speechSynthesis.speak(utterance)
  }, [onSpeechStart, onSpeechEnd, onError])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
  }
}

// Voice IDs for different personalities
export const ELEVENLABS_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM", // Warm, conversational female
  adam: "pNInz6obpgDQGcFmaJgB", // Deep, authoritative male
  antoni: "ErXwobaYiN019PkySvjV", // Warm, friendly male
  bella: "EXAVITQu4vr4xnSDxMaL", // Soft, gentle female
  elli: "MF3mGyEYCl7XYWbV9V6O", // Young, energetic female
  josh: "TxGEqnHWrfWFTfGW9XjX", // Deep, narrative male
  sam: "yoZ06aMxZJJ28mfd3POQ", // Raspy, authentic male
} as const

