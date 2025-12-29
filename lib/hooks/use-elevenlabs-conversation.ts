"use client"

/**
 * ElevenLabs Conversation Hook - Directly connects to an agent
 * 
 * This hook directly connects to an ElevenLabs Conversational AI agent
 * using the useConversation hook from @elevenlabs/react
 */

import { useConversation } from '@elevenlabs/react';
import { useState } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseElevenLabsConversationOptions {
  /**
   * REQUIRED: Your ElevenLabs Agent ID
   * Get this from: https://elevenlabs.io/app/conversational-ai
   * Or use environment variable: NEXT_PUBLIC_ELEVENLABS_AGENT_ID
   */
  agentId?: string;
  
  /**
   * Optional: For private agents, use a conversation token instead of agentId
   */
  conversationToken?: string;
  
  /**
   * Optional: Server location ('us', 'eu-residency', 'in-residency', 'global')
   */
  serverLocation?: 'us' | 'eu-residency' | 'in-residency' | 'global';
}

export function useElevenLabsConversation(options: UseElevenLabsConversationOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');

  // Get agent ID from options or environment
  const agentId = options.agentId || (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID : undefined);

  // Initialize the conversation hook - THIS CONNECTS DIRECTLY TO YOUR AGENT
  const conversation = useConversation({
    // Callback when connection is established - AGENT IS NOW CONNECTED
    onConnect: () => {
      console.log('✅ Connected to ElevenLabs agent');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    },

    // Callback when connection is disconnected
    onDisconnect: () => {
      console.log('❌ Disconnected from ElevenLabs agent');
      setIsConnected(false);
      setIsSessionActive(false);
      setConnectionStatus('disconnected');
    },

    // Handle incoming messages (both user transcriptions and agent replies)
    onMessage: (message: any) => {
      console.log('Message received from agent:', message);
      
      setMessages(prev => [...prev, {
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.content || message.text || '',
        timestamp: new Date(),
      }]);
    },

    // Handle errors
    onError: (error: any) => {
      console.error('Conversation error:', error);
      setError(error.message || 'An error occurred');
      setIsConnected(false);
      setIsSessionActive(false);
      setConnectionStatus('disconnected');
    },

    // Handle mode changes (speaking/listening)
    onModeChange: (mode: string) => {
      console.log('Conversation mode changed:', mode);
    },

    // Handle status changes - tracks agent connection status
    onStatusChange: (status: string) => {
      console.log('Agent connection status:', status);
      setConnectionStatus(status as 'idle' | 'connecting' | 'connected' | 'disconnected');
    },

    // Server location
    serverLocation: options.serverLocation || 'us',
  });

  /**
   * Start a conversation session - CONNECTS DIRECTLY TO YOUR AGENT
   * 
   * @param overrideAgentId - Optional agent ID override (uses options.agentId or env var by default)
   * @param overrideToken - Optional conversation token for private agents
   */
  const startSession = async (overrideAgentId?: string, overrideToken?: string) => {
    try {
      setError(null);
      setConnectionStatus('connecting');

      // Request microphone permission first (required for voice conversations)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine which agent connection method to use
      const tokenToUse = overrideToken || options.conversationToken;
      const agentIdToUse = overrideAgentId || agentId;

      if (tokenToUse) {
        // For private agents - connect using conversation token
        console.log('🔗 Connecting to private agent with conversation token...');
        await conversation.startSession({
          conversationToken: tokenToUse,
        });
      } else if (agentIdToUse) {
        // For public agents - connect directly using agent ID
        console.log(`🔗 Connecting directly to agent: ${agentIdToUse}`);
        await conversation.startSession({
          agentId: agentIdToUse,
        });
      } else {
        throw new Error(
          'Agent ID or conversation token is required. ' +
          'Provide agentId in options, or set NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable.'
        );
      }

      setIsSessionActive(true);
      console.log('✅ Session started - agent is now connected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      console.error('❌ Failed to connect to agent:', err);
      setError(errorMessage);
      setIsSessionActive(false);
      setConnectionStatus('disconnected');
    }
  };

  /**
   * End the conversation session - DISCONNECTS FROM AGENT
   */
  const endSession = async () => {
    try {
      await conversation.endSession();
      setIsSessionActive(false);
      setMessages([]);
      console.log('✅ Session ended - disconnected from agent');
    } catch (err) {
      console.error('Failed to end session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  /**
   * Send a message (for text-only mode)
   */
  const sendMessage = async (text: string) => {
    try {
      await conversation.sendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  /**
   * Interrupt the agent (stop them from speaking)
   */
  const interrupt = () => {
    conversation.interrupt();
  };

  return {
    // Connection state
    isConnected,              // true when connected to agent
    isSessionActive,          // true when session is active
    connectionStatus,         // 'idle' | 'connecting' | 'connected' | 'disconnected'
    agentId,                  // The agent ID being used
    
    // Conversation data
    messages,                 // Array of conversation messages
    error,                    // Error message if any
    
    // Conversation controls
    startSession,             // Start connection to agent
    endSession,               // End connection to agent
    sendMessage,              // Send text message (for text-only mode)
    interrupt,                // Interrupt agent speaking
    
    // Direct access to conversation object for advanced usage
    conversation,
  };
}
