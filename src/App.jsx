import { useState, useEffect, useRef, useCallback, Component } from "react";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class EB extends Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  render() {
    if (this.state.e) return (
      <div style={{textAlign:"center",padding:48,color:"#64748B"}}>
        <div style={{fontSize:48,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:13,marginBottom:20}}>{this.state.e.message}</div>
        <button onClick={()=>this.setState({e:null})} style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:12,padding:"10px 22px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ξαναπροσπάθεια</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const KP = "lh17_";
const gls = (k,d) => { try { const v=localStorage.getItem(KP+k); return v!=null?JSON.parse(v):d; } catch { return d; } };
const sls = (k,v) => { try { localStorage.setItem(KP+k,JSON.stringify(v)); } catch {} };
function useLS(k,init) {
  const [v,sv] = useState(()=>gls(k,init));
  const upd = useCallback(fn=>sv(p=>{const n=typeof fn==="function"?fn(p):fn;sls(k,n);return n;}),[k]);
  return [v,upd];
}

// ─── AI ───────────────────────────────────────────────────────────────────────
const $c = new Map();
async function ai(sys, msg, json=false) {
  const key=(sys+msg).slice(0,100);
  if($c.has(key)) return $c.get(key);
  if(!navigator.onLine) return json?null:"📵 Χωρίς σύνδεση.";
  try {
    const ctrl=new AbortController();
    const t=setTimeout(()=>ctrl.abort(),15000);
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-allow-browser":"true"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:700,
        system:json?sys+" Απάντα ΜΟΝΟ valid JSON χωρίς backticks.":sys,
        messages:[{role:"user",content:msg}]})
    });
    clearTimeout(t);
    const d=await r.json();
    const txt=d.content?.[0]?.text||"";
    const out=json?(()=>{try{return JSON.parse(txt.replace(/```json|```/g,"").trim())}catch{return null}})():txt;
    if(out){$c.set(key,out);setTimeout(()=>$c.delete(key),300000);}
    return out||(json?null:"—");
  } catch(e) { return json?null:(e.name==="AbortError"?"⏱️ Timeout":"❌ Σφάλμα"); }
}

// ─── Voice Recognition Hook ───────────────────────────────────────────────────
function useVoice(onResult) {
  const [listening,setListening]=useState(false);
  const recRef=useRef(null);
  const start=useCallback(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Το browser σου δεν υποστηρίζει φωνητική εισαγωγή.");return;}
    const rec=new SR();
    rec.lang="el-GR";rec.continuous=false;rec.interimResults=false;
    rec.onstart=()=>setListening(true);
    rec.onend=()=>setListening(false);
    rec.onerror=()=>setListening(false);
    rec.onresult=e=>{const t=e.results[0][0].transcript;onResult(t);};
    rec.start();recRef.current=rec;
  },[onResult]);
  const stop=useCallback(()=>{recRef.current?.stop();setListening(false);},[]);
  return{listening,start,stop};
}

// ─── Name Days ────────────────────────────────────────────────────────────────
const ND={"01-01":["Βασίλης","Βασιλική"],"01-07":["Γιάννης","Ιωάννα"],"01-17":["Αντώνης"],"01-18":["Αθανάσιος"],"02-10":["Χαράλαμπος"],"03-25":["Βαγγέλης","Ευαγγελία"],"04-23":["Γεώργιος","Γεωργία"],"05-21":["Κωνσταντίνος","Ελένη"],"06-29":["Πέτρος","Παύλος"],"07-17":["Μαρίνα"],"07-20":["Ηλίας"],"07-26":["Παρασκευή"],"07-27":["Παντελής"],"08-15":["Παναγιώτης","Παναγιώτα"],"09-14":["Σταύρος"],"10-26":["Δημήτριος","Δήμητρα"],"11-08":["Μιχαήλ"],"11-25":["Αικατερίνη"],"11-30":["Ανδρέας"],"12-06":["Νικόλαος"],"12-12":["Σπυρίδων"]};
const ndToday=()=>{const d=new Date();return ND[`${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`]||[];};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const LT={bg:"#F8F9FC",card:"#FFFFFF",border:"#ECEEF2",text:"#0F172A",sub:"#64748B",mute:"#CBD5E1",blue:"#2563EB",blueBg:"#EFF6FF",green:"#16A34A",greenBg:"#F0FDF4",red:"#DC2626",redBg:"#FEF2F2",orange:"#EA580C",orangeBg:"#FFF7ED",yellow:"#CA8A04",yellowBg:"#FEFCE8",purple:"#7C3AED",purpleBg:"#F5F3FF",sh:"0 1px 3px rgba(0,0,0,.06)"};
const DT={bg:"#0D1117",card:"#161B22",border:"#21262D",text:"#E6EDF3",sub:"#7D8590",mute:"#30363D",blue:"#58A6FF",blueBg:"#0D2035",green:"#3FB950",greenBg:"#0A2317",red:"#F85149",redBg:"#250A0A",orange:"#F0883E",orangeBg:"#271300",yellow:"#E3B341",yellowBg:"#241E00",purple:"#BC8CFF",purpleBg:"#1C0F30",sh:"0 1px 3px rgba(0,0,0,.4)"};

// ─── Primitives ───────────────────────────────────────────────────────────────
const Spin=({c="#fff",s=16})=><span style={{width:s,height:s,border:`2px solid ${c}30`,borderTopColor:c,borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite",flexShrink:0}}/>;
const Card=({children,style={},C})=><div style={{background:C.card,borderRadius:16,border:`1.5px solid ${C.border}`,boxShadow:C.sh,padding:"14px",marginBottom:10,...style}}>{children}</div>;
const StatCard=({icon,label,value,color,bg,C})=>(
  <div style={{background:bg||C.card,border:`1.5px solid ${color}22`,borderRadius:14,padding:"12px 8px",textAlign:"center",flex:1}}>
    <div style={{fontSize:24,marginBottom:2}}>{icon}</div>
    <div style={{fontSize:20,fontWeight:900,color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:10,color:C.sub,marginTop:3,lineHeight:1.3}}>{label}</div>
  </div>
);
const Sheet=({title,icon,onClose,children,C})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:60,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{background:C.bg,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:440,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{width:34,height:4,background:C.border,borderRadius:2,margin:"12px auto 0"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px 0"}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text}}>{icon} {title}</div>
        <button onClick={onClose} style={{background:C.border,border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,cursor:"pointer",color:C.sub}}>✕</button>
      </div>
      <div style={{padding:"14px 18px 40px"}}>{children}</div>
    </div>
  </div>
);
const FL=({label,children,C})=><div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.sub,marginBottom:5,letterSpacing:.3}}>{label}</div>{children}</div>;
const FI=({value,onChange,placeholder,type="text",C})=><input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>;
const FS=({value,onChange,opts,C})=><select value={value} onChange={onChange} style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 12px",fontSize:14,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>;
const Sav=({onClick,label="Αποθήκευση",color,C})=><button onClick={onClick} style={{width:"100%",background:color||C.blue,color:"#fff",border:"none",borderRadius:13,padding:"13px 0",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8}}>{label}</button>;
const Tog=({on,set,color,C})=><div onClick={()=>set(!on)} style={{width:44,height:24,borderRadius:12,background:on?(color||C.blue):C.mute,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:on?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transition:"left .2s"}}/></div>;
const Pill=({children,color,C})=><span style={{background:(color||C.blue)+"18",color:color||C.blue,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;
const AIBox=({text,C})=><div style={{background:C.blueBg,borderLeft:`3px solid ${C.blue}`,borderRadius:12,padding:"11px 13px",marginTop:8}}><div style={{fontSize:10,fontWeight:800,color:C.blue,marginBottom:4,letterSpacing:.5}}>✦ AI</div><div style={{fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{text}</div></div>;
const EmojiPick=({icons,value,onChange,active,C})=><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{icons.map(ic=><button key={ic} onClick={()=>onChange(ic)} style={{fontSize:22,background:value===ic?active+"18":C.card,border:`2px solid ${value===ic?active:C.border}`,borderRadius:10,padding:7,cursor:"pointer"}}>{ic}</button>)}</div>;
const MicBtn=({onResult,C})=>{
  const [on,setOn]=useState(false);
  const start=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    const r=new SR();r.lang="el-GR";r.onstart=()=>setOn(true);r.onend=()=>setOn(false);
    r.onresult=e=>onResult(e.results[0][0].transcript);r.start();
  };
  return<button onClick={start} style={{width:36,height:36,borderRadius:10,background:on?C.red:C.card,border:`1.5px solid ${on?C.red:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",transition:"all .2s",flexShrink:0}}>🎤</button>;
};
const AddBtn=({icon,label,onClick,color,C})=><button onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,background:(color||C.blue)+"15",border:`1.5px solid ${(color||C.blue)+"30"}`,borderRadius:12,padding:"10px 14px",color:color||C.blue,fontSize:13,fontWeight:700,cursor:"pointer",width:"100%",marginBottom:8}}><span style={{fontSize:18}}>{icon}</span>{label}</button>;
const SecLabel=({text,C})=><div style={{fontSize:10,fontWeight:700,color:C.mute,marginBottom:7,letterSpacing:.5,marginTop:4}}>{text}</div>;
const SectionTitle=({icon,title,sub,C})=>(
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:28}}>{icon}</span>
      <div><div style={{fontSize:20,fontWeight:900,color:C.text,lineHeight:1}}>{title}</div>{sub&&<div style={{fontSize:12,color:C.sub,marginTop:2}}>{sub}</div>}</div>
    </div>
  </div>
);
const AIBtn=({onClick,busy,label,color,C})=>(
  <button onClick={onClick} disabled={busy} style={{width:"100%",background:busy?C.border:(color||C.blue)+"18",border:`1.5px solid ${(color||C.blue)+"25"}`,borderRadius:12,padding:"10px 0",color:color||C.blue,fontSize:13,fontWeight:700,cursor:busy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:8}}>
    {busy?<><Spin s={12} c={color||C.blue}/>Σκέφτομαι…</>:`✦  ${label}`}
  </button>
);

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({onDone,C}) {
  const [step,setStep]=useState(0);const [name,setName]=useState("");
  const steps=[{em:"⬡",h:"LifeHub",p:"Η ελληνική AI εφαρμογή για κάθε μέρα σου."},{em:"✦",h:"AI Βοηθός",p:"Ρώτα, πρόσθεσε, οργάνωσε — ένα tap."},{em:"👤",h:"Καλώς ήρθες!",p:""}];
  const s=steps[step];const last=step===2;
  const next=()=>{if(last){if(name.trim())sls("settings_name",name.trim());onDone();}else setStep(p=>p+1);};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0D1117,#1D4ED8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{display:"flex",gap:6,marginBottom:48}}>{steps.map((_,i)=><div key={i} style={{height:4,borderRadius:2,background:"#fff",width:i===step?24:6,opacity:i===step?1:i<step?.4:.2,transition:"all .3s"}}/>)}</div>
      <div style={{fontSize:68,marginBottom:16}}>{s.em}</div>
      <div style={{fontSize:26,fontWeight:900,color:"#fff",textAlign:"center",marginBottom:8,lineHeight:1.2}}>{s.h}</div>
      {s.p&&<div style={{fontSize:15,color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:260,lineHeight:1.7,marginBottom:40}}>{s.p}</div>}
      {!s.p&&<div style={{height:40}}/>}
      {last&&<input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&next()} placeholder="Το όνομά σου…" autoFocus style={{width:"100%",maxWidth:280,background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:12,padding:"13px 16px",fontSize:16,color:"#fff",outline:"none",marginBottom:20,textAlign:"center",fontFamily:"inherit"}}/>}
      <button onClick={next} disabled={last&&!name.trim()} style={{width:"100%",maxWidth:280,background:last&&!name.trim()?"rgba(255,255,255,.1)":"#fff",color:"#1D4ED8",border:"none",borderRadius:13,padding:"14px 0",fontSize:16,fontWeight:800,cursor:last&&!name.trim()?"default":"pointer"}}>{last?"Ξεκινάμε →":"Επόμενο →"}</button>
      {!last&&<button onClick={onDone} style={{background:"none",border:"none",color:"rgba(255,255,255,.25)",fontSize:12,cursor:"pointer",marginTop:14}}>Παράλειψη</button>}
    </div>
  );
}

// ─── MORNING BRIEF ────────────────────────────────────────────────────────────
function MorningBrief({all,C,onClose}) {
  const {meds,tasks,docs,car,bills,appts}=all;
  const [brief,setBrief]=useState(null);
  const [loading,setLoading]=useState(true);
  const now=new Date();

  useEffect(()=>{
    const pMeds=(meds||[]).filter(m=>!m.taken);
    const pTasks=(tasks||[]).filter(t=>!t.done).slice(0,5);
    const uDocs=(docs||[]).filter(d=>d.status==="urgent");
    const uCar=(car||[]).filter(a=>a.alertDays<=14);
    const uBills=(bills||[]).filter(b=>!b.paid);
    const todayAppts=(appts||[]).filter(a=>a.date===now.toISOString().split("T")[0]);
    Promise.all([
      ai("Καιρός Ναύπλιο. JSON:{temp:number,icon:string,desc:string,wind:string}",`Μήνας:${now.getMonth()+1}`,true),
      ai(`Morning briefing coach, Ελληνικά, emoji, 3-4 προτάσεις, ενθαρρυντικό.`,
        `Ώρα:${now.getHours()} Φάρμακα:${pMeds.length} Tasks:${pTasks.length} Έγγραφα:${uDocs.length} Αυτ/το:${uCar.length} Λογαριασμοί:${uBills.length} Ραντεβού σήμερα:${todayAppts.length}`)
    ]).then(([w,msg])=>{
      setBrief({weather:w,msg,pMeds,pTasks,uDocs,uCar,uBills,todayAppts});
      setLoading(false);
    });
  },[]);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:80,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#0D1117",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto"}}>
        {/* Hero */}
        <div style={{background:"linear-gradient(160deg,#0D1117 0%,#1D4ED8 60%,#7C3AED 100%)",padding:"22px 18px 18px",position:"relative"}}>
          <div style={{width:34,height:4,background:"rgba(255,255,255,.2)",borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:4}}>
            {now.toLocaleDateString("el-GR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:12}}>☀️ Καλημέρα!</div>
          {loading?(
            <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.08)",borderRadius:14,padding:"12px 14px"}}>
              <Spin c="rgba(255,255,255,.6)" s={16}/><span style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>Ετοιμάζω briefing…</span>
            </div>
          ):brief?.weather?(
            <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.1)",borderRadius:14,padding:"12px 14px"}}>
              <span style={{fontSize:34}}>{brief.weather.icon}</span>
              <div>
                <div style={{fontSize:22,fontWeight:900,color:"#fff"}}>{brief.weather.temp}°C</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{brief.weather.desc}</div>
                {brief.weather.wind&&<div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>💨 {brief.weather.wind}</div>}
              </div>
            </div>
          ):null}
        </div>

        <div style={{padding:"16px 18px 36px"}}>
          {/* AI Message */}
          {!loading&&brief?.msg&&(
            <div style={{background:"#1a1f2e",borderLeft:"3px solid #2563EB",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:"#58A6FF",marginBottom:5,letterSpacing:.5}}>✦ AI BRIEFING</div>
              <div style={{fontSize:13,color:"#E6EDF3",lineHeight:1.7}}>{brief.msg}</div>
            </div>
          )}

          {/* Quick stats grid */}
          {!loading&&brief&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {icon:"💊",label:"Φάρμακα",value:brief.pMeds.length,color:brief.pMeds.length>0?"#F85149":"#3FB950",sub:brief.pMeds.length>0?"να ληφθούν":"όλα εντάξει"},
                {icon:"✅",label:"Tasks",value:brief.pTasks.length,color:brief.pTasks.length>0?"#58A6FF":"#3FB950",sub:"εκκρεμή"},
                {icon:"💶",label:"Λογαριασμοί",value:brief.uBills.length,color:brief.uBills.length>0?"#F0883E":"#3FB950",sub:"απλήρωτοι"},
                {icon:"🏥",label:"Ραντεβού",value:brief.todayAppts.length,color:brief.todayAppts.length>0?"#BC8CFF":"#3FB950",sub:"σήμερα"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#161B22",border:"1.5px solid #21262D",borderRadius:14,padding:"13px 12px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:10,color:"#7D8590",marginTop:3}}>{s.label}</div>
                  <div style={{fontSize:10,color:s.color,marginTop:1,fontWeight:600}}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Top tasks */}
          {!loading&&brief?.pTasks.length>0&&(
            <>
              <div style={{fontSize:10,fontWeight:700,color:"#7D8590",marginBottom:8,letterSpacing:.5}}>ΤΑ 3 ΣΗΜΑΝΤΙΚΟΤΕΡΑ TASKS</div>
              {brief.pTasks.slice(0,3).map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#161B22",border:"1.5px solid #21262D",borderRadius:11,marginBottom:6}}>
                  <span style={{fontSize:14}}>{t.energy==="deep"?"🏔️":t.energy==="medium"?"🔋":"⚡"}</span>
                  <span style={{fontSize:13,color:"#E6EDF3",flex:1}}>{t.text}</span>
                  {t.due&&<span style={{fontSize:11,color:"#7D8590"}}>{t.due}</span>}
                </div>
              ))}
            </>
          )}

          {/* Urgent alerts */}
          {!loading&&brief&&(brief.uDocs.length>0||brief.uCar.length>0)&&(
            <div style={{background:"#271300",border:"1.5px solid #F0883E25",borderRadius:13,padding:"12px 14px",marginTop:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F0883E",marginBottom:8}}>⚠️ ΧΡΕΙΑΖΕΤΑΙ ΠΡΟΣΟΧΗ</div>
              {brief.uDocs.map((d,i)=><div key={i} style={{fontSize:12,color:"#E6EDF3",marginBottom:4}}>{d.icon} {d.name} — λήγει σε {d.days} μέρες</div>)}
              {brief.uCar.map((a,i)=><div key={i} style={{fontSize:12,color:"#E6EDF3",marginBottom:4}}>🚗 {a.name} — σε {a.alertDays} μέρες</div>)}
            </div>
          )}

          <button onClick={onClose} style={{width:"100%",background:"linear-gradient(135deg,#0D1117,#1D4ED8)",border:"none",borderRadius:13,padding:"14px 0",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",marginTop:16}}>
            Ξεκινάμε! →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY REVIEW ────────────────────────────────────────────────────────────
function WeeklyReview({all,C,onClose}) {
  const {tasks,habits,meds,xp,level}=all;
  const [review,setReview]=useState(null);
  const [loading,setLoading]=useState(true);
  const doneTasks=(tasks||[]).filter(t=>t.done).length;
  const pendTasks=(tasks||[]).filter(t=>!t.done).length;
  const habitsOk=(habits||[]).filter(h=>h.done>=h.target).length;
  const medsTaken=(meds||[]).filter(m=>m.taken).length;
  const now=new Date();
  const weekNum=Math.ceil((now-new Date(now.getFullYear(),0,1))/604800000);

  useEffect(()=>{
    ai(`Εβδομαδιαία ανασκόπηση coach, Ελληνικά, emoji, 4-5 προτάσεις. Κάνε σύνοψη της εβδομάδας και δώσε 2 συμβουλές για την επόμενη.`,
      `Εβδομάδα:${weekNum} Tasks ολοκλ:${doneTasks} εκκρεμή:${pendTasks} Habits:${habitsOk}/${(habits||[]).length} Φάρμακα:${medsTaken} XP:${xp} Level:${level}`)
    .then(r=>{setReview(r);setLoading(false);});
  },[]);

  const score=Math.min(100,Math.round(
    (doneTasks>0?30:0)+
    ((habits||[]).length>0?habitsOk/(habits||[]).length*40:0)+
    ((meds||[]).length>0?medsTaken/(meds||[]).length*30:0)
  ));
  const scoreColor=score>=80?"#3FB950":score>=50?"#E3B341":"#F85149";
  const scoreLabel=score>=80?"Εξαιρετική εβδομάδα! 🏆":score>=50?"Καλή πορεία 💪":"Μπορείς καλύτερα 🎯";

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:80,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#0D1117",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{background:"linear-gradient(160deg,#0D1117,#7C3AED)",padding:"22px 18px 18px"}}>
          <div style={{width:34,height:4,background:"rgba(255,255,255,.2)",borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:4}}>Εβδομάδα {weekNum} · {now.getFullYear()}</div>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4}}>📊 Ανασκόπηση Εβδομάδας</div>
          {/* Score circle */}
          <div style={{display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,.1)",borderRadius:14,padding:"14px"}}>
            <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke={scoreColor} strokeWidth="6"
                  strokeDasharray={`${score*1.634} 163.4`} strokeLinecap="round" transform="rotate(-90 32 32)"
                  style={{transition:"stroke-dasharray .8s"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:scoreColor}}>{score}</div>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{scoreLabel}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:3}}>Βαθμολογία εβδομάδας</div>
            </div>
          </div>
        </div>

        <div style={{padding:"16px 18px 36px"}}>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {icon:"✅",label:"Tasks",value:doneTasks,sub:"ολοκλ.",color:"#58A6FF"},
              {icon:"📊",label:"Habits",value:`${habitsOk}/${(habits||[]).length}`,sub:"στόχοι",color:"#3FB950"},
              {icon:"⭐",label:"XP",value:`+${xp}`,sub:`Level ${level}`,color:"#E3B341"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#161B22",border:"1.5px solid #21262D",borderRadius:13,padding:"11px 8px",textAlign:"center"}}>
                <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
                <div style={{fontSize:18,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:9,color:"#7D8590",marginTop:2}}>{s.label}</div>
                <div style={{fontSize:9,color:s.color,marginTop:1,fontWeight:600}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          {[
            {label:"Tasks ολοκλήρωση",val:doneTasks,max:Math.max(doneTasks+pendTasks,1),color:"#58A6FF"},
            {label:"Habits συνέπεια",val:habitsOk,max:Math.max((habits||[]).length,1),color:"#3FB950"},
            {label:"Φάρμακα",val:medsTaken,max:Math.max((meds||[]).length,1),color:"#F85149"},
          ].map((b,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7D8590",marginBottom:5,fontWeight:600}}>
                <span>{b.label}</span><span style={{color:b.color}}>{b.val}/{b.max}</span>
              </div>
              <div style={{background:"#21262D",borderRadius:20,height:6}}>
                <div style={{background:b.color,height:"100%",borderRadius:20,width:`${Math.min(b.val/b.max*100,100)}%`,transition:"width .6s"}}/>
              </div>
            </div>
          ))}

          {/* AI review */}
          {loading?(
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#161B22",borderRadius:13,padding:"14px"}}>
              <Spin c="#BC8CFF" s={16}/><span style={{fontSize:13,color:"#7D8590"}}>Αναλύω την εβδομάδα…</span>
            </div>
          ):review&&(
            <div style={{background:"#1a1422",borderLeft:"3px solid #7C3AED",borderRadius:12,padding:"12px 14px",marginTop:4}}>
              <div style={{fontSize:10,fontWeight:800,color:"#BC8CFF",marginBottom:6,letterSpacing:.5}}>✦ AI ΑΝΑΣΚΟΠΗΣΗ</div>
              <div style={{fontSize:13,color:"#E6EDF3",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{review}</div>
            </div>
          )}

          <button onClick={onClose} style={{width:"100%",background:"linear-gradient(135deg,#0D1117,#7C3AED)",border:"none",borderRadius:13,padding:"14px 0",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",marginTop:16}}>
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TODAY ────────────────────────────────────────────────────────────────────
function Today({all,earn,C}) {
  const {meds,tasks,docs,habits,bills,car,house}=all;
  const [weather,setWeather]=useState(null);
  const [tip,setTip]=useState("");const [tipBusy,setTipBusy]=useState(false);
  const [showBrief,setShowBrief]=useState(false);
  const [showWeekly,setShowWeekly]=useState(false);
  const now=new Date();const hr=now.getHours();
  const greet=hr<5?"Καλό βράδυ":hr<12?"Καλημέρα":hr<17?"Καλό απόγευμα":"Καλό βράδυ";
  const nd=ndToday();
  const pMeds=(meds||[]).filter(m=>!m.taken);
  const pTasks=(tasks||[]).filter(t=>!t.done);
  const uDocs=(docs||[]).filter(d=>d.status==="urgent");
  const uBills=(bills||[]).filter(b=>!b.paid);
  const carAlerts=(car||[]).filter(c=>c.alertDays&&c.alertDays<=14);
  const houseAlerts=(house||[]).filter(h=>h.status==="urgent");
  const total=pMeds.length+pTasks.length+uDocs.length+uBills.length+carAlerts.length+houseAlerts.length;

  useEffect(()=>{
    ai("Καιρός Ναύπλιο Ελλάδα. JSON:{temp:number,icon:string,desc:string}",`Μήνας:${now.getMonth()+1} Ώρα:${hr}`,true).then(r=>setWeather(r));
  },[]);

  return(
    <div>
      <div style={{background:"linear-gradient(145deg,#0D1117,#1D4ED8)",borderRadius:20,padding:"18px 16px",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:2}}>{now.toLocaleDateString("el-GR",{weekday:"long",day:"numeric",month:"long"})}</div>
        <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:12}}>{greet}!</div>
        {weather
          ?<div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,.1)",borderRadius:12,padding:"10px 14px"}}><span style={{fontSize:30}}>{weather.icon}</span><div><div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{weather.temp}°C</div><div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{weather.desc}</div></div></div>
          :<div style={{display:"flex",gap:8,alignItems:"center",background:"rgba(255,255,255,.07)",borderRadius:12,padding:"10px 14px"}}><Spin c="rgba(255,255,255,.4)" s={13}/><span style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>Φορτώνω καιρό…</span></div>
        }
      </div>
      <div style={{display:"flex",gap:7,marginBottom:12,overflowX:"auto"}}>
        <StatCard icon="💊" label="φάρμακα" value={pMeds.length} color={pMeds.length>0?C.red:C.green} bg={pMeds.length>0?C.redBg:C.greenBg} C={C}/>
        <StatCard icon="✅" label="tasks" value={pTasks.length} color={pTasks.length>0?C.blue:C.green} bg={pTasks.length>0?C.blueBg:C.greenBg} C={C}/>
        <StatCard icon="💶" label="εκκρεμείς" value={uBills.length} color={uBills.length>0?C.orange:C.green} bg={uBills.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="🚗" label="αυτ/το" value={carAlerts.length} color={carAlerts.length>0?C.orange:C.green} bg={carAlerts.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="📄" label="έγγραφα" value={uDocs.length} color={uDocs.length>0?C.orange:C.green} bg={uDocs.length>0?C.orangeBg:C.greenBg} C={C}/>
      </div>
      {total===0&&<Card C={C} style={{textAlign:"center",padding:"22px 16px",background:C.greenBg,border:`1.5px solid ${C.green}22`}}><div style={{fontSize:34,marginBottom:6}}>🎉</div><div style={{fontSize:14,fontWeight:700,color:C.green}}>Όλα εντάξει σήμερα!</div></Card>}
      {nd.length>0&&<Card C={C} style={{background:C.yellowBg,border:`1.5px solid ${C.yellow}25`,padding:"11px 13px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>🎂</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.yellow}}>Σήμερα γιορτάζουν</div><div style={{fontSize:13,color:C.text}}>{nd.join(" · ")}</div></div><a href={`sms:?body=${encodeURIComponent("Χρόνια πολλά! 🎉")}`} style={{background:C.yellow,color:"#fff",borderRadius:9,padding:"6px 11px",fontSize:12,fontWeight:700,textDecoration:"none"}}>💬</a></div></Card>}
      {pMeds.slice(0,2).map(m=>(
        <Card key={m.id} C={C} style={{borderLeft:`3px solid ${C.red}`,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{m.icon||"💊"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{m.name}</div><div style={{fontSize:11,color:C.sub}}>⏰ {m.time} · {m.dose}</div></div><button onClick={()=>earn(15)} style={{background:C.red,color:"#fff",border:"none",borderRadius:9,padding:"6px 12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ Πήρα</button></div>
        </Card>
      ))}
      {pTasks.slice(0,3).map(t=>(
        <Card key={t.id} C={C} style={{borderLeft:`3px solid ${C.blue}`,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{t.energy==="deep"?"🏔️":t.energy==="medium"?"🔋":"⚡"}</span><div style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{t.text}</div>{t.due&&<Pill color={C.blue} C={C}>{t.due}</Pill>}</div>
        </Card>
      ))}
      {uBills.slice(0,2).map(b=>(
        <Card key={b.id} C={C} style={{borderLeft:`3px solid ${C.orange}`,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{b.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{b.name}</div><div style={{fontSize:11,color:C.sub}}>📅 {b.due}</div></div><Pill color={C.orange} C={C}>€{b.amount.toFixed(0)}</Pill></div>
        </Card>
      ))}
      {carAlerts.map(a=>(
        <Card key={a.id} C={C} style={{borderLeft:`3px solid ${C.orange}`,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{a.icon||"🚗"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.sub}}>⏳ σε {a.alertDays} μέρες</div></div><Pill color={C.orange} C={C}>⚠️</Pill></div>
        </Card>
      ))}
      {(habits||[]).length>0&&(
        <Card C={C} style={{padding:"12px 14px"}}>
          <SecLabel text="HABITS ΣΉΜΕΡΑ" C={C}/>
          {habits.map((h,i)=>(
            <div key={h.id} style={{marginBottom:i<habits.length-1?10:0}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.text,fontWeight:600}}>{h.icon} {h.name}</span><span style={{color:h.done>=h.target?C.green:C.sub,fontWeight:700}}>{h.done}/{h.target}</span></div>
              <div style={{background:C.border,borderRadius:20,height:4}}><div style={{background:h.done>=h.target?C.green:C.blue,height:"100%",borderRadius:20,width:`${Math.min(h.done/h.target*100,100)}%`,transition:"width .4s"}}/></div>
            </div>
          ))}
        </Card>
      )}
      {/* Action buttons row */}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={()=>setShowBrief(true)}
          style={{flex:1,background:"linear-gradient(135deg,#0D1117,#1D4ED8)",border:"none",borderRadius:13,padding:"12px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          ☀️ Morning Brief
        </button>
        <button onClick={()=>setShowWeekly(true)}
          style={{flex:1,background:`linear-gradient(135deg,#0D1117,${C.purple})`,border:"none",borderRadius:13,padding:"12px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          📊 Εβδομάδα
        </button>
      </div>
      <button onClick={async()=>{setTipBusy(true);const r=await ai("Daily coach Ναύπλιο. Ελληνικά, emoji, max 45 λέξεις.",`Εκκρεμή:${total} Ώρα:${hr}`);setTip(r);setTipBusy(false);}} disabled={tipBusy}
        style={{width:"100%",background:tipBusy?C.border:C.blueBg,border:`1.5px solid ${C.blue}22`,borderRadius:13,padding:"11px 0",color:C.blue,fontSize:13,fontWeight:700,cursor:tipBusy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8}}>
        {tipBusy?<><Spin s={13} c={C.blue}/>Σκέφτομαι…</>:"✦  Tip ημέρας"}
      </button>
      {tip&&<AIBox text={tip} C={C}/>}
      {showBrief&&<MorningBrief all={all} C={C} onClose={()=>setShowBrief(false)}/>}
      {showWeekly&&<WeeklyReview all={all} C={C} onClose={()=>setShowWeekly(false)}/>}
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function Tasks({earn,C}) {
  const [tasks,setTasks]=useLS("tasks",[
    {id:1,text:"Πλήρωσε ΔΕΗ",energy:"quick",done:false,due:"Σήμερα"},
    {id:2,text:"Ραντεβού γιατρού",energy:"quick",done:false,due:"Αυτή εβδ."},
    {id:3,text:"Ανανέωσε ΚΤΕΟ",energy:"medium",done:false,due:"15 Ιουλ"},
    {id:4,text:"Εκκαθαριστικό ΦΠΑ",energy:"deep",done:false,due:"25 Ιουλ"},
  ]);
  const [sheet,setSheet]=useState(false);
  const [pomActive,setPomActive]=useState(false);
  const [pomSec,setPomSec]=useState(25*60);
  const [pomMode,setPomMode]=useState("work");
  const [freeMin,setFreeMin]=useState(30);
  const [aiSug,setAiSug]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [monthGoals,setMonthGoals]=useLS("month_goals",[{id:1,text:"Κάνε 30 tasks",target:30,done:12}]);
  const [nT,setNT]=useState({text:"",energy:"quick",due:""});
  const [nG,setNG]=useState({text:"",target:10});
  const [showGoals,setShowGoals]=useState(false);
  const pomRef=useRef(null);
  const E=[{id:"quick",em:"⚡",l:"< 5'",c:C.green},{id:"medium",em:"🔋",l:"5–30'",c:C.blue},{id:"deep",em:"🏔️",l:"> 30'",c:C.purple}];
  const pending=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);
  const stats=E.map(e=>({...e,count:pending.filter(t=>t.energy===e.id).length}));

  useEffect(()=>{
    if(pomActive){pomRef.current=setInterval(()=>{setPomSec(s=>{if(s<=1){clearInterval(pomRef.current);setPomActive(false);setPomMode(m=>m==="work"?"break":"work");return m==="work"?5*60:25*60;}return s-1;});},1000);}
    else clearInterval(pomRef.current);
    return()=>clearInterval(pomRef.current);
  },[pomActive,pomMode]);

  const pomFmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pomPct=pomMode==="work"?(25*60-pomSec)/(25*60)*100:(5*60-pomSec)/(5*60)*100;

  return(
    <div>
      <SectionTitle icon="✅" title="Tasks" sub={`${pending.length} εκκρεμή · ${done.length} ολοκληρώθηκαν`} C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>{stats.map(e=><StatCard key={e.id} icon={e.em} label={e.l} value={e.count} color={e.c} C={C}/>)}</div>

      {/* Pomodoro */}
      <Card C={C} style={{background:pomMode==="work"?C.redBg:C.greenBg,border:`1.5px solid ${pomMode==="work"?C.red:C.green}22`,padding:"14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
            <svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/><circle cx="28" cy="28" r="22" fill="none" stroke={pomMode==="work"?C.red:C.green} strokeWidth="5" strokeDasharray={`${pomPct*1.382} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)" style={{transition:"stroke-dasharray .5s"}}/></svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:pomMode==="work"?C.red:C.green}}>{pomFmt(pomSec)}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:C.text}}>🍅 Pomodoro</div>
            <div style={{fontSize:12,color:C.sub}}>{pomMode==="work"?"Εστίαση 25'":"Διάλειμμα 5'"}</div>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setPomActive(a=>!a)} style={{background:pomMode==="work"?C.red:C.green,color:"#fff",border:"none",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{pomActive?"⏸":"▶"}</button>
            <button onClick={()=>{setPomActive(false);setPomSec(25*60);setPomMode("work");}} style={{background:C.border,border:"none",borderRadius:9,padding:"8px 10px",fontSize:13,cursor:"pointer",color:C.sub}}>↺</button>
          </div>
        </div>
      </Card>

      {/* AI */}
      <Card C={C} style={{background:C.blueBg,border:`1.5px solid ${C.blue}22`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>⚡ Πόσο χρόνο έχεις;</div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>{[5,15,30,60,120].map(m=><button key={m} onClick={()=>setFreeMin(m)} style={{flex:1,background:freeMin===m?C.blue:C.card,color:freeMin===m?"#fff":C.sub,border:`1.5px solid ${freeMin===m?C.blue:C.border}`,borderRadius:8,padding:"7px 3px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{m<60?`${m}'`:`${m/60}ω`}</button>)}</div>
        <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Task coach. Ελληνικά, emoji, max 45 λέξεις.",`Χρόνος:${freeMin}'. Tasks:${JSON.stringify(pending.map(t=>({t:t.text,e:t.energy})))}`);setAiSug(r);setAiBusy(false);}} busy={aiBusy} label="Τι κάνω τώρα;" C={C}/>
      </Card>
      {aiSug&&<AIBox text={aiSug} C={C}/>}

      {/* Μηνιαίοι στόχοι */}
      <button onClick={()=>setShowGoals(g=>!g)} style={{width:"100%",background:C.purpleBg,border:`1.5px solid ${C.purple}22`,borderRadius:12,padding:"10px 14px",color:C.purple,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        🎯 Στόχοι μήνα <span style={{marginLeft:"auto"}}>{showGoals?"▲":"▼"}</span>
      </button>
      {showGoals&&(
        <Card C={C} style={{padding:"12px 14px"}}>
          {monthGoals.map(g=>(
            <div key={g.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}><span>{g.text}</span><span style={{color:g.done>=g.target?C.green:C.purple,fontWeight:700}}>{g.done}/{g.target}</span></div>
              <div style={{background:C.border,borderRadius:20,height:5}}><div style={{background:g.done>=g.target?C.green:C.purple,height:"100%",borderRadius:20,width:`${Math.min(g.done/g.target*100,100)}%`,transition:"width .4s"}}/></div>
            </div>
          ))}
          <AddBtn icon="➕" label="Νέος στόχος" onClick={()=>setSheet("goal")} color={C.purple} C={C}/>
        </Card>
      )}

      <AddBtn icon="➕" label="Νέο task" onClick={()=>setSheet("task")} color={C.blue} C={C}/>

      {pending.length===0&&<Card C={C} style={{textAlign:"center",padding:26,background:C.greenBg,border:`1.5px solid ${C.green}22`}}><div style={{fontSize:32,marginBottom:6}}>🎉</div><div style={{fontSize:13,fontWeight:700,color:C.green}}>Όλα ολοκληρώθηκαν!</div></Card>}
      {pending.map(t=>{
        const e=E.find(x=>x.id===t.energy)||E[0];
        return(
          <Card key={t.id} C={C} style={{borderLeft:`3px solid ${e.c}`,padding:"11px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div onClick={()=>{setTasks(tasks.map(x=>x.id===t.id?{...x,done:true}:x));earn(t.energy==="deep"?50:t.energy==="medium"?25:10);}} style={{width:22,height:22,borderRadius:7,border:`2px solid ${e.c}`,cursor:"pointer",flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{t.text}</div>{t.due&&<div style={{fontSize:11,color:C.sub,marginTop:1}}>{e.em} {t.due}</div>}</div>
              <Pill color={e.c} C={C}>{e.em} {e.l}</Pill>
              <button onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:C.mute,fontSize:16,cursor:"pointer"}}>×</button>
            </div>
          </Card>
        );
      })}
      {done.length>0&&(
        <div style={{marginTop:8}}>
          <SecLabel text={`✓ ΕΓΙΝΑΝ (${done.length})`} C={C}/>
          {done.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.border+"30",borderRadius:11,marginBottom:6,opacity:.4}}>
              <span style={{fontSize:13}}>✅</span>
              <div style={{flex:1,fontSize:12,color:C.sub,textDecoration:"line-through"}}>{t.text}</div>
              <button onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
            </div>
          ))}
        </div>
      )}

      {sheet==="task"&&<Sheet title="Νέο Task" icon="✅" onClose={()=>setSheet(false)} C={C}>
        <FL label="Τι;" C={C}><FI value={nT.text} onChange={e=>setNT({...nT,text:e.target.value})} placeholder="π.χ. Πλήρωσε ΔΕΗ" C={C}/></FL>
        <FL label="Ενέργεια" C={C}><div style={{display:"flex",gap:8}}>{E.map(e=><button key={e.id} onClick={()=>setNT({...nT,energy:e.id})} style={{flex:1,background:nT.energy===e.id?e.c+"18":C.card,border:`2px solid ${nT.energy===e.id?e.c:C.border}`,borderRadius:12,padding:"11px 6px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22}}>{e.em}</div><div style={{fontSize:11,fontWeight:700,color:nT.energy===e.id?e.c:C.sub,marginTop:3}}>{e.l}</div></button>)}</div></FL>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nT.due} onChange={e=>setNT({...nT,due:e.target.value})} C={C}/></FL>
        <Sav onClick={()=>{if(!nT.text.trim())return;setTasks([...tasks,{...nT,id:Date.now(),done:false}]);setNT({text:"",energy:"quick",due:""});setSheet(false);earn(5);}} color={C.blue} C={C}/>
      </Sheet>}
      {sheet==="goal"&&<Sheet title="Νέος Στόχος" icon="🎯" onClose={()=>setSheet(false)} C={C}>
        <FL label="Στόχος" C={C}><FI value={nG.text} onChange={e=>setNG({...nG,text:e.target.value})} placeholder="π.χ. Κάνε 30 tasks" C={C}/></FL>
        <FL label="Αριθμός στόχου" C={C}><FI type="number" value={nG.target} onChange={e=>setNG({...nG,target:parseInt(e.target.value)||1})} C={C}/></FL>
        <Sav onClick={()=>{if(!nG.text)return;setMonthGoals([...monthGoals,{...nG,id:Date.now(),done:0}]);setNG({text:"",target:10});setSheet(false);}} color={C.purple} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── SHOPPING ─────────────────────────────────────────────────────────────────
function Shopping({C}) {
  const [shop,setShop]=useLS("shopping",[
    {id:1,text:"Ψωμί",qty:"2 τεμ.",list:"🛒 Σούπερ",done:false},
    {id:2,text:"Γάλα",qty:"1 lt",list:"🛒 Σούπερ",done:false},
    {id:3,text:"Βιταμίνη D3",qty:"1 κουτί",list:"💊 Φαρμακείο",done:false},
    {id:4,text:"Απορρυπαντικό",qty:"1 τεμ.",list:"🛒 Σούπερ",done:false},
  ]);
  const [sheet,setSheet]=useState(false);
  const [nI,setNI]=useState({text:"",qty:"1",list:"🛒 Σούπερ"});
  const lists=[...new Set(shop.map(i=>i.list))];
  const pending=shop.filter(i=>!i.done).length;
  const done=shop.filter(i=>i.done).length;
  return(
    <div>
      <SectionTitle icon="🛒" title="Ψώνια" sub={`${pending} απομένουν · ${done} ολοκληρώθηκαν`} C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <StatCard icon="🛒" label="απομένουν" value={pending} color={pending>0?C.orange:C.green} bg={pending>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="✅" label="ολοκλ." value={done} color={C.green} bg={C.greenBg} C={C}/>
        <StatCard icon="🏪" label="λίστες" value={lists.length} color={C.blue} bg={C.blueBg} C={C}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <AddBtn icon="➕" label="Νέο προϊόν" onClick={()=>setSheet(true)} color={C.green} C={C}/>
        <button onClick={()=>setShop(shop.filter(i=>!i.done))} style={{background:C.redBg,border:`1.5px solid ${C.red}22`,borderRadius:12,padding:"10px 14px",color:C.red,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>🗑️</button>
      </div>
      {lists.map(list=>(
        <div key={list} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:800,color:C.text}}>{list}</div>
            <div style={{fontSize:11,color:C.mute}}>{shop.filter(i=>i.list===list&&i.done).length}/{shop.filter(i=>i.list===list).length}</div>
          </div>
          {shop.filter(i=>i.list===list).map(item=>(
            <div key={item.id} onClick={()=>setShop(shop.map(i=>i.id===item.id?{...i,done:!i.done}:i))}
              style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",background:item.done?C.border+"30":C.card,borderRadius:12,marginBottom:6,border:`1.5px solid ${C.border}`,cursor:"pointer",opacity:item.done?.4:1,boxShadow:item.done?"none":C.sh}}>
              <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${item.done?C.green:C.blue}`,background:item.done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{item.done?"✓":""}</div>
              <div style={{flex:1,fontSize:13,fontWeight:600,color:C.text,textDecoration:item.done?"line-through":"none"}}>{item.text}</div>
              <span style={{fontSize:11,color:C.mute}}>{item.qty}</span>
              <button onClick={e=>{e.stopPropagation();setShop(shop.filter(x=>x.id!==item.id));}} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
            </div>
          ))}
        </div>
      ))}
      {shop.length===0&&<Card C={C} style={{textAlign:"center",padding:26}}><div style={{fontSize:32,marginBottom:6}}>🛒</div><div style={{fontSize:13,color:C.sub}}>Άδεια λίστα</div></Card>}
      {sheet&&<Sheet title="Νέο Προϊόν" icon="🛒" onClose={()=>setSheet(false)} C={C}>
        <FL label="Προϊόν" C={C}><FI value={nI.text} onChange={e=>setNI({...nI,text:e.target.value})} placeholder="π.χ. Ψωμί" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Ποσότητα" C={C}><FI value={nI.qty} onChange={e=>setNI({...nI,qty:e.target.value})} placeholder="1 τεμ." C={C}/></FL>
          <FL label="Λίστα" C={C}><FI value={nI.list} onChange={e=>setNI({...nI,list:e.target.value})} placeholder="🛒 Σούπερ" C={C}/></FL>
        </div>
        <Sav onClick={()=>{if(!nI.text.trim())return;setShop([...shop,{...nI,id:Date.now(),done:false}]);setNI({text:"",qty:"1",list:"🛒 Σούπερ"});setSheet(false);}} color={C.green} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── MONEY ────────────────────────────────────────────────────────────────────
function Money({C}) {
  const [bills,setBills]=useLS("bills",[{id:1,name:"ΔΕΗ",amount:87.50,due:"30/6",paid:false,icon:"⚡"},{id:2,name:"ΕΥΔΑΠ",amount:34.20,due:"15/7",paid:false,icon:"💧"}]);
  const [subs,setSubs]=useLS("subs",[{id:1,name:"Netflix",amount:15.99,icon:"🎬",usage:"Συχνά"},{id:2,name:"Spotify",amount:10.99,icon:"🎵",usage:"Καθημερινά"},{id:3,name:"Adobe",amount:59.99,icon:"🎨",usage:"Σπάνια"}]);
  const [income,setIncome]=useLS("income",[{id:1,name:"Μισθός",amount:1400,icon:"💼",freq:"Μηνιαίο"},{id:2,name:"Ενοίκιο",amount:450,icon:"🏠",freq:"Μηνιαίο"}]);
  const [savings,setSavings]=useLS("savings",{target:5000,current:1800});
  const [sheet,setSheet]=useState(null);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [nB,setNB]=useState({name:"",amount:"",due:"",icon:"💶"});
  const [nS,setNS]=useState({name:"",amount:"",icon:"💳",usage:"Συχνά"});
  const [nI,setNI]=useState({name:"",amount:"",icon:"💼",freq:"Μηνιαίο"});
  const subT=subs.reduce((s,x)=>s+x.amount,0);
  const billT=bills.filter(b=>!b.paid).reduce((t,b)=>t+b.amount,0);
  const billPaid=bills.filter(b=>b.paid).reduce((t,b)=>t+b.amount,0);
  const incomeT=income.reduce((s,x)=>s+x.amount,0);
  const savPct=Math.round(savings.current/savings.target*100);

  return(
    <div>
      <SectionTitle icon="💳" title="Χρήματα" sub="Εισόδημα, Λογαριασμοί & Αποταμίευση" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <StatCard icon="💰" label="εισόδημα/μ." value={`€${incomeT.toFixed(0)}`} color={C.green} bg={C.greenBg} C={C}/>
        <StatCard icon="💶" label="εκκρεμείς" value={`€${billT.toFixed(0)}`} color={billT>0?C.orange:C.green} bg={billT>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="📺" label="subs/μ." value={`€${subT.toFixed(0)}`} color={C.blue} bg={C.blueBg} C={C}/>
      </div>
      {/* Savings */}
      <Card C={C} style={{background:C.greenBg,border:`1.5px solid ${C.green}22`,padding:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>🎯 Αποταμίευση</div><div style={{fontSize:12,color:C.sub}}>€{savings.current.toLocaleString()} από €{savings.target.toLocaleString()}</div></div>
          <div style={{fontSize:20,fontWeight:900,color:C.green}}>{savPct}%</div>
        </div>
        <div style={{background:C.border,borderRadius:20,height:8}}><div style={{background:C.green,height:"100%",borderRadius:20,width:`${Math.min(savPct,100)}%`,transition:"width .5s"}}/></div>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>setSavings({...savings,current:savings.current+100})} style={{flex:1,background:C.green,color:"#fff",border:"none",borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>+€100</button>
          <button onClick={()=>setSavings({...savings,current:savings.current+50})} style={{flex:1,background:C.greenBg,border:`1.5px solid ${C.green}`,color:C.green,borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>+€50</button>
          <button onClick={()=>setSheet("savings")} style={{flex:1,background:C.border,border:"none",color:C.sub,borderRadius:9,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>⚙️</button>
        </div>
      </Card>
      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Οικον. σύμβουλος, Ελληνικά, emoji, max 50 λέξεις.",`Εισόδημα:${incomeT} Εξοδα:${subT+billT} Subs:${JSON.stringify(subs)}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="Πού εξοικονομώ;" color={C.blue} C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}
      <SecLabel text="ΕΙΣΟΔΗΜΑ" C={C}/>
      {income.map(inc=>(
        <Card key={inc.id} C={C} style={{padding:"11px 12px",borderLeft:`3px solid ${C.green}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{inc.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{inc.name}</div><div style={{fontSize:11,color:C.sub}}>{inc.freq}</div></div>
            <div style={{fontSize:15,fontWeight:800,color:C.green}}>+€{inc.amount.toFixed(0)}</div>
            <button onClick={()=>setIncome(income.filter(x=>x.id!==inc.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
          </div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέα πηγή εισοδήματος" onClick={()=>setSheet("income")} color={C.green} C={C}/>
      <SecLabel text="ΛΟΓΑΡΙΑΣΜΟΙ" C={C}/>
      {bills.map(b=>(
        <Card key={b.id} C={C} style={{borderLeft:`3px solid ${b.paid?C.green:C.orange}`,opacity:b.paid?.5:1,padding:"11px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{b.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{b.name}</div><div style={{fontSize:11,color:C.sub}}>📅 {b.due}</div></div>
            <div style={{fontSize:14,fontWeight:800,color:C.text}}>€{b.amount.toFixed(2)}</div>
            <button onClick={()=>setBills(bills.map(x=>x.id===b.id?{...x,paid:!x.paid}:x))} style={{background:b.paid?C.greenBg:C.orangeBg,border:"none",borderRadius:9,padding:"6px 10px",fontSize:12,fontWeight:700,color:b.paid?C.green:C.orange,cursor:"pointer"}}>{b.paid?"✅":"💸"}</button>
            <button onClick={()=>setBills(bills.filter(x=>x.id!==b.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
          </div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέος λογαριασμός" onClick={()=>setSheet("bill")} color={C.orange} C={C}/>
      <SecLabel text="SUBSCRIPTIONS" C={C}/>
      {subs.map(s=>(
        <Card key={s.id} C={C} style={{padding:"11px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{s.name}</div><div style={{fontSize:11,color:s.usage==="Σπάνια"?C.orange:C.sub}}>{s.usage}</div></div>
            <div style={{fontSize:14,fontWeight:800,color:s.usage==="Σπάνια"?C.orange:C.text}}>€{s.amount.toFixed(0)}<span style={{fontSize:10,color:C.sub}}>/μ</span></div>
            <button onClick={()=>setSubs(subs.filter(x=>x.id!==s.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
          </div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέο subscription" onClick={()=>setSheet("sub")} color={C.blue} C={C}/>

      {sheet==="savings"&&<Sheet title="Αποταμίευση" icon="🎯" onClose={()=>setSheet(null)} C={C}>
        <FL label="Στόχος €" C={C}><FI type="number" value={savings.target} onChange={e=>setSavings({...savings,target:parseFloat(e.target.value)||0})} C={C}/></FL>
        <FL label="Τρέχον υπόλοιπο €" C={C}><FI type="number" value={savings.current} onChange={e=>setSavings({...savings,current:parseFloat(e.target.value)||0})} C={C}/></FL>
        <Sav onClick={()=>setSheet(null)} label="Αποθήκευση" color={C.green} C={C}/>
      </Sheet>}
      {sheet==="income"&&<Sheet title="Νέα Πηγή Εισοδήματος" icon="💰" onClose={()=>setSheet(null)} C={C}>
        <FL label="Πηγή" C={C}><FI value={nI.name} onChange={e=>setNI({...nI,name:e.target.value})} placeholder="π.χ. Μισθός" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Ποσό €" C={C}><FI type="number" value={nI.amount} onChange={e=>setNI({...nI,amount:e.target.value})} placeholder="1400" C={C}/></FL>
          <FL label="Συχνότητα" C={C}><FS value={nI.freq} onChange={e=>setNI({...nI,freq:e.target.value})} opts={[{v:"Μηνιαίο",l:"Μηνιαίο"},{v:"Εβδομαδιαίο",l:"Εβδομ."},{v:"Εφάπαξ",l:"Εφάπαξ"}]} C={C}/></FL>
        </div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["💼","🏠","💻","🚗","📦","🎓","💶","⭐"]} value={nI.icon} onChange={v=>setNI({...nI,icon:v})} active={C.green} C={C}/></FL>
        <Sav onClick={()=>{if(!nI.name||!nI.amount)return;setIncome([...income,{...nI,id:Date.now(),amount:parseFloat(nI.amount)}]);setNI({name:"",amount:"",icon:"💼",freq:"Μηνιαίο"});setSheet(null);}} color={C.green} C={C}/>
      </Sheet>}
      {sheet==="bill"&&<Sheet title="Νέος Λογαριασμός" icon="💶" onClose={()=>setSheet(null)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nB.name} onChange={e=>setNB({...nB,name:e.target.value})} placeholder="π.χ. ΔΕΗ" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Ποσό €" C={C}><FI type="number" value={nB.amount} onChange={e=>setNB({...nB,amount:e.target.value})} placeholder="87.50" C={C}/></FL>
          <FL label="Πληρ. έως" C={C}><FI value={nB.due} onChange={e=>setNB({...nB,due:e.target.value})} placeholder="30/6" C={C}/></FL>
        </div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["⚡","💧","📱","🌐","🏠","🚗","📺","💶"]} value={nB.icon} onChange={v=>setNB({...nB,icon:v})} active={C.orange} C={C}/></FL>
        <Sav onClick={()=>{if(!nB.name||!nB.amount)return;setBills([...bills,{...nB,id:Date.now(),amount:parseFloat(nB.amount),paid:false}]);setNB({name:"",amount:"",due:"",icon:"💶"});setSheet(null);}} color={C.orange} C={C}/>
      </Sheet>}
      {sheet==="sub"&&<Sheet title="Νέο Subscription" icon="📺" onClose={()=>setSheet(null)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nS.name} onChange={e=>setNS({...nS,name:e.target.value})} placeholder="π.χ. Netflix" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="€/μήνα" C={C}><FI type="number" value={nS.amount} onChange={e=>setNS({...nS,amount:e.target.value})} placeholder="9.99" C={C}/></FL>
          <FL label="Χρήση" C={C}><FS value={nS.usage} onChange={e=>setNS({...nS,usage:e.target.value})} opts={[{v:"Καθημερινά",l:"Καθημερινά"},{v:"Συχνά",l:"Συχνά"},{v:"Σπάνια",l:"Σπάνια"}]} C={C}/></FL>
        </div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["🎬","🎵","☁️","🎮","📰","🎨","💼","🏋️"]} value={nS.icon} onChange={v=>setNS({...nS,icon:v})} active={C.blue} C={C}/></FL>
        <Sav onClick={()=>{if(!nS.name||!nS.amount)return;setSubs([...subs,{...nS,id:Date.now(),amount:parseFloat(nS.amount)}]);setNS({name:"",amount:"",icon:"💳",usage:"Συχνά"});setSheet(null);}} color={C.blue} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── HABITS ───────────────────────────────────────────────────────────────────
function Habits({earn,C}) {
  const [habits,setHabits]=useLS("habits",[
    {id:1,name:"Νερό",icon:"💧",target:8,done:0,unit:"ποτ.",color:C.blue},
    {id:2,name:"Βόλτα 30'",icon:"🚶",target:1,done:0,unit:"φορά",color:C.green},
    {id:3,name:"Διάβασμα",icon:"📖",target:20,done:0,unit:"λεπτά",color:C.purple},
  ]);
  const [sleep,setSleep]=useLS("sleep",[]);
  const [weight,setWeight]=useLS("weight",[]);
  const [view,setView]=useState("habits");
  const [sheet,setSheet]=useState(null);
  const [nH,setNH]=useState({name:"",icon:"⭐",target:1,unit:"φορά",color:C.blue});
  const [nS,setNS]=useState({hours:"",quality:3,date:new Date().toISOString().split("T")[0]});
  const [nW,setNW]=useState({kg:"",date:new Date().toISOString().split("T")[0]});
  const completed=habits.filter(h=>h.done>=h.target).length;
  const avgSleep=sleep.length?((sleep.reduce((s,x)=>s+x.hours,0)/sleep.length).toFixed(1)):"-";
  const latestWeight=weight.length?weight[weight.length-1].kg:"-";

  return(
    <div>
      <SectionTitle icon="📊" title="Habits & Υγεία" sub={`${completed}/${habits.length} σήμερα`} C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{id:"habits",l:"📊 Habits"},{id:"sleep",l:"💤 Ύπνος"},{id:"weight",l:"⚖️ Βάρος"}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,background:view===t.id?C.ink||C.text:C.card,color:view===t.id?"#fff":C.sub,border:`1.5px solid ${view===t.id?C.text:C.border}`,borderRadius:11,padding:"9px 4px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{t.l}</button>
        ))}
      </div>

      {view==="habits"&&(
        <>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <StatCard icon="🏆" label="ολοκλ." value={completed} color={C.green} bg={C.greenBg} C={C}/>
            <StatCard icon="⏳" label="σε εξέλιξη" value={habits.filter(h=>h.done>0&&h.done<h.target).length} color={C.blue} bg={C.blueBg} C={C}/>
            <StatCard icon="😴" label="εκκρεμεί" value={habits.filter(h=>h.done===0).length} color={C.mute} C={C}/>
          </div>
          {habits.map(h=>(
            <Card key={h.id} C={C} style={{borderLeft:`3px solid ${h.done>=h.target?C.green:h.color}`,padding:"14px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <span style={{fontSize:26}}>{h.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{h.name}</div><div style={{fontSize:12,color:C.sub}}>{h.done}/{h.target} {h.unit}</div></div>
                <div style={{display:"flex",gap:7,alignItems:"center"}}>
                  {h.done>=h.target?<span style={{fontSize:24}}>🏆</span>:<button onClick={()=>setHabits(habits.map(x=>{if(x.id!==h.id)return x;const nd=x.done+1;if(nd===x.target)earn(30);return{...x,done:nd};}))} style={{background:h.color,color:"#fff",border:"none",borderRadius:10,width:36,height:36,fontSize:20,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>}
                  <button onClick={()=>setHabits(habits.map(x=>x.id===h.id?{...x,done:0}:x))} style={{background:C.border,border:"none",borderRadius:10,width:36,height:36,fontSize:16,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center"}}>↺</button>
                  <button onClick={()=>setHabits(habits.filter(x=>x.id!==h.id))} style={{background:"none",border:"none",color:C.mute,fontSize:16,cursor:"pointer"}}>×</button>
                </div>
              </div>
              <div style={{background:C.border,borderRadius:20,height:6}}><div style={{background:h.done>=h.target?C.green:h.color,height:"100%",borderRadius:20,width:`${Math.min(h.done/h.target*100,100)}%`,transition:"width .4s"}}/></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.mute,marginTop:3}}><span>0</span><span style={{color:h.done>=h.target?C.green:h.color,fontWeight:700}}>{Math.round(h.done/h.target*100)}%</span><span>{h.target}</span></div>
            </Card>
          ))}
          <AddBtn icon="➕" label="Νέο habit" onClick={()=>setSheet("habit")} color={C.green} C={C}/>
        </>
      )}

      {view==="sleep"&&(
        <>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <StatCard icon="💤" label="μ.ο. ώρες" value={avgSleep} color={C.blue} bg={C.blueBg} C={C}/>
            <StatCard icon="📅" label="καταχωρ." value={sleep.length} color={C.purple} bg={C.purpleBg} C={C}/>
            <StatCard icon={parseFloat(avgSleep)>=7?"✅":"⚠️"} label="στόχος 7-8ω" value={parseFloat(avgSleep)>=7?"ΟΚ":"Λίγο"} color={parseFloat(avgSleep)>=7?C.green:C.orange} bg={parseFloat(avgSleep)>=7?C.greenBg:C.orangeBg} C={C}/>
          </div>
          <AddBtn icon="➕" label="Καταχώρηση ύπνου" onClick={()=>setSheet("sleep")} color={C.blue} C={C}/>
          {sleep.slice().reverse().slice(0,7).map((s,i)=>(
            <Card key={i} C={C} style={{padding:"10px 12px",borderLeft:`3px solid ${s.hours>=7?C.green:s.hours>=6?C.yellow:C.red}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>💤</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{s.hours}ω ύπνος</div><div style={{fontSize:11,color:C.sub}}>{s.date} · {"⭐".repeat(s.quality)}</div></div>
                <button onClick={()=>setSleep(sleep.filter((_,j)=>j!==sleep.length-1-i))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
              </div>
            </Card>
          ))}
          {sleep.length===0&&<Card C={C} style={{textAlign:"center",padding:26}}><div style={{fontSize:32,marginBottom:6}}>💤</div><div style={{fontSize:13,color:C.sub}}>Δεν υπάρχουν καταχωρήσεις</div></Card>}
        </>
      )}

      {view==="weight"&&(
        <>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <StatCard icon="⚖️" label="τελευταίο" value={latestWeight!=="-"?`${latestWeight}kg`:"-"} color={C.blue} bg={C.blueBg} C={C}/>
            <StatCard icon="📉" label="μεταβολή" value={weight.length>=2?`${(weight[weight.length-1].kg-weight[weight.length-2].kg).toFixed(1)}kg`:"-"} color={C.purple} bg={C.purpleBg} C={C}/>
            <StatCard icon="📅" label="μετρήσεις" value={weight.length} color={C.green} bg={C.greenBg} C={C}/>
          </div>
          <AddBtn icon="➕" label="Νέα μέτρηση βάρους" onClick={()=>setSheet("weight")} color={C.purple} C={C}/>
          {weight.slice().reverse().slice(0,10).map((w,i)=>(
            <Card key={i} C={C} style={{padding:"10px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>⚖️</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{w.kg} kg</div><div style={{fontSize:11,color:C.sub}}>{w.date}</div></div>
                <button onClick={()=>setWeight(weight.filter((_,j)=>j!==weight.length-1-i))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
              </div>
            </Card>
          ))}
          {weight.length===0&&<Card C={C} style={{textAlign:"center",padding:26}}><div style={{fontSize:32,marginBottom:6}}>⚖️</div><div style={{fontSize:13,color:C.sub}}>Δεν υπάρχουν μετρήσεις</div></Card>}
        </>
      )}

      {sheet==="habit"&&<Sheet title="Νέο Habit" icon="📊" onClose={()=>setSheet(null)} C={C}>
        <FL label="Τι;" C={C}><FI value={nH.name} onChange={e=>setNH({...nH,name:e.target.value})} placeholder="π.χ. Πίνω νερό" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Στόχος" C={C}><FI type="number" value={nH.target} onChange={e=>setNH({...nH,target:parseInt(e.target.value)||1})} C={C}/></FL>
          <FL label="Μονάδα" C={C}><FI value={nH.unit} onChange={e=>setNH({...nH,unit:e.target.value})} placeholder="ποτήρια" C={C}/></FL>
        </div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["💧","🚶","📖","🥗","🏋️","🧘","💤","🎯","🌿","⭐"]} value={nH.icon} onChange={v=>setNH({...nH,icon:v})} active={C.green} C={C}/></FL>
        <Sav onClick={()=>{if(!nH.name)return;setHabits([...habits,{...nH,id:Date.now(),done:0}]);setNH({name:"",icon:"⭐",target:1,unit:"φορά",color:C.blue});setSheet(null);earn(10);}} color={C.green} C={C}/>
      </Sheet>}
      {sheet==="sleep"&&<Sheet title="Καταχώρηση Ύπνου" icon="💤" onClose={()=>setSheet(null)} C={C}>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nS.date} onChange={e=>setNS({...nS,date:e.target.value})} C={C}/></FL>
        <FL label="Ώρες ύπνου" C={C}><FI type="number" value={nS.hours} onChange={e=>setNS({...nS,hours:parseFloat(e.target.value)||0})} placeholder="7.5" C={C}/></FL>
        <FL label="Ποιότητα ύπνου" C={C}>
          <div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(r=><button key={r} onClick={()=>setNS({...nS,quality:r})} style={{flex:1,background:nS.quality>=r?C.yellowBg:C.card,border:`2px solid ${nS.quality>=r?C.yellow:C.border}`,borderRadius:9,padding:"8px 0",fontSize:18,cursor:"pointer"}}>⭐</button>)}</div>
        </FL>
        <Sav onClick={()=>{if(!nS.hours)return;setSleep([...sleep,{...nS,hours:parseFloat(nS.hours)}]);setNS({hours:"",quality:3,date:new Date().toISOString().split("T")[0]});setSheet(null);}} color={C.blue} C={C}/>
      </Sheet>}
      {sheet==="weight"&&<Sheet title="Νέα Μέτρηση" icon="⚖️" onClose={()=>setSheet(null)} C={C}>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nW.date} onChange={e=>setNW({...nW,date:e.target.value})} C={C}/></FL>
        <FL label="Βάρος (kg)" C={C}><FI type="number" value={nW.kg} onChange={e=>setNW({...nW,kg:parseFloat(e.target.value)||0})} placeholder="75.5" C={C}/></FL>
        <Sav onClick={()=>{if(!nW.kg)return;setWeight([...weight,{...nW,kg:parseFloat(nW.kg)}]);setNW({kg:"",date:new Date().toISOString().split("T")[0]});setSheet(null);}} color={C.purple} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── PROFESSIONALS ────────────────────────────────────────────────────────────
function Professionals({C}) {
  const CATS=[{id:"👨‍⚕️",label:"Γιατροί",color:C.red},{id:"⚡",label:"Ηλεκτρολόγοι",color:C.yellow},{id:"🚗",label:"Συνεργεία",color:C.orange},{id:"💧",label:"Υδραυλικοί",color:C.blue},{id:"⚖️",label:"Δικηγόροι",color:C.purple},{id:"🔧",label:"Άλλο",color:C.sub}];
  const [pros,setPros]=useLS("pros",[
    {id:1,name:"Νίκος Παπαδόπουλος",spec:"Ηλεκτρολόγος",phone:"6912345678",avail:true,cat:"⚡",rating:5,notes:"Άμεσος, καλή τιμή",history:[]},
    {id:2,name:"Δρ. Ελένη Κωνσταντίνου",spec:"Παθολόγος",phone:"6923456789",avail:true,cat:"👨‍⚕️",rating:5,notes:"ΕΟΠΥΥ, Ναύπλιο",history:[]},
    {id:3,name:"Συνεργείο Δημητρίου",spec:"Μηχανολόγος",phone:"6934567890",avail:false,cat:"🚗",rating:4,notes:"Χρειάζεται ραντεβού",history:[]},
  ]);
  const [selCat,setSelCat]=useState(null);
  const [sheet,setSheet]=useState(false);
  const [histSheet,setHistSheet]=useState(null);
  const [nP,setNP]=useState({name:"",spec:"",phone:"",avail:true,cat:"🔧",rating:5,notes:"",history:[]});
  const [nWork,setNWork]=useState({desc:"",cost:"",date:new Date().toISOString().split("T")[0]});
  const catsWithPros=CATS.filter(c=>pros.some(p=>p.cat===c.id));
  const filtered=selCat?pros.filter(p=>p.cat===selCat):[];
  const available=pros.filter(p=>p.avail).length;

  const ProCard=({p})=>(
    <Card C={C} style={{padding:"13px 12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:46,height:46,borderRadius:14,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,position:"relative"}}>
          {p.cat}<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:p.avail?C.green:C.red,border:`2px solid ${C.card}`}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{p.name}</div>
          <div style={{fontSize:12,color:C.sub}}>{p.spec}</div>
          <div style={{fontSize:11,color:C.yellow,marginTop:1}}>{"⭐".repeat(p.rating)}</div>
          {p.notes&&<div style={{fontSize:11,color:C.mute,marginTop:1}}>💬 {p.notes}</div>}
          {(p.history||[]).length>0&&<button onClick={()=>setHistSheet(p)} style={{background:"none",border:"none",color:C.blue,fontSize:11,fontWeight:700,cursor:"pointer",padding:0,marginTop:2}}>📋 {p.history.length} εργασίες</button>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {p.phone&&<><a href={`tel:${p.phone}`} style={{width:36,height:36,borderRadius:10,background:C.greenBg,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:18}}>📞</a><a href={`https://wa.me/30${p.phone}`} target="_blank" rel="noreferrer" style={{width:36,height:36,borderRadius:10,background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:18}}>💬</a></>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,alignSelf:"flex-start"}}>
          <button onClick={()=>{setNWork({desc:"",cost:"",date:new Date().toISOString().split("T")[0]});setHistSheet({...p,addWork:true});}} style={{background:C.blueBg,border:"none",borderRadius:8,padding:"4px 8px",fontSize:11,color:C.blue,cursor:"pointer",fontWeight:700}}>+Εργ.</button>
          <button onClick={()=>setPros(pros.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:C.mute,fontSize:16,cursor:"pointer"}}>×</button>
        </div>
      </div>
    </Card>
  );

  return(
    <div>
      {selCat?(
        <>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <button onClick={()=>setSelCat(null)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"7px 12px",fontSize:13,fontWeight:700,color:C.sub,cursor:"pointer",flexShrink:0}}>← Πίσω</button>
            <div style={{fontSize:18,fontWeight:900,color:C.text}}>{selCat} {CATS.find(c=>c.id===selCat)?.label}</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <StatCard icon="🟢" label="διαθέσιμοι" value={filtered.filter(p=>p.avail).length} color={C.green} bg={C.greenBg} C={C}/>
            <StatCard icon="🔴" label="μη διαθ." value={filtered.filter(p=>!p.avail).length} color={C.red} bg={C.redBg} C={C}/>
            <StatCard icon="⭐" label="μ.ο." value={(filtered.reduce((s,p)=>s+p.rating,0)/Math.max(filtered.length,1)).toFixed(1)} color={C.yellow} bg={C.yellowBg} C={C}/>
          </div>
          {filtered.length===0&&<Card C={C} style={{textAlign:"center",padding:26}}><div style={{fontSize:32,marginBottom:6}}>{selCat}</div><div style={{fontSize:13,color:C.sub}}>Κανένας σε αυτή την κατηγορία</div></Card>}
          {filtered.map(p=><ProCard key={p.id} p={p}/>)}
          <AddBtn icon="➕" label="Νέος επαγγελματίας" onClick={()=>{setNP({...nP,cat:selCat});setSheet(true);}} color={C.blue} C={C}/>
        </>
      ):(
        <>
          <SectionTitle icon="🔧" title="Επαγγελματίες" sub="Επιλέξτε κατηγορία" C={C}/>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <StatCard icon="🟢" label="διαθέσιμοι" value={available} color={C.green} bg={C.greenBg} C={C}/>
            <StatCard icon="👷" label="σύνολο" value={pros.length} color={C.blue} bg={C.blueBg} C={C}/>
            <StatCard icon="📂" label="κατηγορίες" value={catsWithPros.length} color={C.purple} bg={C.purpleBg} C={C}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {CATS.map(cat=>{
              const cp=pros.filter(p=>p.cat===cat.id);
              const ca=cp.filter(p=>p.avail).length;
              return(
                <button key={cat.id} onClick={()=>setSelCat(cat.id)} style={{background:C.card,border:`1.5px solid ${cp.length>0?cat.color+"40":C.border}`,borderRadius:16,padding:"16px 14px",cursor:"pointer",textAlign:"left",boxShadow:C.sh,opacity:cp.length===0?.4:1}}>
                  <div style={{fontSize:30,marginBottom:8}}>{cat.id}</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>{cat.label}</div>
                  {cp.length>0?<div style={{fontSize:11,color:C.sub}}>{cp.length} επαφές · {ca} διαθ.</div>:<div style={{fontSize:11,color:C.mute}}>Κανένας ακόμα</div>}
                  {cp.length>0&&<div style={{marginTop:8,height:3,borderRadius:2,background:C.border,overflow:"hidden"}}><div style={{height:"100%",background:cat.color,width:`${ca/cp.length*100}%`,transition:"width .4s"}}/></div>}
                </button>
              );
            })}
          </div>
          <AddBtn icon="➕" label="Νέος επαγγελματίας" onClick={()=>setSheet(true)} color={C.blue} C={C}/>
        </>
      )}

      {sheet&&<Sheet title="Νέος Επαγγελματίας" icon="🔧" onClose={()=>setSheet(false)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nP.name} onChange={e=>setNP({...nP,name:e.target.value})} placeholder="π.χ. Νίκος Παπαδόπουλος" C={C}/></FL>
        <FL label="Ειδικότητα" C={C}><FI value={nP.spec} onChange={e=>setNP({...nP,spec:e.target.value})} placeholder="π.χ. Ηλεκτρολόγος" C={C}/></FL>
        <FL label="Κατηγορία" C={C}><FS value={nP.cat} onChange={e=>setNP({...nP,cat:e.target.value})} opts={CATS.map(c=>({v:c.id,l:`${c.id} ${c.label}`}))} C={C}/></FL>
        <FL label="Τηλέφωνο" C={C}><FI type="tel" value={nP.phone} onChange={e=>setNP({...nP,phone:e.target.value})} placeholder="69xxxxxxxx" C={C}/></FL>
        <FL label="Σημειώσεις" C={C}><FI value={nP.notes} onChange={e=>setNP({...nP,notes:e.target.value})} placeholder="π.χ. Καλή τιμή, άμεσος" C={C}/></FL>
        <FL label="Αξιολόγηση" C={C}><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(r=><button key={r} onClick={()=>setNP({...nP,rating:r})} style={{flex:1,background:nP.rating>=r?C.yellowBg:C.card,border:`2px solid ${nP.rating>=r?C.yellow:C.border}`,borderRadius:9,padding:"8px 0",fontSize:18,cursor:"pointer"}}>⭐</button>)}</div></FL>
        <Sav onClick={()=>{if(!nP.name)return;setPros([...pros,{...nP,id:Date.now(),history:[]}]);setNP({name:"",spec:"",phone:"",avail:true,cat:"🔧",rating:5,notes:"",history:[]});setSheet(false);}} color={C.blue} C={C}/>
      </Sheet>}

      {histSheet&&(
        <Sheet title={histSheet.addWork?"Νέα Εργασία":histSheet.name} icon="📋" onClose={()=>setHistSheet(null)} C={C}>
          {histSheet.addWork?(
            <>
              <FL label="Περιγραφή εργασίας" C={C}><FI value={nWork.desc} onChange={e=>setNWork({...nWork,desc:e.target.value})} placeholder="π.χ. Αλλαγή πρίζας" C={C}/></FL>
              <div style={{display:"flex",gap:10}}>
                <FL label="Κόστος €" C={C}><FI type="number" value={nWork.cost} onChange={e=>setNWork({...nWork,cost:e.target.value})} placeholder="50" C={C}/></FL>
                <FL label="Ημερομηνία" C={C}><FI type="date" value={nWork.date} onChange={e=>setNWork({...nWork,date:e.target.value})} C={C}/></FL>
              </div>
              <Sav onClick={()=>{if(!nWork.desc)return;const updated={...histSheet,addWork:undefined,history:[...(histSheet.history||[]),{...nWork,cost:parseFloat(nWork.cost)||0}]};setPros(pros.map(p=>p.id===updated.id?updated:p));setHistSheet(null);}} color={C.blue} C={C}/>
            </>
          ):(
            <>
              <div style={{fontSize:11,fontWeight:700,color:C.mute,marginBottom:8,letterSpacing:.5}}>ΙΣΤΟΡΙΚΟ ΕΡΓΑΣΙΩΝ</div>
              {(histSheet.history||[]).length===0&&<div style={{textAlign:"center",padding:20,color:C.sub}}>Δεν υπάρχουν εργασίες ακόμα</div>}
              {(histSheet.history||[]).map((w,i)=>(
                <Card key={i} C={C} style={{padding:"10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{w.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:11,color:C.sub}}>📅 {w.date}</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.orange}}>€{w.cost}</span>
                  </div>
                </Card>
              ))}
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:8}}>Σύνολο: €{(histSheet.history||[]).reduce((s,w)=>s+w.cost,0).toFixed(2)}</div>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}

// ─── FAMILY ───────────────────────────────────────────────────────────────────
function Family({C}) {
  const [members,setMembers]=useLS("family",[
    {id:1,name:"Μαρία",rel:"Σύζυγος",avatar:"👩",phone:"6945678901",birthday:"1985-03-15",notes:""},
    {id:2,name:"Αλέξης",rel:"Γιος",avatar:"👦",phone:"",birthday:"2012-06-20",notes:"Σχολείο 8:00"},
  ]);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [sheet,setSheet]=useState(false);
  const [nF,setNF]=useState({name:"",rel:"",avatar:"👤",phone:"",birthday:"",notes:""});
  const now=new Date();
  const upcomingBdays=members.filter(m=>{
    if(!m.birthday)return false;
    const bd=new Date(m.birthday);
    const next=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());
    if(next<now)next.setFullYear(now.getFullYear()+1);
    return Math.ceil((next-now)/86400000)<=30;
  });

  return(
    <div>
      <SectionTitle icon="👨‍👩‍👧" title="Οικογένεια" sub={`${members.length} μέλη`} C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <StatCard icon="👥" label="μέλη" value={members.length} color={C.purple} bg={C.purpleBg} C={C}/>
        <StatCard icon="🎂" label="γενέθ./30μ." value={upcomingBdays.length} color={upcomingBdays.length>0?C.orange:C.green} bg={upcomingBdays.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="📞" label="με τηλ." value={members.filter(m=>m.phone).length} color={C.blue} bg={C.blueBg} C={C}/>
      </div>
      {upcomingBdays.map(m=>{
        const bd=new Date(m.birthday);const next=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());
        if(next<now)next.setFullYear(now.getFullYear()+1);
        const days=Math.ceil((next-now)/86400000);
        return(
          <Card key={m.id+"bd"} C={C} style={{background:C.yellowBg,border:`1.5px solid ${C.yellow}25`,padding:"11px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>🎂</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.yellow}}>{m.name} — {days===0?"Σήμερα!":`σε ${days} μέρες`}</div><div style={{fontSize:12,color:C.sub}}>{m.rel} · {bd.getDate()}/{bd.getMonth()+1}</div></div>{m.phone&&<a href={`sms:?body=${encodeURIComponent("Χρόνια πολλά! 🎉")}`} style={{background:C.yellow,color:"#fff",borderRadius:9,padding:"6px 11px",fontSize:12,fontWeight:700,textDecoration:"none"}}>💬</a>}</div>
          </Card>
        );
      })}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        {members.map(m=>(
          <Card key={m.id} C={C} style={{margin:0,padding:"14px 12px",minWidth:130,flex:1,position:"relative"}}>
            <button onClick={()=>setMembers(members.filter(x=>x.id!==m.id))} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:C.mute,fontSize:14,cursor:"pointer"}}>×</button>
            <div style={{textAlign:"center",marginBottom:10}}>
              <div style={{fontSize:36,marginBottom:4}}>{m.avatar}</div>
              <div style={{fontSize:14,fontWeight:800,color:C.text}}>{m.name}</div>
              <div style={{fontSize:11,color:C.sub,marginTop:1}}>{m.rel}</div>
              {m.birthday&&<div style={{fontSize:11,color:C.mute,marginTop:1}}>🎂 {new Date(m.birthday).toLocaleDateString("el-GR",{day:"numeric",month:"short"})}</div>}
            </div>
            {m.notes&&<div style={{fontSize:11,color:C.sub,marginBottom:8,textAlign:"center"}}>💬 {m.notes}</div>}
            {m.phone&&<div style={{display:"flex",gap:6,justifyContent:"center"}}><a href={`tel:${m.phone}`} style={{flex:1,background:C.greenBg,color:C.green,borderRadius:9,padding:"7px 0",fontSize:13,fontWeight:700,textDecoration:"none",textAlign:"center"}}>📞</a><a href={`https://wa.me/30${m.phone}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#DCFCE7",color:"#16A34A",borderRadius:9,padding:"7px 0",fontSize:13,fontWeight:700,textDecoration:"none",textAlign:"center"}}>💬</a></div>}
          </Card>
        ))}
      </div>
      <AddBtn icon="➕" label="Νέο μέλος" onClick={()=>setSheet(true)} color={C.purple} C={C}/>
      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Οικογ. βοηθός, Ελληνικά, emoji, max 50 λέξεις.",`Μέλη:${JSON.stringify(members.map(m=>({n:m.name,r:m.rel})))}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="Τι χρειάζεται η οικογένεια;" color={C.purple} C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}
      {sheet&&<Sheet title="Νέο Μέλος" icon="👨‍👩‍👧" onClose={()=>setSheet(false)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nF.name} onChange={e=>setNF({...nF,name:e.target.value})} placeholder="π.χ. Μαρία" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Σχέση" C={C}><FI value={nF.rel} onChange={e=>setNF({...nF,rel:e.target.value})} placeholder="Σύζυγος" C={C}/></FL>
          <FL label="Τηλέφωνο" C={C}><FI type="tel" value={nF.phone} onChange={e=>setNF({...nF,phone:e.target.value})} placeholder="69xxxxxxxx" C={C}/></FL>
        </div>
        <FL label="Γενέθλια" C={C}><FI type="date" value={nF.birthday} onChange={e=>setNF({...nF,birthday:e.target.value})} C={C}/></FL>
        <FL label="Σημειώσεις" C={C}><FI value={nF.notes} onChange={e=>setNF({...nF,notes:e.target.value})} placeholder="π.χ. Σχολείο 8:00" C={C}/></FL>
        <FL label="Avatar" C={C}><EmojiPick icons={["👤","👨","👩","👴","👵","👦","👧","👶"]} value={nF.avatar} onChange={v=>setNF({...nF,avatar:v})} active={C.purple} C={C}/></FL>
        <Sav onClick={()=>{if(!nF.name)return;setMembers([...members,{...nF,id:Date.now()}]);setNF({name:"",rel:"",avatar:"👤",phone:"",birthday:"",notes:""});setSheet(false);}} color={C.purple} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────
function Health({earn,C}) {
  const [meds,setMeds]=useLS("meds",[{id:1,name:"Ομεπραζόλη 20mg",time:"08:00",dose:"1 δισκίο",icon:"💊",taken:false},{id:2,name:"Βιταμίνη D3",time:"13:00",dose:"2000 IU",icon:"🌞",taken:false}]);
  const [appts,setAppts]=useLS("appts",[{id:1,name:"Καρδιολόγος",date:"2026-07-10",time:"10:30",notes:"Φέρε εξετάσεις"}]);
  const [sheet,setSheet]=useState(null);
  const [showEmerg,setShowEmerg]=useState(false);
  const [emergLoad,setEmergLoad]=useState(false);
  const [emergData,setEmergData]=useState(null);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [nM,setNM]=useState({name:"",time:"08:00",dose:"",icon:"💊"});
  const [nA,setNA]=useState({name:"",date:"",time:"",notes:""});
  const taken=meds.filter(m=>m.taken).length;
  const pct=meds.length?Math.round(taken/meds.length*100):0;
  const loadEmerg=async()=>{setEmergLoad(true);const r=await ai("Εφημερεύοντα Ναύπλιο Αργολίδα σήμερα. JSON:{pharmacies:[{name,address,phone}],hospitals:[{name,address,phone,dept}]}",`Ημερομηνία:${new Date().toLocaleDateString("el-GR")}`,true);setEmergData(r);setEmergLoad(false);};

  return(
    <div>
      <SectionTitle icon="❤️" title="Υγεία" sub="Φάρμακα & Ραντεβού" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <StatCard icon="💊" label="σήμερα" value={`${taken}/${meds.length}`} color={taken===meds.length?C.green:C.red} bg={taken===meds.length?C.greenBg:C.redBg} C={C}/>
        <StatCard icon="🏥" label="ραντεβού" value={appts.length} color={C.blue} bg={C.blueBg} C={C}/>
        <StatCard icon={taken===meds.length?"✅":"⏳"} label="κατάσταση" value={taken===meds.length?"Τέλεια!":"Εκκρεμεί"} color={taken===meds.length?C.green:C.orange} bg={taken===meds.length?C.greenBg:C.orangeBg} C={C}/>
      </div>
      <button onClick={()=>{setShowEmerg(true);if(!emergData)loadEmerg();}} style={{width:"100%",background:"linear-gradient(135deg,#DC2626,#991B1B)",border:"none",borderRadius:14,padding:"13px 16px",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12,boxShadow:"0 4px 12px rgba(220,38,38,.35)"}}>
        <span style={{fontSize:22}}>🚑</span>Εφημερεύοντα — Φαρμακεία & Νοσοκομεία
      </button>
      <Card C={C} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 14px",background:C.redBg,border:`1.5px solid ${C.red}20`,marginBottom:10}}>
        <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
          <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" fill="none" stroke={C.border} strokeWidth="5"/><circle cx="26" cy="26" r="21" fill="none" stroke={C.red} strokeWidth="5" strokeDasharray={`${pct*1.319} 131.9`} strokeLinecap="round" transform="rotate(-90 26 26)" style={{transition:"stroke-dasharray .5s"}}/></svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:C.red}}>{pct}%</div>
        </div>
        <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>Φάρμακα σήμερα</div><div style={{fontSize:12,color:C.sub}}>{taken} από {meds.length} ελήφθησαν</div></div>
      </Card>
      <SecLabel text="ΦΑΡΜΑΚΑ" C={C}/>
      {meds.map(m=>(
        <Card key={m.id} C={C} style={{borderLeft:`3px solid ${m.taken?C.green:C.red}`,opacity:m.taken?.5:1,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{m.taken?"✅":m.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text,textDecoration:m.taken?"line-through":"none"}}>{m.name}</div><div style={{fontSize:11,color:C.sub}}>{m.time} · {m.dose}</div></div>{!m.taken?<button onClick={()=>{setMeds(meds.map(x=>x.id===m.id?{...x,taken:true}:x));earn(15);}} style={{background:C.red,color:"#fff",border:"none",borderRadius:9,padding:"6px 12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ Πήρα</button>:<span style={{fontSize:16}}>✅</span>}<button onClick={()=>setMeds(meds.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button></div>
        </Card>
      ))}
      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Φαρμακολόγος, Ελληνικά, emoji, max 45 λέξεις.",`Φάρμακα:${JSON.stringify(meds)}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="AI Συμβουλή Υγείας" color={C.red} C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}
      <AddBtn icon="➕" label="Νέο φάρμακο" onClick={()=>setSheet("med")} color={C.red} C={C}/>
      <SecLabel text="ΡΑΝΤΕΒΟΥ" C={C}/>
      {appts.map(a=>(
        <Card key={a.id} C={C} style={{padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>🏥</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.sub}}>📅 {a.date}{a.time?` ⏰ ${a.time}`:""}</div>{a.notes&&<div style={{fontSize:11,color:C.mute}}>💬 {a.notes}</div>}</div><button onClick={()=>setAppts(appts.filter(x=>x.id!==a.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button></div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέο ραντεβού" onClick={()=>setSheet("appt")} color={C.blue} C={C}/>

      {showEmerg&&(
        <Sheet title="Εφημερεύοντα σήμερα" icon="🚑" onClose={()=>setShowEmerg(false)} C={C}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[{icon:"🚑",label:"ΕΚΑΒ",phone:"166"},{icon:"🏥",label:"Νοσοκομείο Ναυπλίου",phone:"2752027100"},{icon:"💊",label:"Φαρμ. Σύλλογος",phone:"2751022434"},{icon:"🚒",label:"Πυροσβεστική",phone:"199"}].map(b=>(
              <a key={b.label} href={`tel:${b.phone}`} style={{background:C.redBg,border:`1.5px solid ${C.red}20`,borderRadius:13,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,textDecoration:"none"}}>
                <span style={{fontSize:26}}>{b.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:C.red,textAlign:"center",lineHeight:1.3}}>{b.label}</span>
                <span style={{fontSize:13,fontWeight:900,color:C.text}}>{b.phone}</span>
              </a>
            ))}
          </div>
          {emergLoad&&<div style={{textAlign:"center",padding:24}}><Spin s={24} c={C.blue}/><div style={{fontSize:13,color:C.sub,marginTop:12}}>Φορτώνω εφημερεύοντα…</div></div>}
          {emergData&&(
            <>
              <SecLabel text="💊 ΕΦΗΜΕΡΕΥΟΝΤΑ ΦΑΡΜΑΚΕΙΑ" C={C}/>
              {(emergData.pharmacies||[]).map((p,i)=>(
                <Card key={i} C={C} style={{padding:"10px 12px",borderLeft:`3px solid ${C.green}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>💊</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.name}</div><div style={{fontSize:11,color:C.sub}}>📍 {p.address}</div></div>{p.phone&&<a href={`tel:${p.phone}`} style={{width:34,height:34,borderRadius:9,background:C.greenBg,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:18}}>📞</a>}</div>
                </Card>
              ))}
              <SecLabel text="🏥 ΕΦΗΜΕΡΕΥΟΝΤΑ ΝΟΣΟΚΟΜΕΙΑ" C={C}/>
              {(emergData.hospitals||[]).map((h,i)=>(
                <Card key={i} C={C} style={{padding:"10px 12px",borderLeft:`3px solid ${C.blue}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🏥</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{h.name}</div><div style={{fontSize:11,color:C.sub}}>📍 {h.address}</div>{h.dept&&<div style={{fontSize:11,color:C.mute}}>🩺 {h.dept}</div>}</div>{h.phone&&<a href={`tel:${h.phone}`} style={{width:34,height:34,borderRadius:9,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:18}}>📞</a>}</div>
                </Card>
              ))}
              <button onClick={()=>{setEmergData(null);loadEmerg();}} style={{width:"100%",background:C.border,border:"none",borderRadius:11,padding:10,color:C.sub,fontSize:12,cursor:"pointer",marginTop:4}}>🔄 Ανανέωση</button>
            </>
          )}
        </Sheet>
      )}
      {sheet==="med"&&<Sheet title="Νέο Φάρμακο" icon="💊" onClose={()=>setSheet(null)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nM.name} onChange={e=>setNM({...nM,name:e.target.value})} placeholder="π.χ. Ομεπραζόλη 20mg" C={C}/></FL>
        <div style={{display:"flex",gap:10}}><FL label="Ώρα" C={C}><FI type="time" value={nM.time} onChange={e=>setNM({...nM,time:e.target.value})} C={C}/></FL><FL label="Δόση" C={C}><FI value={nM.dose} onChange={e=>setNM({...nM,dose:e.target.value})} placeholder="1 δισκίο" C={C}/></FL></div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["💊","🌞","🌙","💉","🩺","🫀","🧠","🦷"]} value={nM.icon} onChange={v=>setNM({...nM,icon:v})} active={C.red} C={C}/></FL>
        <Sav onClick={()=>{if(!nM.name.trim())return;setMeds([...meds,{...nM,id:Date.now(),taken:false}]);setNM({name:"",time:"08:00",dose:"",icon:"💊"});setSheet(null);earn(10);}} color={C.red} C={C}/>
      </Sheet>}
      {sheet==="appt"&&<Sheet title="Νέο Ραντεβού" icon="🏥" onClose={()=>setSheet(null)} C={C}>
        <FL label="Γιατρός" C={C}><FI value={nA.name} onChange={e=>setNA({...nA,name:e.target.value})} placeholder="π.χ. Καρδιολόγος" C={C}/></FL>
        <div style={{display:"flex",gap:10}}><FL label="Ημερομηνία" C={C}><FI type="date" value={nA.date} onChange={e=>setNA({...nA,date:e.target.value})} C={C}/></FL><FL label="Ώρα" C={C}><FI type="time" value={nA.time} onChange={e=>setNA({...nA,time:e.target.value})} C={C}/></FL></div>
        <FL label="Σημειώσεις" C={C}><FI value={nA.notes} onChange={e=>setNA({...nA,notes:e.target.value})} placeholder="π.χ. Φέρε εξετάσεις" C={C}/></FL>
        <Sav onClick={()=>{if(!nA.name||!nA.date)return;setAppts([...appts,{...nA,id:Date.now()}]);setNA({name:"",date:"",time:"",notes:""});setSheet(null);earn(10);}} color={C.blue} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
function Documents({earn,C}) {
  const [docs,setDocs]=useLS("docs",[
    {id:1,icon:"🚗",name:"ΚΤΕΟ",expires:"2026-07-15",days:18,status:"urgent"},
    {id:2,icon:"🏠",name:"Ασφάλεια Σπιτιού",expires:"2026-07-28",days:31,status:"soon"},
    {id:3,icon:"🪪",name:"Ταυτότητα",expires:"2028-03-01",days:610,status:"ok"},
  ]);
  const [sheet,setSheet]=useState(false);
  const [nD,setND]=useState({name:"",icon:"📄",expires:""});
  const sc=s=>s==="urgent"?C.orange:s==="soon"?C.blue:C.green;
  const sl=s=>s==="urgent"?"⚠️ Επείγει":s==="soon"?"📅 Σύντομα":"✅ ΟΚ";
  const calcDoc=e=>{const days=Math.ceil((new Date(e)-new Date())/86400000);return{days,status:days<30?"urgent":days<90?"soon":"ok"};};
  const urgent=docs.filter(d=>d.status==="urgent");
  const soon=docs.filter(d=>d.status==="soon");
  const ok=docs.filter(d=>d.status==="ok");

  const DocCard=({d})=>(
    <Card C={C} style={{borderLeft:`3px solid ${sc(d.status)}`,padding:"11px 12px",background:d.status==="urgent"?C.orangeBg:C.card}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>{d.icon}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{d.name}</div><div style={{fontSize:11,color:C.sub}}>Λήγει: {d.expires} · {d.days>0?`${d.days} μέρες`:"⚠️ ΕΛΗΞΕ"}</div></div><Pill color={sc(d.status)} C={C}>{sl(d.status)}</Pill><button onClick={()=>setDocs(docs.filter(x=>x.id!==d.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button></div>
    </Card>
  );

  return(
    <div>
      <SectionTitle icon="📁" title="Έγγραφα" sub="Παρακολούθηση λήξεων" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <StatCard icon="⚠️" label="επείγοντα" value={urgent.length} color={urgent.length>0?C.orange:C.green} bg={urgent.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="📅" label="σύντομα" value={soon.length} color={soon.length>0?C.blue:C.green} bg={soon.length>0?C.blueBg:C.greenBg} C={C}/>
        <StatCard icon="✅" label="εντάξει" value={ok.length} color={C.green} bg={C.greenBg} C={C}/>
      </div>
      <AddBtn icon="➕" label="Νέο έγγραφο" onClick={()=>setSheet(true)} color={C.orange} C={C}/>
      {urgent.length>0&&<SecLabel text="⚠️ ΕΠΕΙΓΕΙ ΑΝΑΝΕΩΣΗ" C={C}/>}{urgent.map(d=><DocCard key={d.id} d={d}/>)}
      {soon.length>0&&<SecLabel text="📅 ΣΥΝΤΟΜΑ" C={C}/>}{soon.map(d=><DocCard key={d.id} d={d}/>)}
      {ok.length>0&&<SecLabel text="✅ ΕΝΤΆΞΕΙ" C={C}/>}{ok.map(d=><DocCard key={d.id} d={d}/>)}
      {docs.length===0&&<Card C={C} style={{textAlign:"center",padding:26}}><div style={{fontSize:32,marginBottom:6}}>📁</div><div style={{fontSize:13,color:C.sub}}>Κανένα έγγραφο</div></Card>}
      {sheet&&<Sheet title="Νέο Έγγραφο" icon="📁" onClose={()=>setSheet(false)} C={C}>
        <FL label="Όνομα" C={C}><FI value={nD.name} onChange={e=>setND({...nD,name:e.target.value})} placeholder="π.χ. ΚΤΕΟ" C={C}/></FL>
        <FL label="Ημερομηνία λήξης" C={C}><FI type="date" value={nD.expires} onChange={e=>setND({...nD,expires:e.target.value})} C={C}/></FL>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["📄","🚗","🏠","🪪","✈️","🏥","🎓","🔑","📋","💳"]} value={nD.icon} onChange={v=>setND({...nD,icon:v})} active={C.orange} C={C}/></FL>
        <Sav onClick={()=>{if(!nD.name||!nD.expires)return;const{days,status}=calcDoc(nD.expires);setDocs([...docs,{...nD,id:Date.now(),days,status}]);setND({name:"",icon:"📄",expires:""});setSheet(false);earn(10);}} color={C.orange} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── ΑΥΤΟΚΙΝΗΤΟ ──────────────────────────────────────────────────────────────
function Car({C}) {
  const [cars,setCars]=useLS("cars",[{id:1,name:"Αυτοκίνητο",plate:"ΑΑΑ-0000",icon:"🚗"}]);
  const [fuel,setFuel]=useLS("fuel_log",[
    {id:1,date:"2026-06-15",liters:45,cost:85.50,km:85430,carId:1},
    {id:2,date:"2026-06-28",liters:42,cost:79.80,km:85780,carId:1},
  ]);
  const [alerts,setAlerts]=useLS("car_alerts",[
    {id:1,name:"ΚΤΕΟ",date:"2026-07-15",alertDays:18,icon:"🔧",carId:1,status:"urgent"},
    {id:2,name:"Ασφάλεια",date:"2026-09-01",alertDays:66,icon:"🛡️",carId:1,status:"soon"},
    {id:3,name:"Service 90.000km",date:"2026-08-15",alertDays:50,icon:"⚙️",carId:1,status:"soon"},
    {id:4,name:"Τέλη κυκλοφορίας",date:"2027-01-31",alertDays:220,icon:"📋",carId:1,status:"ok"},
  ]);
  const [fines,setFines]=useLS("fines",[]);
  const [sheet,setSheet]=useState(null);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [nF,setNF]=useState({date:new Date().toISOString().split("T")[0],liters:"",cost:"",km:"",carId:cars[0]?.id||1});
  const [nA,setNA]=useState({name:"",date:"",icon:"🔧",carId:cars[0]?.id||1});
  const [nFine,setNFine]=useState({desc:"",amount:"",date:new Date().toISOString().split("T")[0],paid:false});
  const urgent=alerts.filter(a=>a.alertDays<=14);
  const soon2=alerts.filter(a=>a.alertDays>14&&a.alertDays<=60);
  const latestKm=fuel.length?fuel[fuel.length-1].km:0;
  const avgCostKm=fuel.length>=2?((fuel[fuel.length-1].cost)/(fuel[fuel.length-1].km-fuel[fuel.length-2].km)*100).toFixed(2):"-";
  const monthFuel=fuel.filter(f=>{const d=new Date(f.date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,f)=>s+f.cost,0);
  const calcAlert=d=>{const days=Math.ceil((new Date(d)-new Date())/86400000);return{alertDays:days,status:days<30?"urgent":days<90?"soon":"ok"};};

  return(
    <div>
      <SectionTitle icon="🚗" title="Αυτοκίνητο" sub="Βενζίνη, Service & Υπενθυμίσεις" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <StatCard icon="⚠️" label="επείγει" value={urgent.length} color={urgent.length>0?C.orange:C.green} bg={urgent.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="⛽" label="€/μήνα" value={`€${monthFuel.toFixed(0)}`} color={C.blue} bg={C.blueBg} C={C}/>
        <StatCard icon="🛣️" label="τελευτ.km" value={latestKm.toLocaleString()} color={C.sub} C={C}/>
      </div>
      {urgent.length>0&&<Card C={C} style={{background:C.orangeBg,border:`1.5px solid ${C.orange}25`,padding:"12px 14px",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:C.orange,marginBottom:8}}>⚠️ ΑΠΑΙΤΕΙ ΑΜΕΣΗ ΕΝΕΡΓΕΙΑ</div>
        {urgent.map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:20}}>{a.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.orange}}>⏳ σε {a.alertDays} μέρες</div></div></div>
        ))}
      </Card>}
      <SecLabel text="ΥΠΕΝΘΥΜΙΣΕΙΣ" C={C}/>
      {alerts.sort((a,b)=>a.alertDays-b.alertDays).map(a=>(
        <Card key={a.id} C={C} style={{borderLeft:`3px solid ${a.alertDays<=14?C.orange:a.alertDays<=60?C.blue:C.green}`,padding:"11px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{a.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.sub}}>📅 {a.date} · {a.alertDays>0?`σε ${a.alertDays} μέρες`:"ΕΛΗΞΕ"}</div></div><Pill color={a.alertDays<=14?C.orange:a.alertDays<=60?C.blue:C.green} C={C}>{a.alertDays<=14?"⚠️":a.alertDays<=60?"📅":"✅"}</Pill><button onClick={()=>setAlerts(alerts.filter(x=>x.id!==a.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button></div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέα υπενθύμιση" onClick={()=>setSheet("alert")} color={C.orange} C={C}/>
      <SecLabel text="ΚΑΥΣΙΜΑ" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <StatCard icon="⛽" label="αυτόν μήνα" value={`€${monthFuel.toFixed(0)}`} color={C.orange} bg={C.orangeBg} C={C}/>
        <StatCard icon="📊" label="€/100km" value={avgCostKm!=="-"?`€${avgCostKm}`:"-"} color={C.blue} bg={C.blueBg} C={C}/>
        <StatCard icon="🏁" label="καταχωρ." value={fuel.length} color={C.green} bg={C.greenBg} C={C}/>
      </div>
      <AddBtn icon="➕" label="Καταχώρηση βενζίνης" onClick={()=>setSheet("fuel")} color={C.blue} C={C}/>
      {fuel.slice().reverse().slice(0,5).map((f,i)=>(
        <Card key={i} C={C} style={{padding:"10px 12px",borderLeft:`3px solid ${C.blue}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>⛽</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{f.liters}lt · {f.km.toLocaleString()}km</div><div style={{fontSize:11,color:C.sub}}>📅 {f.date}</div></div><Pill color={C.orange} C={C}>€{f.cost.toFixed(2)}</Pill></div>
        </Card>
      ))}
      <SecLabel text="ΠΡΟΣΤΙΜΑ & ΠΑΡΑΒΑΣΕΙΣ" C={C}/>
      {fines.map(f=>(
        <Card key={f.id} C={C} style={{borderLeft:`3px solid ${f.paid?C.green:C.red}`,opacity:f.paid?.5:1,padding:"10px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🚨</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{f.desc}</div><div style={{fontSize:11,color:C.sub}}>📅 {f.date}</div></div><Pill color={C.orange} C={C}>€{f.amount}</Pill><button onClick={()=>setFines(fines.map(x=>x.id===f.id?{...x,paid:!x.paid}:x))} style={{background:f.paid?C.greenBg:C.redBg,border:"none",borderRadius:8,padding:"5px 9px",fontSize:11,fontWeight:700,color:f.paid?C.green:C.red,cursor:"pointer"}}>{f.paid?"✅":"Πλ/σε"}</button><button onClick={()=>setFines(fines.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button></div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέο πρόστιμο" onClick={()=>setSheet("fine")} color={C.red} C={C}/>
      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Αυτοκίνητο, Ελληνικά, emoji, max 50 λέξεις.",`Καύσιμα μήνα:€${monthFuel.toFixed(0)} Εκκρεμή:${urgent.length} Km:${latestKm}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="Ανάλυση κόστους αυτ/του" color={C.blue} C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}

      {sheet==="fuel"&&<Sheet title="Καταχώρηση Βενζίνης" icon="⛽" onClose={()=>setSheet(null)} C={C}>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nF.date} onChange={e=>setNF({...nF,date:e.target.value})} C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Λίτρα" C={C}><FI type="number" value={nF.liters} onChange={e=>setNF({...nF,liters:e.target.value})} placeholder="45" C={C}/></FL>
          <FL label="Κόστος €" C={C}><FI type="number" value={nF.cost} onChange={e=>setNF({...nF,cost:e.target.value})} placeholder="85.50" C={C}/></FL>
        </div>
        <FL label="Χιλιόμετρα (km)" C={C}><FI type="number" value={nF.km} onChange={e=>setNF({...nF,km:e.target.value})} placeholder="85430" C={C}/></FL>
        <Sav onClick={()=>{if(!nF.liters||!nF.cost)return;setFuel([...fuel,{...nF,id:Date.now(),liters:parseFloat(nF.liters),cost:parseFloat(nF.cost),km:parseInt(nF.km)||0}]);setNF({date:new Date().toISOString().split("T")[0],liters:"",cost:"",km:"",carId:cars[0]?.id||1});setSheet(null);}} color={C.blue} C={C}/>
      </Sheet>}
      {sheet==="alert"&&<Sheet title="Νέα Υπενθύμιση" icon="🔔" onClose={()=>setSheet(null)} C={C}>
        <FL label="Τι;" C={C}><FI value={nA.name} onChange={e=>setNA({...nA,name:e.target.value})} placeholder="π.χ. Service, Ασφάλεια…" C={C}/></FL>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nA.date} onChange={e=>setNA({...nA,date:e.target.value})} C={C}/></FL>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["🔧","⚙️","🛡️","📋","🚗","⛽","🏁","🔑"]} value={nA.icon} onChange={v=>setNA({...nA,icon:v})} active={C.orange} C={C}/></FL>
        <Sav onClick={()=>{if(!nA.name||!nA.date)return;const{alertDays,status}=calcAlert(nA.date);setAlerts([...alerts,{...nA,id:Date.now(),alertDays,status}]);setNA({name:"",date:"",icon:"🔧",carId:cars[0]?.id||1});setSheet(null);}} color={C.orange} C={C}/>
      </Sheet>}
      {sheet==="fine"&&<Sheet title="Νέο Πρόστιμο" icon="🚨" onClose={()=>setSheet(null)} C={C}>
        <FL label="Παράβαση" C={C}><FI value={nFine.desc} onChange={e=>setNFine({...nFine,desc:e.target.value})} placeholder="π.χ. Παρκάρισμα" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Ποσό €" C={C}><FI type="number" value={nFine.amount} onChange={e=>setNFine({...nFine,amount:e.target.value})} placeholder="80" C={C}/></FL>
          <FL label="Ημερομηνία" C={C}><FI type="date" value={nFine.date} onChange={e=>setNFine({...nFine,date:e.target.value})} C={C}/></FL>
        </div>
        <Sav onClick={()=>{if(!nFine.desc||!nFine.amount)return;setFines([...fines,{...nFine,id:Date.now(),amount:parseFloat(nFine.amount)}]);setNFine({desc:"",amount:"",date:new Date().toISOString().split("T")[0],paid:false});setSheet(null);}} color={C.red} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── ΣΠΙΤΙ / ΑΚΙΝΗΤΑ ─────────────────────────────────────────────────────────
function House({C}) {
  const [properties,setProperties]=useLS("properties",[
    {id:1,name:"Κύρια Κατοικία",type:"own",icon:"🏠",address:"Ναύπλιο"},
    {id:2,name:"Ενοικιαζόμενο",type:"rent_out",icon:"🏢",address:"Αθήνα",tenant:"Κ. Παπαδόπουλος",rent:650,rentDay:1},
  ]);
  const [meters,setMeters]=useLS("meters",[
    {id:1,date:"2026-06-01",elec:4820,water:125,propId:1},
  ]);
  const [issues,setIssues]=useLS("house_issues",[
    {id:1,name:"Στάζει βρύση κουζίνας",status:"urgent",propId:1,date:"2026-06-20",notes:""},
    {id:2,name:"Βάψιμο εξωτερικού",status:"soon",propId:1,date:"",notes:"Καλοκαίρι"},
  ]);
  const [rents,setRents]=useLS("rent_log",[
    {id:1,month:"Ιούν 2026",amount:650,paid:true,propId:2},
    {id:2,month:"Ιούλ 2026",amount:650,paid:false,propId:2},
  ]);
  const [sheet,setSheet]=useState(null);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [nI,setNI]=useState({name:"",status:"urgent",propId:properties[0]?.id||1,date:"",notes:""});
  const [nM,setNM]=useState({date:new Date().toISOString().split("T")[0],elec:"",water:"",propId:properties[0]?.id||1});
  const [nR,setNR]=useState({month:"",amount:"",paid:false,propId:properties.find(p=>p.type==="rent_out")?.id||1});
  const rentIncome=rents.filter(r=>r.paid).reduce((s,r)=>s+r.amount,0);
  const pendingRent=rents.filter(r=>!r.paid);
  const urgentIssues=issues.filter(i=>i.status==="urgent");
  const latestMeter=meters.length?meters[meters.length-1]:null;

  return(
    <div>
      <SectionTitle icon="🏠" title="Σπίτι & Ακίνητα" sub="Ενοίκια, Βλάβες & Μετρητές" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <StatCard icon="🏠" label="ακίνητα" value={properties.length} color={C.blue} bg={C.blueBg} C={C}/>
        <StatCard icon="💶" label="ενοίκια/μ." value={`€${properties.filter(p=>p.type==="rent_out").reduce((s,p)=>s+(p.rent||0),0)}`} color={C.green} bg={C.greenBg} C={C}/>
        <StatCard icon="⚠️" label="βλάβες" value={urgentIssues.length} color={urgentIssues.length>0?C.red:C.green} bg={urgentIssues.length>0?C.redBg:C.greenBg} C={C}/>
      </div>

      {/* Properties */}
      <SecLabel text="ΑΚΙΝΗΤΑ" C={C}/>
      {properties.map(p=>(
        <Card key={p.id} C={C} style={{padding:"12px 13px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>{p.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{p.name}</div><div style={{fontSize:12,color:C.sub}}>📍 {p.address}</div>{p.type==="rent_out"&&<div style={{fontSize:12,color:C.green,marginTop:2}}>👤 {p.tenant} · €{p.rent}/μήνα</div>}</div>
            <Pill color={p.type==="own"?C.blue:C.green} C={C}>{p.type==="own"?"Ιδιοκτησία":"Ενοικ/μενο"}</Pill>
          </div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέο ακίνητο" onClick={()=>setSheet("property")} color={C.blue} C={C}/>

      {/* Rent tracker */}
      {properties.some(p=>p.type==="rent_out")&&(
        <>
          <SecLabel text="ΕΝΟΙΚΙΑ" C={C}/>
          {pendingRent.length>0&&<Card C={C} style={{background:C.orangeBg,border:`1.5px solid ${C.orange}25`,padding:"12px 13px",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:C.orange,marginBottom:6}}>⚠️ ΕΚΚΡΕΜΗ ΕΝΟΙΚΙΑ</div>
            {pendingRent.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{flex:1,fontSize:13,color:C.text}}>{r.month} · €{r.amount}</div><button onClick={()=>setRents(rents.map(x=>x.id===r.id?{...x,paid:true}:x))} style={{background:C.green,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Ελήφθη</button></div>
            ))}
          </Card>}
          {rents.filter(r=>r.paid).slice(-3).map(r=>(
            <Card key={r.id} C={C} style={{padding:"10px 12px",borderLeft:`3px solid ${C.green}`,opacity:.6}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>✅</span><div style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{r.month}</div><Pill color={C.green} C={C}>€{r.amount}</Pill></div>
            </Card>
          ))}
          <AddBtn icon="➕" label="Νέα εγγραφή ενοικίου" onClick={()=>setSheet("rent")} color={C.green} C={C}/>
        </>
      )}

      {/* Meters */}
      <SecLabel text="ΜΕΤΡΗΤΕΣ (ΔΕΗ / ΕΥΔΑΠ)" C={C}/>
      {latestMeter&&<Card C={C} style={{padding:"12px 13px"}}>
        <div style={{display:"flex",gap:16}}>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24}}>⚡</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{latestMeter.elec}</div><div style={{fontSize:11,color:C.sub}}>kWh · {latestMeter.date}</div></div>
          <div style={{width:1,background:C.border}}/>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:24}}>💧</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{latestMeter.water}</div><div style={{fontSize:11,color:C.sub}}>m³ · {latestMeter.date}</div></div>
        </div>
      </Card>}
      <AddBtn icon="➕" label="Νέα καταχώρηση μετρητή" onClick={()=>setSheet("meter")} color={C.blue} C={C}/>

      {/* Issues */}
      <SecLabel text="ΒΛΑΒΕΣ & ΕΡΓΑΣΙΕΣ" C={C}/>
      {issues.sort((a,b)=>a.status==="urgent"?-1:1).map(iss=>(
        <Card key={iss.id} C={C} style={{borderLeft:`3px solid ${iss.status==="urgent"?C.red:iss.status==="soon"?C.orange:C.green}`,padding:"11px 12px",background:iss.status==="urgent"?C.redBg:C.card}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{iss.status==="urgent"?"🔴":"🟡"}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{iss.name}</div>{iss.notes&&<div style={{fontSize:11,color:C.sub}}>📝 {iss.notes}</div>}</div>
            <Pill color={iss.status==="urgent"?C.red:C.orange} C={C}>{iss.status==="urgent"?"Επείγει":"Σύντομα"}</Pill>
            <button onClick={()=>setIssues(issues.filter(x=>x.id!==iss.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
          </div>
        </Card>
      ))}
      <AddBtn icon="➕" label="Νέα βλάβη / εργασία" onClick={()=>setSheet("issue")} color={C.red} C={C}/>

      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Σύμβουλος ακινήτων, Ελληνικά, emoji, max 50 λέξεις.",`Ακίνητα:${properties.length} Εκκρεμή ενοίκια:${pendingRent.length} Βλάβες:${urgentIssues.length}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="Ανάλυση ακινήτων" color={C.blue} C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}

      {sheet==="property"&&<Sheet title="Νέο Ακίνητο" icon="🏠" onClose={()=>setSheet(null)} C={C}>
        <FL label="Όνομα" C={C}><FI value={""} onChange={e=>null} placeholder="π.χ. Κατοικία Αθήνα" C={C}/></FL>
        <FL label="Τύπος" C={C}><FS value={"own"} onChange={()=>null} opts={[{v:"own",l:"🏠 Ιδιοκτησία"},{v:"rent_out",l:"💶 Ενοικιαζόμενο"}]} C={C}/></FL>
        <FL label="Διεύθυνση" C={C}><FI value={""} onChange={e=>null} placeholder="π.χ. Ναύπλιο" C={C}/></FL>
        <Sav onClick={()=>setSheet(null)} label="Αποθήκευση" color={C.blue} C={C}/>
      </Sheet>}
      {sheet==="rent"&&<Sheet title="Εγγραφή Ενοικίου" icon="💶" onClose={()=>setSheet(null)} C={C}>
        <FL label="Μήνας" C={C}><FI value={nR.month} onChange={e=>setNR({...nR,month:e.target.value})} placeholder="π.χ. Ιούλ 2026" C={C}/></FL>
        <FL label="Ποσό €" C={C}><FI type="number" value={nR.amount} onChange={e=>setNR({...nR,amount:e.target.value})} placeholder="650" C={C}/></FL>
        <Sav onClick={()=>{if(!nR.month||!nR.amount)return;setRents([...rents,{...nR,id:Date.now(),amount:parseFloat(nR.amount)}]);setNR({month:"",amount:"",paid:false,propId:properties.find(p=>p.type==="rent_out")?.id||1});setSheet(null);}} color={C.green} C={C}/>
      </Sheet>}
      {sheet==="meter"&&<Sheet title="Μετρητές" icon="⚡" onClose={()=>setSheet(null)} C={C}>
        <FL label="Ημερομηνία" C={C}><FI type="date" value={nM.date} onChange={e=>setNM({...nM,date:e.target.value})} C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="ΔΕΗ (kWh)" C={C}><FI type="number" value={nM.elec} onChange={e=>setNM({...nM,elec:parseFloat(e.target.value)||0})} placeholder="4820" C={C}/></FL>
          <FL label="ΕΥΔΑΠ (m³)" C={C}><FI type="number" value={nM.water} onChange={e=>setNM({...nM,water:parseFloat(e.target.value)||0})} placeholder="125" C={C}/></FL>
        </div>
        <Sav onClick={()=>{if(!nM.elec&&!nM.water)return;setMeters([...meters,{...nM,id:Date.now()}]);setNM({date:new Date().toISOString().split("T")[0],elec:"",water:"",propId:properties[0]?.id||1});setSheet(null);}} color={C.blue} C={C}/>
      </Sheet>}
      {sheet==="issue"&&<Sheet title="Νέα Βλάβη / Εργασία" icon="🔧" onClose={()=>setSheet(null)} C={C}>
        <FL label="Περιγραφή" C={C}><FI value={nI.name} onChange={e=>setNI({...nI,name:e.target.value})} placeholder="π.χ. Στάζει βρύση" C={C}/></FL>
        <FL label="Επείγον" C={C}><FS value={nI.status} onChange={e=>setNI({...nI,status:e.target.value})} opts={[{v:"urgent",l:"🔴 Επείγει"},{v:"soon",l:"🟡 Σύντομα"},{v:"ok",l:"🟢 Χωρίς βιάση"}]} C={C}/></FL>
        <FL label="Σημειώσεις" C={C}><FI value={nI.notes} onChange={e=>setNI({...nI,notes:e.target.value})} placeholder="π.χ. Βρύση κουζίνας" C={C}/></FL>
        <Sav onClick={()=>{if(!nI.name)return;setIssues([...issues,{...nI,id:Date.now()}]);setNI({name:"",status:"urgent",propId:properties[0]?.id||1,date:"",notes:""});setSheet(null);}} color={C.red} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── ΕΛΛΗΝΙΚΗ ΖΩΗ ────────────────────────────────────────────────────────────
function GreekLife({C}) {
  const [tasks,setGovTasks]=useLS("gov_tasks",[
    {id:1,name:"Εκκαθαριστικό ΦΠΑ",due:"25/7",status:"pending",icon:"📋",category:"ΑΑΔΕ"},
    {id:2,name:"Δήλωση εισοδήματος",due:"30/6",status:"done",icon:"📝",category:"ΑΑΔΕ"},
    {id:3,name:"Ανανέωση δελτίου",due:"Αορ.",status:"pending",icon:"🪪",category:"ΚΕΠ"},
  ]);
  const [news,setNews]=useState([]);const [newsLoad,setNewsLoad]=useState(false);
  const [strike,setStrike]=useState(null);const [strikeLoad,setStrikeLoad]=useState(false);
  const [aiTip,setAiTip]=useState("");const [aiBusy,setAiBusy]=useState(false);
  const [sheet,setSheet]=useState(false);
  const [nT,setNT]=useState({name:"",due:"",status:"pending",icon:"📋",category:"ΑΑΔΕ"});
  const CATS=["ΑΑΔΕ","ΚΕΠ","ΕΦΚΑ","ΔΟΥ","ΔΗΜΟΣ","ΑΛΛΟ"];
  const pending=tasks.filter(t=>t.status==="pending");

  const loadNews=async()=>{setNewsLoad(true);const r=await ai("Δώσε 4 τοπικές ειδήσεις Αργολίδας/Ναυπλίου. JSON:[{title,summary,source}]",`Ημερομηνία:${new Date().toLocaleDateString("el-GR")}`,true);setNews(r||[]);setNewsLoad(false);};
  const loadStrike=async()=>{setStrikeLoad(true);const r=await ai("Υπάρχουν απεργίες ΜΜΜ/δημόσιων υπηρεσιών Ελλάδα σήμερα; Ελληνικά, emoji, max 60 λέξεις. Αν δεν υπάρχουν πες το.",`Ημερομηνία:${new Date().toLocaleDateString("el-GR")}`);setStrike(r);setStrikeLoad(false);};

  return(
    <div>
      <SectionTitle icon="🇬🇷" title="Ελληνική Ζωή" sub="Gov.gr, ΑΑΔΕ, Ειδήσεις & Απεργίες" C={C}/>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <StatCard icon="⏳" label="εκκρεμή" value={pending.length} color={pending.length>0?C.orange:C.green} bg={pending.length>0?C.orangeBg:C.greenBg} C={C}/>
        <StatCard icon="✅" label="ολοκλ." value={tasks.filter(t=>t.status==="done").length} color={C.green} bg={C.greenBg} C={C}/>
        <StatCard icon="📂" label="κατηγορίες" value={[...new Set(tasks.map(t=>t.category))].length} color={C.blue} bg={C.blueBg} C={C}/>
      </div>

      {/* Quick links */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[{icon:"🏛️",label:"Gov.gr",url:"https://www.gov.gr"},{icon:"💶",label:"ΑΑΔΕ / Taxisnet",url:"https://www.aade.gr"},{icon:"🏥",label:"ΕΦΚΑ",url:"https://www.efka.gov.gr"},{icon:"🏛️",label:"ΚΕΠ Online",url:"https://www.kep.gov.gr"}].map(l=>(
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{background:C.blueBg,border:`1.5px solid ${C.blue}22`,borderRadius:13,padding:"12px 10px",display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <span style={{fontSize:24}}>{l.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:C.blue}}>{l.label}</span>
          </a>
        ))}
      </div>

      {/* Gov tasks */}
      <SecLabel text="ΕΚΚΡΕΜΟΤΗΤΕΣ GOV / ΑΑΔΕ" C={C}/>
      {CATS.filter(cat=>tasks.some(t=>t.category===cat)).map(cat=>(
        <div key={cat} style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.sub,marginBottom:6}}>{cat}</div>
          {tasks.filter(t=>t.category===cat).map(t=>(
            <Card key={t.id} C={C} style={{borderLeft:`3px solid ${t.status==="done"?C.green:C.orange}`,padding:"10px 12px",opacity:t.status==="done"?.5:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{t.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text,textDecoration:t.status==="done"?"line-through":"none"}}>{t.name}</div>{t.due&&<div style={{fontSize:11,color:C.sub}}>📅 {t.due}</div>}</div>
                <button onClick={()=>setGovTasks(tasks.map(x=>x.id===t.id?{...x,status:x.status==="done"?"pending":"done"}:x))} style={{background:t.status==="done"?C.greenBg:C.orangeBg,border:"none",borderRadius:9,padding:"5px 10px",fontSize:11,fontWeight:700,color:t.status==="done"?C.green:C.orange,cursor:"pointer"}}>{t.status==="done"?"✅":"⏳"}</button>
                <button onClick={()=>setGovTasks(tasks.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:C.mute,fontSize:15,cursor:"pointer"}}>×</button>
              </div>
            </Card>
          ))}
        </div>
      ))}
      <AddBtn icon="➕" label="Νέα εκκρεμότητα Gov / ΑΑΔΕ" onClick={()=>setSheet(true)} color={C.blue} C={C}/>

      {/* Strikes */}
      <button onClick={loadStrike} disabled={strikeLoad} style={{width:"100%",background:strikeLoad?C.border:C.redBg,border:`1.5px solid ${C.red}22`,borderRadius:12,padding:"10px 0",color:C.red,fontSize:13,fontWeight:700,cursor:strikeLoad?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:6}}>
        {strikeLoad?<><Spin s={12} c={C.red}/>Ελέγχω…</>:"🚌 Απεργίες & ΜΜΜ σήμερα;"}
      </button>
      {strike&&<AIBox text={strike} C={C}/>}

      {/* Local news */}
      <button onClick={loadNews} disabled={newsLoad} style={{width:"100%",background:newsLoad?C.border:C.blueBg,border:`1.5px solid ${C.blue}22`,borderRadius:12,padding:"10px 0",color:C.blue,fontSize:13,fontWeight:700,cursor:newsLoad?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:6}}>
        {newsLoad?<><Spin s={12} c={C.blue}/>Φορτώνω…</>:"📰 Ειδήσεις Αργολίδας σήμερα"}
      </button>
      {news.length>0&&news.map((n,i)=>(
        <Card key={i} C={C} style={{padding:"11px 13px"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>{n.title}</div>
          <div style={{fontSize:12,color:C.sub,lineHeight:1.5}}>{n.summary}</div>
          {n.source&&<div style={{fontSize:10,color:C.mute,marginTop:4}}>📰 {n.source}</div>}
        </Card>
      ))}

      <AIBtn onClick={async()=>{setAiBusy(true);const r=await ai("Σύμβουλος ελληνικής γραφειοκρατίας, emoji, max 50 λέξεις.",`Εκκρεμή:${pending.map(t=>t.name).join(",")}`);setAiTip(r);setAiBusy(false);}} busy={aiBusy} label="AI Ανάλυση εκκρεμοτήτων" C={C}/>
      {aiTip&&<AIBox text={aiTip} C={C}/>}

      {sheet&&<Sheet title="Νέα Εκκρεμότητα" icon="🏛️" onClose={()=>setSheet(false)} C={C}>
        <FL label="Τι;" C={C}><FI value={nT.name} onChange={e=>setNT({...nT,name:e.target.value})} placeholder="π.χ. Εκκαθαριστικό ΦΠΑ" C={C}/></FL>
        <div style={{display:"flex",gap:10}}>
          <FL label="Κατηγορία" C={C}><FS value={nT.category} onChange={e=>setNT({...nT,category:e.target.value})} opts={CATS.map(c=>({v:c,l:c}))} C={C}/></FL>
          <FL label="Προθεσμία" C={C}><FI value={nT.due} onChange={e=>setNT({...nT,due:e.target.value})} placeholder="π.χ. 25/7" C={C}/></FL>
        </div>
        <FL label="Εικονίδιο" C={C}><EmojiPick icons={["📋","📝","🪪","💶","🏛️","📊","✈️","⚖️"]} value={nT.icon} onChange={v=>setNT({...nT,icon:v})} active={C.blue} C={C}/></FL>
        <Sav onClick={()=>{if(!nT.name)return;setGovTasks([...tasks,{...nT,id:Date.now()}]);setNT({name:"",due:"",status:"pending",icon:"📋",category:"ΑΑΔΕ"});setSheet(false);}} color={C.blue} C={C}/>
      </Sheet>}
    </div>
  );
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
function AIChat({all,earn,C}) {
  const [msgs,setMsgs]=useState([{r:"a",t:"Γεια! 👋\nΡώτα με οτιδήποτε — βλέπω τα δεδομένα σου."}]);
  const [inp,setInp]=useState("");const [busy,setBusy]=useState(false);
  const end=useRef(null);
  const QUICK=["Τι κάνω πρώτα;","Πού εξοικονομώ;","Τι λήγει σύντομα;","Εβδομαδιαία ανασκόπηση"];
  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async txt=>{
    const m=txt||inp.trim();if(!m||busy)return;
    setInp("");setMsgs(p=>[...p,{r:"u",t:m}]);setBusy(true);
    const r=await ai(`AI βοηθός LifeHub Ναύπλιο. Ελληνικά, φιλικός, emoji, max 120 λέξεις. Δεδομένα:${JSON.stringify(all)}`,m);
    setMsgs(p=>[...p,{r:"a",t:r}]);setBusy(false);earn(2);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 165px)"}}>
      <SectionTitle icon="✦" title="AI Βοηθός" sub="Ρώτα οτιδήποτε" C={C}/>
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:2}}>{QUICK.map((q,i)=><button key={i} onClick={()=>send(q)} style={{background:C.blueBg,color:C.blue,border:"none",borderRadius:20,padding:"7px 12px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{q}</button>)}</div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
        {msgs.map((m,i)=><div key={i} style={{alignSelf:m.r==="u"?"flex-end":"flex-start",maxWidth:"82%",background:m.r==="u"?"linear-gradient(135deg,#0D1117,#1D4ED8)":C.card,border:m.r==="a"?`1.5px solid ${C.border}`:"none",borderRadius:m.r==="u"?"16px 16px 3px 16px":"3px 16px 16px 16px",padding:"11px 14px",fontSize:13,color:m.r==="u"?"#fff":C.text,lineHeight:1.65,whiteSpace:"pre-wrap",boxShadow:C.sh}}>{m.t}</div>)}
        {busy&&<div style={{alignSelf:"flex-start",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:"3px 16px 16px 16px",padding:"12px 16px",display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.mute,animation:`bounce 1s ${i*.2}s infinite`}}/>)}</div>}
        <div ref={end}/>
      </div>
      <div style={{display:"flex",gap:8,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"8px 8px 8px 13px",boxShadow:C.sh}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Γράψε ή μίλα…" style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:C.text,fontFamily:"inherit"}}/>
        <MicBtn onResult={txt=>{setInp(txt);}} C={C}/>
        <button onClick={()=>send()} disabled={busy} style={{width:36,height:36,borderRadius:10,background:busy?C.border:"linear-gradient(135deg,#0D1117,#1D4ED8)",border:"none",color:"#fff",fontSize:17,cursor:busy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{busy?<Spin s={14}/>:"→"}</button>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsScreen({dark,setDark,C}) {
  const [name,setName]=useLS("settings_name","");
  const [nm,snm]=useLS("notif_meds",true);
  const [nd,snd]=useLS("notif_docs",true);
  const [saved,setSaved]=useState(false);const [clear,setClear]=useState(false);
  return(
    <div>
      <div style={{background:"linear-gradient(145deg,#0D1117,#1D4ED8)",borderRadius:18,padding:"20px 16px",marginBottom:14,textAlign:"center"}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 10px"}}>👤</div>
        <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{name||"LifeHub User"}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2}}>v17.0 — All Features</div>
      </div>
      <Card C={C}><FL label="Όνομα" C={C}><FI value={name} onChange={e=>setName(e.target.value)} placeholder="Το όνομά σου" C={C}/></FL></Card>
      <Card C={C} style={{padding:"4px 14px"}}>
        {[{icon:dark?"🌙":"☀️",l:"Σκοτεινό θέμα",c:<Tog on={dark} set={setDark} C={C}/>},{icon:"💊",l:"Ειδοπ. φαρμάκων",c:<Tog on={nm} set={snm} C={C}/>},{icon:"📄",l:"Ειδοπ. εγγράφων",c:<Tog on={nd} set={snd} C={C}/>}].map((r,i,a)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<a.length-1?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:20,width:28,textAlign:"center"}}>{r.icon}</span>
            <div style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{r.l}</div>
            {r.c}
          </div>
        ))}
      </Card>
      <Sav onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}} label={saved?"✅ Αποθηκεύτηκε":"Αποθήκευση"} color={saved?C.green:C.blue} C={C}/>
      {!clear?<button onClick={()=>setClear(true)} style={{width:"100%",background:"transparent",border:`1.5px solid ${C.red}`,borderRadius:13,padding:"12px 0",color:C.red,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:8}}>🗑️ Διαγραφή δεδομένων</button>
        :<Card C={C} style={{background:C.redBg,border:`1.5px solid ${C.red}22`,marginTop:8}}><div style={{fontSize:12,color:C.red,marginBottom:10,fontWeight:600}}>⚠️ Δεν μπορεί να αναιρεθεί.</div><div style={{display:"flex",gap:8}}><button onClick={()=>setClear(false)} style={{flex:1,background:C.border,border:"none",borderRadius:10,padding:11,color:C.sub,fontSize:13,fontWeight:700,cursor:"pointer"}}>Ακύρωση</button><button onClick={()=>{Object.keys(localStorage).filter(k=>k.startsWith("lh17_")).forEach(k=>localStorage.removeItem(k));window.location.reload();}} style={{flex:1,background:C.red,border:"none",borderRadius:10,padding:11,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Διαγραφή</button></div></Card>}
      <div style={{textAlign:"center",fontSize:10,color:C.mute,padding:"18px 0 4px"}}>⬡ LifeHub AI v17.0 · Ναύπλιο 🇬🇷</div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const NAV=[
  {id:"today",   icon:"📅",label:"Σήμερα"},
  {id:"tasks",   icon:"✅",label:"Tasks"},
  {id:"shopping",icon:"🛒",label:"Ψώνια"},
  {id:"money",   icon:"💳",label:"Χρήματα"},
  {id:"habits",  icon:"📊",label:"Habits"},
  {id:"pros",    icon:"🔧",label:"Επαγγ."},
  {id:"family",  icon:"👨‍👩‍👧",label:"Οικογ."},
  {id:"health",  icon:"❤️",label:"Υγεία"},
  {id:"docs",    icon:"📁",label:"Έγγραφα"},
  {id:"car",     icon:"🚗",label:"Αυτ/το"},
  {id:"house",   icon:"🏠",label:"Σπίτι"},
  {id:"greece",  icon:"🇬🇷",label:"Ελλάδα"},
  {id:"ai",      icon:"✦", label:"AI"},
];

export default function App() {
  const [dark,setDark]=useLS("dark",false);
  const C=dark?DT:LT;
  const [screen,setScreen]=useLS("screen","today");
  const [onboarded,setOnboarded]=useLS("onboarded",false);
  const [showSettings,setShowSettings]=useState(false);
  const [showSOS,setShowSOS]=useState(false);
  const [toast,setToast]=useState(null);
  const [xp,setXP]=useLS("xp",0);
  const level=Math.floor(xp/200)+1;
  const prog=(xp%200)/200*100;
  const earn=useCallback(n=>{setXP(x=>x+n);setToast(`+${n} XP`);setTimeout(()=>setToast(null),1500);},[setXP]);
  const [meds]=useLS("meds",[]);
  const [tasks]=useLS("tasks",[]);
  const [docs]=useLS("docs",[]);
  const [habits]=useLS("habits",[]);
  const [appts]=useLS("appts",[]);
  const [bills]=useLS("bills",[]);
  const [subs]=useLS("subs",[]);
  const [family]=useLS("family",[]);
  const [car]=useLS("car_alerts",[]);
  const [house]=useLS("house_issues",[]);
  const [income]=useLS("income",[]);
  const all={meds,tasks,docs,habits,appts,bills,subs,family,car,house,income,xp,level};

  const [voiceResult,setVoiceResult]=useState(null);
  const [voiceSheet,setVoiceSheet]=useState(false);
  const [voiceAI,setVoiceAI]=useState("");const [voiceAIBusy,setVoiceAIBusy]=useState(false);
  const {listening,start:startVoice}=useVoice(async txt=>{
    setVoiceResult(txt);setVoiceSheet(true);setVoiceAIBusy(true);
    const r=await ai(`Είσαι βοηθός LifeHub. Ο χρήστης μίλησε. Εξήγησε σύντομα τι κατάλαβες και τι θα κάνεις. Ελληνικά, emoji, max 40 λέξεις.`,`Φωνή: "${txt}" Δεδομένα:${JSON.stringify({tasks:tasks.length,meds:meds.length})}`);
    setVoiceAI(r);setVoiceAIBusy(false);
  });

  useEffect(()=>{if("Notification"in window)Notification.requestPermission();},[]);
  if(!onboarded) return <Onboarding onDone={()=>setOnboarded(true)} C={C}/>;

  const render=()=>{
    if(screen==="today")    return <Today all={all} earn={earn} C={C}/>;
    if(screen==="tasks")    return <Tasks earn={earn} C={C}/>;
    if(screen==="shopping") return <Shopping C={C}/>;
    if(screen==="money")    return <Money C={C}/>;
    if(screen==="habits")   return <Habits earn={earn} C={C}/>;
    if(screen==="pros")     return <Professionals C={C}/>;
    if(screen==="family")   return <Family C={C}/>;
    if(screen==="health")   return <Health earn={earn} C={C}/>;
    if(screen==="docs")     return <Documents earn={earn} C={C}/>;
    if(screen==="car")      return <Car C={C}/>;
    if(screen==="house")    return <House C={C}/>;
    if(screen==="greece")   return <GreekLife C={C}/>;
    if(screen==="ai")       return <AIChat all={all} earn={earn} C={C}/>;
  };

  const badges={
    tasks:tasks.filter(t=>!t.done).length,
    money:bills.filter(b=>!b.paid).length,
    health:meds.filter(m=>!m.taken).length,
    docs:docs.filter(d=>d.status==="urgent").length,
    car:car.filter(a=>a.alertDays<=14).length,
    house:house.filter(h=>h.status==="urgent").length,
  };

  return(
    <EB>
      <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",color:C.text,display:"flex",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:440,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          {/* Header */}
          <div style={{position:"sticky",top:0,zIndex:20,background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"10px 14px 9px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#0D1117,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff"}}>⬡</div>
                <div><div style={{fontSize:15,fontWeight:900,color:C.blue,lineHeight:1}}>LifeHub</div><div style={{fontSize:9,color:C.mute,fontWeight:600}}>Lv.{level} · {xp} xp</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:50,height:4,background:C.border,borderRadius:20,overflow:"hidden"}}><div style={{background:`linear-gradient(90deg,${C.blue},${C.purple})`,height:"100%",width:`${prog}%`,borderRadius:20,transition:"width .5s"}}/></div>
                <button onClick={()=>setDark(!dark)} style={{width:30,height:30,borderRadius:8,background:C.card,border:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer"}}>{dark?"🌙":"☀️"}</button>
                <button onClick={startVoice} style={{width:30,height:30,borderRadius:8,background:listening?C.red:C.card,border:`1.5px solid ${listening?C.red:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer",transition:"all .2s",animation:listening?"pulse .8s infinite":"none"}}>🎤</button>
                <button onClick={()=>setShowSOS(true)} style={{width:30,height:30,borderRadius:8,background:C.redBg,border:`1.5px solid ${C.red}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer"}}>🚨</button>
                <button onClick={()=>setShowSettings(true)} style={{width:30,height:30,borderRadius:8,background:C.card,border:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer"}}>⚙️</button>
              </div>
            </div>
          </div>
          {/* Content */}
          <div style={{flex:1,padding:"12px 12px 90px",overflowY:"auto"}}><EB>{render()}</EB></div>
          {/* Scrollable bottom nav */}
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:C.card,borderTop:`1px solid ${C.border}`,zIndex:20,padding:"6px 0 18px"}}>
            <div style={{display:"flex",overflowX:"auto"}}>
              {NAV.map(n=>{
                const badge=badges[n.id]||0;
                return(
                  <button key={n.id} onClick={()=>setScreen(n.id)} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 10px",position:"relative",minWidth:60}}>
                    <span style={{fontSize:20,filter:screen===n.id?"none":"saturate(0) opacity(.3)",transform:screen===n.id?"scale(1.1)":"scale(1)",transition:"all .2s"}}>{n.icon}</span>
                    <span style={{fontSize:9,fontWeight:screen===n.id?700:400,color:screen===n.id?C.blue:C.mute,whiteSpace:"nowrap"}}>{n.label}</span>
                    {screen===n.id&&<span style={{position:"absolute",bottom:0,width:20,height:2,borderRadius:2,background:C.blue}}/>}
                    {badge>0&&<span style={{position:"absolute",top:2,right:6,background:C.red,color:"#fff",fontSize:9,fontWeight:800,minWidth:15,height:15,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 2px"}}>{badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {toast&&<div style={{position:"fixed",top:62,left:"50%",transform:"translateX(-50%)",background:"#0D1117",color:"#fff",padding:"7px 16px",borderRadius:20,fontSize:12,fontWeight:700,zIndex:100,pointerEvents:"none"}}>{toast} ⭐</div>}
          {showSOS&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:C.card,borderRadius:20,padding:28,width:"100%",maxWidth:300,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:10}}>🚨</div>
                <div style={{fontSize:19,fontWeight:800,color:C.red,marginBottom:6}}>Έκτακτη Ανάγκη</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:20}}>Θα σταλεί η τοποθεσία σου.</div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setShowSOS(false)} style={{flex:1,background:C.border,border:"none",borderRadius:11,padding:12,color:C.sub,fontSize:13,fontWeight:700,cursor:"pointer"}}>Ακύρωση</button>
                  <button onClick={()=>{setShowSOS(false);setToast("🚨 SOS εστάλη!");}} style={{flex:1,background:C.red,border:"none",borderRadius:11,padding:12,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>ΑΠΟΣΤΟΛΗ</button>
                </div>
              </div>
            </div>
          )}
          {showSettings&&<Sheet title="Ρυθμίσεις" icon="⚙️" onClose={()=>setShowSettings(false)} C={C}><SettingsScreen dark={dark} setDark={setDark} C={C}/></Sheet>}

          {/* Voice result sheet */}
          {voiceSheet&&(
            <Sheet title="Φωνητική Εντολή" icon="🎤" onClose={()=>setVoiceSheet(false)} C={C}>
              <div style={{background:C.blueBg,border:`1.5px solid ${C.blue}22`,borderRadius:13,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:C.sub,marginBottom:6,letterSpacing:.5}}>ΑΝΑΓΝΩΡΊΣΤΗΚΕ</div>
                <div style={{fontSize:15,fontWeight:600,color:C.text}}>"{voiceResult}"</div>
              </div>
              {voiceAIBusy?(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:14}}><Spin s={16} c={C.blue}/><span style={{fontSize:13,color:C.sub}}>Επεξεργάζομαι…</span></div>
              ):voiceAI&&(
                <AIBox text={voiceAI} C={C}/>
              )}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={()=>{setVoiceSheet(false);startVoice();}} style={{flex:1,background:C.blueBg,border:`1.5px solid ${C.blue}22`,borderRadius:11,padding:"11px 0",color:C.blue,fontSize:13,fontWeight:700,cursor:"pointer"}}>🎤 Ξανά</button>
                <button onClick={()=>setVoiceSheet(false)} style={{flex:1,background:C.green,border:"none",borderRadius:11,padding:"11px 0",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ OK</button>
              </div>
            </Sheet>
          )}

          {/* Listening indicator */}
          {listening&&(
            <div style={{position:"fixed",top:55,left:"50%",transform:"translateX(-50%)",background:C.red,color:"#fff",padding:"8px 18px",borderRadius:20,fontSize:12,fontWeight:700,zIndex:200,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(220,38,38,.4)"}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#fff",display:"inline-block",animation:"pulse .6s infinite"}}/>
              Ακούω…
            </div>
          )}

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.9)}}*{box-sizing:border-box}::-webkit-scrollbar{display:none}`}</style>
        </div>
      </div>
    </EB>
  );
}
