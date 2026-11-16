'use strict';
const fs = require('node:fs');
const {test,expect}=require('@playwright/test');
const {ready,progressKey}=require('./helpers');
async function openTransfer(page){
  await ready(page);
  await page.locator('.s15-dock [data-s15-view="progress"]').click();
  const fold=page.locator('#s15Progress > details.s15-parentfold');
  if(!(await fold.evaluate(el=>el.open)))await fold.locator(':scope > summary').click();
  await expect(page.locator('#hf30TransferGuide')).toBeVisible();
}
async function upload(page,payload,name='franka-backup.json'){
  await page.locator('#hf18file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload),'utf8')});
}
function backup(name='Franek',points=32){
  return {
    format:'hiszpanski-franka-backup',schema:2,appVersion:'27C.0',exportedAt:'2026-11-16T12:00:00Z',
    profiles:[{id:'franek',name,createdAt:'2026-01-01T00:00:00Z'}],active:'franek',
    data:{franek:{hiszpanskiFrankaProgressV1:JSON.stringify({points,mastery:{'1|erizo':{right:3,wrong:0,streak:3}}})}}
  };
}
test('PT01 — Safari guide explains independent PWA storage and backup',async({page})=>{
  await openTransfer(page);
  await expect(page.locator('#hf30TransferContext')).toContainText('przeglądarce');
  await expect(page.locator('#hf30TransferGuide')).toContainText('Nie usuwaj danych Safari');
  await expect(page.locator('#hf30TransferGuide')).toContainText('nie synchronizują się automatycznie');
});
test('PT02 — installed PWA mode explains separate data storage',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{configurable:true,value:true}));
  await openTransfer(page);
  await expect(page.locator('#hf30TransferContext')).toContainText('ekranu początkowego');
  await expect(page.locator('#hf30ImportedActions')).toBeHidden();
});
test('PT03 — browser export preserves saved learning history',async({page})=>{
  await openTransfer(page);
  await page.evaluate(k=>frankaStore.setItem(k,JSON.stringify({points:117,mastery:{}})),progressKey);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#hf18export').click()]);
  const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  expect(JSON.parse(data.data.franek[progressKey]).points).toBe(117);
  expect(data.schema).toBe(2);
  expect(await page.evaluate(k=>JSON.parse(frankaStore.getItem(k)).points,progressKey)).toBe(117);
});
test('PT04 — import previews source, keeps current profile, then switches only on click',async({page})=>{
  await openTransfer(page);
  await page.evaluate(k=>frankaStore.setItem(k,JSON.stringify({points:9,mastery:{}})),progressKey);
  const prompts=[];page.on('dialog',async d=>{prompts.push(d.message());await d.accept()});
  await upload(page,backup('Franek',117));
  await expect(page.locator('#hf18status')).toContainText('Import zakończony');
  await expect(page.locator('#hf30ImportedActions')).toBeVisible();
  expect(prompts).toHaveLength(1);
  expect(prompts[0]).toContain('2026-11-16');
  expect(prompts[0]).toContain('Franek');
  expect(prompts[0]).toContain('nie zostaną nadpisane');
  const before=await page.evaluate(k=>({active:hfProfiles19.getMeta().active,original:JSON.parse(localStorage.getItem('hf18:p:franek:'+k)).points,profiles:hfProfiles19.getMeta().profiles.length}),progressKey);
  expect(before).toEqual({active:'franek',original:9,profiles:2});
  await page.locator('#hf30Activate').click();
  await expect.poll(()=>page.evaluate(()=>hfProfiles19.getMeta().active)).not.toBe('franek');
  const after=await page.evaluate(k=>({points:JSON.parse(frankaStore.getItem(k)).points,name:hfProfiles19.getMeta().profiles.find(p=>p.id===hfProfiles19.getMeta().active)?.name,original:JSON.parse(localStorage.getItem('hf18:p:franek:'+k)).points}),progressKey);
  expect(after).toEqual({points:117,name:'Franek (import)',original:9});
});
test('PT05 — cancelling import confirmation never changes profiles',async({page})=>{
  await openTransfer(page);
  const before=await page.evaluate(()=>JSON.stringify(hfProfiles19.getMeta()));
  page.on('dialog',d=>d.dismiss());
  await upload(page,backup());
  const after=await page.evaluate(()=>({meta:JSON.stringify(hfProfiles19.getMeta()),actions:document.querySelector('#hf30ImportedActions').hidden}));
  expect(after).toEqual({meta:before,actions:true});
});
test('PT06 — invalid JSON and corrupt progress cannot alter existing profile',async({page})=>{
  await openTransfer(page);
  const before=await page.evaluate(()=>JSON.stringify(hfProfiles19.getMeta()));
  await upload(page,'{invalid','bad.json');
  await expect(page.locator('#hf18status')).toContainText('Import przerwany');
  const broken=backup();broken.data.franek.hiszpanskiFrankaProgressV1='{"points":-12}';
  await upload(page,broken,'bad-progress.json');
  await expect(page.locator('#hf18status')).toContainText('Import przerwany');
  expect(await page.evaluate(()=>JSON.stringify(hfProfiles19.getMeta()))).toBe(before);
  await expect(page.locator('#hf30ImportedActions')).toBeHidden();
});
test('PT07 — repeat import creates separate profiles without replacing data',async({page})=>{
  await openTransfer(page);
  page.on('dialog',d=>d.accept());
  await upload(page,backup('Franek',55),'first.json');
  await expect(page.locator('#hf18status')).toContainText('Import zakończony');
  await upload(page,backup('Franek',77),'second.json');
  await expect.poll(()=>page.evaluate(()=>hfProfiles19.getMeta().profiles.length)).toBe(3);
  const result=await page.evaluate(k=>{
    const list=hfProfiles19.getMeta().profiles.filter(p=>p.id!=='franek');
    return {unique:new Set(list.map(p=>p.id)).size===2,values:list.map(p=>JSON.parse(localStorage.getItem('hf18:p:'+p.id+':'+k)).points).sort((a,b)=>a-b),active:hfProfiles19.getMeta().active};
  },progressKey);
  expect(result).toEqual({unique:true,values:[55,77],active:'franek'});
});
