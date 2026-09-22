(()=>{"use strict";
// AV EmailJS primary + fallback — existing service/template/publicKey are reused verbatim.
// Primary flow: backend persists lead via /api/public/lead, then EmailJS delivers
// owner (template_bf12i18) + visitor (template_n2ql8q9) via this SDK.
// Fallback path (fetch interceptor) remains for backend timeout/failure.
const SERVICE_ID="service_sa2s1c9";
const OWNER_TEMPLATE_ID="template_bf12i18";
const VISITOR_TEMPLATE_ID="template_n2ql8q9";
const PUBLIC_KEY="IdNuDWb_8YJTbre82";
const SDK_URL="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
const API_PATH="/api/public/lead";
const BACKEND_TIMEOUT_MS=8000;
const EMAILJS_SEND_GAP_MS=1200;

let sdkPromise=null;
const loadSdk=()=>{
  if(window.emailjs)return Promise.resolve(window.emailjs);
  if(sdkPromise)return sdkPromise;
  sdkPromise=new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=SDK_URL;
    s.async=true;
    s.onload=()=>{try{window.emailjs.init({publicKey:PUBLIC_KEY});resolve(window.emailjs);}catch(e){reject(e);}};
    s.onerror=()=>reject(new Error("EmailJS SDK failed to load"));
    document.head.appendChild(s);
  });
  return sdkPromise;
};

const fmtFallbackMessage=(body)=>{
  const msg=String(body||"");
  const m=msg.match(/(?:^|\n\n)Requested intro call:\s*(.*?)\s+at\s+([^\r\n]+)\s+IST\s*$/s);
  return {
    formMessage:m?msg.replace(/(?:^|\n\n)Requested intro call:.*$/s,"").trim():msg,
    booking_date:m?m[1].trim():"—",
    booking_time:m?m[2].trim()+" IST":"—"
  };
};

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const safeStr=v=>String(v||"").trim();
const safeDash=v=>{const s=String(v||"").trim();return s!==""?s:"—";};
const submittedAtNow=()=>{
  try{
    return new Date().toLocaleString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata",hour12:true})+" IST";
  }catch{return new Date().toISOString();}
};

// Comprehensive template params — covers all spec fields + legacy aliases.
// Undefined/null/empty never breaks the request (empty-string or dash fallback).
const buildParams=(payload, opts)=>{
  const isOwner = !!(opts && opts.isOwner);
  const booking=fmtFallbackMessage(payload.message);
  const submittedAt=submittedAtNow();
  const fullPhone=safeStr(payload.full_phone_number) || safeStr(payload.phone_number ? ("+"+String(payload.country_code||"").replace(/\D/g,"")+String(payload.phone_number).replace(/\D/g,"")) : "");
  const phoneDisplay=fullPhone || "—";
  const countryCode=safeStr(payload.country_code);
  const base={
    // identity
    name:safeStr(payload.name),
    visitor_name:safeStr(payload.name),
    from_name:safeStr(payload.name),
    email:safeStr(payload.email),
    visitor_email:safeStr(payload.email),
    from_email:safeStr(payload.email),
    // phone / country
    phone:phoneDisplay,
    phone_number:safeStr(payload.phone_number),
    full_phone_number:fullPhone,
    country:countryCode,
    country_code:countryCode,
    // org
    company:safeDash(payload.organization),
    organisation:safeDash(payload.organization),
    organization:safeDash(payload.organization),
    // project
    project_type:safeStr(payload.project_type) || "intro call request",
    inquiry_type:safeStr(payload.project_type) || "intro call request",
    project:safeStr(payload.project_type) || "intro call request",
    type:safeStr(payload.project_type) || "intro call request",
    // message / booking
    message:booking.formMessage || "—",
    enquiry_message:booking.formMessage || "—",
    visitor_message:booking.formMessage || "—",
    details:booking.formMessage || "—",
    booking_date:booking.booking_date,
    booking_time:booking.booking_time,
    date:booking.booking_date,
    time:booking.booking_time,
    preferred_date:booking.booking_date,
    preferred_time:booking.booking_time,
    // source / tracking
    source:safeStr(payload.source),
    page:safeStr(payload.page),
    source_page:safeStr(payload.page),
    page_url:safeStr(payload.page),
    current_page:safeStr(payload.page),
    referrer:safeStr(payload.referrer),
    referrer_url:safeStr(payload.referrer),
    utm_source:safeStr(payload.utm_source),
    utm_medium:safeStr(payload.utm_medium),
    utm_campaign:safeStr(payload.utm_campaign),
    utm_term:safeStr(payload.utm_term),
    utm_content:safeStr(payload.utm_content),
    // meta
    submitted_at:submittedAt,
    timestamp:submittedAt,
    submission_date:submittedAt,
    site_name:"Abhijeet Varghese",
    site_url:"https://abhijeetvarghese.com",
    admin_url:"https://abhijeetvarghese.com/admin/",
    owner_mobile:"+91 969 408 0706"
  };
  // Reply-To distinction required by spec
  base.reply_to = isOwner ? safeStr(payload.email) : "hi@abhijeetvarghese.com";
  base.to_email = isOwner ? "hi@abhijeetvarghese.com, abhijeetvarghese33@gmail.com, write4abhijeet@gmail.com" : safeStr(payload.email);
  base.owner_email="hi@abhijeetvarghese.com";
  base.owner_emails="hi@abhijeetvarghese.com, abhijeetvarghese33@gmail.com, write4abhijeet@gmail.com";
  return base;
};

// Bounded retry: up to 3 attempts per email, 1.2s gap. Each template independently tracked.
const SEND_ATTEMPTS=3;
const sendWithRetry=async(emailjs,template,params)=>{
  let lastError=null;
  for(let attempt=1;attempt<=SEND_ATTEMPTS;attempt++){
    try{
      const result=await emailjs.send(SERVICE_ID,template,params);
      if(result&&result.status===200)return true;
      lastError=new Error("EmailJS send failed ("+((result&&result.status)||"no status")+")");
    }catch(error){lastError=error;}
    if(attempt<SEND_ATTEMPTS)await sleep(EMAILJS_SEND_GAP_MS);
  }
  throw lastError||new Error("EmailJS send failed");
};

const buildOwnerParams=payload=>buildParams(payload,{isOwner:true});
const buildVisitorParams=payload=>buildParams(payload,{isOwner:false});

// Visitor-only — used when backend saved + owner delivered but visitor pending (and for primary).
const sendVisitorOnly=async payload=>{
  if(!safeStr((payload&&payload.email)||""))throw new Error("Visitor email is required for EmailJS");
  const emailjs=await loadSdk();
  try{return await sendWithRetry(emailjs,VISITOR_TEMPLATE_ID,buildVisitorParams(payload));}catch(error){return false;}
};
// Owner-only — used when backend saved but owner pending (and for primary).
const sendOwnerOnly=async payload=>{
  const emailjs=await loadSdk();
  try{return await sendWithRetry(emailjs,OWNER_TEMPLATE_ID,buildOwnerParams(payload));}catch(error){return false;}
};

const sendFallback=async payload=>{
  const emailjs=await loadSdk();
  const ownerParams=buildOwnerParams(payload);
  const visitorParams=buildVisitorParams(payload);
  if(!ownerParams.email)throw new Error("Visitor email is required for EmailJS fallback");
  let ownerOk=false;
  try{ownerOk=await sendWithRetry(emailjs,OWNER_TEMPLATE_ID,ownerParams);}catch{}
  if(!ownerOk)return{owner:false,visitor:false};
  await sleep(EMAILJS_SEND_GAP_MS);
  let visitorOk=false;
  try{visitorOk=await sendWithRetry(emailjs,VISITOR_TEMPLATE_ID,visitorParams);}catch{}
  return{owner:true,visitor:visitorOk};
};

// Primary helper for the new flow: persist then EmailJS owner->visitor. Exposed for React primary.
const sendBoth=async payload=>{
  let ownerOk=false;
  try{ownerOk=await sendOwnerOnly(payload);}catch{} 
  if(!ownerOk)return{ownerOk:false,visitorOk:false};
  await sleep(EMAILJS_SEND_GAP_MS);
  let visitorOk=false;
  try{visitorOk=await sendVisitorOnly(payload);}catch{}
  return{ownerOk:true,visitorOk:visitorOk};
};

const originalFetch=window.fetch.bind(window);
window.AVEmailJSFallback={sendVisitorOnly,sendOwnerOnly,sendBoth,loadSdk,buildParams};
window.fetch=async(input,init)=>{
  const url=typeof input==="string"?input:(input&&input.url)||"";
  if(!url||!url.endsWith(API_PATH)||String(init&&init.method||"GET").toUpperCase()!=="POST"){
    return originalFetch(input,init);
  }
  let payload={};
  try{payload=JSON.parse(String(init&&init.body||"{}"));}catch{}
  const controller=new AbortController();
  const opts=Object.assign({},init||{},{signal:controller.signal});
  const timer=setTimeout(()=>controller.abort(),BACKEND_TIMEOUT_MS);
  try{
    const response=await originalFetch(input,opts);
    clearTimeout(timer);
    if(response.ok)return response;
  }catch{}
  clearTimeout(timer);
  try{
    const result=await sendFallback(payload);
    if(result.owner&&result.visitor)return new Response(JSON.stringify({ok:true,fallback:"emailjs"}),{status:201,headers:{"Content-Type":"application/json"}});
    if(result.owner)return new Response(JSON.stringify({ok:true,fallback:"emailjs",degraded:"visitor"}),{status:201,headers:{"Content-Type":"application/json"}});
    return new Response(JSON.stringify({ok:false,fallback:"emailjs",error:"Fallback email delivery failed"}),{status:503,headers:{"Content-Type":"application/json"}});
  }catch(error){
    return new Response(JSON.stringify({ok:false,fallback:"emailjs",error:"Fallback email delivery failed"}),{status:503,headers:{"Content-Type":"application/json"}});
  }
};
})();
