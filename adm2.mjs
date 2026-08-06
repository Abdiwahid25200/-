import { writeFileSync } from "node:fs";
const list = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id=0; const waits=new Map();
ws.onmessage=(m)=>{const d=JSON.parse(m.data); if(waits.has(d.id)){waits.get(d.id)(d); waits.delete(d.id);}};
await new Promise(r=>ws.onopen=r);
const send=(m,p={})=>new Promise(res=>{const i=++id; waits.set(i,res); ws.send(JSON.stringify({id:i,method:m,params:p}));});
const ev=async e=>(await send("Runtime.evaluate",{expression:e,returnByValue:true})).result?.result?.value;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await send("Page.enable"); await send("Runtime.enable");
for (const [w,h,name] of [[1440,900,"adm-desktop"],[820,1180,"adm-ipad"],[390,844,"adm-phone"]]) {
  await send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:w<500});
  await send("Page.navigate",{url:"http://127.0.0.1:3013/admin"});
  await sleep(4000);
  console.log(name, await ev(`(()=>{const n=document.querySelector('.adm-nav'); const m=document.querySelector('main'); if(!n) return 'no nav (gate)'; const r=n.getBoundingClientRect(); const s=getComputedStyle(n); return JSON.stringify({navW:Math.round(r.width),navX:Math.round(r.x),dir:s.flexDirection,pos:s.position,mainW:Math.round(m.getBoundingClientRect().width),overflow:document.documentElement.scrollWidth>innerWidth})})()`));
  const r=await send("Page.captureScreenshot",{format:"png",clip:{x:0,y:0,width:w,height:Math.min(h,900),scale:1}});
  writeFileSync(name+".png", Buffer.from(r.result.data,"base64"));
}
ws.close();
