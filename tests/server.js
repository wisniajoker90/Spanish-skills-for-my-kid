'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mimes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  // Serve only resources that belong to the PWA. Never expose test scripts or secrets.
  const allowed=pathname==='/'||pathname==='/index.html'||pathname==='/sw.js'||pathname==='/manifest.webmanifest'||/^\/icons\/[a-zA-Z0-9_.\/-]+$/.test(pathname);
  if(!allowed){res.writeHead(404);return res.end('Not found')}
  const name=pathname==='/'?'index.html':pathname.slice(1);
  const filename=path.resolve(root,name);
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
    res.writeHead(404);return res.end('Not found')
  }
  const mime=mimes[path.extname(filename)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache',...(pathname==='/sw.js'?{'Service-Worker-Allowed':'/'}:{})});
  fs.createReadStream(filename).pipe(res);
}).listen(Number(process.env.PORT||4173),'127.0.0.1');
