import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const files = process.argv.slice(2).filter(existsSync);
for (const f of files) {
  const tmp = '/tmp/bc_' + f.replace(/[^a-z0-9]/gi,'_') + '.bmp';
  try {
    execFileSync('sips', ['-s','format','bmp','-z','40','64', f, '--out', tmp], {stdio:'ignore'});
    const b = readFileSync(tmp);
    const off = b.readUInt32LE(10);       // pixel data offset
    const w = b.readInt32LE(18), h = Math.abs(b.readInt32LE(22));
    const bpp = b.readUInt16LE(28);
    const rowSize = Math.floor((bpp*w + 31)/32)*4;
    let n=0,s1=0,s2=0;
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const p = off + y*rowSize + x*(bpp/8);
      const B=b[p],G=b[p+1],R=b[p+2];
      const L=0.299*R+0.587*G+0.114*B;
      s1+=L; s2+=L*L; n++;
    }
    const m=s1/n, sd=Math.sqrt(s2/n-m*m);
    const verdict = sd<8 ? 'BLANK/FLAT' : sd<18 ? 'low-detail' : 'OK';
    console.log(`${f.split('/').pop().padEnd(28)} mean=${m.toFixed(0).padStart(3)} std=${sd.toFixed(1).padStart(5)}  ${verdict}`);
  } catch(e){ console.log(`${f}  ERR ${e.message}`); }
}
