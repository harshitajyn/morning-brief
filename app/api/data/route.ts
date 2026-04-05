import { google } from "googleapis";
import { NextResponse } from "next/server";

// Force dynamic — never cache
export const dynamic = "force-dynamic";

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

async function fetchEmails(auth: any) {
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
      id: m.id,
      from: get("From").replace(/<.*>/, "").trim(),
      subject: get("Subject"),
      tag,
      unread: isUnread,
      date: get("Date"),
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
  const auth = getAuth();
  if (!auth) {
    // Return empty data when no credentials configured
    return NextResponse.json({
      emails: [],
      calToday: [],
      calTomorrow: [],
      live: false,
      error: "Google API credentials not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env.local",
      ts: Date.now(),
    });
  }

  try {
    const [emails, calendar] = await Promise.all([
      fetchEmails(auth),
      fetchCalendar(auth),
    ]);
    return NextResponse.json({
      emails,
      calToday: calendar.today,
      calTomorrow: calendar.tomorrow,
      live: true,
      ts: Date.now(),
    });
  } catch (err: any) {
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
