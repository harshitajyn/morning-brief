"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./components/colors";
import { Badge } from "./components/Badge";
import { CheckIcon } from "./components/CheckIcon";
import { LiveDot } from "./components/LiveDot";
import { Section } from "./components/Section";
import { SwipeableEmail } from "./components/SwipeableEmail";
import { VoicePlayer } from "./components/VoicePlayer";
import { Sheet } from "./components/Sheet";
import { LoadingSkeleton } from "./components/LoadingSkeleton";

// ═══════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════
const QUOTES = [
  {t:"Focus is not about saying yes. It's about saying no.",a:"Steve Jobs"},
  {t:"Deep work is the ability to focus without distraction on a cognitively demanding task.",a:"Cal Newport"},
  {t:"Attention is the rarest and purest form of generosity.",a:"Simone Weil"},
  {t:"Until we can manage time, we can manage nothing else.",a:"Peter Drucker"},
  {t:"The key is not to prioritize what's on your schedule, but to schedule your priorities.",a:"Stephen Covey"},
  {t:"Concentrate all your thoughts upon the work at hand.",a:"Alexander Graham Bell"},
  {t:"Almost everything will work again if you unplug it for a few minutes, including you.",a:"Anne Lamott"},
  {t:"Time is what we want most, but what we use worst.",a:"William Penn"},
  {t:"Do the hard jobs first. The easy jobs will take care of themselves.",a:"Dale Carnegie"},
  {t:"It is not enough to be busy. The question is: what are we busy about?",a:"Henry David Thoreau"},
];
const EVE_QUOTES = [
  {t:"Finish each day and be done with it. Tomorrow is a new day.",a:"Ralph Waldo Emerson"},
  {t:"Rest is not idleness. It is the most productive thing you can do for tomorrow.",a:"Dalai Lama"},
  {t:"An evening review is the bridge between today's actions and tomorrow's intentions.",a:"Robin Sharma"},
  {t:"What is done is done. What is not done is a task for tomorrow.",a:"Seneca"},
  {t:"The night is the hardest time to be alive. But morning always comes.",a:"Ernest Hemingway"},
];
const todayQuote = QUOTES[new Date().getDate() % QUOTES.length];
const eveQuote = EVE_QUOTES[new Date().getDate() % EVE_QUOTES.length];

// ═══════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════
const SK = "mb_v4";
const load = () => { try { return JSON.parse(localStorage?.getItem?.(SK) || "null"); } catch { return null; } };
const save = (s: any) => { try { localStorage?.setItem?.(SK, JSON.stringify(s)); } catch {} };

// ═══════════════════════════════════════
// DYNAMIC TEXT HELPERS
// ═══════════════════════════════════════
function getDayInsight(calCount: number, isEvening: boolean, dayName: string) {
  if (isEvening) return "Review pending items before winding down";
  if (calCount <= 2) return `Light ${dayName} — great day for deep work`;
  return `${calCount} events today — plan focus time around them`;
}

function getFocusSubtitle(isEvening: boolean, calCount: number, dayName: string) {
  if (isEvening) return "Before you close out, check off what you got done:";
  if (calCount <= 2) return `${dayName} is light. Block 2-3 hours:`;
  return "Squeeze in focus time between meetings:";
}

// ═══════════════════════════════════════
// VOICE BRIEF (fully dynamic)
// ═══════════════════════════════════════
function generateVoiceBrief(emails: any[], isEvening: boolean, actionItems: any[], followUps: any[], calToday: any[], calTomorrow: any[]) {
  if (isEvening) {
    const oldest = followUps.length > 0 ? followUps.reduce((a: any, b: any) => a.days > b.days ? a : b) : null;
    return [
      `Hey Harshita, let's wrap up your day.`,
      actionItems.length > 0 ? `You still have ${actionItems.length} action items open — the most pressing one is ${actionItems[0].title}.` : `You cleared all your action items today — nice work.`,
      followUps.length > 0 && oldest ? `There are ${followUps.length} follow-ups outstanding. The longest is ${oldest.name} at ${oldest.days} days.` : ``,
      emails.length > 0 ? `${emails.length} priority emails are still unread.` : `You cleared all your priority emails today.`,
      calTomorrow.length > 0 ? `Looking ahead to tomorrow: you have ${calTomorrow.length} events.` : `Tomorrow looks clear.`,
      `Take a breath. Review what you got done, set your top three for tomorrow, and call it a day.`,
      `${eveQuote.t}. That's from ${eveQuote.a}.`,
      `Good night, Harshita.`,
    ].filter(Boolean).join(" ");
  }
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return [
    `Good morning, Harshita. Let's get you set up for ${dayName}.`,
    `You've got ${emails.length} priority emails waiting, ${calToday.length} things on your calendar, and ${actionItems.length} action items to work through.`,
    calToday.length <= 2 ? `Your calendar is pretty light today — this is a great window for deep, focused work.` : `It's a busier day with ${calToday.length} events, so plan your focus time around them.`,
    actionItems.length > 0 ? `The most urgent thing on your plate? ${actionItems[0].title}. I'd tackle that first.` : ``,
    followUps.length > 0 ? `Quick heads up — you have ${followUps.length} follow-ups waiting on other people.` : ``,
    `One more thing. ${todayQuote.t}. That's ${todayQuote.a}.`,
    `Have a great day.`,
  ].filter(Boolean).join(" ");
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function MorningBrief() {
  const saved = load();
  const [dismissed, setDismissed] = useState<string[]>(saved?.dismissed || []);
  const [tab, setTab] = useState(saved?.tab || "home");
  const [focusChecked, setFocusChecked] = useState<Record<string, boolean>>(saved?.focusChecked || {});
  const [sheet, setSheet] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live data state
  const [liveEmails, setLiveEmails] = useState<any[]>([]);
  const [liveCalToday, setLiveCalToday] = useState<any[]>([]);
  const [liveCalTomorrow, setLiveCalTomorrow] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [focusTasks, setFocusTasks] = useState<any[]>([]);
  const [noise, setNoise] = useState<string[]>([]);

  // Pull-to-refresh
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      const d = await res.json();
      if (d.emails) setLiveEmails(d.emails);
      if (d.calToday) setLiveCalToday(d.calToday);
      if (d.calTomorrow) setLiveCalTomorrow(d.calTomorrow);
      if (d.actionItems) setActionItems(d.actionItems);
      if (d.followUps) setFollowUps(d.followUps);
      if (d.noise) setNoise(d.noise);
      if (d.live) setIsLive(true);
    } catch {}
    // Fetch focus tasks
    try {
      const res = await fetch("/api/focus");
      const d = await res.json();
      if (d.tasks) setFocusTasks(d.tasks);
    } catch {}
    setLoading(false);
  }, []);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setNow(new Date());
    fetchData().finally(() => setTimeout(() => setRefreshing(false), 400));
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const iv = setInterval(doRefresh, 60000); return () => clearInterval(iv); }, [doRefresh]);
  useEffect(() => { const h = () => { if (document.visibilityState === "visible") doRefresh(); }; document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h); }, [doRefresh]);
  useEffect(() => { save({ dismissed, tab, focusChecked }); }, [dismissed, tab, focusChecked]);

  const hr = now.getHours();
  const isEvening = hr >= 17;
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const activeEmails = liveEmails.filter((e: any) => !dismissed.includes(e.id));
  const dismissEmail = useCallback((id: string) => { setDismissed(p => [...p, id]); }, []);
  const handleAction = useCallback((email: any, action: string) => { if (action === "reply") setSheet({ item: email, type: "reply" }); else if (action === "done") dismissEmail(email.id); }, [dismissEmail]);
  const toggleFocus = useCallback((id: string) => { setFocusChecked(p => ({ ...p, [id]: !p[id] })); }, []);

  const calEvents = isEvening ? liveCalTomorrow : liveCalToday;
  const q = isEvening ? eveQuote : todayQuote;
  const accent = isEvening ? C.eve : C.cal;
  const accentBg = isEvening ? C.eveBg : C.calBg;
  const pendingCount = actionItems.length + followUps.length;

  // Focus task management
  const [newTask, setNewTask] = useState("");
  const addFocusTask = async () => {
    if (!newTask.trim()) return;
    const res = await fetch("/api/focus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", text: newTask.trim() }) });
    const d = await res.json();
    setFocusTasks(d.tasks);
    setNewTask("");
  };
  const deleteFocusTask = async (id: string) => {
    const res = await fetch("/api/focus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    const d = await res.json();
    setFocusTasks(d.tasks);
  };

  // Pull-to-refresh handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setPullDistance(Math.min(dy * 0.4, 80));
  };
  const onTouchEnd = () => {
    if (pullDistance > 50) doRefresh();
    setPullDistance(0);
  };

  const tabs = [
    { id: "home", label: "Home", icon: isEvening ? "🌙" : "☀️" },
    { id: "email", label: "Email", icon: "✉️" },
    { id: "actions", label: "Pending", icon: <CheckIcon /> },
    { id: "focus", label: "Focus", icon: "🧘" },
  ];

  const voiceBriefGen = (emails: any[], eve: boolean) => generateVoiceBrief(emails, eve, actionItems, followUps, liveCalToday, liveCalTomorrow);

  return (
    <div
      ref={scrollRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="max-w-[390px] mx-auto min-h-screen relative pb-24 transition-colors duration-500"
      style={{ background: isEvening ? "#0F0F1A" : C.bg, fontFamily: "-apple-system,'SF Pro Display','SF Pro Text',system-ui,sans-serif" }}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center py-2 transition-all" style={{ height: pullDistance }}>
          <span className="text-lg" style={{ opacity: pullDistance / 80, transform: `rotate(${pullDistance * 4}deg)`, color: isEvening ? "#fff" : C.text }}>↻</span>
        </div>
      )}

      {/* Status Bar - minimal */}
      <div className="flex justify-end items-center px-6 pt-3">
        <button onClick={doRefresh} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-1.5 px-3 rounded-full text-[10px] font-bold transition-all" style={{ color: isLive ? C.live : C.later, opacity: refreshing ? 0.5 : 1, background: isLive ? C.liveBg : C.laterBg }}>
          <span className="inline-block transition-transform duration-500" style={{ transform: refreshing ? "rotate(360deg)" : "rotate(0)" }}>↻</span>
          {isLive ? <LiveDot /> : <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: C.later }} />}
          <span>{isLive ? "Synced" : "Offline"}</span>
        </button>
      </div>

      {/* Header with gradient title */}
      <div className="px-6 pt-2">
        <p className="text-[13px] font-medium m-0" style={{ color: isEvening ? "rgba(255,255,255,0.4)" : C.light }}>{dateStr}</p>
        <h1 className="text-[32px] font-black m-0 mt-0.5 tracking-tighter" style={{
          background: isEvening ? "linear-gradient(135deg, #818CF8, #C084FC)" : "linear-gradient(135deg, #1A1A2E, #4F7FFF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>{isEvening ? "Evening Brief" : "Morning Brief"}</h1>
        <p className="text-sm mt-1" style={{ color: isEvening ? "rgba(255,255,255,0.5)" : C.muted }}>{isEvening ? "Let's wrap up your day, Harshita." : "Hey Harshita — here's your day at a glance."}</p>
      </div>

      <div className="px-5 pb-5">
        {loading ? <LoadingSkeleton /> : <>

        {/* ═══ HOME ═══ */}
        {tab === "home" && <>
          {/* Summary Grid */}
          <div className="mt-5 rounded-[22px] p-5" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 4px 20px ${C.shadow}, 0 0 0 1px ${C.border}`, border: isEvening ? `1px solid rgba(255,255,255,0.08)` : "none" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider m-0 mb-3" style={{ color: isEvening ? "rgba(255,255,255,0.35)" : C.light }}>{isEvening ? "End of day snapshot" : "Today at a glance"}</p>
            <div className="grid grid-cols-2 gap-3">
              {(isEvening ? [
                { num: activeEmails.length, label: "emails still unread", icon: "✉️", color: C.email, bg: C.emailBg, grad: "linear-gradient(135deg, #EEF3FF, #E0EAFF)" },
                { num: actionItems.length, label: "actions still open", icon: "🔴", color: C.urgent, bg: C.urgentBg, grad: "linear-gradient(135deg, #FFF0F0, #FFE0E0)" },
                { num: followUps.length, label: "follow-ups pending", icon: "🔁", color: C.later, bg: C.laterBg, grad: "linear-gradient(135deg, #FFFBEB, #FFF3D0)" },
                { num: liveCalTomorrow.length, label: "events tomorrow", icon: "📅", color: C.eve, bg: C.eveBg, grad: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" },
              ] : [
                { num: activeEmails.length, label: "priority emails", icon: "✉️", color: C.email, bg: C.emailBg, grad: "linear-gradient(135deg, #EEF3FF, #E0EAFF)" },
                { num: liveCalToday.length, label: "meetings today", icon: "📅", color: C.cal, bg: C.calBg, grad: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" },
                { num: actionItems.length, label: "action items", icon: "🔴", color: C.urgent, bg: C.urgentBg, grad: "linear-gradient(135deg, #FFF0F0, #FFE0E0)" },
                { num: followUps.length, label: "follow-ups", icon: "🔁", color: C.later, bg: C.laterBg, grad: "linear-gradient(135deg, #FFFBEB, #FFF3D0)" },
              ]).map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: isEvening ? "rgba(255,255,255,0.06)" : s.grad }}>
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-2xl font-black m-0 leading-none" style={{ color: isEvening ? "#fff" : s.color }}>{s.num}</p>
                    <p className="text-[10px] m-0 mt-1 font-semibold" style={{ color: isEvening ? "rgba(255,255,255,0.5)" : C.muted }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold m-0 mt-3 text-center" style={{ color: isEvening ? "rgba(255,255,255,0.4)" : accent }}>{getDayInsight(calEvents.length, isEvening, dayName)}</p>
          </div>

          {/* Voice */}
          <VoicePlayer emails={activeEmails} isEvening={isEvening} generateVoiceBrief={voiceBriefGen} />

          {/* Emails FIRST (above calendar) */}
          <Section icon="✉️" title={isEvening ? "Still Unread" : "Priority Emails"} count={activeEmails.length} color={C.email} live />
          {activeEmails.length === 0 ? (
            <div className="rounded-xl p-3.5 text-center" style={{ background: C.emailBg }}>
              <p className="text-[13px] font-semibold m-0" style={{ color: C.email }}>{isEvening ? "You cleared your inbox today" : "All clear — inbox zero on priorities"}</p>
            </div>
          ) : activeEmails.map((e: any) => <SwipeableEmail key={e.id} email={e} onDismiss={dismissEmail} onAction={handleAction} />)}

          {/* Calendar */}
          <Section icon="📅" title={isEvening ? "Tomorrow" : "Today's Calendar"} count={calEvents.length} color={accent} live />
          {calEvents.map((e: any) => (
            <div key={e.id} onClick={() => setSheet({ item: e, type: "cal" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px] active:scale-[0.98]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}`, borderLeft: `4px solid ${accent}`, border: isEvening ? `1px solid rgba(255,255,255,0.08)` : undefined, borderLeftWidth: "4px", borderLeftColor: accent }}>
              <div className="flex gap-3.5 items-center">
                <div className="min-w-[60px] text-center">
                  <p className="text-[13px] font-bold m-0" style={{ color: accent }}>{e.time}</p>
                  {e.end && <p className="text-[11px] m-0 mt-0.5" style={{ color: C.muted }}>{e.end}</p>}
                </div>
                <div className="w-0.5 h-8 rounded-sm" style={{ background: accentBg }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold m-0" style={{ color: C.text }}>{e.title}</p>
                  <p className="text-xs m-0 mt-0.5" style={{ color: C.muted }}>{e.note}</p>
                </div>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}

          {/* Pending Items (consolidated) */}
          <Section icon={<CheckIcon />} title={isEvening ? "Still Pending" : "Pending Items"} count={pendingCount} color={C.urgent} />
          {actionItems.map((a: any) => (
            <div key={a.id} onClick={() => setSheet({ item: a, type: "urgent" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px] active:scale-[0.98]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}`, borderLeft: `4px solid ${C.urgent}` }}>
              <div className="flex items-center gap-2">
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg} />
                <p className="text-sm font-semibold m-0 flex-1" style={{ color: C.text }}>{a.title}</p>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}
          {followUps.map((f: any) => (
            <div key={f.id} onClick={() => setSheet({ item: f, type: "follow" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px] active:scale-[0.98]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}`, borderLeft: `4px solid ${C.urgent}` }}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-semibold m-0" style={{ color: C.text }}>{f.task}</p>
                  <div className="flex gap-1.5 mt-1 items-center">
                    <span className="text-xs" style={{ color: C.muted }}>{f.name}</span>
                    <Badge text={`${f.days}d`} color={f.days >= 4 ? C.urgent : C.later} bg={f.days >= 4 ? C.urgentBg : C.laterBg} />
                    <Badge text={f.status} color={C.muted} bg={C.border} />
                  </div>
                </div>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}

          {/* Filtered */}
          {noise.length > 0 && <>
            <Section icon="🔇" title="Filtered Out" count={noise.length} color={C.light} />
            <div className="rounded-2xl px-4 py-3" style={{ background: C.card, boxShadow: `0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              {noise.map((n: string, i: number) => <p key={i} className="text-xs m-0 my-[3px] leading-relaxed" style={{ color: C.light }}>• {n}</p>)}
            </div>
          </>}
        </>}

        {/* ═══ EMAIL TAB ═══ */}
        {tab === "email" && <>
          <Section icon="✉️" title="Priority Emails" count={activeEmails.length} color={C.email} live />
          <p className="text-xs mb-3" style={{ color: C.muted }}>Swipe left to remove. Tap Reply or Done.</p>
          {activeEmails.length === 0
            ? <div className="rounded-xl p-3.5 text-center" style={{ background: C.emailBg }}><p className="text-[13px] font-semibold m-0" style={{ color: C.email }}>All clear</p></div>
            : activeEmails.map((e: any) => <SwipeableEmail key={e.id} email={e} onDismiss={dismissEmail} onAction={handleAction} />)
          }
          <Section icon={<CheckIcon />} title="Pending" count={pendingCount} color={C.urgent} />
          {actionItems.map((a: any) => (
            <div key={a.id} onClick={() => setSheet({ item: a, type: "urgent" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              <div className="flex items-center gap-2">
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg} />
                <p className="text-sm font-semibold m-0 flex-1" style={{ color: C.text }}>{a.title}</p>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}
          {followUps.map((f: any) => (
            <div key={f.id} onClick={() => setSheet({ item: f, type: "follow" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              <div className="flex justify-between items-center">
                <div><p className="text-sm font-semibold m-0" style={{ color: C.text }}>{f.task}</p><div className="flex gap-1.5 mt-1"><span className="text-xs" style={{ color: C.muted }}>{f.name}</span><Badge text={`${f.days}d`} color={f.days >= 4 ? C.urgent : C.later} bg={f.days >= 4 ? C.urgentBg : C.laterBg} /></div></div>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}
          {noise.length > 0 && <>
            <Section icon="🔇" title="Filtered Noise" count={noise.length} color={C.light} />
            <div className="rounded-2xl px-4 py-3" style={{ background: C.card, boxShadow: `0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              {noise.map((n: string, i: number) => <p key={i} className="text-xs m-0 my-[3px] leading-relaxed" style={{ color: C.light }}>• {n}</p>)}
            </div>
          </>}
        </>}

        {/* ═══ ACTIONS TAB (consolidated as Pending) ═══ */}
        {tab === "actions" && <>
          <Section icon={<CheckIcon />} title="Pending Items" count={pendingCount} color={C.urgent} />
          {actionItems.map((a: any) => (
            <div key={a.id} onClick={() => setSheet({ item: a, type: "urgent" })} className="rounded-2xl px-4 py-3.5 mb-2 cursor-pointer" style={{ background: C.card, boxShadow: `0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              <div className="flex items-center gap-2">
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg} />
                <p className="text-sm font-semibold m-0 flex-1" style={{ color: C.text }}>{a.title}</p>
                <span style={{ color: C.light }}>›</span>
              </div>
              {a.detail && <p className="text-xs m-0 mt-1.5 leading-relaxed" style={{ color: C.muted }}>{a.detail}</p>}
            </div>
          ))}
          {followUps.map((f: any) => (
            <div key={f.id} onClick={() => setSheet({ item: f, type: "follow" })} className="rounded-[20px] px-4 py-3 mb-2 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-[1px]" style={{ background: isEvening ? "rgba(255,255,255,0.04)" : C.card, boxShadow: isEvening ? "none" : `0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}` }}>
              <div className="flex justify-between items-center">
                <div><p className="text-sm font-semibold m-0" style={{ color: C.text }}>{f.task}</p><div className="flex gap-1.5 mt-1"><span className="text-xs" style={{ color: C.muted }}>{f.name}</span><Badge text={`${f.days}d`} color={f.days >= 4 ? C.urgent : C.later} bg={f.days >= 4 ? C.urgentBg : C.laterBg} /></div></div>
                <span style={{ color: C.light }}>›</span>
              </div>
            </div>
          ))}
        </>}

        {/* ═══ FOCUS TAB (editable) ═══ */}
        {tab === "focus" && <>
          <Section icon="🧘" title={isEvening ? "Wind Down" : "Suggested Focus"} color={C.focus} />
          <div className="rounded-[18px] p-5 mb-3" style={{ background: `linear-gradient(135deg,${C.focusBg},${C.card})`, border: `1.5px solid ${C.focus}22` }}>
            <p className="text-[17px] font-bold m-0" style={{ color: C.focus }}>{isEvening ? "Evening Review" : "Deep Work"}</p>
            <p className="text-[13px] m-0 mt-2 mb-4" style={{ color: C.muted }}>{getFocusSubtitle(isEvening, calEvents.length, dayName)}</p>
            {focusTasks.map((t: any) => (
              <div key={t.id} className="flex gap-2.5 items-center py-2 group">
                <div onClick={() => toggleFocus(t.id)} className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-all" style={{ border: `2px solid ${C.focus}`, background: focusChecked[t.id] ? C.focus : "transparent" }}>
                  {focusChecked[t.id] && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm flex-1 transition-all" style={{ color: focusChecked[t.id] ? C.muted : C.text, textDecoration: focusChecked[t.id] ? "line-through" : "none" }}>{t.text}</span>
                <button onClick={() => deleteFocusTask(t.id)} className="opacity-0 group-hover:opacity-100 text-xs bg-transparent border-none cursor-pointer px-1" style={{ color: C.dismiss }}>✕</button>
              </div>
            ))}
            {/* Add new task */}
            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addFocusTask()} placeholder="Add a focus task..." className="flex-1 text-sm bg-transparent border-none outline-none" style={{ color: C.text }} />
              <button onClick={addFocusTask} className="text-xs font-bold bg-transparent border-none cursor-pointer px-2 py-1 rounded-lg" style={{ color: C.focus, background: C.focusBg }}>Add</button>
            </div>
            <p className="text-xs font-semibold m-0 mt-3 text-center" style={{ color: C.focus }}>{Object.values(focusChecked).filter(Boolean).length}/{focusTasks.length} completed</p>
          </div>
          <div className="rounded-[14px] p-4" style={{ background: accentBg }}>
            <p className="text-sm font-semibold m-0 mb-1.5" style={{ color: accent }}>
              {isEvening ? `Tomorrow: ${liveCalTomorrow.length} events` : `${dayName}: ${calEvents.length} events`}
            </p>
            <p className="text-[13px] m-0 leading-relaxed" style={{ color: C.muted }}>
              {isEvening
                ? (liveCalTomorrow.length > 0 ? `First up: ${liveCalTomorrow[0].title} at ${liveCalTomorrow[0].time}. Plan accordingly.` : "Tomorrow looks clear. Rest well.")
                : (calEvents.length <= 2 ? `Light day. Use this ${dayName} wisely for deep work.` : `Busy day ahead with ${calEvents.length} events. Protect your focus blocks.`)
              }
            </p>
          </div>
        </>}

        {/* Bottom Quote */}
        <div className="mt-8 px-4 py-5 text-center" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-sm italic leading-relaxed m-0 mb-1.5" style={{ color: C.text }}>"{q.t}"</p>
          <p className="text-xs m-0" style={{ color: C.light }}>— {q.a}</p>
        </div>

        </>}
      </div>

      {/* Tab Bar — glass morphism */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] flex justify-around py-2 pb-6 z-50 transition-colors duration-500" style={{ background: isEvening ? "rgba(15,15,26,0.92)" : "rgba(250,250,250,0.88)", backdropFilter: "blur(20px) saturate(180%)", borderTop: `1px solid ${isEvening ? "rgba(255,255,255,0.06)" : C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="relative border-none cursor-pointer flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 active:scale-90" style={{ background: tab === t.id ? (isEvening ? "rgba(129,140,248,0.15)" : `${C.email}10`) : "transparent" }}>
            <span className={`flex items-center justify-center transition-transform duration-200 ${typeof t.icon === "string" ? "text-xl" : "text-base"}`} style={{ transform: tab === t.id ? "scale(1.1)" : "scale(1)" }}>{t.icon}</span>
            <span className="text-[10px]" style={{ fontWeight: tab === t.id ? 800 : 500, color: tab === t.id ? (isEvening ? "#818CF8" : C.email) : (isEvening ? "rgba(255,255,255,0.4)" : C.muted) }}>{t.label}</span>
          </button>
        ))}
      </div>

      {sheet && <Sheet item={sheet.item} type={sheet.type} onClose={() => setSheet(null)} />}
    </div>
  );
}
