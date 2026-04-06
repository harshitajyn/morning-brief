import { google } from "googleapis";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Force dynamic — never cache
export const dynamic = "force-dynamic";

function loadLocalData() {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "live.json"), "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

function getAuth(prefix: string) {
  const clientId = process.env[`${prefix}_CLIENT_ID`] || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env[`${prefix}_REFRESH_TOKEN`];
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

// Senders/subjects that are noise, not priority
const NOISE_PATTERNS = [
  /mimecast/i, /spam/i, /helpdesk@peakxv/i,
  /donotreply@wpvip/i, /contact.us/i, /contact form/i,
  /calendar-notification@google/i, /daily agenda/i, /daily digest/i,
  /noreply/i, /no-reply/i,
  /appleid@id\.apple\.com/i, /password.*reset/i,
  /corporate.card.*statement/i,
  /cold outreach/i,
];

function isNoise(from: string, subject: string): boolean {
  const text = `${from} ${subject}`;
  return NOISE_PATTERNS.some(p => p.test(text));
}

async function fetchEmails(auth: any, account: string) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:3d -category:promotions -category:social",
    maxResults: 15,
  });
  const messages = res.data.messages || [];
  const priority: any[] = [];
  const noise: string[] = [];
  for (const m of messages.slice(0, 10)) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: m.id!,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = msg.data.payload?.headers || [];
    const get = (n: string) => headers.find((h) => h.name === n)?.value || "";
    const labels = msg.data.labelIds || [];
    const isUnread = labels.includes("UNREAD");
    const isSent = labels.includes("SENT");
    if (isSent) continue;

    const from = get("From");
    const subject = get("Subject");

    // Filter noise vs priority
    if (isNoise(from, subject)) {
      noise.push(`${from.replace(/<.*>/, "").trim()} — ${subject}`);
      continue;
    }

    let tag = "FYI";
    const subj = subject.toLowerCase();
    if (subj.includes("urgent") || subj.includes("action")) tag = "ACTION";
    else if (subj.includes("invoice") || subj.includes("payment")) tag = "ACTION";
    else if (subj.includes("re:")) tag = "REPLY";
    else if (subj.includes("fwd:")) tag = "FWD";
    else if (subj.includes("shared") || subj.includes("notion") || subj.includes("sheets")) tag = "SHARED DOC";
    else if (subj.includes("update") || subj.includes("digest")) tag = "UPDATE";
    else if (labels.includes("CATEGORY_UPDATES")) tag = "UPDATE";

    priority.push({
      id: `${account}-${m.id}`,
      from: from.replace(/<.*>/, "").trim(),
      subject,
      tag,
      unread: isUnread,
      date: get("Date"),
      account,
    });
  }
  return { priority, noise };
}

async function fetchCalendar(auth: any) {
  const cal = google.calendar({ version: "v3", auth });
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: todayStart.toISOString(),
    timeMax: tomorrowEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 20,
  });

  const events = (res.data.items || []).map((e) => {
    const start = e.start?.dateTime || e.start?.date || "";
    const end = e.end?.dateTime || e.end?.date || "";
    const allDay = !e.start?.dateTime;
    const startDate = new Date(start);
    const endDate = new Date(end);

    return {
      id: e.id,
      title: e.summary || "(No title)",
      note: e.location || (e.attendees ? `${e.attendees.length} attendees` : "") || "",
      allDay,
      time: allDay
        ? "All day"
        : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      end: allDay
        ? ""
        : endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      date: start,
      isToday: startDate.toDateString() === now.toDateString(),
    };
  });

  const today = events.filter((e) => e.isToday);
  const tomorrow = events.filter((e) => !e.isToday);
  return { today, tomorrow };
}

export async function GET() {
  // Work account: GOOGLE_REFRESH_TOKEN
  // Personal account: GOOGLE_PERSONAL_REFRESH_TOKEN
  const workAuth = getAuth("GOOGLE");
  const personalAuth = getAuth("GOOGLE_PERSONAL");

  if (!workAuth && !personalAuth) {
    // No API creds — serve from local data file if available
    const local = loadLocalData();
    if (local) return NextResponse.json({ ...local, ts: Date.now() });

    return NextResponse.json({
      emails: [],
      calToday: [],
      calTomorrow: [],
      live: false,
      error: "No Google credentials configured.",
      ts: Date.now(),
    });
  }

  try {
    const fetches: Promise<any>[] = [];

    // Fetch emails from both accounts in parallel
    if (workAuth) fetches.push(fetchEmails(workAuth, "work"));
    else fetches.push(Promise.resolve({ priority: [], noise: [] }));

    if (personalAuth) fetches.push(fetchEmails(personalAuth, "personal"));
    else fetches.push(Promise.resolve({ priority: [], noise: [] }));

    // Calendar from work account (primary), personal as secondary
    if (workAuth) fetches.push(fetchCalendar(workAuth));
    else if (personalAuth) fetches.push(fetchCalendar(personalAuth));
    else fetches.push(Promise.resolve({ today: [], tomorrow: [] }));

    const [workResult, personalResult, calendar] = await Promise.all(fetches);

    // Merge priority emails and sort by date (newest first)
    const allEmails = [...workResult.priority, ...personalResult.priority].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Deduplicate and summarize noise
    const noiseMap = new Map<string, number>();
    for (const n of [...workResult.noise, ...personalResult.noise]) {
      const key = n.split(" — ")[0];
      noiseMap.set(key, (noiseMap.get(key) || 0) + 1);
    }
    const noise = [...noiseMap.entries()].map(([k, v]) => v > 1 ? `${v}× ${k}` : k);

    // Load local data for action items / follow-ups (not from Gmail)
    const local = loadLocalData();

    return NextResponse.json({
      emails: allEmails,
      calToday: calendar.today,
      calTomorrow: calendar.tomorrow,
      actionItems: local?.actionItems || [],
      followUps: local?.followUps || [],
      noise,
      live: true,
      ts: Date.now(),
    });
  } catch (err: any) {
    // Google API unreachable — fall back to local data file
    const local = loadLocalData();
    if (local) return NextResponse.json({ ...local, ts: Date.now() });

    return NextResponse.json({
      emails: [],
      calToday: [],
      calTomorrow: [],
      live: false,
      error: err.message,
      ts: Date.now(),
    }, { status: 500 });
  }
}
