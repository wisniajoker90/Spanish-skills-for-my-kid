const {test,expect}=require('@playwright/test');
const API='https://franka-family-sync.wisniajoker90.workers.dev',ID='00000000-0000-4000-8000-000000000037',P='hiszpanskiFrankaProgressV1';
const records={
 [P]:JSON.stringify({points:108,unit:1,index:0,quizTotal:11,quizCorrect:10,words:{hola:'learned'},mastery:{}}),
 hiszpanskiFrankaPath10V2:JSON.stringify({'1':{'finale-v1':{done:true,date:'2026-01-01'}}}),
 hiszpanskiFrankaLevel14V1:JSON.stringify({initialized:true,events:[],badges:{first:{date:'2026-01-01'},words:{date:'2026-01-01'},habit:{date:'2026-01-01'},cup:{date:'2026-01-01'}}})
};
async function seed(context,role='parent'){await context.addInitScript(({records,role})=>{if(localStorage.getItem('fixture-learning'))return;localStorage.setItem('fixture-learning','yes');localStorage.setItem('hf18:meta',JSON.stringify({schema:1,active:'source',profiles:[{id:'source',name:'Franek import TEST'}]}));for(const[k,v]of Object.entries(records))localStorage.setItem('hf18:p:source:'+k,v);localStorage.setItem('family-sync-production37',JSON.stringify({token:(role==='parent'?'a':'b').repeat(64),deviceId:role,profileId:'pilot',role,name:role,events:[],pending:[],revision:1}));},{records,role});}
async function fixture(context,model={profile:null,revision:1,writes:0,history:[]}){await context.route(API+'/**',async route=>{const req=route.request(),p=new URL(req.url()).pathname,m=req.method(),h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};if(m==='OPTIONS')return route.fulfill({status:204,headers:h});if(model.offline)return route.abort();let status=200,data={};if(model.holdProfile&&p==='/v1/profiles/'+ID&&m==='GET'){model.profileHeld=true;await model.holdProfile;}const role=req.headers().authorization==='Bearer '+'a'.repeat(64)?'parent':'learner';
 if(p==='/health')data={learningProfiles:!model.old,versionHistory:!model.old};
 else if(p==='/v1/me')data={device:{id:role,role,name:role}};
 else if(p==='/v1/profiles/pilot')data={revision:1,snapshot:{schema:1,data:{pilot:true,events:[]}}};
 else if(p==='/v1/profiles')data={profiles:[{id:'pilot'},...(model.profile?[{id:ID}]:[])]};
 else if(p==='/v1/learning'){if(role!=='parent')status=403;else{const b=req.postDataJSON();if(!model.profile){model.profile=b.snapshot;model.name=b.name;}data={profileId:ID,revision:model.revision};}}
 else if(p==='/v1/profiles/'+ID&&m==='GET'){model.learningGets=(model.learningGets||0)+1;if(model.revoked){return route.fulfill({status:401,headers:h,contentType:'application/json',body:JSON.stringify({error:'unauthorized'})});}if(!model.profile){status=404;data={error:'profile_not_found'}}else data={id:ID,name:model.name,revision:model.revision,snapshot:model.profile};}
 else if(p==='/v1/profiles/'+ID&&m==='PUT'){const b=req.postDataJSON();if(model.conflict){model.conflict=false;const x=JSON.parse(model.profile.data.records[P]);x.points++;model.profile.data.records[P]=JSON.stringify(x);model.revision++;}if(b.baseRevision!==model.revision){status=409;data={error:'revision_conflict'}}else{model.history.push(model.profile);model.profile=b.snapshot;model.revision++;model.writes++;data={revision:model.revision};if(model.lost){model.lost=false;return route.abort()}}}
 else if(p==='/v1/profiles/'+ID+'/history')data={versions:model.history.map((_,i)=>({revision:i+1,saved_at:1}))};
 else{status=404;data={error:'not_found'}}await route.fulfill({status,headers:h,contentType:'application/json',body:JSON.stringify(data)});});return model;}
async function open(page){await page.goto('/');await page.locator('#fs37Launch').click();await page.locator('#fs37LearningConfirm').check();}
async function publish(page){await Promise.all([page.waitForEvent('load'),page.locator('#fs37LearningPublish').click()]);await expect.poll(()=>page.evaluate(()=>!!JSON.parse(localStorage.getItem('hf37prod:learning:source')||'null')?.lastSync)).toBe(true);}
async function reopen(page){await page.locator('#fs37Launch').click();await page.locator('#fs37LearningConfirm').check();}
async function addPoint(page){await page.evaluate(()=>{const k='hiszpanskiFrankaProgressV1',p=JSON.parse(frankaStore.getItem(k));p.points++;frankaStore.setItem(k,JSON.stringify(p));});}
test('baseline is explicit; publishing enables auto without changing awards',async({page,context})=>{
 await seed(context);const m=await fixture(context);await page.goto('/');
 expect(m.profile).toBe(null);await page.locator('#fs37Launch').click();
 await expect(page.locator('#fs37Add')).toHaveCount(0);await expect(page.locator('#fs37LearningAuto')).toBeHidden();
 await page.locator('#fs37LearningPublish').click();expect(m.profile).toBe(null);
 await page.locator('#fs37LearningConfirm').check();await publish(page);
 expect(JSON.parse(m.profile.data.records[P]).points).toBe(108);
 expect(await page.evaluate(()=>localStorage.getItem('hf37prod:auto:source'))).toBe('1');
 await expect(page.locator('#fs37AutoStatus')).toContainText('Zapis na serwerze potwierdzony o',{timeout:20000});
 await page.locator('#fs37Launch').click();await expect(page.locator('#fs37LearningPublish')).toBeHidden();
 await expect(page.locator('#fs37LearningAuto')).toBeChecked();
 expect(await page.evaluate(()=>JSON.parse(frankaStore.getItem('hiszpanskiFrankaLevel14V1')).badges.cup)).toBeTruthy();
});
test('download enables auto and retains pre-existing local profile',async({page,context})=>{
 await seed(context,'learner');const m=await fixture(context,{profile:{schema:1,data:{kind:'learning-v1',records,applied:[]}},revision:2,writes:0,history:[],name:'Franek'});
 await open(page);await expect(page.locator('#fs37LearningPublish')).toBeHidden();
 await Promise.all([page.waitForEvent('load'),page.locator('#fs37LearningDownload').click()]);
 const state=await page.evaluate(()=>({id:hfProfiles19.getMeta().active,n:hfProfiles19.getMeta().profiles.length,auto:localStorage.getItem('hf37prod:auto:'+hfProfiles19.getMeta().active),old:JSON.parse(localStorage.getItem('hf18:p:source:hiszpanskiFrankaProgressV1')).points}));
 expect(state.id).toMatch(/^sync-/);expect(state.n).toBe(2);expect(state.auto).toBe('1');expect(state.old).toBe(108);
 await page.locator('#fs37Launch').click();await expect(page.locator('#fs37LearningHistory')).toBeHidden();
});
test('QR pairing fetches real profile automatically even while panel action is busy',async({page,context})=>{
 await seed(context,'learner');await context.addInitScript(()=>{if(!localStorage.getItem('fixture-unlinked')){localStorage.removeItem('family-sync-production37');localStorage.setItem('fixture-unlinked','1')}});
 await fixture(context,{profile:{schema:1,data:{kind:'learning-v1',records,applied:[]}},revision:1,writes:0,history:[],name:'Franek'});
 await context.route(API+'/health*',r=>r.fulfill({json:{retrySafePairing:true,learningProfiles:true,versionHistory:true}}));
 await context.route(API+'/v1/join',r=>{const b=r.request().postDataJSON();return r.fulfill({json:{deviceId:b.deviceId,token:b.token}})});
 await page.goto('/#family-join='+'a'.repeat(32));await page.locator('#fs37Name').fill('iPhone');
 await Promise.all([page.waitForEvent('load'),page.locator('#fs37JoinButton').click()]);
 expect(await page.evaluate(()=>hfProfiles19.getMeta().active)).toMatch(/^sync-/);
 expect(await page.evaluate(()=>JSON.parse(frankaStore.getItem('hiszpanskiFrankaProgressV1')).points)).toBe(108);
 expect(await page.evaluate(()=>localStorage.getItem('hf37prod:auto:'+hfProfiles19.getMeta().active))).toBe('1');
});
test('candidate ignores saved TEST credentials and never auto-publishes a local profile',async({page,context})=>{
 await seed(context);await context.addInitScript(()=>{const x=localStorage.getItem('family-sync-production37');localStorage.setItem('family-sync-pilot37',x);localStorage.removeItem('family-sync-production37');});
 const requests=[];page.on('request',r=>{if(r.url().includes('workers.dev'))requests.push(r.url())});
 await page.goto('/');await page.locator('#fs37Launch').click();await expect(page.locator('#fs37Unlinked')).toBeVisible();await expect(page.locator('#fs37Linked')).toBeHidden();
 expect(requests).toEqual([]);expect(await page.evaluate(()=>JSON.parse(frankaStore.getItem('hiszpanskiFrankaProgressV1')).points)).toBe(108);
});
test('production QR stays on production app and contains only one-time code',async({page,context})=>{
 await seed(context);await fixture(context);
 await context.route(API+'/v1/pairing',r=>r.fulfill({json:{code:'c'.repeat(32),expiresAt:Date.now()+600000}}));
 await page.goto('/');await page.locator('#fs37Launch').click();await page.locator('#fs37Pair').click();
 await expect(page.locator('#fs37Qr')).toHaveAttribute('src',/^data:image/);
 // Independently decode the QR image rendered in the browser.
 await expect.poll(()=>page.locator('#fs37Qr').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
 const pixels=await page.locator('#fs37Qr').evaluate(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return {data:Array.from(x.getImageData(0,0,c.width,c.height).data),width:c.width,height:c.height}});
 const qr=require('jsqr')(new Uint8ClampedArray(pixels.data),pixels.width,pixels.height);
 expect(qr.data).toBe('https://wisniajoker90.github.io/Spanish-skills-for-my-kid/#family-join='+'c'.repeat(32));
});
