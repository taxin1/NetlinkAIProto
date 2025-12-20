import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Helper to read env file manually
function readEnv() {
    try {
        const envPath = path.join(projectRoot, '.env.local');
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[match[1].trim()] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Error reading .env.local:", e.message);
        return {};
    }
}

const env = readEnv();
const API_KEY = env.ELEVENLABS_API_KEY;
const AGENT_ID = env.ELEVENLABS_AGENT_ID;

console.log("-----------------------------------------");
console.log("Connection Verification Script");
console.log("-----------------------------------------");
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING'}`);
console.log(`Agent ID: ${AGENT_ID ? AGENT_ID : 'MISSING'}`);
console.log("-----------------------------------------");

if (!API_KEY || !AGENT_ID) {
    console.error("Missing credentials, aborting.");
    process.exit(1);
}

async function verifyAgent() {
    console.log(`\n1. Verifying Agent (${AGENT_ID})...`);
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
            method: "GET",
            headers: { "xi-api-key": API_KEY }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Agent found!");
            console.log(`   Name: ${data.name}`);
            console.log(`   Voice ID: ${data.voice_id}`);
        } else {
            const text = await response.text();
            console.error(`❌ Agent verification failed! Status: ${response.status}`);
            console.error(`   Response: ${text}`);
        }
    } catch (e) {
        console.error("❌ Error connecting to API:", e.message);
    }
}

async function verifyTelephony() {
    console.log(`\n2. Verifying Telephony Endpoint...`);
    // Testing with a fake number to see if endpoint exists and what error it gives
    // If we get "Not Found", it means the agent doesn't have telephony or integration is missing
    const phone = "+448072497474";

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/convai/conversation/outbound_call", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": API_KEY
            },
            body: JSON.stringify({
                phone_number: phone,
                agent_id: AGENT_ID
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 404) {
            console.error("❌ Error 404: Not Found.");
            console.error("Possible causes:");
            console.error(" - The Agent ID is incorrect.");
            console.error(" - The Agent does not have the Twilio integration enabled in ElevenLabs dashboard.");
            console.error(" - The API endpoint URL has changed (unlikely).");
        } else if (response.status === 200) {
            console.log("✅ Call initiated successfully!");
        } else {
            console.log("ℹ️ Other result (might be permission or validation error).");
        }

    } catch (e) {
        console.error("❌ Error hitting telephony endpoint:", e.message);
    }
}

(async () => {
    await verifyAgent();
    await verifyTelephony();
})();
