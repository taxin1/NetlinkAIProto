// Rebuild trigger
import { NextRequest, NextResponse } from "next/server"

/**
 * Diagnostic endpoint to test ElevenLabs Telephony connection
 * This will help identify what's working and what's not
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    success: false
  }

  // Check 1: Environment Variables
  results.checks.env = {
    apiKey: !!process.env.ELEVENLABS_API_KEY,
    agentId: !!process.env.ELEVENLABS_AGENT_ID,
    apiKeyLength: process.env.ELEVENLABS_API_KEY?.length || 0,
    agentIdLength: process.env.ELEVENLABS_AGENT_ID?.length || 0,
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    results.errors.push("ELEVENLABS_API_KEY not found in environment variables")
  }
  if (!process.env.ELEVENLABS_AGENT_ID) {
    results.errors.push("ELEVENLABS_AGENT_ID not found in environment variables")
  }

  // Check 2: Test API Key Validity
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const testResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
      })

      results.checks.apiKeyValid = testResponse.ok
      results.checks.apiKeyStatus = testResponse.status

      if (testResponse.ok) {
        const agents = await testResponse.json()
        results.checks.agentsFound = Array.isArray(agents) ? agents.length : 0
        results.checks.agentList = Array.isArray(agents)
          ? agents.map((a: any) => ({ id: a.agent_id, name: a.name }))
          : []
      } else {
        const errorText = await testResponse.text()
        results.errors.push(`API Key validation failed: ${testResponse.status} - ${errorText}`)
      }
    } catch (error) {
      results.errors.push(`API Key test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check 3: Test Agent Access
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID) {
    try {
      const agentResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
        }
      )

      results.checks.agentAccessible = agentResponse.ok
      results.checks.agentStatus = agentResponse.status

      if (agentResponse.ok) {
        const agent = await agentResponse.json()
        results.checks.agentDetails = {
          id: agent.agent_id,
          name: agent.name,
          voice_id: agent.voice_id,
        }
      } else {
        const errorText = await agentResponse.text()
        results.errors.push(`Agent access failed: ${agentResponse.status} - ${errorText}`)
      }
    } catch (error) {
      results.errors.push(`Agent test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check 4: Test Telephony Endpoint (without making actual call)
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID) {
    try {
      // Try to make a test request to see what the endpoint expects
      // We'll use an invalid phone number to see the error response format
      const telephonyResponse = await fetch(
        "https://api.elevenlabs.io/v1/convai/conversation/outbound_call",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            phone_number: "+10000000000", // Invalid test number
            agent_id: process.env.ELEVENLABS_AGENT_ID,
          }),
        }
      )

      results.checks.telephonyEndpointExists = telephonyResponse.status !== 404
      results.checks.telephonyStatus = telephonyResponse.status
      const telephonyText = await telephonyResponse.text()

      try {
        results.checks.telephonyResponse = JSON.parse(telephonyText)
      } catch {
        results.checks.telephonyResponseRaw = telephonyText
      }

      if (telephonyResponse.status === 404) {
        results.errors.push("Telephony endpoint returned 404 - endpoint may not exist or telephony not enabled")
      } else if (!telephonyResponse.ok) {
        // 400/401/403 errors are actually good - they mean the endpoint exists!
        results.checks.telephonyEndpointExists = true
        results.checks.telephonyErrorType = telephonyResponse.status === 400 ? "Bad Request (endpoint exists, invalid params)" :
          telephonyResponse.status === 401 ? "Unauthorized (endpoint exists, auth issue)" :
            telephonyResponse.status === 403 ? "Forbidden (endpoint exists, permission issue)" :
              "Other error"
      }
    } catch (error) {
      results.errors.push(`Telephony endpoint test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Determine overall success
  results.success = results.errors.length === 0 &&
    results.checks.env?.apiKey &&
    results.checks.env?.agentId &&
    results.checks.apiKeyValid &&
    results.checks.agentAccessible

  return NextResponse.json(results, {
    status: results.success ? 200 : 200 // Always return 200 so we can see the results
  })
}

