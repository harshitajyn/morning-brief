/**
 * Run this once per Google account to get an OAuth refresh token.
 *
 * Prerequisites:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create an OAuth 2.0 Client ID (type: Web application)
 * 3. Add http://localhost:3333 as an Authorized redirect URI
 * 4. Enable Gmail API and Google Calendar API in your project
 *
 * Usage (work account — harshita@peakxv.com):
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-token.mjs
 *
 * Usage (personal account — harshita.1013@gmail.com):
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy ACCOUNT=personal node scripts/get-google-token.mjs
 *
 * Then paste the refresh_token into .env.local
 */
import { createServer } from "http";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ACCOUNT = process.env.ACCOUNT || "work";
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "http://localhost:3333");

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
});

console.log(`\nSetting up ${ACCOUNT.toUpperCase()} account\n`);
console.log("Open this URL in your browser:\n");
console.log(url);
console.log("\nWaiting for callback on http://localhost:3333 ...\n");

const server = createServer(async (req, res) => {
  const code = new URL(req.url, "http://localhost:3333").searchParams.get("code");
  if (!code) { res.end("No code"); return; }
  const { tokens } = await oauth2.getToken(code);

  const prefix = ACCOUNT === "personal" ? "GOOGLE_PERSONAL" : "GOOGLE";

  console.log("\n=== Add these to .env.local ===\n");
  console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
  console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`${prefix}_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\n==============================\n");
  console.log(`${ACCOUNT.toUpperCase()} account configured!`);
  if (ACCOUNT === "work") {
    console.log("To also add your personal Gmail, run again with ACCOUNT=personal");
  }
  res.end(`Done! ${ACCOUNT} account configured. Check your terminal for the tokens.`);
  server.close();
});

server.listen(3333);
