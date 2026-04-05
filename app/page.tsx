"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const C = {
  bg:"#F7F5F0",card:"#FFFFFF",text:"#2D2D2D",muted:"#8A8A8A",light:"#B0A89A",
  border:"#EDE9E2",shadow:"rgba(0,0,0,0.04)",
  urgent:"#E07A5F",urgentBg:"#FDF0EC",
  cal:"#5B8A72",calBg:"#EDF5F0",
  email:"#6B7FD7",emailBg:"#EDEFFE",
  focus:"#8B7EC8",focusBg:"#F0EDF8",
  dismiss:"#FF6B6B",dismissBg:"#FFE8E8",
  done:"#4CAF50",doneBg:"#E8F5E9",
  later:"#FF9800",laterBg:"#FFF3E0",
  reply:"#6B7FD7",replyBg:"#EDEFFE",
  live:"#4CAF50",liveBg:"#E8F5E9",
  eve:"#6366F1",eveBg:"#EEF2FF",
};

// ════════════════════════════════════════════════════════════
// DATA — fetched from /api/data when Google creds are configured,
//         falls back to snapshot from your real Gmail + Calendar
// ════════════════════════════════════════════════════════════
const QUOTES = [
  {t:"Focus is not about saying yes. It's about saying no.",a:"Steve Jobs"},
  {t:"Deep work is the ability to focus without distraction on a cognitively demanding task.",a:"Cal Newport"},
  {t:"Attention is the rarest and purest form of generosity.",a:"Simone Weil"},
  {t:"Until we can manage time, we can manage nothing else.",a:"Peter Drucker"},
  {t:"The key is not to prioritize what's on your schedule, but to schedule your priorities.",a:"Stephen Covey"},
  {t:"Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.",a:"Alexander Graham Bell"},
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
const todayQuote = QUOTES[new Date().getDate()%QUOTES.length];
const eveQuote = EVE_QUOTES[new Date().getDate()%EVE_QUOTES.length];

// Fallback data — snapshot from your real accounts
const FALLBACK_EMAILS = [
  {id:"e-19d5c224",from:"Surge (donotreply@wpvip.com)",subject:"Surge - Contact Us (Dr Rashmi MR)",tag:"UPDATE",account:"work",unread:true},
  {id:"e-19d5c0f3",from:"Helpdesk Peak XV",subject:"Mimecast: Potential Spam on hold for harshita@peakxv.com",tag:"FYI",account:"work",unread:true},
  {id:"e-personal-urgent",from:"Harshita Jain (harshita@peakxv.com)",subject:"Urgent",tag:"ACTION",account:"personal",unread:true},
  {id:"e-19d58de5",from:"Apple",subject:"Your Apple Account password has been reset",tag:"FYI",account:"work",unread:true},
];

const FALLBACK_CAL_TODAY = [
  {id:"c-excursion",time:"All day",end:"",title:"Monthly Excursion",note:"All-day event · 2 attendees"},
  {id:"c-virtues",time:"8:00 PM",end:"8:15 PM",title:"Write the three virtues",note:""},
  {id:"c-goals",time:"10:45 PM",end:"11:00 PM",title:"set goals for next day 🎯",note:"Recurring daily"},
];

const FALLBACK_CAL_TOMORROW = [
  {id:"ct-pilates",time:"6:15 AM",end:"8:15 AM",title:"Pilates 🏋️‍♀️",note:""},
  {id:"ct-happay",time:"10:00 AM",end:"10:15 AM",title:"🚨 Check Happay/ Ensure all bills are updated",note:"2 attendees"},
  {id:"ct-focus",time:"10:00 AM",end:"12:00 PM",title:"Focus time - PLS don't book unless urgent 🙏",note:"Focus time"},
  {id:"ct-standup",time:"12:00 PM",end:"1:00 PM",title:"Marketing Standup ✨",note:"Del-3-Aryabhatt (5) · 9 attendees"},
  {id:"ct-lunch",time:"1:30 PM",end:"2:00 PM",title:"lunch 🥗",note:""},
  {id:"ct-dna",time:"3:00 PM",end:"3:30 PM",title:"Founder's DNA Discussion",note:"SGP-26-Dhoni (4) · 6 attendees"},
  {id:"ct-neha",time:"3:45 PM",end:"4:05 PM",title:"{Zoom} 1:1 Weekly Catch Up: Harshita <> Neha",note:"Del-3-Aryabhatt (5) · 3 attendees"},
  {id:"ct-goals2",time:"10:45 PM",end:"11:00 PM",title:"set goals for next day 🎯",note:"Recurring daily"},
];

const FALLBACK_NOISE = [
  "4× Mimecast spam hold notifications",
  "3× Surge contact form submissions",
  "1× Google Calendar daily digest",
  "1× Apple Account password reset",
];

const ACTION_ITEMS = [
  {id:"a1",title:"Review & sign off Fazer status report",tag:"TODAY",detail:"Website launching May 29 (World Everest Day). Erin needs your approval on the weekly status report."},
  {id:"a2",title:"Confirm Verve Media invoice tracker",tag:"THIS WEEK",detail:"Mayur updated March invoice numbers. Verify they match your records and confirm to Vasiqa."},
  {id:"a3",title:"Review Surge Immersion Content Roll Out sheet",tag:"THIS WEEK",detail:"Nikita shared the content planning spreadsheet. Check assignments and timeline."},
];

const FOLLOW_UPS = [
  {id:"f1",name:"Erin (Fazer)",task:"Website launch sign-off",days:1,status:"waiting"},
  {id:"f2",name:"Vasiqa",task:"Verve Media invoice confirmation",days:3,status:"waiting"},
  {id:"f3",name:"Nikita Puri",task:"Immersion content sheet review",days:2,status:"in-progress"},
  {id:"f4",name:"Shweta Rajpal Kohli",task:"SPF × Surge collaboration next steps",days:5,status:"waiting"},
];

const FOCUS_TASKS = [
  {id:"ft1",text:"Draft first 'Company Zero-to-Two' essay outline"},
  {id:"ft2",text:"Finalize 3 LinkedIn post hooks"},
  {id:"ft3",text:"Define newsletter cadence + distribution plan"},
];

// ════════════════════════════════════════════════════════════
// STORAGE
// ════════════════════════════════════════════════════════════
const SK="mb_v3";
const load=()=>{try{return JSON.parse(localStorage?.getItem?.(SK)||"null")}catch{return null}};
const save=(s: any)=>{try{localStorage?.setItem?.(SK,JSON.stringify(s))}catch{}};
// ════════════════════════════════════════════════════════════
// BRIEF GENERATORS
// ════════════════════════════════════════════════════════════
function generateVoiceBrief(emails,isEvening) {
  if(isEvening){
    const pending=ACTION_ITEMS.length;
    const oldest=FOLLOW_UPS.reduce((a,b)=>a.days>b.days?a:b);
    return [
      `Hey Harshita, let's wrap up your day.`,
      `You still have ${pending} action items open — the most pressing one is the Fazer status report sign-off.`,
      `There are ${FOLLOW_UPS.length} follow-ups outstanding. The longest is ${oldest.name} at ${oldest.days} days.`,
      emails.length>0?`${emails.length} priority emails are still unread.`:`You cleared all your priority emails today — nice work.`,
      `Looking ahead to tomorrow: you have a Monthly Excursion planned for the full day, so keep that in mind when you set your priorities tonight.`,
      `Take a breath. Review what you got done, set your top three for tomorrow, and call it a day.`,
      `${eveQuote.t}. That's from ${eveQuote.a}.`,
      `Good night, Harshita.`,
    ].join(" ");
  }
  return [
    `Good morning, Harshita. Let's get you set up for the day.`,
    `You've got ${emails.length} priority emails waiting, ${FALLBACK_CAL_TODAY.length} things on your calendar, and ${ACTION_ITEMS.length} action items to work through.`,
    FALLBACK_CAL_TODAY.length<=2?`Your calendar is pretty light today — this is a great window for deep, focused work.`:`It's a busier day with ${FALLBACK_CAL_TODAY.length} meetings, so plan your focus time around them.`,
    `The most urgent thing on your plate? ${ACTION_ITEMS[0].title}. I'd tackle that first.`,
    FOLLOW_UPS.length>0?`Quick heads up — you have ${FOLLOW_UPS.length} follow-ups waiting on other people. The longest outstanding is ${FOLLOW_UPS.reduce((a,b)=>a.days>b.days?a:b).name}, now ${FOLLOW_UPS.reduce((a,b)=>a.days>b.days?a:b).days} days.`:``,
    `For your focus block, I'd suggest working on the content strategy — specifically drafting that first Company Zero-to-Two essay outline.`,
    `One more thing. ${todayQuote.t}. That's ${todayQuote.a}.`,
    `Have a great day.`,
  ].filter(Boolean).join(" ");
}

// ════════════════════════════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════════════════════════════
const CHECK_ICON = ()=>(
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.done} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);

function Badge({text,color,bg}){return <span style={{fontSize:10,fontWeight:700,color,background:bg,padding:"2px 8px",borderRadius:6,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{text}</span>}
function LiveDot(){return <span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:C.live,boxShadow:"0 0 4px #4CAF50"}}/>}

function PillButton({label,icon,color,bg,onClick}){
  return <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${color}22`,background:bg,cursor:"pointer",fontSize:11,fontWeight:600,color,transition:"transform .12s"}}
  onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
  >{icon&&<span style={{fontSize:12}}>{icon}</span>}{label}</button>;
}

function Section({icon,title,count,color,live}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:24}}>
      <div style={{width:28,height:28,borderRadius:8,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{icon}</div>
      <span style={{fontSize:15,fontWeight:700,color:C.text,letterSpacing:-.3}}>{title}</span>
      {count!==undefined&&<span style={{fontSize:11,fontWeight:600,color:C.muted,background:C.border,borderRadius:10,padding:"2px 8px"}}>{count}</span>}
      {live&&<span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:C.live,background:C.liveBg,padding:"2px 8px",borderRadius:6}}><LiveDot/> LIVE</span>}
    </div>
  );
}

function SwipeableEmail({email,onDismiss,onAction}){
  const startX=useRef(0);
  const [offset,setOffset]=useState(0);
  const [gone,setGone]=useState(false);
  const [swiping,setSwiping]=useState(false);
  if(gone) return null;
  const onS=x=>{startX.current=x;setSwiping(true);};
  const onM=x=>{if(!swiping)return;const dx=x-startX.current;if(dx<0)setOffset(dx);};
  const onE=()=>{setSwiping(false);if(offset<-90){setGone(true);setTimeout(()=>onDismiss(email.id),250);}else setOffset(0);};
  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:16,marginBottom:8,opacity:gone?0:1,transition:"opacity .25s"}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:110,background:C.dismiss,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 16px 16px 0"}}>
        <span style={{color:"#fff",fontSize:12,fontWeight:700}}>Remove</span>
      </div>
      <div style={{background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,transform:`translateX(${offset}px)`,transition:swiping?"none":"transform .25s cubic-bezier(.2,.8,.3,1)",position:"relative",zIndex:2,userSelect:"none",touchAction:"pan-y"}}
        onMouseDown={e=>onS(e.clientX)} onMouseMove={e=>{if(swiping)onM(e.clientX)}} onMouseUp={onE} onMouseLeave={()=>{if(swiping)onE()}}
        onTouchStart={e=>onS(e.touches[0].clientX)} onTouchMove={e=>onM(e.touches[0].clientX)} onTouchEnd={onE}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Badge text={email.tag} color={C.email} bg={C.emailBg}/>
          {email.account==="personal"&&<Badge text="PERSONAL" color={C.focus} bg={C.focusBg}/>}
          <span style={{fontSize:10,color:C.light,marginLeft:"auto"}}>← swipe</span>
        </div>
        <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"4px 0 2px"}}>{email.from}</p>
        <p style={{fontSize:13,color:C.muted,margin:"0 0 8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email.subject}</p>
        <div style={{display:"flex",gap:6}}>
          <PillButton label="Reply" icon="↩" color={C.reply} bg={C.replyBg} onClick={e=>{e.stopPropagation();onAction(email,"reply");}}/>
          <PillButton label="Later" icon="⏰" color={C.later} bg={C.laterBg} onClick={e=>{e.stopPropagation();onAction(email,"later");}}/>
          <PillButton label="Done" icon="✓" color={C.done} bg={C.doneBg} onClick={e=>{e.stopPropagation();onDismiss(email.id);}}/>
        </div>
      </div>
    </div>
  );
}

// ─── VOICE PLAYER (compact + sleek) ───
function VoicePlayer({emails,isEvening}){
  const [st,setSt]=useState("idle");
  const play=()=>{const u=new SpeechSynthesisUtterance(generateVoiceBrief(emails,isEvening));u.rate=0.95;u.pitch=1;u.lang="en-US";u.onend=()=>setSt("idle");u.onerror=()=>setSt("idle");window.speechSynthesis.cancel();window.speechSynthesis.speak(u);setSt("playing");};
  const pause=()=>{window.speechSynthesis.pause();setSt("paused");};
  const resume=()=>{window.speechSynthesis.resume();setSt("playing");};
  const stop=()=>{window.speechSynthesis.cancel();setSt("idle");};
  const accent=isEvening?C.eve:"#1D1D1F";
  return(
    <div style={{background:isEvening?"linear-gradient(135deg,#1e1b4b,#312e81)":"linear-gradient(135deg,#1D1D1F,#2D2D3F)",borderRadius:16,padding:"14px 18px",marginTop:16,display:"flex",alignItems:"center",gap:14}}>
      <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:17}}>{st==="playing"?"🔊":"🎙"}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:0}}>Listen to the summary</p>
        <p style={{fontSize:11,color:"rgba(255,255,255,.45)",margin:"2px 0 0"}}>{st==="playing"?"Speaking...":st==="paused"?"Paused":"Tap play"}</p>
      </div>
      <div style={{display:"flex",gap:6}}>
        {st==="idle"&&<button onClick={play} style={{width:36,height:36,borderRadius:10,border:"none",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:accent,transition:"transform .12s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>▶</button>}
        {st==="playing"&&<>
          <button onClick={pause} style={{width:36,height:36,borderRadius:10,border:"1.5px solid rgba(255,255,255,.25)",background:"transparent",cursor:"pointer",color:"#fff",fontSize:13}}>⏸</button>
          <button onClick={stop} style={{width:36,height:36,borderRadius:10,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",cursor:"pointer",color:"rgba(255,255,255,.6)",fontSize:13}}>⏹</button>
        </>}
        {st==="paused"&&<>
          <button onClick={resume} style={{width:36,height:36,borderRadius:10,border:"none",background:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,color:accent}}>▶</button>
          <button onClick={stop} style={{width:36,height:36,borderRadius:10,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",cursor:"pointer",color:"rgba(255,255,255,.6)",fontSize:13}}>⏹</button>
        </>}
      </div>
    </div>
  );
}

// ─── SHEETS ───
function Sheet({item,type,onClose}){
  if(!item)return null;
  const colors={urgent:C.urgent,cal:C.cal,email:C.email,focus:C.focus,follow:C.later,reply:C.reply};
  const c=colors[type]||C.urgent;
  return(
    <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",backdropFilter:"blur(6px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:C.card,borderRadius:"24px 24px 0 0",padding:"12px 24px 40px",maxHeight:"75vh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.2,.8,.3,1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{width:8,height:8,borderRadius:4,background:c}}/>
          <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:c}}>{type==="cal"?"calendar":type}</span>
        </div>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:"0 0 8px",lineHeight:1.3}}>{item.title||item.subject||item.task||""}</h2>
        {item.from&&<p style={{fontSize:13,color:C.muted}}>From: <strong style={{color:C.text}}>{item.from}</strong></p>}
        {item.detail&&<p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginTop:10}}>{item.detail}</p>}
        {item.note&&<p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginTop:10}}>{item.note}</p>}
        {item.time&&item.end&&<p style={{fontSize:13,color:c,fontWeight:600,marginTop:6}}>{item.time} – {item.end}</p>}
        {item.name&&<p style={{fontSize:13,color:C.muted,marginTop:4}}>Contact: <strong style={{color:C.text}}>{item.name}</strong> · {item.days}d waiting</p>}
        {item.prep&&item.prep.length>0&&(
          <div style={{marginTop:14,padding:14,background:C.calBg,borderRadius:12}}>
            <p style={{fontSize:12,fontWeight:700,color:C.cal,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:.5}}>Prep Notes</p>
            {item.prep.map((p,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0"}}><div style={{width:16,height:16,borderRadius:4,border:`2px solid ${C.cal}`,flexShrink:0}}/><span style={{fontSize:13,color:C.text}}>{p}</span></div>)}
          </div>
        )}
        {type==="reply"&&(
          <div style={{marginTop:14,padding:14,background:C.emailBg,borderRadius:12}}>
            <p style={{fontSize:12,fontWeight:700,color:C.email,margin:"0 0 8px"}}>Draft Reply</p>
            <p style={{fontSize:13,color:C.text,lineHeight:1.6,fontStyle:"italic"}}>Hi {item.from?.split(" ")[0]}, thanks for this — reviewing now and will get back to you shortly. Best, Harshita</p>
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",marginTop:20,padding:"14px",borderRadius:14,background:c,color:"#fff",border:"none",fontSize:15,fontWeight:600,cursor:"pointer",transition:"transform .12s"}}
        onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >Done</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════
export default function MorningBrief(){
  const saved=load();
  const [dismissed,setDismissed]=useState(saved?.dismissed||[]);
  const [tab,setTab]=useState(saved?.tab||"home");
  const [focusChecked,setFocusChecked]=useState(saved?.focusChecked||{});
  const [sheet,setSheet]=useState(null);
  const [now,setNow]=useState(new Date());

  const [lastRefresh,setLastRefresh]=useState(now);
  const [refreshing,setRefreshing]=useState(false);
  const [isLive,setIsLive]=useState(false);

  // Live data state — starts with fallback, replaced by API data when available
  const [liveEmails,setLiveEmails]=useState(FALLBACK_EMAILS);
  const [liveCalToday,setLiveCalToday]=useState(FALLBACK_CAL_TODAY);
  const [liveCalTomorrow,setLiveCalTomorrow]=useState(FALLBACK_CAL_TOMORROW);

  const fetchData=useCallback(async()=>{
    try{
      const res=await fetch("/api/data",{cache:"no-store"});
      const d=await res.json();
      if(d.live){
        setLiveEmails(d.emails||[]);
        if(d.calToday?.length>0) setLiveCalToday(d.calToday);
        if(d.calTomorrow?.length>0) setLiveCalTomorrow(d.calTomorrow);
        setIsLive(true);
      }
    }catch{}
  },[]);

  const doRefresh=useCallback(()=>{
    setRefreshing(true);
    setNow(new Date());
    setLastRefresh(new Date());
    fetchData().finally(()=>setTimeout(()=>setRefreshing(false),400));
  },[fetchData]);

  // Fetch on mount
  useEffect(()=>{fetchData();},[fetchData]);
  // Auto-refresh every 60 seconds
  useEffect(()=>{const iv=setInterval(()=>doRefresh(),60000);return()=>clearInterval(iv);},[doRefresh]);
  // Refresh when tab becomes visible again
  useEffect(()=>{const handler=()=>{if(document.visibilityState==="visible")doRefresh();};document.addEventListener("visibilitychange",handler);return()=>document.removeEventListener("visibilitychange",handler);},[doRefresh]);
  useEffect(()=>{save({dismissed,tab,focusChecked});},[dismissed,tab,focusChecked]);

  const hr=now.getHours();
  const isEvening=hr>=17;
  const timeStr=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
  const dateStr=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const activeEmails=liveEmails.filter(e=>!dismissed.includes(e.id));
  const dismissEmail=useCallback(id=>{setDismissed(p=>[...p,id]);},[]);
  const handleAction=useCallback((email,action)=>{if(action==="reply")setSheet({item:email,type:"reply"});else if(action==="done")dismissEmail(email.id);},[dismissEmail]);
  const toggleFocus=useCallback(id=>{setFocusChecked(p=>({...p,[id]:!p[id]}));},[]);

  const calEvents=isEvening?liveCalTomorrow:liveCalToday;
  const q=isEvening?eveQuote:todayQuote;
  const accent=isEvening?C.eve:C.cal;
  const accentBg=isEvening?C.eveBg:C.calBg;

  const tabs=[
    {id:"home",label:"Home",icon:isEvening?"🌙":"☀️"},
    {id:"email",label:"Email",icon:"✉️"},
    {id:"actions",label:"Actions",icon:<CHECK_ICON/>},
    {id:"focus",label:"Focus",icon:"🧘"},
  ];

  return(
    <div style={{maxWidth:390,margin:"0 auto",minHeight:"100vh",background:isEvening?"#F0EDF8":C.bg,fontFamily:"-apple-system,'SF Pro Display','SF Pro Text',system-ui,sans-serif",position:"relative",paddingBottom:90,transition:"background .5s ease"}}>

      {/* Status Bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 24px 0",color:C.muted,fontSize:12,fontWeight:600}}>
        <span>{timeStr}</span>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={doRefresh} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,color:isLive?C.live:C.later,fontSize:10,fontWeight:700,transition:"opacity .2s",opacity:refreshing?0.5:1}}>
            <span style={{display:"inline-block",transition:"transform .6s",transform:refreshing?"rotate(360deg)":"rotate(0deg)"}}>↻</span>
            {isLive?<LiveDot/>:<span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:C.later}}/>}
            <span>{isLive?"Gmail + Calendar":"Offline · tap to sync"}</span>
          </button>
        </div>
      </div>
      {/* Last updated */}
      <div style={{padding:"2px 24px 0",textAlign:"right"}}>
        <span style={{fontSize:9,color:C.light}}>Updated {lastRefresh.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}).toLowerCase()}{refreshing?" · refreshing…":""}</span>
      </div>

      {/* Header */}
      <div style={{padding:"14px 24px 0"}}>
        <p style={{fontSize:13,color:C.light,fontWeight:500,margin:0}}>{dateStr}</p>
        <h1 style={{fontSize:28,fontWeight:800,color:C.text,margin:"2px 0 0",letterSpacing:-.8}}>{isEvening?"Evening Brief":"Morning Brief"}</h1>
        <p style={{fontSize:14,color:C.muted,marginTop:4}}>{isEvening?"Let's wrap up your day, Harshita.":"Hey Harshita — here's your day at a glance."}</p>
      </div>

      <div style={{padding:"0 20px 20px"}}>

        {/* ════ HOME ════ */}
        {tab==="home"&&<>
          {/* Summary */}
          <div style={{marginTop:20,background:isEvening?"linear-gradient(135deg,#FFFFFF,#F0EDF8)":"linear-gradient(135deg,#FFFFFF,#F7F5F0)",borderRadius:18,padding:"18px 20px",boxShadow:`0 2px 8px ${C.shadow}, 0 0 0 1px ${C.border}`}}>
            <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,color:C.light,margin:"0 0 12px"}}>{isEvening?"End of day snapshot":"Today at a glance"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {(isEvening?[
                {num:activeEmails.length,label:"emails still unread",icon:"✉️",color:C.email,bg:C.emailBg},
                {num:ACTION_ITEMS.length,label:"actions still open",icon:"🔴",color:C.urgent,bg:C.urgentBg},
                {num:FOLLOW_UPS.length,label:"follow-ups pending",icon:"🔁",color:C.later,bg:C.laterBg},
                {num:liveCalTomorrow.length,label:"events tomorrow",icon:"📅",color:C.eve,bg:C.eveBg},
              ]:[
                {num:activeEmails.length,label:"priority emails",icon:"✉️",color:C.email,bg:C.emailBg},
                {num:liveCalToday.length,label:"meetings today",icon:"📅",color:C.cal,bg:C.calBg},
                {num:ACTION_ITEMS.length,label:"action items",icon:"🔴",color:C.urgent,bg:C.urgentBg},
                {num:FOLLOW_UPS.length,label:"follow-ups",icon:"🔁",color:C.later,bg:C.laterBg},
              ]).map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:s.bg,borderRadius:12,padding:"10px 12px"}}>
                  <span style={{fontSize:18}}>{s.icon}</span>
                  <div>
                    <p style={{fontSize:20,fontWeight:800,color:s.color,margin:0,lineHeight:1}}>{s.num}</p>
                    <p style={{fontSize:11,color:C.muted,margin:"2px 0 0",fontWeight:500}}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{fontSize:12,color:accent,fontWeight:600,margin:"12px 0 0",textAlign:"center"}}>{isEvening?"Review pending items before winding down 🌙":"Light Saturday — great day for deep work 🌿"}</p>
          </div>

          {/* Voice */}
          <VoicePlayer emails={activeEmails} isEvening={isEvening}/>

          {/* Calendar / Tomorrow */}
          <Section icon="📅" title={isEvening?"Tomorrow":"Today's Calendar"} count={calEvents.length} color={accent} live/>
          {calEvents.map(e=>(
            <div key={e.id} onClick={()=>setSheet({item:e,type:"cal"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer",transition:"transform .12s"}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{minWidth:60,textAlign:"center"}}><p style={{fontSize:13,fontWeight:700,color:accent,margin:0}}>{e.time}</p>{e.end&&<p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{e.end}</p>}</div>
                <div style={{width:2,height:32,background:accentBg,borderRadius:1}}/>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>{e.title}</p><p style={{fontSize:12,color:C.muted,margin:"2px 0 0"}}>{e.note}</p></div>
                <span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}

          {/* Emails */}
          <Section icon="✉️" title={isEvening?"Still Unread":"Priority Emails"} count={activeEmails.length} color={C.email} live/>
          {activeEmails.length===0?(
            <div style={{background:C.emailBg,borderRadius:12,padding:14,textAlign:"center"}}><p style={{fontSize:13,color:C.email,fontWeight:600,margin:0}}>{isEvening?"You cleared your inbox today":"All clear — inbox zero on priorities"}</p></div>
          ):(
            activeEmails.map(e=><SwipeableEmail key={e.id} email={e} onDismiss={dismissEmail} onAction={handleAction}/>)
          )}

          {/* Pending Items (Actions + Follow-ups consolidated) */}
          <Section icon={<CHECK_ICON/>} title={isEvening?"Still Pending":"Pending Items"} count={ACTION_ITEMS.length+FOLLOW_UPS.length} color={C.urgent}/>
          {ACTION_ITEMS.map(a=>(
            <div key={a.id} onClick={()=>setSheet({item:a,type:"urgent"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer",transition:"transform .12s"}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg}/>
                <p style={{fontSize:14,fontWeight:600,color:C.text,margin:0,flex:1}}>{a.title}</p>
                <span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}
          {FOLLOW_UPS.map(f=>(
            <div key={f.id} onClick={()=>setSheet({item:f,type:"follow"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer",transition:"transform .12s"}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}><p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>{f.task}</p>
                  <div style={{display:"flex",gap:6,marginTop:5,alignItems:"center"}}><span style={{fontSize:12,color:C.muted}}>{f.name}</span><Badge text={`${f.days}d`} color={f.days>=4?C.urgent:C.later} bg={f.days>=4?C.urgentBg:C.laterBg}/><Badge text={f.status} color={C.muted} bg={C.border}/></div>
                </div><span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}

          {/* Filtered */}
          <Section icon="🔇" title="Filtered Out" count={FALLBACK_NOISE.length} color={C.light}/>
          <div style={{background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`}}>
            {FALLBACK_NOISE.map((n,i)=><p key={i} style={{fontSize:12,color:C.light,margin:"3px 0",lineHeight:1.5}}>• {n}</p>)}
          </div>
        </>}

        {/* ════ EMAIL TAB ════ */}
        {tab==="email"&&<>
          <Section icon="✉️" title="Priority Emails" count={activeEmails.length} color={C.email} live/>
          <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Swipe left to remove. Tap Reply, Later, or Done.</p>
          {activeEmails.length===0?<div style={{background:C.emailBg,borderRadius:12,padding:14,textAlign:"center"}}><p style={{fontSize:13,color:C.email,fontWeight:600,margin:0}}>All clear</p></div>
          :activeEmails.map(e=><SwipeableEmail key={e.id} email={e} onDismiss={dismissEmail} onAction={handleAction}/>)}

          {/* Pending Items */}
          <Section icon={<CHECK_ICON/>} title="Pending" count={ACTION_ITEMS.length+FOLLOW_UPS.length} color={C.urgent}/>
          {ACTION_ITEMS.map(a=>(
            <div key={a.id} onClick={()=>setSheet({item:a,type:"urgent"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg}/>
                <p style={{fontSize:14,fontWeight:600,color:C.text,margin:0,flex:1}}>{a.title}</p><span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}
          {FOLLOW_UPS.map(f=>(
            <div key={f.id} onClick={()=>setSheet({item:f,type:"follow"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>{f.task}</p><div style={{display:"flex",gap:6,marginTop:4}}><span style={{fontSize:12,color:C.muted}}>{f.name}</span><Badge text={`${f.days}d`} color={f.days>=4?C.urgent:C.later} bg={f.days>=4?C.urgentBg:C.laterBg}/></div></div>
                <span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}

          <Section icon="🔇" title="Filtered Noise" count={FALLBACK_NOISE.length} color={C.light}/>
          <div style={{background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`}}>
            {FALLBACK_NOISE.map((n,i)=><p key={i} style={{fontSize:12,color:C.light,margin:"3px 0",lineHeight:1.5}}>• {n}</p>)}
          </div>
        </>}

        {/* ════ ACTIONS TAB ════ */}
        {tab==="actions"&&<>
          <Section icon={<CHECK_ICON/>} title="Action Items" count={ACTION_ITEMS.length} color={C.urgent}/>
          {ACTION_ITEMS.map(a=>(
            <div key={a.id} onClick={()=>setSheet({item:a,type:"urgent"})} style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Badge text={a.tag} color={C.urgent} bg={C.urgentBg}/>
                <p style={{fontSize:14,fontWeight:600,color:C.text,margin:0,flex:1}}>{a.title}</p><span style={{color:C.light}}>›</span>
              </div>
              {a.detail&&<p style={{fontSize:12,color:C.muted,margin:"6px 0 0",lineHeight:1.5}}>{a.detail}</p>}
            </div>
          ))}
          <Section icon="🔁" title="Follow-ups" count={FOLLOW_UPS.length} color={C.later}/>
          {FOLLOW_UPS.map(f=>(
            <div key={f.id} onClick={()=>setSheet({item:f,type:"follow"})} style={{background:C.card,borderRadius:16,padding:"12px 16px",marginBottom:8,boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>{f.task}</p><div style={{display:"flex",gap:6,marginTop:4}}><span style={{fontSize:12,color:C.muted}}>{f.name}</span><Badge text={`${f.days}d`} color={f.days>=4?C.urgent:C.later} bg={f.days>=4?C.urgentBg:C.laterBg}/></div></div>
                <span style={{color:C.light}}>›</span>
              </div>
            </div>
          ))}
        </>}

        {/* ════ FOCUS TAB ════ */}
        {tab==="focus"&&<>
          <Section icon="🧘" title={isEvening?"Wind Down":"Suggested Focus"} color={C.focus}/>
          <div style={{background:`linear-gradient(135deg,${C.focusBg},${C.card})`,borderRadius:18,padding:"20px",border:`1.5px solid ${C.focus}22`,marginBottom:12}}>
            <p style={{fontSize:17,fontWeight:700,color:C.focus,margin:0}}>{isEvening?"Evening Review":"Deep Work: Content Strategy"}</p>
            <p style={{fontSize:13,color:C.muted,margin:"8px 0 16px"}}>{isEvening?"Before you close out, check off what you got done:":"Saturday is wide open. Block 2–3 hours:"}</p>
            {FOCUS_TASKS.map(t=>(
              <div key={t.id} onClick={()=>toggleFocus(t.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",cursor:"pointer"}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${C.focus}`,background:focusChecked[t.id]?C.focus:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>
                  {focusChecked[t.id]&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontSize:14,color:focusChecked[t.id]?C.muted:C.text,textDecoration:focusChecked[t.id]?"line-through":"none",transition:"all .15s"}}>{t.text}</span>
              </div>
            ))}
            <p style={{fontSize:12,color:C.focus,fontWeight:600,margin:"12px 0 0",textAlign:"center"}}>{Object.values(focusChecked).filter(Boolean).length}/{FOCUS_TASKS.length} completed</p>
          </div>
          <div style={{background:accentBg,borderRadius:14,padding:16}}>
            <p style={{fontSize:14,fontWeight:600,color:accent,margin:"0 0 6px"}}>{isEvening?"Tomorrow: Monthly Excursion":"Calendar is clear"}</p>
            <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.6}}>{isEvening?"You have an all-day Monthly Excursion tomorrow plus your evening goal-setting. Plan accordingly.":"Only 2 recurring personal events. No external meetings. Use this Saturday wisely."}</p>
          </div>
        </>}

        {/* Bottom Quote */}
        <div style={{marginTop:32,padding:"20px 16px",borderTop:`1px solid ${C.border}`,textAlign:"center"}}>
          <p style={{fontSize:14,color:C.text,fontStyle:"italic",lineHeight:1.6,margin:"0 0 6px"}}>"{q.t}"</p>
          <p style={{fontSize:12,color:C.light,margin:0}}>— {q.a}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:390,background:isEvening?"rgba(240,237,248,0.94)":"rgba(247,245,240,0.94)",backdropFilter:"blur(16px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 24px",zIndex:50,transition:"background .5s ease"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 12px",transition:"transform .12s"}}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <span style={{fontSize:typeof t.icon==="string"?20:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?C.text:C.muted}}>{t.label}</span>
            {tab===t.id&&<div style={{width:4,height:4,borderRadius:2,background:C.text,marginTop:1}}/>}
          </button>
        ))}
      </div>

      {sheet&&<Sheet item={sheet.item} type={sheet.type} onClose={()=>setSheet(null)}/>}
    </div>
  );
}
