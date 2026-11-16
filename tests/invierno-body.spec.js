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

test('IV31-07 — new Invierno lessons are visible first and can launch immediately without old completions',async({page})=>{
 await ready(page);
 await page.evaluate(()=>{const season=document.querySelector('#uxUnit');season.value='2';season.dispatchEvent(new Event('change',{bubbles:true}));window.frankaNav15_2.go('path',{focus:false})});
 const buttons=page.locator('#s10Steps button.s10-step');
 await expect(buttons).toHaveCount(7);
 expect(await buttons.first().getAttribute('data-journey-stage-id')).toBe('school:s31-invierno-body-1');
 expect(await buttons.nth(1).getAttribute('data-journey-stage-id')).toBe('school:s31-invierno-body-2');
 expect(await buttons.nth(2).getAttribute('data-journey-stage-id')).toBe('school:s31-invierno-body-3');
 for(let i=0;i<3;i++)await expect(buttons.nth(i)).toBeEnabled();
 await expect(page.locator('#s10Steps')).toContainText('możesz rozpocząć od razu');
 await buttons.first().click();
 await expect(page.locator('#s10Lesson')).toBeVisible();
 await expect(page.locator('#s10LessonHeading')).toContainText('Części ciała');
 const state=await stored(page,pathKey);
 expect(Object.values(state?.['2']||{}).filter(x=>x.done)).toHaveLength(0);
});
test('IV31-08 — practicing body words cannot bypass historical Invierno journey gates',async({page})=>{
 await ready(page);
 const result=await page.evaluate(({pathKey})=>{
  const steps=window.frankaPath10.stages(2),firstNew=steps.find(x=>x.id==='school:s31-invierno-body-1');
  const completed={'2':{[firstNew.id]:{done:true,date:'2026-11-16'}}};
  window.frankaStore.setItem(pathKey,JSON.stringify(completed));
  const sel=document.querySelector('#uxUnit');sel.value='2';sel.dispatchEvent(new Event('change',{bubbles:true}));
  const old=[...document.querySelectorAll('#s10Steps button.s10-step')].filter(x=>!x.dataset.journeyStageId.startsWith('school:s31-invierno-body-'));
  return {old:old.map(x=>({id:x.dataset.journeyStageId,disabled:x.disabled})),newSteps:[...document.querySelectorAll('#s10Steps button.s10-step')].filter(x=>x.dataset.journeyStageId.startsWith('school:s31-invierno-body-')).map(x=>({id:x.dataset.journeyStageId,disabled:x.disabled}))};
 },{pathKey});
 expect(result.old[0].disabled).toBe(false);
 expect(result.old[1].disabled).toBe(true);
 expect(result.newSteps.every(x=>x.disabled===false)).toBe(true);
});
