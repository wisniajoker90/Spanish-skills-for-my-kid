'use strict';
const {test,expect}=require('@playwright/test');
const {ready,installTTS,stored}=require('./helpers');
async function openJunior(page){
 await installTTS(page);
 await ready(page);
 await page.evaluate(()=>{document.querySelector('#uxUnit').value='1';document.querySelector('[data-ux-activity="dialogues"]').click();document.querySelector('#uxStart').click()});
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','0');
}
test('ST01 — leaving the learning stage before audio starts cancels its deferred playback',async({page})=>{
 await openJunior(page);
 await page.locator('#uxBackToChoice').click();
 await expect(page.locator('#uxLearningStage')).toBeHidden();
 await page.waitForTimeout(290);
 expect(await page.evaluate(()=>__ttsTest.calls)).toHaveLength(0);
});
test('ST02 — retrying after seeing the model answer never records a result prematurely',async({page})=>{
 await openJunior(page);
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','1');
 await page.locator('#a1Stage .jr-quiet').filter({hasText:'jeszcze raz'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','0');
 const before=await stored(page,'hiszpanskiFrankaA1ProgressV1');
 expect(Object.values(before?.otono?.dialogs||{})).toHaveLength(0);
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await page.locator('#a1Stage .jr-main').filter({hasText:'Dalej'}).click();
 await page.locator('#a1Stage .jr-options button').filter({hasText:'Powiedziałem sam'}).click();
 const after=await stored(page,'hiszpanskiFrankaA1ProgressV1');
 expect(Object.values(after.otono.dialogs).reduce((n,x)=>n+x.practised,0)).toBe(1);
});
test('ST03 — a two-word model answer is never completely disclosed by the hint',async({page})=>{
 await openJunior(page);
 for(let i=0;i<2;i++){
  await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
  await page.locator('#a1Stage .jr-main').filter({hasText:'Dalej'}).click();
  await page.locator('#a1Stage .jr-options button').first().click();
  await page.locator('#a1Stage .jr-main').filter({hasText:'Następna rozmowa'}).click();
 }
 await expect(page.locator('#a1Stage .jr-question')).toContainText('calabaza');
 await page.locator('#a1Stage .jr-quiet').filter({hasText:'Potrzebuję podpowiedzi'}).click();
 const hint=await page.locator('#a1Stage .jr-hint').textContent();
 expect(hint).toContain('Es');
 expect(hint).not.toContain('naranja');
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await expect(page.locator('#a1Stage .jr-answer')).toHaveText('Es naranja.');
});
test('ST04 — hidden learning stage cannot speak even if the pending autoplay timer is still active',async({page})=>{
 await openJunior(page);
 await page.evaluate(()=>document.querySelector('#uxLearningStage').hidden=true);
 await page.waitForTimeout(290);
 expect(await page.evaluate(()=>__ttsTest.calls.length)).toBe(0);
});
