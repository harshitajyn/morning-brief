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
  wa:"#25D366",waBg:"#E9FBF0",
  dismiss:"#FF6B6B",dismissBg:"#FFE8E8",
  done:"#4CAF50",doneBg:"#E8F5E9",
  later:"#FF9800",laterBg:"#FFF3E0",
  reply:"#6B7FD7",replyBg:"#EDEFFE",
  live:"#4CAF50",liveBg:"#E8F5E9",
  eve:"#6366F1",eveBg:"#EEF2FF",
};

// ════════════════════════════════════════════════════════════
// MOCK DATA
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

const INITIAL_EMAILS = [
  {id:"e1",from:"Erin Northern (Fazer Agency)",subject:"Peak XV x Fazer Weekly Status Report — 4/3",tag:"ACTION"},
  {id:"e2",from:"Mayur Gole (Verve Media)",subject:"Re: Peak XV & Verve Media — Mar'26 Invoice",tag:"CC'd"},
  {id:"e3",from:"Nikita Puri via Google Sheets",subject:"Surge Immersion 2026 Content Roll Out",tag:"SHARED DOC"},
  {id:"e4",from:"Shruthi Krishnan",subject:"Re: ClickHouse logo file",tag:"FYI"},
  {id:"e5",from:"Nikita Puri via Notion",subject:"Updates in Peak XV workspace",tag:"UPDATE"},
];

const CAL_TODAY = [
  {id:"c1",time:"9:00 AM",end:"9:30 AM",title:"Check in with people",note:"Recurring daily",prep:["Review yesterday's follow-up list","Check team Slack channels"]},
  {id:"c2",time:"10:45 PM",end:"11:00 PM",title:"Set goals for next day",note:"Recurring daily",prep:["Review what got done today","Identify top 3 priorities for tomorrow"]},
];

const CAL_TOMORROW = [
  {id:"ct1",time:"All day",end:"",title:"Monthly Excursion",note:"All-day event · 2 attendees",prep:["Confirm plans with co-attendee","Pack essentials"]},
  {id:"ct2",time:"10:45 PM",end:"11:00 PM",title:"Set goals for next day 🎯",note:"Recurring daily",prep:["Reflect on the excursion","Plan Monday priorities"]},
];

const ACTION_ITEMS = [
  {id:"a1",title:"Review & sign off Fazer status report",tag:"TODAY",detail:"Website launching May 29 (World Everest Day). Erin needs your approval on the weekly status report."},
  {id:"a2",title:"Confirm Verve Media invoice tracker",tag:"THIS WEEK",detail:"Mayur updated March invoice numbers. Verify they match your records and confirm to Vasiqa."},
  {id:"a3",title:"Review Surge Immersion Content Roll Out sheet",tag:"THIS WEEK",detail:"Nikita shared the content planning spreadsheet. Check assignments and timeline."},
];

const NOISE = [
  "3× Mimecast spam hold notifications",
  "3× Surge contact form submissions",
  "1× SBI Corporate Card statement",
  "1× Google Calendar daily digest",
  "1× CapitalCorn cold outreach",
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
const save=(s)=>{try{localStorage?.setItem?.(SK,JSON.stringify(s))}catch{}};

// ════════════════════════════════════════════════════════════
// BRIEF GENERATORS
// ════════════════════════════════════════════════════════════
function generateWhatsAppBrief(emails,isEvening) {
  const ds=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  if(isEvening){
    let m=`🌙 *EVENING BRIEF*\n${ds}\n\n`;
    m+=`📋 *STILL PENDING*\n`;
    ACTION_ITEMS.forEach((a,i)=>{m+=`${i+1}. ${a.title}\n`;});
    m+=`\n🔁 *FOLLOW-UPS OUTSTANDING*\n`;
    FOLLOW_UPS.forEach(f=>{m+=`• ${f.name} — ${f.task} (${f.days}d)\n`;});
    m+=`\n📅 *TOMORROW*\n`;
    CAL_TOMORROW.forEach(e=>{m+=`• ${e.time} — ${e.title}\n`;});
    m+=`\n✉️ *UNREAD PRIORITY* (${emails.length})\n`;
    emails.forEach(e=>{m+=`• [${e.tag}] ${e.from} — ${e.subject}\n`;});
    m+=`\n🧘 *WIND DOWN*\nReview what got done. Set tomorrow's top 3.\n\n`;
    m+=`💬 _"${eveQuote.t}"_\n— ${eveQuote.a}`;
    return m;
  }
  let m=`☀️ *MORNING BRIEF*\n${ds}\n\n`;
  m+=`📅 *CALENDAR* (${CAL_TODAY.length})\n`;
  CAL_TODAY.forEach(e=>{m+=`• ${e.time} — ${e.title}\n`;});
  m+=`\n✉️ *PRIORITY EMAILS* (${emails.length})\n`;
  emails.forEach(e=>{m+=`• [${e.tag}] ${e.from} — ${e.subject}\n`;});
  m+=`\n🔴 *ACTION ITEMS*\n`;
  ACTION_ITEMS.forEach((a,i)=>{m+=`${i+1}. ${a.title}\n`;});
  m+=`\n🔁 *FOLLOW-UPS*\n`;
  FOLLOW_UPS.forEach(f=>{m+=`• ${f.name} — ${f.task} (${f.days}d)\n`;});
  m+=`\n🧘 *FOCUS*\nBlock 2–3 hrs for content strategy.\n\n`;
  m+=`💬 _"${todayQuote.t}"_\n— ${todayQuote.a}`;
  return m;
}

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
    `You've got ${emails.length} priority emails waiting, ${CAL_TODAY.length} things on your calendar, and ${ACTION_ITEMS.length} action items to work through.`,
    CAL_TODAY.length<=2?`Your calendar is pretty light today — this is a great window for deep, focused work.`:`It's a busier day with ${CAL_TODAY.length} meetings, so plan your focus time around them.`,
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
const WA_ICON = ()=>(
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

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

function WhatsAppModal({onClose,emails,isEvening}){
  const [phone,setPhone]=useState("");const [sent,setSent]=useState(false);const [preview,setPreview]=useState(false);
  const brief=generateWhatsAppBrief(emails,isEvening);
  const send=ph=>{const url=ph?`https://wa.me/${ph}?text=${encodeURIComponent(brief)}`:`https://wa.me/?text=${encodeURIComponent(brief)}`;window.open(url,"_blank");setSent(true);};
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(6px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:C.card,borderRadius:"24px 24px 0 0",padding:"16px 24px 40px",maxHeight:"85vh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.2,.8,.3,1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.wa,display:"flex",alignItems:"center",justifyContent:"center"}}><WA_ICON/></div>
          <div>
            <h2 style={{fontSize:18,fontWeight:700,color:C.text,margin:0}}>Send {isEvening?"Evening":"Morning"} Brief</h2>
            <p style={{fontSize:13,color:C.muted,margin:0}}>Opens WhatsApp with your brief pre-filled</p>
          </div>
        </div>
        <button onClick={()=>setPreview(!preview)} style={{width:"100%",padding:"10px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,background:preview?C.bg:C.card,cursor:"pointer",textAlign:"left",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{preview?"Hide":"Preview"} message</span>
          <span style={{fontSize:14,color:C.muted}}>{preview?"▲":"▼"}</span>
        </button>
        {preview&&<div style={{background:"#DCF8C6",borderRadius:14,padding:"14px 16px",marginBottom:16,maxHeight:240,overflowY:"auto",border:"1px solid #C5E8A5"}}><pre style={{fontSize:11,color:"#1a1a1a",margin:0,whiteSpace:"pre-wrap",fontFamily:"-apple-system,sans-serif",lineHeight:1.6}}>{brief}</pre></div>}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:6}}>Phone number (optional)</label>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 919876543210" style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:15,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={()=>send(phone)} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",cursor:"pointer",background:C.wa,color:"#fff",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"transform .12s"}}
        onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        ><WA_ICON/>{sent?"Sent — Tap again":"Send to WhatsApp"}</button>
        <button onClick={()=>{navigator.clipboard?.writeText(brief);setSent(true);}} style={{width:"100%",padding:"12px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,cursor:"pointer",marginTop:8,fontSize:14,fontWeight:600,color:C.muted}}>Copy to clipboard</button>
        <button onClick={onClose} style={{width:"100%",marginTop:8,padding:"12px",borderRadius:12,background:"transparent",border:"none",fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer"}}>Cancel</button>
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
  const [waModal,setWaModal]=useState(false);
  const [now,setNow]=useState(new Date());

  useEffect(()=>{const iv=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(iv);},[]);
  useEffect(()=>{save({dismissed,tab,focusChecked});},[dismissed,tab,focusChecked]);

  const hr=now.getHours();
  const isEvening=hr>=17;
  const timeStr=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
  const dateStr=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const activeEmails=INITIAL_EMAILS.filter(e=>!dismissed.includes(e.id));
  const dismissEmail=useCallback(id=>{setDismissed(p=>[...p,id]);},[]);
  const handleAction=useCallback((email,action)=>{if(action==="reply")setSheet({item:email,type:"reply"});else if(action==="done")dismissEmail(email.id);},[dismissEmail]);
  const toggleFocus=useCallback(id=>{setFocusChecked(p=>({...p,[id]:!p[id]}));},[]);

  const calEvents=isEvening?CAL_TOMORROW:CAL_TODAY;
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
        <div style={{display:"flex",gap:4,alignItems:"center"}}><LiveDot/><span style={{fontSize:10,color:C.live,marginLeft:4}}>Gmail + Calendar</span></div>
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
                {num:CAL_TOMORROW.length,label:"events tomorrow",icon:"📅",color:C.eve,bg:C.eveBg},
              ]:[
                {num:activeEmails.length,label:"priority emails",icon:"✉️",color:C.email,bg:C.emailBg},
                {num:CAL_TODAY.length,label:"meetings today",icon:"📅",color:C.cal,bg:C.calBg},
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

          {/* WhatsApp */}
          <div style={{marginTop:12}}>
            <button onClick={()=>setWaModal(true)} style={{width:"100%",padding:"14px 20px",borderRadius:14,border:"none",cursor:"pointer",background:C.wa,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 14px rgba(37,211,102,0.25)",transition:"transform .12s"}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            ><WA_ICON/><span style={{fontSize:15,fontWeight:700}}>Send {isEvening?"Evening":"Morning"} Brief to WhatsApp</span></button>
          </div>

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

          {/* Follow-ups */}
          <Section icon="🔁" title="Follow-ups Pending" count={FOLLOW_UPS.length} color={C.later}/>
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

          {/* Actions */}
          <Section icon={<CHECK_ICON/>} title={isEvening?"Still Pending":"Action Items"} count={ACTION_ITEMS.length} color={isEvening?C.urgent:C.urgent}/>
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

          {/* Filtered */}
          <Section icon="🔇" title="Filtered Out" count={NOISE.length} color={C.light}/>
          <div style={{background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`}}>
            {NOISE.map((n,i)=><p key={i} style={{fontSize:12,color:C.light,margin:"3px 0",lineHeight:1.5}}>• {n}</p>)}
          </div>
        </>}

        {/* ════ EMAIL TAB ════ */}
        {tab==="email"&&<>
          <Section icon="✉️" title="Priority Emails" count={activeEmails.length} color={C.email} live/>
          <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Swipe left to remove. Tap Reply, Later, or Done.</p>
          {activeEmails.length===0?<div style={{background:C.emailBg,borderRadius:12,padding:14,textAlign:"center"}}><p style={{fontSize:13,color:C.email,fontWeight:600,margin:0}}>All clear</p></div>
          :activeEmails.map(e=><SwipeableEmail key={e.id} email={e} onDismiss={dismissEmail} onAction={handleAction}/>)}
          <Section icon="🔇" title="Filtered Noise" count={NOISE.length} color={C.light}/>
          <div style={{background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:`0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`}}>
            {NOISE.map((n,i)=><p key={i} style={{fontSize:12,color:C.light,margin:"3px 0",lineHeight:1.5}}>• {n}</p>)}
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
      {waModal&&<WhatsAppModal onClose={()=>setWaModal(false)} emails={activeEmails} isEvening={isEvening}/>}
    </div>
  );
}
