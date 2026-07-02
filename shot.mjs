// Headless-Chrome screenshot via CDP (no deps; Node built-in WebSocket).
// Usage: node shot.mjs <url> <outfile.png> [waitMs]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [,, URL, OUT, WAIT='3500', SCROLL='0'] = process.argv;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9322 + Math.floor(Math.random()*400);

// Watchdog: never hang longer than WAIT + 20s
const WATCHDOG = setTimeout(() => { console.error('ERR watchdog-timeout'); try { chrome.kill('SIGKILL'); } catch {} process.exit(1); }, Number(WAIT) + 20000);

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--hide-scrollbars', '--disable-gpu', '--no-first-run',
  '--force-device-scale-factor=2',
  '--window-size=1440,900',
  '--user-data-dir=/tmp/cdp-shot-'+PORT,
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getWsUrl() {
  for (let i=0;i<40;i++){
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

let id = 0;
function cmd(ws, method, params={}, sessionId) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    const onMsg = (ev) => {
      const m = JSON.parse(typeof ev === 'string' ? ev : ev.data.toString());
      if (m.id === msgId) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

const KILL_OVERLAYS = `
(() => {
  // hide ALL fixed/sticky elements (cookie banners, announcement/country bars, nav)
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || s.position === 'sticky') {
      el.style.setProperty('display','none','important');
    }
    if (/cookie|consent|gdpr|onetrust|banner|overlay|modal|backdrop|region-pick|country/i.test(el.id+' '+el.className)) {
      el.style.setProperty('display','none','important');
    }
  }
})();
`;

(async () => {
  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((res,rej)=>{ ws.addEventListener('open',res); ws.addEventListener('error',rej); });
    const { targetId } = await cmd(ws, 'Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cmd(ws, 'Target.attachToTarget', { targetId, flatten: true });
    await cmd(ws, 'Page.enable', {}, sessionId);
    await cmd(ws, 'Runtime.enable', {}, sessionId);
    await cmd(ws, 'Emulation.setDeviceMetricsOverride', { width:1440, height:900, deviceScaleFactor:2, mobile:false }, sessionId);
    await cmd(ws, 'Page.navigate', { url: URL }, sessionId);
    await sleep(Number(WAIT));
    try { await cmd(ws, 'Runtime.evaluate', { expression: KILL_OVERLAYS }, sessionId); } catch {}
    if (Number(SCROLL) > 0) {
      await cmd(ws, 'Runtime.evaluate', { expression: `window.scrollTo(0,${Number(SCROLL)});` }, sessionId);
      await sleep(900);
    }
    await sleep(600);
    const { data } = await cmd(ws, 'Page.captureScreenshot', { format:'png', clip:{ x:0,y:0,width:1440,height:900,scale:1 } }, sessionId);
    writeFileSync(OUT, Buffer.from(data, 'base64'));
    console.log('OK '+OUT);
    ws.close();
  } catch (e) {
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(WATCHDOG);
    chrome.kill('SIGKILL');
    setTimeout(() => process.exit(process.exitCode || 0), 300);
  }
})();
