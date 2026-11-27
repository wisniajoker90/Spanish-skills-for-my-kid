'use strict';
const {test,expect}=require('@playwright/test');
const {ready,installTTS,stored,seedCarSession}=require('./helpers');
const A1='hiszpanskiFrankaA1ProgressV1';
async function openJunior(page,{tts=true}={}){
 if(tts)await installTTS(page);
 await ready(page);
 await page.evaluate(()=>{
  document.querySelector('#uxUnit').value='1';
  document.querySelector('[data-ux-activity="dialogues"]').click();
  document.getElementById('uxStart').click();
 });
 await expect(page.locator('#a1Stage .jr-dialog')).toBeVisible();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','0');
}
async function feedback(page,quality){
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','1');
 await page.locator('#a1Stage .jr-main').filter({hasText:'Dalej'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','2');
 await page.locator('#a1Stage .jr-options button').filter({hasText:quality}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','3');
}
test('DJ01 — opening a Junior dialogue automatically speaks its Spanish question once',async({page})=>{
 await openJunior(page);
 const question=(await page.locator('#a1Stage .jr-question').textContent()).trim();
 await expect.poll(()=>page.evaluate(()=>__ttsTest.calls.length)).toBe(1);
 const result=await page.evaluate(()=>({calls:__ttsTest.calls,pending:__ttsTest.pendingCount()}));
 expect(result.calls[0].text).toBe(question);
 expect(result.calls[0].lang).toBe('es-ES');
 expect(result.pending).toBe(1);
});
test('DJ02 — large repeat button replays question and replaces queued utterance',async({page})=>{
 await openJunior(page);
 await expect.poll(()=>page.evaluate(()=>__ttsTest.calls.length)).toBe(1);
 const btn=page.locator('#a1Stage .jr-repeat');
 await expect(btn).toContainText('Powtórz pytanie');
 const box=await btn.boundingBox();expect(box.height).toBeGreaterThanOrEqual(60);
 await btn.click();
 const x=await page.evaluate(()=>({calls:__ttsTest.calls.map(v=>v.text),pending:__ttsTest.pendingCount()}));
 expect(x.calls).toHaveLength(2);expect(x.calls[0]).toBe(x.calls[1]);expect(x.pending).toBe(1);
});
test('DJ03 — a hint shows context without revealing full model and preserves speak step',async({page})=>{
 await openJunior(page);
 const question=await page.locator('#a1Stage .jr-question').textContent();
 await page.locator('#a1Stage .jr-quiet').click();
 await expect(page.locator('#a1Stage .jr-hint')).toBeVisible();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','0');
 await expect(page.locator('#a1Stage .jr-question')).toHaveText(question);
 await expect(page.locator('#a1Stage .jr-main')).toHaveText(/Odpowiedziałem/);
 await expect(page.locator('#a1Stage .jr-quiet')).toHaveCount(0);
});
test('DJ04 — help path records one honest needsHelp attempt in existing profile schema',async({page})=>{
 await openJunior(page);
 await page.locator('#a1Stage .jr-quiet').click();
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await page.locator('#a1Stage .jr-main').filter({hasText:'Dalej'}).click();
 await expect(page.locator('#a1Stage .jr-options button')).toHaveCount(1);
 await page.locator('#a1Stage .jr-options button').click();
 const data=await stored(page,A1);
 const records=Object.values(data?.otono?.dialogs||{});
 expect(records.reduce((n,v)=>n+v.practised,0)).toBe(1);
 expect(records.reduce((n,v)=>n+v.needsHelp,0)).toBe(1);
 expect(records.reduce((n,v)=>n+v.confident,0)).toBe(0);
});
test('DJ05 — independent speech records confidence once and shows no grading claim',async({page})=>{
 await openJunior(page);
 await feedback(page,'Odpowiedziałem sam');
 const data=await stored(page,A1);
 const records=Object.values(data?.otono?.dialogs||{});
 expect(records.reduce((n,v)=>n+v.confident,0)).toBe(1);
 expect(records.reduce((n,v)=>n+v.practised,0)).toBe(1);
 await expect(page.locator('#a1Stage .jr-dialog')).toContainText('¡Muy bien!');
 await test.step('A1 introduction keeps both self-assessments after reload',async()=>{
  await page.reload();
  await openJunior(page,{tts:false});
  await expect(page.locator('#a1Stage').getByRole('button',{name:/Poznajmy się/})).toHaveCount(0);
  await page.evaluate(()=>frankaNav15_2.go('path'));
  const priorPath=await stored(page,'hiszpanskiFrankaPath10V2');
  const priorA1=await stored(page,A1);
  await page.getByRole('button',{name:/TEST · Podejrzyj rozmowę/}).click();
  await feedback(page,'Odpowiedziałem sam');
  await page.getByRole('button',{name:/Drugie pytanie/}).click();
  await page.getByRole('button',{name:/Potrzebuję podpowiedzi/}).click();
  await feedback(page,'Potrzebowałem pomocy');
  await expect(page.locator('#a1Stage')).toContainText('Postępy nie zostały zapisane');
  await page.getByRole('button',{name:'Wróć do ścieżki',exact:true}).click();
  expect(await stored(page,'hiszpanskiFrankaPath10V2')).toEqual(priorPath);
  expect(await stored(page,A1)).toEqual(priorA1);
  await page.evaluate(()=>{
   const stages=frankaPath10.stages(1);
   const sentence=stages.findIndex(x=>x.kind==='sentence');
   if(stages[sentence+1].kind!=='dialogue')throw Error('Conversation must follow sentences');
   frankaStore.setItem('hiszpanskiFrankaPath10V2',JSON.stringify({1:Object.fromEntries(stages.slice(0,sentence+1).map(s=>[s.id,{done:true}]))}));
  });
  await page.reload();
  await page.evaluate(()=>frankaNav15_2.go('path'));
  await expect(page.locator('[data-journey-stage-id="checkpoint"]')).toBeEnabled();
  await page.locator('[data-journey-stage-id="dialogue:a1-introduction"]').click();
  await expect(page.locator('#a1Stage .jr-question')).toHaveText('¿Cómo te llamas?');
  await feedback(page,'Odpowiedziałem sam');
  await page.getByRole('button',{name:/Drugie pytanie/}).click();
  await expect(page.locator('#a1Stage .jr-question')).toHaveText('¿Cuántos años tienes?');
  await page.getByRole('button',{name:/Potrzebuję podpowiedzi/}).click();
  await feedback(page,'Potrzebowałem pomocy');
  await page.getByRole('button',{name:'Wróć do ścieżki',exact:true}).click();
  await expect(page.locator('#s10Steps')).toBeVisible();
  await page.reload();
  expect((await stored(page,'hiszpanskiFrankaPath10V2'))[1]['dialogue:a1-introduction'].done).toBe(true);
  const dialogs=(await stored(page,A1)).otono.dialogs;
  expect(dialogs['¿Cómo te llamas?|Me llamo Franek.']).toMatchObject({practised:1,confident:1,needsHelp:0});
  expect(dialogs['¿Cuántos años tienes?|Tengo siete años.']).toMatchObject({practised:1,confident:0,needsHelp:1});
 });
});
test('DJ06 — next dialogue resets hint, keeps one main action and auto-plays new question',async({page})=>{
 await openJunior(page);
 await page.locator('#a1Stage .jr-quiet').click();
 await feedback(page,'Potrzebowałem pomocy');
 const before=await page.evaluate(()=>__ttsTest.calls.length);
 await page.locator('#a1Stage .jr-main').filter({hasText:'Następna rozmowa'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','0');
 await expect(page.locator('#a1Stage .jr-hint')).toHaveCount(0);
 await expect(page.locator('#a1Stage .jr-quiet')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>__ttsTest.calls.length)).toBe(before+1);
 expect(await page.evaluate(()=>__ttsTest.calls.at(-1).text)).toBe((await page.locator('#a1Stage .jr-question').textContent()).trim());
});
test('DJ07 — leaving dialogue cancels delayed autoplay',async({page})=>{
 await openJunior(page);
 await page.evaluate(()=>document.querySelector('[data-a1-view="sentences"]').click());
 await page.waitForTimeout(260);
 const count=await page.evaluate(()=>__ttsTest.calls.length);
 expect(count).toBe(0);
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveCount(0);
});
test('DJ08 — autoplay cannot interrupt active Car Mode audio',async({page})=>{
 await installTTS(page);
 await seedCarSession(page);
 await page.locator('#carResume').click();
 await expect.poll(()=>page.evaluate(()=>__ttsTest.pendingCount())).toBe(1);
 const before=await page.evaluate(()=>({calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations}));
 // Exercise the same shared speech engine used by Dialogi Junior.
 const denied=await page.evaluate(()=>hf29Audio.speakWord('¿Qué ves?'));
 expect(denied).toBe(false);
 const after=await page.evaluate(()=>({calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations,owner:hf27bAudio.owner}));
 expect(after).toEqual({...before,owner:'car26'});
 await page.locator('#carStop').click();
});

async function seasonalConversation(page, season, topic, prompts, childTurns) {
 await installTTS(page);
 await ready(page);
 const pathKey='hiszpanskiFrankaPath10V2';
 const stages=await page.evaluate(u=>frankaPath10.stages(u).map(s=>({kind:s.kind,id:s.id})),season);
 const index=stages.findIndex(s=>s.kind==='dialogue');
 expect(stages[index-1].kind).toBe('sentence');
 expect(stages[index+1].kind).toBe('checkpoint');
 for(const preview of [true,false]){
  if(!preview){
   await page.evaluate(({season,stages,index,pathKey})=>{
    const completed=Object.fromEntries(stages.slice(0,index).map(s=>[s.id,{done:true}]));
    frankaStore.setItem(pathKey,JSON.stringify({[season]:completed}));
   },{season,stages,index,pathKey});
   await page.reload();
  }
  await page.evaluate(u=>{
   const select=document.getElementById('uxUnit');
   select.value=String(u);
   select.dispatchEvent(new Event('change',{bubbles:true}));
   frankaNav15_2.go('path');
  },season);
  const before=await stored(page,pathKey);
  const priorDialogs=(await stored(page,A1))?.[topic]?.dialogs||{};
  if(preview)await page.getByRole('button',{name:/TEST · Podejrzyj rozmowę/}).click();
  else{
   await expect(page.locator('[data-journey-stage-id="checkpoint"]')).toBeEnabled();
   await page.locator('[data-journey-stage-id="'+stages[index].id+'"]').click();
  }
  const stage=page.locator('#a1Stage');
  for(const [turn,prompt] of prompts.entries()){
   await expect(stage.locator('.jr-question')).toHaveText(prompt);
   await expect(stage.locator('.jr-repeat')).toHaveCount(childTurns.includes(turn)?0:1);
   if(turn===1)await stage.getByRole('button',{name:/Potrzebuję podpowiedzi/}).click();
   await stage.locator('.jr-main').click();
   await stage.locator('.jr-main').click();
   await stage.locator('.jr-options button').first().click();
   if(turn===0)await stage.locator('.jr-main').click();
  }
  if(season===3)await expect(stage).toContainText('Me gusta montar en bici.');
  await stage.getByRole('button',{name:'Wróć do ścieżki',exact:true}).click();
  await page.reload();
  const result=await stored(page,pathKey);
  const dialogs=(await stored(page,A1))?.[topic]?.dialogs||{};
  if(preview){
   expect(result).toEqual(before);
   expect(dialogs).toEqual(priorDialogs);
  }else{
   expect(result[season][stages[index].id].done).toBe(true);
   for(const [turn,prompt] of prompts.entries()){
    const record=Object.entries(dialogs).find(([key])=>key.startsWith(prompt+'|'))?.[1];
    expect(record).toMatchObject({practised:1,confident:turn===0?1:0,needsHelp:turn===1?1:0});
   }
  }
 }
}
test('A134-01 — winter weather and clothes',async({page})=>{
 await seasonalConversation(page,2,'invierno',['¿Qué tiempo hace?','¿Qué te pones?'],[]);
});
test('A134-02 — spring preferences and a question from the child',async({page})=>{
 await seasonalConversation(page,3,'primavera',['¿Qué te gusta hacer?','Zapytaj kolegę, co on lubi robić.'],[1]);
});
test('A134-03 — summer request initiated by the child and a follow-up',async({page})=>{
 await seasonalConversation(page,4,'verano_a1',['Jesteś w kiosku. Poproś po hiszpańsku o lody.','¿De chocolate?'],[0]);
});
