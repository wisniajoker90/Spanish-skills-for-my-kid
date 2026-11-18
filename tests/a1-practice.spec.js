'use strict';
const {test,expect}=require('@playwright/test');
const {ready,installTTS,stored,pathKey,progressKey}=require('./helpers');
const KEY='hiszpanskiFrankaA1Practice39V1';
async function open(page,id,preview=true){await page.evaluate(({id,preview})=>frankaS39.open(id,preview),{id,preview});await expect(page.locator('#s39Shade')).toBeVisible();}
async function start(page){await page.getByRole('button',{name:'Spróbuję sam →',exact:true}).click();}
async function task(page){return page.evaluate(()=>{const d=JSON.parse(frankaStore.getItem('hiszpanskiFrankaA1Practice39V1'));const p=d?.pending;return p&&frankaS39.catalog.find(t=>t.id===p.taskId).variants[p.variant][p.step]});}
async function solve(page,a,wrong=false){const box=page.locator('#s39Body');if(a.audio)await box.getByRole('button',{name:'🔊 Posłuchaj',exact:true}).click();
 if(a.kind==='listen'){await box.locator('.s39-choices button').nth(wrong?(a.answer+1)%a.options.length:a.answer).click();}
 if(a.kind==='oral'){await box.getByRole('button',{name:'Powiedziałem — porównaj',exact:true}).click();await box.getByRole('button',{name:'Powiedziałem bez wzoru',exact:true}).click();}
 if(a.kind==='order'){for(let i=0;i<a.tokens.length;i++)await box.locator('[data-token-index="'+i+'"]').click();await box.getByRole('button',{name:'Sprawdź kolejność',exact:true}).click();}
 await box.locator('.s39-primary').last().click();
}
test('A139-01 — all twelve oral scenarios have two complete variants and no writing tasks',async({page})=>{
 await ready(page);const catalog=await page.evaluate(()=>frankaS39.catalog);expect(catalog).toHaveLength(12);expect(new Set(catalog.map(t=>t.id)).size).toBe(12);
 for(const u of [1,2,3,4])expect(catalog.filter(t=>t.season===u)).toHaveLength(3);
 for(const t of catalog){expect(t.prepare.length).toBeGreaterThan(1);expect(t.variants).toHaveLength(2);for(const v of t.variants){expect(v.length).toBeGreaterThanOrEqual(3);expect(v.some(a=>a.kind==='oral')).toBe(true);for(const a of v){expect(['oral','listen','order']).toContain(a.kind);expect(a.goals).not.toEqual(expect.arrayContaining(['G13']));expect(a.goals).not.toContain('G14');if(a.kind==='listen')expect(a.options[a.answer]).toBeTruthy();}}}
 await open(page,'O1');expect(await page.locator('#s39Panel input,#s39Panel textarea,[contenteditable="true"]').count()).toBe(0);
});
test('A139-02 — every variant can finish in TEST preview without writing any learning records',async({page})=>{
 test.setTimeout(180000);await installTTS(page,{autoEnd:true});await ready(page);const catalog=await page.evaluate(()=>frankaS39.catalog);const before=await page.evaluate(()=>frankaStore.dump());
 for(const t of catalog)for(let variant=0;variant<2;variant++){await open(page,t.id);if(variant)await page.getByRole('button',{name:'Zmień wariant',exact:true}).click();await start(page);for(const a of t.variants[variant])await solve(page,a);await expect(page.locator('#s39Body')).toContainText('To podgląd');await page.locator('#s39Body').getByRole('button',{name:'Wróć do ścieżki',exact:true}).click();}
 expect(await stored(page,KEY)).toBeNull();const after=await page.evaluate(()=>frankaStore.dump());expect(after).toEqual(before);
});
test('A139-03 — supplemental cards are interleaved and cannot change legacy completion or unlocks',async({page})=>{
 await ready(page);for(const u of [1,2,3,4]){const data=await page.evaluate(u=>{const stages=frankaPath10.stages(u);const slots=frankaS39.slots(u,stages);return {len:stages.length,slots:slots.map(s=>s.before),ids:stages.map(s=>s.id)}},u);expect(data.slots).toHaveLength(3);expect(new Set(data.slots).size).toBe(3);expect(data.slots.every(n=>n>0&&n<data.len-3)).toBe(true);expect(data.ids.some(s=>s.startsWith('a1-s39'))).toBe(false);}
 await page.evaluate(key=>{const d={};for(const u of [1,2,3,4])d[u]=Object.fromEntries(frankaPath10.stages(u).map(s=>[s.id,{done:true,date:'2026-11-18'}]));frankaStore.setItem(key,JSON.stringify(d))},pathKey);await page.reload();const before=await stored(page,pathKey);
 await page.evaluate(()=>{frankaNav15_2.go('path');});await page.getByRole('button',{name:/Pokaż wszystkie etapy/}).click();await expect(page.locator('[data-a1-practice]')).toHaveCount(3);for(const b of await page.locator('[data-a1-practice]').all())await expect(b).toBeEnabled();await expect(page.locator('[data-journey-stage-id="finale-v1"]')).toContainText('Gotowe');expect(await stored(page,pathKey)).toEqual(before);
});
test('A139-04 — real completion records kinds and next attempt rotates variant, without mastery credit',async({page})=>{
 await installTTS(page,{autoEnd:true});await ready(page);const before=await stored(page,progressKey);await open(page,'O1',false);await start(page);let a;while(a=await task(page)){await solve(page,a);if(await page.locator('#s39Body').getByRole('button',{name:'Zapisz i wróć do ścieżki'}).count())break;}
 await page.getByRole('button',{name:'Zapisz i wróć do ścieżki',exact:true}).click();const d=await stored(page,KEY);expect(d.tasks.O1.count).toBe(1);expect(d.tasks.O1.history[0].results.map(r=>r.kind)).toEqual(['oral','oral','sentence-order']);expect(d.tasks.O1.history[0].results[0]).toMatchObject({correct:null,source:'self',quality:'independent'});expect(d.pending).toBeNull();expect(await stored(page,progressKey)).toEqual(before);expect(await stored(page,pathKey)).toBeNull();await open(page,'O1',false);await expect(page.locator('#s39Context')).toContainText('wariant 2');
});
test('A139-05 — model before oral response forbids independent score and preserves parent source',async({page})=>{
 await ready(page);await open(page,'O1',false);await start(page);await page.getByRole('button',{name:'Potrzebuję wzoru',exact:true}).click();await expect(page.getByRole('button',{name:'Powiedziałem bez wzoru',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Ocenia rodzic',exact:true}).click();await page.getByRole('button',{name:'Ćwiczyłem z pomocą',exact:true}).click();await page.getByRole('button',{name:'Następne zadanie →',exact:true}).click();expect((await stored(page,KEY)).pending.results[0]).toMatchObject({source:'parent',correct:null,help:true,modelBeforeAttempt:true,quality:'help'});
});
test('A139-06 — listening hides transcription until answer, plays uncancelled ES and keeps first error',async({page})=>{
 await installTTS(page);await ready(page);await open(page,'O2',false);await start(page);await expect(page.locator('#s39Body')).not.toContainText('Tengo una manzana roja.');await expect(page.locator('.s39-choices button').first()).toBeDisabled();await page.getByRole('button',{name:'🔊 Posłuchaj',exact:true}).click();expect(await page.evaluate(()=>__ttsTest.pendingCount())).toBe(1);expect(await page.evaluate(()=>__ttsTest.calls.at(-1).lang)).toBe('es-ES');await page.locator('.s39-choices button').nth(1).click();await expect(page.locator('.s39-choices button').first()).toBeDisabled();await page.getByRole('button',{name:'Następne zadanie →'}).click();expect((await stored(page,KEY)).pending.results[0]).toMatchObject({kind:'listen',source:'quiz',correct:false});
});
test('A139-07 — ordering supports undo, retries and a distinct sentence-order result',async({page})=>{
 await installTTS(page,{autoEnd:true});await ready(page);await open(page,'I3',false);await start(page);await solve(page,await task(page));const a=await task(page);for(let n=a.tokens.length-1;n>=0;n--)await page.locator('[data-token-index="'+n+'"]').click();await page.getByRole('button',{name:'Sprawdź kolejność',exact:true}).click();await expect(page.locator('#s39Status')).toContainText('Jeszcze nie');for(let n=0;n<a.tokens.length;n++)await page.locator('.s39-assembled button').first().click();for(let n=0;n<a.tokens.length;n++)await page.locator('[data-token-index="'+n+'"]').click();await page.getByRole('button',{name:'Sprawdź kolejność',exact:true}).click();await page.getByRole('button',{name:'Następne zadanie →'}).click();expect((await stored(page,KEY)).pending.results[1]).toMatchObject({kind:'sentence-order',source:'quiz',correct:false});
});
test('A139-08 — refresh resumes current task with hint and selected tokens retained',async({page})=>{
 await installTTS(page,{autoEnd:true});await ready(page);await open(page,'I3',false);await start(page);await solve(page,await task(page));await page.locator('[data-token-index="0"]').click();await page.getByRole('button',{name:'🔊 Posłuchaj podpowiedzi'}).click();await page.reload();await open(page,'I3',false);await expect(page.locator('.s39-assembled')).toContainText('Tengo');expect((await stored(page,KEY)).pending.item).toMatchObject({chosen:[0],help:true,model:true});await expect(page.locator('#s39Body')).toContainText('Zadanie 2');
});
test('A139-09 — practice is isolated per profile and included in existing backup',async({page})=>{
 await ready(page);await open(page,'O1',false);await start(page);const prior=await stored(page,KEY);const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>document.getElementById('hf18export').click());const download=await downloadPromise;const exportData=JSON.parse(require('fs').readFileSync(await download.path(),'utf8'));expect(JSON.parse(exportData.data[exportData.active][KEY])).toMatchObject({pending:{taskId:'O1'}});
 await page.evaluate(()=>hfProfiles19.createProfile('Drugi','🦊'));await page.waitForLoadState('load');await expect.poll(()=>page.evaluate(()=>hfProfiles19.getMeta().profiles.find(p=>p.id===hfProfiles19.getMeta().active)?.name)).toBe('Drugi');expect(await stored(page,KEY)).toBeNull();await page.evaluate(()=>hfProfiles19.switchTo('franek'));await page.waitForLoadState('load');await expect.poll(()=>page.evaluate(()=>hfProfiles19.getMeta().active)).toBe('franek');expect(await stored(page,KEY)).toEqual(prior);
});
test('A139-10 — production host has no TEST controls and ignores preview bypass',async({page})=>{
 const fs=require('fs'),path=require('path');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');await page.route('https://wisniajoker90.github.io/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://wisniajoker90.github.io/Spanish-skills-for-my-kid/');await expect.poll(()=>page.evaluate(()=>!!window.frankaS39)).toBe(true);await expect(page.locator('.s39-test')).toHaveCount(0);await open(page,'O1',true);expect((await stored(page,KEY)).pending.taskId).toBe('O1');await expect(page.locator('#s39Context')).not.toContainText('Podgląd');
});
test('A139-11 — phone layout has no horizontal overflow, closable focus and audio stops on hide',async({page})=>{
 await page.setViewportSize({width:390,height:740});await installTTS(page);await ready(page);await open(page,'P3');await start(page);await page.getByRole('button',{name:'🔊 Posłuchaj',exact:true}).click();expect(await page.evaluate(()=>__ttsTest.pendingCount())).toBe(1);expect(await page.locator('#s39Panel').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);await page.locator('#s39Close').click();expect(await page.evaluate(()=>__ttsTest.pendingCount())).toBe(0);await expect(page.locator('#s39Shade')).toBeHidden();
});
test('A139-12 — duplicate next/save cannot double count a completed attempt',async({page})=>{
 await installTTS(page,{autoEnd:true});await ready(page);await open(page,'O1',false);await start(page);for(let i=0;i<3;i++)await solve(page,await task(page));await page.evaluate(()=>{const b=document.querySelector('#s39Body .s39-primary');b.click();b.click()});expect((await stored(page,KEY)).tasks.O1.count).toBe(1);await page.reload();expect((await stored(page,KEY)).tasks.O1.history).toHaveLength(1);
});
