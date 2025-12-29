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
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[match[1].trim()] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = readEnv();
const API_KEY = env.ELEVENLABS_API_KEY;

console.log("-----------------------------------------");
console.log("Checking API Key & Listing Agents");
console.log("-----------------------------------------");
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING'}`);

if (!API_KEY) process.exit(1);

async function listAgents() {
    try {
        const response = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
            method: "GET",
            headers: { "xi-api-key": API_KEY }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`\n✅ API Key is Valid! Found ${data.agents ? data.agents.length : 0} agents.`);
            if (data.agents) {
                data.agents.forEach(agent => {
                    console.log(` - Name: ${agent.name}, ID: ${agent.agent_id}`);
                });
            }
        } else {
            const text = await response.text();
            console.error(`\n❌ API Key invalid or error! Status: ${response.status}`);
            console.error(`Response: ${text}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

listAgents();
