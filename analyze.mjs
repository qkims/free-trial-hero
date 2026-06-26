import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT=9800+Math.floor(Math.random()*150);
const files=process.argv.slice(2).filter(existsSync);
const chrome=spawn(CHROME,['--headless=new',`--remote-debugging-port=${PORT}`,'--disable-gpu','--no-first-run','--user-data-dir=/tmp/an-'+PORT],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ws(){for(let i=0;i<40;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}/json/version`);return (await r.json()).webSocketDebuggerUrl;}catch{}await sleep(250);}throw 0;}
let id=0;function cmd(s,m,p={},sid){return new Promise((res,rej)=>{const i=++id;const h=e=>{const o=JSON.parse(e.data);if(o.id===i){s.removeEventListener('message',h);o.error?rej(new Error(o.error.message)):res(o.result);}};s.addEventListener('message',h);s.send(JSON.stringify({id:i,method:m,params:p,sessionId:sid}));});}
const wsUrl=await ws();const s=new WebSocket(wsUrl);await new Promise(r=>s.addEventListener('open',r));
const {targetId}=await cmd(s,'Target.createTarget',{url:'about:blank'});
const {sessionId}=await cmd(s,'Target.attachToTarget',{targetId,flatten:true});
await cmd(s,'Runtime.enable',{},sessionId);
for(const f of files){
  const expr=`(async()=>{const im=new Image();im.src='file://${process.cwd()}/'+${JSON.stringify(f)};await im.decode();const c=document.createElement('canvas');c.width=48;c.height=30;const x=c.getContext('2d');x.drawImage(im,0,0,48,30);const d=x.getImageData(0,0,48,30).data;let n=d.length/4,s1=0,s2=0;const lum=[];for(let i=0;i<d.length;i+=4){const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];lum.push(L);s1+=L;s2+=L*L;}const m=s1/n;const sd=Math.sqrt(s2/n-m*m);return JSON.stringify({mean:+m.toFixed(1),std:+sd.toFixed(1)});})()`;
  try{const r=await cmd(s,'Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sessionId);console.log(f, r.result.value);}catch(e){console.log(f,'ERR',e.message);}
}
s.close();chrome.kill('SIGKILL');setTimeout(()=>process.exit(0),200);
