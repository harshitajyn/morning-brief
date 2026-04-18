import { google } from "googleapis";
import { readFileSync } from "fs";
import { join } from "path";

export function loadLocalData() {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "live.json"), "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

export function getAuth(prefix: string) {
  const clientId = process.env[`${prefix}_CLIENT_ID`] || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env[`${prefix}_REFRESH_TOKEN`];
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

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
  return NOISE_PATTERNS.some(p => p.test(`${from} ${subject}`));
}

export async function fetchEmails(auth: any, account: string) {
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
    const get = (n: string) => headers.find((h: any) => h.name === n)?.value || "";
    const labels = msg.data.labelIds || [];
    const isUnread = labels.includes("UNREAD");
    if (labels.includes("SENT")) continue;

    const from = get("From");
    const subject = get("Subject");

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

export async function fetchCalendar(auth: any) {
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

  const events = (res.data.items || []).map((e: any) => {
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
      time: allDay ? "All day" : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      end: allDay ? "" : endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      date: start,
      isToday: startDate.toDateString() === now.toDateString(),
    };
  });

  return {
    today: events.filter((e: any) => e.isToday),
    tomorrow: events.filter((e: any) => !e.isToday),
  };
}

export async function fetchAllData() {
  const workAuth = getAuth("GOOGLE");
  const personalAuth = getAuth("GOOGLE_PERSONAL");

  if (!workAuth && !personalAuth) {
    const local = loadLocalData();
    if (local) return { ...local, live: false, ts: Date.now() };
    return { emails: [], calToday: [], calTomorrow: [], live: false, error: "No Google credentials configured.", ts: Date.now() };
  }

  try {
    const [workResult, personalResult, calendar] = await Promise.all([
      workAuth ? fetchEmails(workAuth, "work") : Promise.resolve({ priority: [], noise: [] }),
      personalAuth ? fetchEmails(personalAuth, "personal") : Promise.resolve({ priority: [], noise: [] }),
      workAuth ? fetchCalendar(workAuth) : personalAuth ? fetchCalendar(personalAuth) : Promise.resolve({ today: [], tomorrow: [] }),
    ]);

    const allEmails = [...workResult.priority, ...personalResult.priority].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const noiseMap = new Map<string, number>();
    for (const n of [...workResult.noise, ...personalResult.noise]) {
      const key = n.split(" — ")[0];
      noiseMap.set(key, (noiseMap.get(key) || 0) + 1);
    }
    const noise = [...noiseMap.entries()].map(([k, v]) => v > 1 ? `${v}× ${k}` : k);

    const local = loadLocalData();
    return {
      emails: allEmails,
      calToday: calendar.today,
      calTomorrow: calendar.tomorrow,
      actionItems: local?.actionItems || [],
      followUps: local?.followUps || [],
      noise,
      live: true,
      ts: Date.now(),
    };
  } catch (err: any) {
    const local = loadLocalData();
    if (local) return { ...local, live: false, ts: Date.now() };
    return { emails: [], calToday: [], calTomorrow: [], live: false, error: err.message, ts: Date.now() };
  }
}
