# AI Model Configuration - Unified Model

## Overview
All AI tasks in Netlink now use a **single unified OpenRouter model** for consistency and simplicity.

## Current Configuration

**Model**: `qwen/qwen3-14b:free`

This model is used for:
- ✅ Text generation (emails, responses, content)
- ✅ AI assistant conversations
- ✅ Voice agent commands
- ✅ Campaign content generation
- ✅ Call prompt generation (when AI is enabled)
- ✅ Business card scanning (note: text-only model may have limitations with images)

## Configuration File

The model is configured in `lib/gemini.ts`:

\`\`\`typescript
export const OPENROUTER_MODEL = "qwen/qwen3-14b:free"
export const OPENROUTER_TEXT_MODEL = "qwen/qwen3-14b:free" // Same as OPENROUTER_MODEL
\`\`\`

Both constants point to the same model for consistency.

## Where It's Used

### API Routes Using the Model:
1. **`app/api/ai-assistant/route.ts`** - AI assistant conversations
2. **`app/api/generate-email/route.ts`** - Email generation
3. **`app/api/generate-campaign-content/route.ts`** - Campaign content
4. **`app/api/voice-agent/route.ts`** - Voice commands
5. **`app/api/voice-call/route.ts`** - Call prompt generation (when AI enabled)
6. **`lib/gemini.ts`** - Core AI functions (email generation, text generation, business card scanning)

### Functions Using the Model:
- `generateText()` - General text generation
- `generateEmailWithGemini()` - Email composition
- `generateChatResponse()` - Chat responses
- `extractBusinessCardInfo()` - Business card OCR
- `fetchUrlPreview()` - URL preview generation
- `extractEventDataFromUrl()` - Event data extraction
- `callOpenRouter()` - Core OpenRouter API call

## Benefits of Unified Model

1. **Consistency** - Same model behavior across all features
2. **Simplicity** - Single model to manage and configure
3. **Cost Control** - Easier to track and manage API usage
4. **Maintenance** - One place to update model configuration

## Important Notes

### Business Card Scanning
The current model (`qwen/qwen3-14b:free`) is a text-only model. For business card scanning with images, you may need to:
- Use a vision-capable model like `qwen/qwen-2-vl-7b-instruct:free`
- Or use a different OCR service for image processing

If business card scanning doesn't work well, you can temporarily use a vision model for that specific function while keeping the text model for everything else.

## Changing the Model

To change the model for all AI tasks, update `lib/gemini.ts`:

\`\`\`typescript
export const OPENROUTER_MODEL = "your-model-name-here"
export const OPENROUTER_TEXT_MODEL = "your-model-name-here"
\`\`\`

All AI features will automatically use the new model.

## Environment Variable

Make sure you have `OPENROUTER_API_KEY` set in your `.env.local` file:

\`\`\`bash
OPENROUTER_API_KEY=your-api-key-here
\`\`\`
