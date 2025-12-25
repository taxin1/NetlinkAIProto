"use client"

import { useState, useCallback, useRef } from "react"

interface VoiceOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  voiceId?: string
}

export function useElevenLabsVoice({
  onSpeechStart,
  onSpeechEnd,
  onTranscript,
  onError,
  voiceId = "21m00Tcm4TlvDq8ikWAM",
}: VoiceOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Browser TTS fallback
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

  // Text-to-Speech - tries API first, falls back to browser
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

      // Check if response is JSON (browser fallback signal)
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const json = await response.json()
        if (json.useBrowserTTS) {
          fallbackSpeak(text)
          return
        }
      }

      if (!response.ok) {
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
        fallbackSpeak(text)
      }

      await audio.play()
    } catch (error) {
      console.error("TTS error:", error)
      setIsLoading(false)
      fallbackSpeak(text)
    }
  }, [isLoading, voiceId, onSpeechStart, onSpeechEnd, fallbackSpeak])

  // Speech-to-Text transcription function
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true)
    
    try {
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("No audio data recorded")
      }

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")

      const response = await fetch("/api/elevenlabs-stt", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Transcription failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const transcribedText = result.text || ""
      
      setTranscript(transcribedText)
      onTranscript?.(transcribedText)
    } catch (error) {
      console.error("Transcription error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio"
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [onTranscript, onError])

  // Speech-to-Text using Gemini 2.0 Flash
  const startListening = useCallback(async () => {
    if (isListening) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        
        // Send to transcription API
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsListening(true)
      setTranscript("")
    } catch (error) {
      console.error("Error starting recording:", error)
      onError?.("Failed to access microphone")
    }
  }, [isListening, onError, transcribeAudio])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
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
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    
    // Stop STT
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
  }
}

// Voice IDs for different personalities (kept for compatibility)
export const ELEVENLABS_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  adam: "pNInz6obpgDQGcFmaJgB",
  antoni: "ErXwobaYiN019PkySvjV",
  bella: "EXAVITQu4vr4xnSDxMaL",
  elli: "MF3mGyEYCl7XYWbV9V6O",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  sam: "yoZ06aMxZJJ28mfd3POQ",
} as const
