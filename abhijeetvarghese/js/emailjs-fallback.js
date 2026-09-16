(()=>{"use strict";
// AV OS is primary; EmailJS is used only when the lead API fails or times out.
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

// Bounded retry: up to 3 attempts per email, EmailJS rate-limit gap before
// every retry. Each template's outcome is tracked independently so a failed
// visitor send never resends the owner email (and vice versa).
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

const buildParams=payload=>{
  const booking=fmtFallbackMessage(payload.message);
  return {
    name:String(payload.name||""),
    email:String(payload.email||""),
    company:String(payload.organization||"—"),
    phone:String(payload.full_phone_number||payload.phone_number||"—"),
    message:booking.formMessage||"—",
    booking_date:booking.booking_date,
    booking_time:booking.booking_time,
    owner_mobile:"+91 969 408 0706",
    site_name:"Abhijeet Varghese",
    site_url:"https://abhijeetvarghese.com",
    admin_url:"https://abhijeetvarghese.com/admin/"
  };
};

// Visitor-only confirmation for the rare case where AV OS saved the lead and
// delivered the owner notification but could not deliver the visitor email.
// Same bounded retry (3 attempts, 1.2s gap). Never touches the owner template.
const sendVisitorOnly=async payload=>{
  if(!String((payload&&payload.email)||""))throw new Error("Visitor email is required for EmailJS fallback");
  const emailjs=await loadSdk();
  try{return await sendWithRetry(emailjs,VISITOR_TEMPLATE_ID,buildParams(payload));}catch(error){return false;}
};

// Owner-only notification for the rare case where AV OS saved the lead and
// confirmed the visitor email but could not deliver the owner notification.
const sendOwnerOnly=async payload=>{
  const emailjs=await loadSdk();
  try{return await sendWithRetry(emailjs,OWNER_TEMPLATE_ID,buildParams(payload));}catch(error){return false;}
};

const sendFallback=async payload=>{
  const emailjs=await loadSdk();
  const params=buildParams(payload);
  if(!params.email)throw new Error("Visitor email is required for EmailJS fallback");
  // Owner first — it is the delivery that matters most. If the owner
  // notification cannot be delivered at all, report total fallback failure
  // (the visitor is shown the hi@ email address rather than a success state).
  let ownerOk=false;
  try{ownerOk=await sendWithRetry(emailjs,OWNER_TEMPLATE_ID,params);}catch{}
  if(!ownerOk)return{owner:false,visitor:false};
  await sleep(EMAILJS_SEND_GAP_MS);
  let visitorOk=false;
  try{visitorOk=await sendWithRetry(emailjs,VISITOR_TEMPLATE_ID,params);}catch{}
  return{owner:true,visitor:visitorOk};
};

const originalFetch=window.fetch.bind(window);
window.AVEmailJSFallback={sendVisitorOnly,sendOwnerOnly};
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
