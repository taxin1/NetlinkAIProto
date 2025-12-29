# ElevenLabs useConversation Hook - Usage Guide

The `useConversation` hook from `@elevenlabs/react` requires configuration options. Here's how to use it properly:

## Basic Usage

\`\`\`typescript
import { useConversation } from '@elevenlabs/react';

function MyComponent() {
  // Initialize the hook with callbacks
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to conversation');
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      // Handle incoming messages (user transcriptions and agent replies)
    },
    onError: (error) => {
      console.error('Conversation error:', error);
    },
    onModeChange: (mode) => {
      console.log('Mode changed:', mode); // 'speaking', 'listening', etc.
    },
  });

  // To start a conversation session
  const handleStart = async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start with a public agent ID
      await conversation.startSession({
        agentId: 'your-agent-id-here'
      });
      
      // OR start with a conversation token (for private agents)
      // const tokenResponse = await fetch('/api/conversation-token');
      // const { conversationToken } = await tokenResponse.json();
      // await conversation.startSession({ conversationToken });
      
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // To end the conversation
  const handleEnd = async () => {
    await conversation.endSession();
  };

  // To send a message (for text-only mode)
  const handleSendMessage = async (text: string) => {
    await conversation.sendMessage(text);
  };

  // To interrupt the agent
  const handleInterrupt = () => {
    conversation.interrupt();
  };

  return (
    <div>
      <button onClick={handleStart}>Start Conversation</button>
      <button onClick={handleEnd}>End Conversation</button>
      <button onClick={handleInterrupt}>Interrupt</button>
    </div>
  );
}
\`\`\`

## Complete Example with State Management

\`\`\`typescript
"use client"

import { useConversation } from '@elevenlabs/react';
import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ConversationComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      setError(null);
    },
    onDisconnect: () => {
      setIsConnected(false);
      setIsSessionActive(false);
    },
    onMessage: (message) => {
      setMessages(prev => [...prev, {
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content || message.text || '',
        timestamp: new Date(),
      }]);
    },
    onError: (error) => {
      setError(error.message || 'An error occurred');
      setIsConnected(false);
      setIsSessionActive(false);
    },
    onModeChange: (mode) => {
      console.log('Conversation mode:', mode);
    },
  });

  const startSession = async () => {
    try {
      // Get microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use your agent ID from environment or configuration
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'your-agent-id';
      
      await conversation.startSession({ agentId });
      setIsSessionActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  };

  const endSession = async () => {
    await conversation.endSession();
    setIsSessionActive(false);
    setMessages([]);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      <div>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
        {isSessionActive && ' - Session Active'}
      </div>

      {!isSessionActive ? (
        <button onClick={startSession}>Start Conversation</button>
      ) : (
        <button onClick={endSession}>End Conversation</button>
      )}

      <div>
        <h3>Messages:</h3>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

## Configuration Options

The `useConversation` hook accepts these options:

### Callbacks:
- `onConnect`: Called when WebSocket connection is established
- `onDisconnect`: Called when connection is terminated
- `onMessage`: Handles incoming messages
- `onError`: Handles errors
- `onAudio`: Handles incoming audio data (optional)
- `onModeChange`: Called when conversation mode changes
- `onStatusChange`: Called when connection status changes

### Other Options:
- `serverLocation`: `'us'` | `'eu-residency'` | `'in-residency'` | `'global'` (default: `'us'`)
- `textOnly`: `boolean` - Set to `true` for text-only conversations
- `overrides`: Object to override default settings (prompts, language, etc.)
- `clientTools`: Define client-side functions the agent can invoke

## Getting an Agent ID

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create or select an agent
3. Copy the Agent ID
4. Add it to your `.env.local`:

\`\`\`env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
\`\`\`

## Notes

- The hook requires microphone access for voice conversations
- For private agents, you'll need to obtain a `conversationToken` from your backend
- The conversation uses WebRTC for real-time audio streaming
- Make sure your ElevenLabs API key is configured (already set up in your codebase)
