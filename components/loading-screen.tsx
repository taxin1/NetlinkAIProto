"use client"

import { useEffect, useState } from "react"
import { Network, Sparkles } from "lucide-react"
/* Removed unused framer-motion import */

interface LoadingScreenProps {
  onComplete?: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)

  const phases = [
    "Initializing AI systems...",
    "Connecting neural networks...",
    "Loading intelligent agents...",
    "Ready to launch!",
  ]

  useEffect(() => {
    // Smooth, natural progress animation with easing
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      // Ease out function for natural deceleration
      const remaining = 100 - currentProgress
      const increment = Math.max(1, remaining * 0.05) // Slightly faster and guaranteed finish
      currentProgress += increment

      if (currentProgress >= 100) {
        currentProgress = 100
        setProgress(100)
        setCurrentPhase(phases.length - 1)
        clearInterval(progressInterval)

        // Small delay before completing to show 100%
        setTimeout(() => {
          if (onComplete) onComplete()
        }, 500)
        return
      }

      setProgress(currentProgress)

      // Update phase based on progress
      const phaseIndex = Math.floor((currentProgress / 100) * phases.length)
      setCurrentPhase(Math.min(phaseIndex, phases.length - 1))
    }, 30)

    return () => clearInterval(progressInterval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Smooth animated background */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Smooth floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Main loading content */}
      <div className="relative z-10 text-center px-6 animate-fade-in">
        {/* Elegant animated logo */}
        <div className="mb-12 relative">
          <div className="relative inline-block">
            {/* Outer glow ring */}
            <div className="absolute inset-0 -m-6 border border-cyan-400/10 rounded-full animate-spin-slow" />

            {/* Pulsing background circle */}
            <div
              className="absolute inset-0 -m-2 bg-cyan-400/5 rounded-full animate-pulse"
              style={{ animationDuration: "3s" }}
            />

            {/* Main icon container */}
            <div className="relative p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl backdrop-blur-sm border border-cyan-400/20 shadow-xl">
              <Network className="h-20 w-20 text-cyan-400 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Brand name with smooth gradient */}
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent animate-gradient-flow">
          Netlink
        </h1>

        {/* Subtitle */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" style={{ animationDuration: "2s" }} />
          <p className="text-cyan-200/80 text-lg font-light">AI-Powered Networking Platform</p>
        </div>

        {/* Smooth animated progress bar */}
        <div className="w-80 max-w-full mx-auto mb-8">
          <div className="relative h-2.5 bg-slate-800/40 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full relative transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Smooth shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                  animation: "shimmer 2s ease-in-out infinite",
                  transform: "translateX(-100%)",
                }}
              />
              {/* Soft glow */}
              <div className="absolute inset-0 bg-cyan-400/30 blur-md" />
            </div>
          </div>
        </div>

        {/* Loading text with smooth transition */}
        <div className="text-cyan-300 text-base font-medium mb-6 min-h-[24px] transition-all duration-500 ease-in-out">
          <span key={currentPhase} className="inline-block animate-fade-in-up">
            {phases[currentPhase]}
          </span>
        </div>

        {/* Percentage with smooth counter */}
        <div className="text-4xl font-bold text-cyan-400 font-mono tracking-wider transition-all duration-300">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  )
}
