(()=>{"use strict";
// AV OS is primary; EmailJS is used only when the lead API fails or times out.
const SERVICE_ID="service_sa2s1c9";
const OWNER_TEMPLATE_ID="template_bf12i18";
const VISITOR_TEMPLATE_ID="template_n2ql8q9";
const PUBLIC_KEY="IdNuDWb_8YJTbre82";
const SDK_URL="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
const API_PATH="/api/public/lead";
const BACKEND_TIMEOUT_MS=8000;

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

const sendFallback=async payload=>{
  const emailjs=await loadSdk();
  const booking=fmtFallbackMessage(payload.message);
  const params={
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
  if(!params.email)throw new Error("Visitor email is required for EmailJS fallback");
  const ownerResult=await emailjs.send(SERVICE_ID,OWNER_TEMPLATE_ID,params);
  if(!ownerResult||ownerResult.status!==200)throw new Error("EmailJS owner notification failed");
  const visitorResult=await emailjs.send(SERVICE_ID,VISITOR_TEMPLATE_ID,params);
  if(!visitorResult||visitorResult.status!==200)throw new Error("EmailJS visitor confirmation failed");
  return true;
};

const originalFetch=window.fetch.bind(window);
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
    await sendFallback(payload);
    return new Response(JSON.stringify({ok:true,fallback:"emailjs"}),{status:201,headers:{"Content-Type":"application/json"}});
  }catch(error){
    return new Response(JSON.stringify({ok:false,fallback:"emailjs",error:"Fallback email delivery failed"}),{status:503,headers:{"Content-Type":"application/json"}});
  }
};
})();
