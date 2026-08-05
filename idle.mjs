const list = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id=0; const waits=new Map(); let reqs=[];
ws.onmessage=(m)=>{const d=JSON.parse(m.data);
 if(d.method==="Network.requestWillBeSent") reqs.push(d.params.request.url);
 if(waits.has(d.id)){waits.get(d.id)(d); waits.delete(d.id);}};
await new Promise(r=>ws.onopen=r);
const send=(m,p={})=>new Promise(res=>{const i=++id; waits.set(i,res); ws.send(JSON.stringify({id:i,method:m,params:p}));});
const ev=async e=>(await send("Runtime.evaluate",{expression:e,returnByValue:true})).result?.result?.value;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:2,mobile:true});
for (const u of ["/ar","/ar/pubg","/ar/help"]) {
  reqs=[];
  await send("Page.navigate",{url:"http://127.0.0.1:3012"+u});
  await sleep(5000);
  const fs = reqs.filter(r=>/firestore|googleapis/.test(r)).length;
  console.log(u, "· طلبات:", reqs.length, "· فايرستور:", fs, "· رسم:", await ev(`Math.round(performance.getEntriesByType('paint').find(p=>p.name==='first-contentful-paint')?.startTime||0)+'ms'`));
}
ws.close();
