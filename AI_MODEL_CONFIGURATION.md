# AI Model Configuration

## Overview

All AI tasks use a **unified provider chain** with OpenAI as the primary provider and automatic fallbacks.

## Provider Priority

1. **OpenAI** (`OPENAI_API_KEY`) — primary for all text and vision tasks (`gpt-4o-mini` by default)
2. **Google Gemini** (`GEMINI_API_KEY`) — first fallback
3. **OpenRouter** (`OPENROUTER_API_KEY`) — second fallback (free models rotated)
4. **Bytez** (`BYTEZ_API_KEY`) — third fallback

If OpenAI fails (rate limit, outage, etc.), the system automatically tries the next configured provider.

## Load Balancing

Among fallback providers (Gemini, OpenRouter, Bytez), requests are routed to the provider with the **lowest recent usage** to balance token consumption across API keys.

When a provider returns a rate-limit error (429), it is temporarily skipped for 5 minutes before being tried again.

## Configuration

### Environment Variables

```bash
# Primary (recommended)
OPENAI_API_KEY=sk-...

# Optional fallbacks
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
BYTEZ_API_KEY=...

# Optional model overrides
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

### Core Files

- `lib/ai/providers.ts` — provider chain, OpenAI calls, load balancing
- `lib/ai/utils.ts` — throttle and retry utilities
- `lib/gemini.ts` — legacy exports and high-level functions (`generateText`, `generateEmailWithGemini`, etc.)

## Features Using the Provider Chain

- AI assistant chat
- Email generation
- Campaign content
- Business card scanning (OpenAI vision → Gemini → OpenRouter → Bytez)
- CV improvement
- URL preview and event extraction
- Voice agent (via shared text generation where applicable)
