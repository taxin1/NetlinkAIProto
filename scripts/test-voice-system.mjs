#!/usr/bin/env node

/**
 * Voice System Test Script
 * 
 * Tests all voice-related endpoints and functionality:
 * - ElevenLabs TTS
 * - ElevenLabs STT
 * - Twilio Telephony
 * - Voice hooks integration
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const envVars = {}
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          envVars[key.trim()] = value.trim()
        }
      }
    })
    
    // Set environment variables
    Object.assign(process.env, envVars)
  } catch (error) {
    // .env.local might not exist, that's okay
    console.warn('Could not load .env.local file')
  }
}

loadEnv()

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

async function testEndpoint(name, url, options = {}) {
  try {
    logInfo(`Testing ${name}...`)
    const response = await fetch(url, options)
    const status = response.status
    const isOk = response.ok
    
    if (isOk) {
      logSuccess(`${name}: ${status} OK`)
      return { success: true, status, response }
    } else {
      const text = await response.text()
      logError(`${name}: ${status} ${response.statusText}`)
      logError(`Response: ${text.substring(0, 200)}`)
      return { success: false, status, error: text }
    }
  } catch (error) {
    logError(`${name}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue')
  log('Voice System Test Suite', 'blue')
  log('='.repeat(60) + '\n', 'blue')

  // Check environment variables
  log('\n📋 Environment Variables Check:', 'cyan')
  const envVars = {
    'ELEVENLABS_API_KEY': ELEVENLABS_API_KEY,
    'TWILIO_ACCOUNT_SID': TWILIO_ACCOUNT_SID,
    'TWILIO_AUTH_TOKEN': TWILIO_AUTH_TOKEN,
    'TWILIO_PHONE_NUMBER': TWILIO_PHONE_NUMBER,
    'NEXT_PUBLIC_APP_URL': BASE_URL,
  }

  let envOk = true
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      const masked = key.includes('KEY') || key.includes('TOKEN') || key.includes('AUTH')
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value
      logSuccess(`${key}: ${masked}`)
    } else {
      logWarning(`${key}: Not set`)
      if (key !== 'TWILIO_ACCOUNT_SID' && key !== 'TWILIO_AUTH_TOKEN' && key !== 'TWILIO_PHONE_NUMBER') {
        envOk = false
      }
    }
  }

  if (!envOk) {
    logError('\n⚠️  Some required environment variables are missing!')
    logError('Please check your .env.local file.\n')
    return
  }

  // Test 1: ElevenLabs TTS
  log('\n🎤 Test 1: ElevenLabs TTS', 'cyan')
  const ttsResult = await testEndpoint(
    'ElevenLabs TTS',
    `${BASE_URL}/api/elevenlabs-tts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello, this is a test of the ElevenLabs text to speech system.' })
    }
  )

  // Test 2: ElevenLabs TTS Audio (for phone calls)
  log('\n📞 Test 2: ElevenLabs TTS Audio (Phone Calls)', 'cyan')
  const ttsAudioResult = await testEndpoint(
    'ElevenLabs TTS Audio',
    `${BASE_URL}/api/elevenlabs-tts-audio?text=${encodeURIComponent('Hello, this is a test.')}`
  )

  // Test 3: ElevenLabs STT (would need actual audio file, so we'll just check the endpoint exists)
  log('\n🎙️  Test 3: ElevenLabs STT Endpoint', 'cyan')
  const sttResult = await testEndpoint(
    'ElevenLabs STT',
    `${BASE_URL}/api/elevenlabs-stt`,
    {
      method: 'POST',
      // Note: This will fail without an actual audio file, but we're checking if the endpoint exists
    }
  )

  // Test 4: Twilio Telephony (without making actual call)
  log('\n📱 Test 4: Twilio Telephony Endpoint', 'cyan')
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    // Test with invalid phone number to check endpoint without making real call
    const twilioResult = await testEndpoint(
      'Twilio Telephony',
      `${BASE_URL}/api/twilio-telephony`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+10000000000', // Invalid test number
          userId: 'test-user-id'
        })
      }
    )
  } else {
    logWarning('Twilio credentials not configured - skipping Twilio test')
  }

  // Test 5: Voice Call API
  log('\n💬 Test 5: Voice Call API', 'cyan')
  const voiceCallResult = await testEndpoint(
    'Voice Call API',
    `${BASE_URL}/api/voice-call`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_call_prompt',
        context: {
          user_profile: { name: 'Test User', role: 'Developer', organization: 'Test Org' },
          contact: { name: 'Test Contact', company: 'Test Company', phone: '+1234567890' },
          call_goal: { type: 'networking', desired_outcome: 'Test call' }
        },
        userId: 'test-user-id'
      })
    }
  )

  // Summary
  log('\n' + '='.repeat(60), 'blue')
  log('Test Summary', 'blue')
  log('='.repeat(60), 'blue')

  const results = [
    { name: 'ElevenLabs TTS', result: ttsResult },
    { name: 'ElevenLabs TTS Audio', result: ttsAudioResult },
    { name: 'ElevenLabs STT', result: sttResult },
    { name: 'Voice Call API', result: voiceCallResult },
  ]

  let passed = 0
  let failed = 0

  results.forEach(({ name, result }) => {
    if (result.success) {
      logSuccess(`${name}: PASSED`)
      passed++
    } else {
      logError(`${name}: FAILED`)
      failed++
    }
  })

  log(`\n📊 Results: ${passed} passed, ${failed} failed`, passed === results.length ? 'green' : 'yellow')

  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green')
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow')
  }

  log('\n')
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error: ${error.message}`)
  process.exit(1)
})

