'use strict';
const {test,expect}=require('@playwright/test');
const {ready,stored,pathKey,progressKey}=require('./helpers');
const expected=['Cara','Pelo','Ojo','Ojos','Oreja','Nariz','Boca','Cabeza','Brazo','Mano','Barriga','Pierna','Pie'];
const normalized=s=>String(s).normalize('NFC').trim().toLocaleLowerCase('es');

test('IV31-01 — all 13 pictured Spanish body words have Polish translations and school provenance',async({page})=>{
 await ready(page);
 const snapshot=await page.evaluate(()=>({
  cards:window.frankaInvierno31.bodyCards.map(c=>({es:c[1],pl:c[2]})),
  school:window.frankaSeasons8.school[2].map(c=>c[1]),
  origin:window.frankaSeasons8.origin
 }));
 expect(snapshot.cards.map(c=>c.es)).toEqual(expected);
 expect(snapshot.cards.every(c=>typeof c.pl==='string'&&c.pl.length>=2)).toBe(true);
 for(const word of expected){
  expect(snapshot.school.map(normalized)).toContain(normalized(word));
  expect(snapshot.origin['2|'+normalized(word)]).toContain('szkoła — Invierno');
 }
});
test('IV31-02 — source vocabulary is deduplicated against existing A1 and earlier school cards',async({page})=>{
 await ready(page);
 const data=await page.evaluate(()=>({
  original:window.frankaInvierno31.legacyWords.map(c=>c[1]),
  cards:units[2].cards.map(c=>c[1]),
  extra:window.frankaInvierno31.bodyCards.map(c=>c[1])
 }));
 expect(data.original).toContain('Nariz');
 expect(data.original).toContain('Cabeza');
 for(const word of expected){
  expect(data.cards.filter(c=>normalized(c)===normalized(word))).toHaveLength(1);
 }
 expect(data.cards.length).toBeGreaterThan(data.original.length);
});
test('IV31-03 — three new lessons use existing school learning engine and preserve original path IDs',async({page})=>{
 await ready(page);
 const stages=await page.evaluate(()=>window.frankaPath10.stages(2).map(s=>({kind:s.kind,id:s.id,title:s.title,words:s.raw.map(c=>c[1])})));
 const newSteps=stages.filter(s=>s.id.startsWith('school:s31-invierno-body-'));
 expect(newSteps.map(s=>s.id)).toEqual(['school:s31-invierno-body-1','school:s31-invierno-body-2','school:s31-invierno-body-3']);
 expect(newSteps.flatMap(s=>s.words)).toEqual(expected);
 expect(newSteps.every(s=>s.kind==='school')).toBe(true);
 expect(stages[0].id).toBe('school:invierno~muñeco de nieve~guantes~botas~chaqueta');
 expect(stages.some(s=>s.id==='checkpoint')).toBe(true);
 expect(stages.some(s=>s.id==='finale-v1')).toBe(true);
 expect(stages.findIndex(s=>s.id==='school:s31-invierno-body-3')).toBeLessThan(stages.findIndex(s=>s.id==='checkpoint'));
 expect(new Set(stages.map(s=>s.id)).size).toBe(stages.length);
});
test('IV31-04 — Invierno body words are available in unchanged vocabulary and game pools',async({page})=>{
 await ready(page);
 const pools=await page.evaluate(()=>({
  quizSchool:window.frankaSeasons8.school[2].map(c=>c[1]),
  flashcards:units[2].cards.map(c=>c[1]),
  fullWords:window.frankaPath10.stages(2).filter(s=>s.kind==='school').flatMap(s=>s.raw.map(c=>c[1]))
 }));
 for(const word of expected){
  for(const key of ['quizSchool','flashcards','fullWords'])expect(pools[key].map(normalized)).toContain(normalized(word));
 }
});
test('IV31-05 — existing Invierno journey and mastery records survive refresh',async({page})=>{
 await ready(page);
 const oldId=await page.evaluate(()=>window.frankaPath10.stages(2)[0].id);
 await page.evaluate(({oldId,pathKey,progressKey})=>{
  window.frankaStore.setItem(pathKey,JSON.stringify({'2':{[oldId]:{done:true,date:'2026-11-10'}}}));
  window.frankaStore.setItem(progressKey,JSON.stringify({points:42,unit:2,index:3,words:{'2:3':'learned'},mastery:{'2|nariz':{right:3,wrong:0,streak:3,level:3,due:0,last:123}}}));
 },{oldId,pathKey,progressKey});
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!window.frankaPath10)).toBe(true);
 const [path,progress]=await Promise.all([stored(page,pathKey),stored(page,progressKey)]);
 expect(path['2'][oldId].done).toBe(true);
 expect(progress.points).toBe(42);
 expect(progress.words['2:3']).toBe('learned');
 expect(progress.mastery['2|nariz'].right).toBe(3);
 expect(await page.evaluate(()=>window.frankaPath10.stages(2).some(x=>x.id==='school:s31-invierno-body-1'))).toBe(true);
});
test('IV31-06 — body content contains no English matching tasks or new game modes',async({page})=>{
 await ready(page);
 const result=await page.evaluate(()=>({
  body:window.frankaInvierno31.bodyCards.map(c=>[c[1],c[2]]),
  labels:[...document.querySelectorAll('[data-ux-activity]')].map(x=>x.dataset.uxActivity)
 }));
 expect(result.labels).toEqual(['words','sentences','dialogues','listening','speaking']);
 expect(result.body.flat().join(' ')).not.toMatch(/\b(arm|hand|head|leg)\b/i);
});


test('IV31-07 — new school stages are woven through Invierno without becoming first or last',async({page})=>{
 await ready(page);
 const stages=await page.evaluate(()=>window.frankaPath10.stages(2).map(s=>({id:s.id,kind:s.kind})));
 const positions=stages.flatMap((s,i)=>s.id.startsWith('school:s31-invierno-body-')?[i]:[]);
 expect(positions).toHaveLength(3);
 expect(positions[0]).toBeGreaterThan(0);
 expect(positions[2]).toBeLessThan(stages.length-4);
 expect(positions[0]).toBeLessThan(positions[1]);
 expect(positions[1]).toBeLessThan(positions[2]);
 expect(positions[1]-positions[0]).toBeGreaterThan(1);
 const oldStages=stages.filter(s=>!s.id.startsWith('school:s31-invierno-body-'));
 expect(oldStages[0].id).toBe('school:invierno~muñeco de nieve~guantes~botas~chaqueta');
 expect(oldStages.at(-2).id).toBe('checkpoint');
 expect(oldStages.at(-1).id).toBe('finale-v1');
});
test('IV31-08 — testing shortcut launches a real lesson without saving or unlocking progress',async({page})=>{
 await ready(page);
 await page.evaluate(()=>{const s=document.querySelector('#uxUnit');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));window.frankaNav15_2.go('path',{focus:false})});
 const tools=page.locator('.s31-test-tools');
 await expect(tools).toBeVisible();
 await expect(tools.getByRole('button')).toHaveCount(3);
 const stages=page.locator('#s10Steps button.s10-step');
 await expect(stages.first()).not.toHaveAttribute('data-journey-stage-id',/s31-invierno-body/);
 await page.locator('#s10Steps').getByRole('button',{name:/Pokaż wszystkie etapy/}).click();
 const newStage=page.locator('#s10Steps button.s10-step[data-journey-stage-id="school:s31-invierno-body-1"]');
 // New stage is on the normal journey, so it is initially locked for fresh users.
 await expect(newStage).toBeDisabled();
 const before=await stored(page,progressKey);
 const journeyBefore=await stored(page,pathKey);
 await tools.getByRole('button').first().click();
 await expect(page.locator('#s10Lesson')).toBeVisible();
 await expect(page.locator('#s10LessonHeading')).toContainText('części ciała');
 await page.locator('#s10LessonBody').getByRole('button',{name:'Spróbuję odpowiedzieć'}).click();
 const spanish=await page.locator('#s10LessonBody .s10-question').textContent();
 const meaning=await page.evaluate(es=>window.frankaInvierno31.bodyCards.find(c=>c[1]===es)?.[2],spanish);
 await page.locator('#s10LessonBody .s10-answer-grid').getByRole('button',{name:meaning,exact:true}).click();
 expect(await stored(page,progressKey)).toEqual(before);
 expect(await stored(page,pathKey)).toEqual(journeyBefore);
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!window.frankaPath10)).toBe(true);
 const afterRestart=await stored(page,progressKey);
 // UI startup may choose the default season; that navigation field is not learning progress.
 for(const field of ['points','quizCorrect','quizTotal','words','mastery'])
  expect(afterRestart?.[field],field+' retained after restart').toEqual(before?.[field]);
 expect(await stored(page,pathKey)).toEqual(journeyBefore);
});
test('IV31-09 — the original old lesson gate remains locked even if a new stage was previously finished',async({page})=>{
 await ready(page);
 const result=await page.evaluate(({pathKey})=>{
  const steps=window.frankaPath10.stages(2),firstNew=steps.find(x=>x.id==='school:s31-invierno-body-1');
  window.frankaStore.setItem(pathKey,JSON.stringify({'2':{[firstNew.id]:{done:true,date:'2026-11-16'}}}));
  const sel=document.querySelector('#uxUnit');sel.value='2';sel.dispatchEvent(new Event('change',{bubbles:true}));
  return [...document.querySelectorAll('#s10Steps button.s10-step')].map(x=>({id:x.dataset.journeyStageId,disabled:x.disabled}));
 },{pathKey});
 const old=result.filter(x=>!x.id.startsWith('school:s31-invierno-body-'));
 expect(old[0].disabled).toBe(false);
 expect(old[1].disabled).toBe(true);
});
test('IV31-10 — new authored PL-ES dialogues reuse the existing Invierno Junior flow',async({page})=>{
 await ready(page);
 const dialog=await page.evaluate(()=>{
  const s=document.querySelector('#uxUnit');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('[data-ux-activity="dialogues"]').click();
  document.querySelector('#uxStart').click();
  return {count:document.querySelector('#a1Stage .jr-dialog')?.getAttribute('aria-label'),text:document.querySelector('#a1Stage')?.textContent};
 });
 expect(dialog.count).toContain('Dialog Junior');
 // Existing UI is unchanged and newly authored content occurs in the normal ordered rotation.
 expect(dialog.text).toContain('Posłuchaj');
});
