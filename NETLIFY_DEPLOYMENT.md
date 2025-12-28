# Netlify Deployment Guide

## Why "AI service temporarily unavailable" Error?

This error typically occurs when:
1. **Environment variables are not set** in Netlify (most common)
2. **Function timeout** - AI API calls taking longer than default timeout
3. **API key issues** - Invalid or missing GEMINI_API_KEY

## Setup Instructions

### 1. Set Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Add the following variables:

#### Required Variables:
\`\`\`
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

#### Optional Variables (if using Supabase):
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

#### Optional Variables (if using email):
\`\`\`
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
\`\`\`

### 2. Redeploy After Setting Variables

After adding environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

### 3. Verify Environment Variables

You can verify variables are set by checking the build logs. They should appear (but values will be hidden) in the build output.

## Troubleshooting

### Error: "AI service temporarily unavailable"

**Solution:**
1. Check that `GEMINI_API_KEY` is set in Netlify environment variables
2. Verify the API key is valid and has not expired
3. Check Netlify function logs for detailed error messages

### Error: Function timeout

**Solution:**
- The `netlify.toml` file is already configured with a 26-second timeout (maximum allowed)
- If AI calls are still timing out, consider:
  - Using a faster AI model
  - Implementing request queuing
  - Using background jobs for long-running tasks

### Error: Module not found

**Solution:**
- Make sure `@netlify/plugin-nextjs` is installed (already added to devDependencies)
- Clear Netlify build cache and redeploy

## Build Configuration

The project includes:
- `netlify.toml` - Netlify configuration file
- `@netlify/plugin-nextjs` - Required plugin for Next.js on Netlify
- Function timeout set to 26 seconds (maximum) for AI API calls

## Testing Locally

To test with Netlify environment:
\`\`\`bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your site
netlify link

# Run dev server with Netlify functions
netlify dev
\`\`\`

## Additional Notes

- Netlify has a 26-second maximum timeout for serverless functions
- Environment variables are case-sensitive
- Always redeploy after changing environment variables
- Check function logs in Netlify dashboard for detailed error messages
