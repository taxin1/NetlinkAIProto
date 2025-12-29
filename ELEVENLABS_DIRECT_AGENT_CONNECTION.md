# Direct Agent Connection with useConversation

This guide shows you how to use the `useConversation` hook to **directly connect to an ElevenLabs agent**.

## Quick Start

\`\`\`typescript
"use client"

import { useElevenLabsConversation } from '@/lib/hooks/use-elevenlabs-conversation';

function MyComponent() {
  // Connect directly to your agent
  const {
    isConnected,
    isSessionActive,
    agentId,
    messages,
    error,
    startSession,
    endSession,
  } = useElevenLabsConversation({
    agentId: 'your-agent-id-here' // Direct agent connection
  });

  return (
    <div>
      <p>Agent ID: {agentId}</p>
      <p>Status: {isConnected ? 'Connected' : 'Not Connected'}</p>
      
      {error && <div>Error: {error}</div>}
      
      {!isSessionActive ? (
        <button onClick={() => startSession()}>
          Connect to Agent
        </button>
      ) : (
        <button onClick={endSession}>
          Disconnect from Agent
        </button>
      )}

      <div>
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

## Setup

### 1. Get Your Agent ID

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create or select an agent
3. Copy the Agent ID

### 2. Add to Environment Variables (Optional)

Add to `.env.local`:

\`\`\`env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here
\`\`\`

Then you can use the hook without passing agentId:

\`\`\`typescript
const { startSession } = useElevenLabsConversation();
// Automatically uses NEXT_PUBLIC_ELEVENLABS_AGENT_ID
\`\`\`

### 3. Use the Hook

\`\`\`typescript
// Option 1: Pass agentId directly
const { startSession } = useElevenLabsConversation({
  agentId: 'your-agent-id'
});

// Option 2: Use environment variable
const { startSession } = useElevenLabsConversation();

// Option 3: Use private agent with token
const { startSession } = useElevenLabsConversation({
  conversationToken: 'your-conversation-token'
});
\`\`\`

## How It Works

1. **Hook Initialization**: The `useConversation` hook is initialized with callbacks
2. **Agent Connection**: When you call `startSession()`, it connects directly to your agent using the `agentId`
3. **WebSocket Connection**: A WebSocket connection is established to the agent
4. **Real-time Communication**: The agent can now hear you and respond in real-time

## Connection Flow

\`\`\`
startSession() called
    ↓
Request microphone permission
    ↓
Call conversation.startSession({ agentId: 'your-agent-id' })
    ↓
WebSocket connects to ElevenLabs
    ↓
onConnect() callback fired → Agent is connected!
    ↓
You can now talk to the agent
\`\`\`

## Key Points

- ✅ **Direct Connection**: The hook connects directly to your specific agent
- ✅ **Agent ID Required**: You must provide an `agentId` or set the environment variable
- ✅ **Real-time**: Uses WebRTC/WebSocket for real-time bidirectional communication
- ✅ **Automatic**: Once connected, the agent listens and responds automatically

## Example: Full Component

\`\`\`typescript
"use client"

import { useState } from 'react';
import { useElevenLabsConversation } from '@/lib/hooks/use-elevenlabs-conversation';

export function VoiceAgentComponent() {
  const [agentId, setAgentId] = useState(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '');
  
  const {
    isConnected,
    isSessionActive,
    connectionStatus,
    messages,
    error,
    startSession,
    endSession,
    interrupt,
  } = useElevenLabsConversation({
    agentId: agentId || undefined,
  });

  return (
    <div className="p-4">
      <h2>ElevenLabs Agent Connection</h2>
      
      <div className="mb-4">
        <label>Agent ID:</label>
        <input
          type="text"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="Enter your agent ID"
          className="border p-2"
        />
      </div>

      <div className="mb-4">
        <p>Connection Status: <strong>{connectionStatus}</strong></p>
        {isConnected && <p className="text-green-500">✅ Connected to agent</p>}
        {error && <p className="text-red-500">❌ Error: {error}</p>}
      </div>

      <div className="mb-4 flex gap-2">
        {!isSessionActive ? (
          <button
            onClick={() => startSession(agentId)}
            disabled={!agentId}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Connect to Agent
          </button>
        ) : (
          <>
            <button
              onClick={endSession}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Disconnect
            </button>
            <button
              onClick={interrupt}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Interrupt Agent
            </button>
          </>
        )}
      </div>

      <div>
        <h3>Conversation:</h3>
        <div className="border p-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Start a conversation!</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <strong className={msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}>
                  {msg.role === 'user' ? 'You' : 'Agent'}:
                </strong>
                <span className="ml-2">{msg.content}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
\`\`\`

## Notes

- The agent connection happens **only when** you call `startSession()`
- Make sure microphone permissions are granted (the hook handles this)
- The connection is **direct** - no intermediate servers (besides ElevenLabs)
- Your agent must be created and published in the ElevenLabs dashboard first
