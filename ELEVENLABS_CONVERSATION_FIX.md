# Fix for useConversation Hook Usage

## Your Current Code:
\`\`\`typescript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation();
\`\`\`

## What's Missing:

1. **Configuration options** - The hook needs callbacks and options
2. **Session initialization** - You need to call `startSession()` to begin
3. **Agent ID or Token** - Required to identify which agent to use

## Fixed Version:

\`\`\`typescript
"use client"

import { useConversation } from '@elevenlabs/react';
import { useState } from 'react';

function MyComponent() {
  const [isConnected, setIsConnected] = useState(false);

  // ✅ Initialize with callbacks
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('Message:', message);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  // ✅ Start the conversation session
  const startConversation = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start session with agent ID
      await conversation.startSession({
        agentId: 'your-agent-id-here'
      });
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  return (
    <button onClick={startConversation}>
      Start Conversation
    </button>
  );
}
\`\`\`

## Quick Fix for Your Code:

Replace your current code with:

\`\`\`typescript
import { useConversation } from '@elevenlabs/react';

function YourComponent() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (msg) => console.log('Message:', msg),
    onError: (err) => console.error('Error:', err),
  });

  // Then somewhere in your code, start the session:
  const handleStart = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await conversation.startSession({
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'your-agent-id'
    });
  };
}
\`\`\`
