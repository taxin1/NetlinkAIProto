# Netlink AI AI - Network Link AI - AI-Powered Business Networking Platform

A comprehensive business networking platform with AI-powered features including business card scanning, email generation, and contact management.

## Features

- 🤖 AI-powered business card scanning using Google Gemini
- 📧 Intelligent email generation
- 📊 Analytics and contact management
- 🔄 Real-time notifications
- 🎨 Modern, responsive UI

## Environment Setup

To run this application, you'll need to set up the following environment variables:

### 1. Create `.env.local` file in the root directory:

\`\`\`env
# AI API Configuration (required)
# Get your Gemini API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
\`\`\`

### 2. Get your Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in your `.env.local` file

**Note:** The app uses Google Gemini 1.5 Flash (free tier) for all AI features.

### 3. Set up Supabase:

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Settings > API
3. Copy your Project URL and anon/public key
4. Add them to your `.env.local` file

## Installation

\`\`\`bash
# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`

## Troubleshooting

### Business Card Scanner Error

If you encounter "Failed to extract business card information" error:

1. **Check API Key**: Ensure `GEMINI_API_KEY` is set in your `.env.local` file
2. **Verify API Keys**: Make sure your API keys are valid and have sufficient quota
3. **Image Format**: Ensure you're uploading a valid image file (JPEG, PNG, etc.)
4. **Network**: Check your internet connection
5. **Format**: Ensure no spaces around the `=` sign in your `.env.local` file (e.g., `GEMINI_API_KEY=your_key` not `GEMINI_API_KEY = your_key`)

The application now provides detailed error messages and supports multiple AI providers for better reliability.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase
- **AI**: Google Gemini API
- **Authentication**: Supabase Auth

## Deployment

This project is configured for deployment on Vercel. Make sure to add your environment variables in the Vercel dashboard.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ujjibons-projects/v0-background-paths)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/JTAL4vzQkxj)
