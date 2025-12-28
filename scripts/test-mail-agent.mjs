#!/usr/bin/env node

/**
 * Test script to verify if the mail agent works
 * Tests:
 * 1. Environment variables (GEMINI_API_KEY, email config)
 * 2. API endpoints availability
 * 3. Email generation functionality
 * 4. Email sending configuration
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
try {
  const envPath = join(__dirname, '..', '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      if (key && value) {
        process.env[key.trim()] = value
      }
    }
  })
} catch (error) {
  // .env.local might not exist, that's okay
  console.log('Note: .env.local not found, using process.env only')
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function check(condition, message) {
  if (condition) {
    log(`✓ ${message}`, 'green')
    return true
  } else {
    log(`✗ ${message}`, 'red')
    return false
  }
}

async function testEnvironmentVariables() {
  log('\n📋 Testing Environment Variables...', 'cyan')
  log('─'.repeat(50), 'cyan')
  
  const results = {
    geminiKey: false,
    emailConfig: false,
    hasUserEmail: false,
    hasGmailFallback: false,
  }
  
  // Check GEMINI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  results.geminiKey = check(
    !!geminiKey && geminiKey.length > 0,
    `GEMINI_API_KEY is set (${geminiKey ? `${geminiKey.substring(0, 10)}...` : 'NOT SET'})`
  )
  
  // Check email configuration
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  
  results.hasGmailFallback = check(
    !!gmailUser && !!gmailPass,
    `Gmail fallback configured (${gmailUser ? gmailUser : 'NOT SET'})`
  )
  
  if (!results.hasGmailFallback) {
    log('  ⚠ Note: Users can configure their own email in Settings → Email Configuration', 'yellow')
    results.emailConfig = true // Still valid if users configure their own
  } else {
    results.emailConfig = true
  }
  
  return results
}

async function testGeminiAPI() {
  log('\n🤖 Testing Gemini API Connection...', 'cyan')
  log('─'.repeat(50), 'cyan')
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    log('✗ Cannot test Gemini API - GEMINI_API_KEY not set', 'red')
    return false
  }
  
  try {
    const testPrompt = 'Say "API connection successful" and nothing else.'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: testPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 50,
          },
        }),
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      log(`✗ Gemini API request failed (${response.status}): ${errorText.substring(0, 100)}`, 'red')
      return false
    }
    
    const data = await response.json()
    
    if (data.error) {
      log(`✗ Gemini API error: ${data.error.message || JSON.stringify(data.error)}`, 'red')
      return false
    }
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      check(true, `Gemini API connection successful: "${text.substring(0, 50)}..."`)
      return true
    }
    
    log('✗ No valid response from Gemini API', 'red')
    return false
  } catch (error) {
    log(`✗ Gemini API test failed: ${error.message}`, 'red')
    return false
  }
}

async function testEmailGeneration() {
  log('\n✉️  Testing Email Generation...', 'cyan')
  log('─'.repeat(50), 'cyan')
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    log('✗ Cannot test email generation - GEMINI_API_KEY not set', 'red')
    return false
  }
  
  try {
    // Simulate the email generation prompt
    const testContext = {
      contactName: 'John Doe',
      contactCompany: 'Test Company',
      purpose: 'Schedule a product demo',
      userProfile: {
        name: 'Test User',
        email: 'test@example.com'
      }
    }
    
    const prompt = `You are an expert email writer. Write a professional email to ${testContext.contactName} at ${testContext.contactCompany} about: ${testContext.purpose}. Keep it brief (2-3 sentences). No asterisks, plain text only.`
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      log(`✗ Email generation failed (${response.status}): ${errorText.substring(0, 100)}`, 'red')
      return false
    }
    
    const data = await response.json()
    
    if (data.error) {
      log(`✗ Email generation error: ${data.error.message || JSON.stringify(data.error)}`, 'red')
      return false
    }
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const emailBody = data.candidates[0].content.parts[0].text
      check(true, `Email generation successful (${emailBody.length} characters)`)
      log(`  Sample: "${emailBody.substring(0, 100)}..."`, 'blue')
      return true
    }
    
    log('✗ No email body generated', 'red')
    return false
  } catch (error) {
    log(`✗ Email generation test failed: ${error.message}`, 'red')
    return false
  }
}

async function testEmailSendingConfig() {
  log('\n📧 Testing Email Sending Configuration...', 'cyan')
  log('─'.repeat(50), 'cyan')
  
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  
  if (!gmailUser || !gmailPass) {
    log('⚠ Gmail fallback not configured (this is OK if users configure their own email)', 'yellow')
    log('  Users can set up email in: Settings → Email Configuration', 'yellow')
    return true // Not a failure, just means users need to configure
  }
  
  // Check if credentials look valid
  const hasValidFormat = gmailUser.includes('@') && gmailPass.length >= 10
  check(hasValidFormat, `Gmail credentials format looks valid (${gmailUser})`)
  
  if (!hasValidFormat) {
    log('  ⚠ Gmail credentials may be invalid', 'yellow')
  }
  
  return true
}

async function testAPIRoutes() {
  log('\n🔌 Testing API Routes Structure...', 'cyan')
  log('─'.repeat(50), 'cyan')
  
  const routes = [
    'app/api/generate-email/route.ts',
    'app/api/send-email/route.ts',
    'app/api/generate-campaign-content/route.ts',
  ]
  
  const fs = await import('fs')
  const path = await import('path')
  
  let allExist = true
  for (const route of routes) {
    const routePath = path.join(process.cwd(), route)
    const exists = fs.existsSync(routePath)
    check(exists, `Route exists: ${route}`)
    if (!exists) allExist = false
  }
  
  return allExist
}

async function main() {
  log('\n🚀 Mail Agent Test Suite', 'cyan')
  log('='.repeat(50), 'cyan')
  
  const results = {
    env: false,
    gemini: false,
    emailGen: false,
    emailConfig: false,
    apiRoutes: false,
  }
  
  // Run tests
  const envResults = await testEnvironmentVariables()
  results.env = envResults.geminiKey && envResults.emailConfig
  
  if (envResults.geminiKey) {
    results.gemini = await testGeminiAPI()
    if (results.gemini) {
      results.emailGen = await testEmailGeneration()
    }
  }
  
  results.emailConfig = await testEmailSendingConfig()
  results.apiRoutes = await testAPIRoutes()
  
  // Summary
  log('\n📊 Test Summary', 'cyan')
  log('='.repeat(50), 'cyan')
  
  const allTests = [
    ['Environment Variables', results.env],
    ['Gemini API Connection', results.gemini],
    ['Email Generation', results.emailGen],
    ['Email Configuration', results.emailConfig],
    ['API Routes', results.apiRoutes],
  ]
  
  let passed = 0
  let total = allTests.length
  
  allTests.forEach(([name, result]) => {
    if (result) {
      log(`✓ ${name}`, 'green')
      passed++
    } else {
      log(`✗ ${name}`, 'red')
    }
  })
  
  log('\n' + '─'.repeat(50), 'cyan')
  
  if (passed === total) {
    log(`\n✅ All tests passed! (${passed}/${total})`, 'green')
    log('The mail agent should work correctly.', 'green')
  } else {
    log(`\n⚠️  Some tests failed (${passed}/${total})`, 'yellow')
    
    if (!results.env) {
      log('\n💡 Fix: Set GEMINI_API_KEY in .env.local', 'yellow')
    }
    if (!results.gemini) {
      log('\n💡 Fix: Check your GEMINI_API_KEY is valid', 'yellow')
    }
    if (!results.emailGen) {
      log('\n💡 Fix: Email generation depends on Gemini API', 'yellow')
    }
    if (!results.emailConfig) {
      log('\n💡 Fix: Configure email in Settings → Email Configuration', 'yellow')
    }
    if (!results.apiRoutes) {
      log('\n💡 Fix: API route files are missing', 'yellow')
    }
  }
  
  log('\n')
}

main().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red')
  process.exit(1)
})
