"use client"

import React from "react"

export function BackgroundPaths() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Minimal gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Subtle geometric patterns */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Minimal grid lines */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Subtle accent lines */}
        <path
          d="M0,300 Q250,200 500,300 T1000,300"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          fill="none"
          opacity="0.1"
          className="animate-pulse"
        />
        <path
          d="M0,700 Q750,600 1000,700"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          fill="none"
          opacity="0.08"
          className="animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        
        {/* Minimal floating elements */}
        <circle
          cx="150"
          cy="200"
          r="1"
          fill="hsl(var(--primary))"
          opacity="0.15"
          className="animate-pulse"
        />
        <circle
          cx="850"
          cy="400"
          r="1.5"
          fill="hsl(var(--primary))"
          opacity="0.1"
          className="animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <circle
          cx="450"
          cy="800"
          r="1"
          fill="hsl(var(--primary))"
          opacity="0.12"
          className="animate-pulse"
          style={{ animationDelay: "3s" }}
        />
      </svg>
    </div>
  )
}
