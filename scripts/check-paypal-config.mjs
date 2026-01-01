import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}PayPal Configuration Checker${RESET}\n`);

// Check .env.local
const envPath = path.join(rootDir, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log(`${RED}❌ .env.local file not found in ${rootDir}${RESET}`);
  console.log(`Please create a .env.local file with your PayPal credentials.`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let clientId = '';
let clientSecret = '';
let environment = '';

for (const line of lines) {
  const [key, ...valueParts] = line.trim().split('=');
  const value = valueParts.join('=');
  
  if (key === 'PAYPAL_CLIENT_ID') clientId = value;
  if (key === 'PAYPAL_CLIENT_SECRET') clientSecret = value;
  if (key === 'PAYPAL_ENVIRONMENT') environment = value;
}

console.log(`${BOLD}Checking credentials...${RESET}`);

// Check Client ID
if (!clientId) {
  console.log(`${RED}❌ PAYPAL_CLIENT_ID is missing${RESET}`);
} else {
  console.log(`${GREEN}✅ PAYPAL_CLIENT_ID is present${RESET}`);
  if (clientId.startsWith('A') && !clientId.includes('sandbox')) {
    console.log(`${YELLOW}   Note: Looks like a LIVE client ID (starts with 'A'). Make sure this is intended.${RESET}`);
  } else if (clientId.startsWith('A')) {
    console.log(`${GREEN}   Looks like a SANDBOX client ID.${RESET}`);
  } else {
    console.log(`${YELLOW}   Warning: Client ID format looks unusual.${RESET}`);
  }
}

// Check Client Secret
if (!clientSecret) {
  console.log(`${RED}❌ PAYPAL_CLIENT_SECRET is missing${RESET}`);
} else {
  console.log(`${GREEN}✅ PAYPAL_CLIENT_SECRET is present${RESET}`);
}

// Check Environment
if (environment === 'live') {
  console.log(`${YELLOW}⚠️  PAYPAL_ENVIRONMENT is set to 'live'. You are in PRODUCTION mode.${RESET}`);
} else {
  console.log(`${GREEN}✅ Environment is set to sandbox (default)${RESET}`);
}

console.log(`\n${BOLD}Summary:${RESET}`);
if (clientId && clientSecret) {
  console.log(`${GREEN}Your PayPal configuration looks correct!${RESET}`);
  console.log(`To test payments, start your app and visit: ${BOLD}/test-payment${RESET}`);
} else {
  console.log(`${RED}Please fix the missing credentials in .env.local${RESET}`);
}
