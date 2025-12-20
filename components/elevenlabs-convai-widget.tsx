"use client"

import { useEffect, createElement } from "react"
import Script from "next/script"

interface ElevenLabsConvAIWidgetProps {
  agentId: string
  className?: string
}

export function ElevenLabsConvAIWidget({ 
  agentId, 
  className = "" 
}: ElevenLabsConvAIWidgetProps) {
  useEffect(() => {
    // Ensure the script is loaded before rendering the widget
    // The script tag handles the async loading
  }, [])

  return (
    <>
      {/* Load the ElevenLabs Conversational AI widget script */}
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
        async
      />
      
      {/* Render the widget */}
      <div className={className}>
        {createElement('elevenlabs-convai', { 'agent-id': agentId })}
      </div>
    </>
  )
}


