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

async function fetchEmails(auth: any, account: string) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:3d -category:promotions -category:social",
    maxResults: 15,
  });
  const messages = res.data.messages || [];
  const emails: any[] = [];
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
    let tag = "FYI";
    const subj = get("Subject").toLowerCase();
    if (subj.includes("urgent") || subj.includes("action")) tag = "ACTION";
    else if (subj.includes("invoice") || subj.includes("payment")) tag = "ACTION";
    else if (subj.includes("re:")) tag = "REPLY";
    else if (subj.includes("fwd:")) tag = "FWD";
    else if (subj.includes("shared") || subj.includes("notion") || subj.includes("sheets")) tag = "SHARED DOC";
    else if (subj.includes("update") || subj.includes("digest")) tag = "UPDATE";
    else if (labels.includes("CATEGORY_UPDATES")) tag = "UPDATE";

    emails.push({
      id: `${account}-${m.id}`,
      from: get("From").replace(/<.*>/, "").trim(),
      subject: get("Subject"),
      tag,
      unread: isUnread,
      date: get("Date"),
      account,
    });
  }
  return emails;
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
    else fetches.push(Promise.resolve([]));

    if (personalAuth) fetches.push(fetchEmails(personalAuth, "personal"));
    else fetches.push(Promise.resolve([]));

    // Calendar from work account (primary), personal as secondary
    if (workAuth) fetches.push(fetchCalendar(workAuth));
    else if (personalAuth) fetches.push(fetchCalendar(personalAuth));
    else fetches.push(Promise.resolve({ today: [], tomorrow: [] }));

    const [workEmails, personalEmails, calendar] = await Promise.all(fetches);

    // Merge and sort emails by date (newest first)
    const allEmails = [...workEmails, ...personalEmails].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      emails: allEmails,
      calToday: calendar.today,
      calTomorrow: calendar.tomorrow,
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
