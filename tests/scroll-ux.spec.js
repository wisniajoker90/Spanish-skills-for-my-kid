'use strict';
const {test,expect}=require('@playwright/test');
const {ready,installTTS}=require('./helpers');
async function noHorizontalOverflow(page,label){
 const x=await page.evaluate(()=>{
  const doc=document.documentElement;
  return {doc:doc.scrollWidth,viewport:window.innerWidth,body:document.body.scrollWidth};
 });
 expect.soft(x.doc, label+' document horizontal scroll').toBeLessThanOrEqual(x.viewport+2);
 expect.soft(x.body, label+' body horizontal scroll').toBeLessThanOrEqual(x.viewport+2);
}
async function dialogue(page){
 await page.evaluate(()=>{document.getElementById('uxUnit').value='1';document.querySelector('[data-ux-activity="dialogues"]').click();document.getElementById('uxStart').click()});
 await expect(page.locator('#a1Stage .jr-dialog')).toBeVisible();
}
test('SC01 — Today, Learning and Progress have no horizontal page scrolling on narrow iPhones',async({page})=>{
 await page.setViewportSize({width:320,height:640});await ready(page);
 for(const dest of ['today','path','awards']){
  await page.evaluate(x=>window.frankaNav15_2.go(x,{focus:false}),dest);
  await noHorizontalOverflow(page,dest+' 320px');
 }
 await page.setViewportSize({width:390,height:844});
 for(const dest of ['today','path','awards']){
  await page.evaluate(x=>window.frankaNav15_2.go(x,{focus:false}),dest);
  await noHorizontalOverflow(page,dest+' 390px');
 }
});
test('SC02 — Dialogues and their controls remain within 320px mobile viewport through all steps',async({page})=>{
 await installTTS(page);await page.setViewportSize({width:320,height:640});await ready(page);await dialogue(page);
 for(let step=0;step<4;step++){
  await noHorizontalOverflow(page,'junior step '+step);
  const card=page.locator('#a1Stage .jr-dialog'),buttons=card.locator('button');
  for(let i=0;i<await buttons.count();i++){
   const b=await buttons.nth(i).boundingBox();
   if(b){expect.soft(b.x).toBeGreaterThanOrEqual(-2);expect.soft(b.x+b.width).toBeLessThanOrEqual(322)}
  }
  if(step===0)await card.locator('.jr-main').click();
  if(step===1)await card.locator('.jr-main').click();
  if(step===2)await card.locator('.jr-options button').first().click();
 }
});
test('SC03 — next dialogue step repositions a scrolled iPhone to the new prompt',async({page})=>{
 await installTTS(page);await page.setViewportSize({width:390,height:640});await ready(page);await dialogue(page);
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
 await page.locator('#a1Stage .jr-main').filter({hasText:'Odpowiedziałem'}).click();
 await expect(page.locator('#a1Stage .jr-dialog')).toHaveAttribute('data-jr-step','1');
 await expect.poll(()=>page.evaluate(()=>({top:document.querySelector('#a1Stage .jr-dialog').getBoundingClientRect().top,focused:document.activeElement?.classList.contains('jr-dialog')}))).toMatchObject({focused:true});
 const top=await page.locator('#a1Stage .jr-dialog').evaluate(x=>x.getBoundingClientRect().top);
 expect(top).toBeGreaterThanOrEqual(-20);
 expect(top).toBeLessThan(130);
});
test('SC04 — back to chooser restores navigation and has no hidden-stage audio or horizontal scrolling',async({page})=>{
 await installTTS(page);await page.setViewportSize({width:375,height:667});await ready(page);await dialogue(page);
 await page.locator('#uxBackToChoice').click();
 await expect(page.locator('#uxLearningStage')).toBeHidden();
 await expect(page.locator('#uxChooser')).toBeVisible();
 await noHorizontalOverflow(page,'chooser');
 const spokenAfterExit=await page.evaluate(()=>__ttsTest.calls.length);
 await page.waitForTimeout(260);
 expect(await page.evaluate(()=>__ttsTest.calls.length)).toBe(spokenAfterExit);
});
test('SC05 — installed PWA-like mobile panels use vertical scrolling and respect safe viewport width',async({page})=>{
 await page.setViewportSize({width:320,height:568});await ready(page);
 const styles=await page.evaluate(()=>{
  const ids=['hf19Dialog','hf192Dialog','hf193Dialog','hf201Dialog','hf202Panel'];
  return ids.map(id=>{const el=document.getElementById(id),c=el?getComputedStyle(el):null;return {id,present:!!el,overflowY:c?.overflowY,maxHeight:c?.maxHeight}});
 });
 for(const x of styles){
  expect(x.present,x.id).toBe(true);
  expect(['auto','scroll'],x.id+' vertical scroll').toContain(x.overflowY);
  expect(x.maxHeight,x.id+' height cap').not.toBe('none');
 }
 await noHorizontalOverflow(page,'base 320px');
});

test('SC06 — opening a Learning Journey lesson brings lesson into view without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:375,height:667});await ready(page);
 await page.evaluate(()=>window.frankaNav15_2.go('path',{focus:false}));
 await page.locator('#s10Steps button.s10-step:not([disabled])').first().click();
 await expect(page.locator('#s10Lesson')).toBeVisible();
 await expect.poll(()=>page.locator('#s10Lesson').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(-20);
 await noHorizontalOverflow(page,'learning journey lesson');
});
test('SC07 — opening Memory on a phone displays playable cards and keeps page width constrained',async({page})=>{
 await page.setViewportSize({width:320,height:640});await ready(page);
 expect(await page.evaluate(()=>window.frankaNav15_2.go('memory',{focus:false}))).toBe(true);
 await expect(page.locator('#epicStage')).toBeVisible();
 await expect(page.locator('#epicContent button.epic-card').first()).toBeVisible();
 await noHorizontalOverflow(page,'memory board');
});
test('SC08 — profile and parent overlays stay within a short mobile viewport and remain scrollable',async({page})=>{
 await page.setViewportSize({width:320,height:568});await ready(page);
 await page.locator('#hf19Launcher').click();
 await expect(page.locator('#hf19Overlay')).toHaveClass(/hf19-open/);
 const profile=page.locator('#hf19Dialog');
 const p=await profile.boundingBox();expect(p).toBeTruthy();
 expect(p.x).toBeGreaterThanOrEqual(-1);expect(p.x+p.width).toBeLessThanOrEqual(321);
 expect(p.y).toBeGreaterThanOrEqual(-1);expect(p.y+p.height).toBeLessThanOrEqual(569);
 await page.locator('#hf193Parent').click();
 await expect(page.locator('#hf192Shade')).toHaveClass(/hf192-visible/);
 const parent=page.locator('#hf192Dialog');
 const b=await parent.boundingBox();expect(b).toBeTruthy();
 expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.x+b.width).toBeLessThanOrEqual(321);
 expect(b.y).toBeGreaterThanOrEqual(-1);expect(b.y+b.height).toBeLessThanOrEqual(569);
 expect(await parent.evaluate(el=>getComputedStyle(el).overflowY)).toMatch(/auto|scroll/);
 await noHorizontalOverflow(page,'parent panel');
});
test('SC09 — bottom navigation stays in the iPhone viewport at both top and bottom of long pages',async({page})=>{
 await page.setViewportSize({width:375,height:667});await ready(page);
 for(const destination of ['today','path','awards']){
  await page.evaluate(name=>window.frankaNav15_2.go(name,{focus:false}),destination);
  for(const edge of ['top','bottom']){
   await page.evaluate(edge=>window.scrollTo({top:edge==='top'?0:document.documentElement.scrollHeight,behavior:'instant'}),edge);
   const rect=await page.locator('.s15-dock').boundingBox();
   expect(rect).toBeTruthy();expect(rect.x).toBeGreaterThanOrEqual(-1);
   expect(rect.x+rect.width).toBeLessThanOrEqual(376);
   expect(rect.y).toBeGreaterThanOrEqual(0);
   expect(rect.y+rect.height).toBeLessThanOrEqual(668);
  }
 }
});
