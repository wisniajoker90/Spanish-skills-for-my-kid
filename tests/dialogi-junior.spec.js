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
 await feedback(page,'Powiedziałem sam');
 const data=await stored(page,A1);
 const records=Object.values(data?.otono?.dialogs||{});
 expect(records.reduce((n,v)=>n+v.confident,0)).toBe(1);
 expect(records.reduce((n,v)=>n+v.practised,0)).toBe(1);
 await expect(page.locator('#a1Stage .jr-dialog')).toContainText('¡Muy bien!');
});
test('DJ06 — next dialogue resets hint, keeps one main action and auto-plays new question',async({page})=>{
 await openJunior(page);
 await page.locator('#a1Stage .jr-quiet').click();
 await feedback(page,'Ćwiczyłem z podpowiedzią');
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
