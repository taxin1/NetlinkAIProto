"use client"

import { useEffect, useState } from "react"
import { Network } from "lucide-react"

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate random network dots
    const newDots = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }))
    setDots(newDots)

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Animated network background */}
      <div className="absolute inset-0">
        {/* Network nodes */}
        {dots.map((dot) => (
          <div
            key={dot.id}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              animationDelay: `${dot.delay}s`,
              boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
            }}
          />
        ))}
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {dots.slice(0, 15).map((dot, i) => {
            const nextDot = dots[(i + 3) % dots.length]
            return (
              <line
                key={`line-${dot.id}`}
                x1={`${dot.x}%`}
                y1={`${dot.y}%`}
                x2={`${nextDot.x}%`}
                y2={`${nextDot.y}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: `${dot.delay}s` }}
              />
            )
          })}
        </svg>

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* Logo animation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 animate-ping">
            <Network className="h-20 w-20 text-cyan-400 opacity-20 mx-auto" />
          </div>
          <Network className="h-20 w-20 text-cyan-400 mx-auto relative z-10 animate-pulse" />
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Netlink-Cogni
        </h1>
        <p className="text-cyan-200 text-lg mb-8">AI-Powered Networking Platform</p>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto mb-4">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-cyan-300 text-sm font-mono">
          {progress < 30 && "Initializing AI systems..."}
          {progress >= 30 && progress < 60 && "Connecting neural networks..."}
          {progress >= 60 && progress < 90 && "Loading intelligent agents..."}
          {progress >= 90 && "Ready to launch!"}
        </div>

        {/* Percentage */}
        <div className="text-2xl font-bold text-cyan-400 mt-4 font-mono">{progress}%</div>
      </div>

      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
    </div>
  )
}
