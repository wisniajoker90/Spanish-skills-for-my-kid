'use strict';
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { ready } = require('./helpers');

async function openBackup(page) {
  await ready(page);
  // The v27C router has no 'progress' destination; use the actual UI tab.
  await page.locator('.s15-dock [data-s15-view="progress"]').click();
  await expect(page.locator('#s15Progress')).toHaveClass(/s15-active/);
  const fold=page.locator('details.s15-parentfold');
  if (!(await fold.evaluate(el=>el.open))) await fold.locator('summary').click();
  await expect(page.locator('#hf18export')).toBeVisible();
}
async function upload(page, payload, filename='backup.json') {
  await page.locator('#hf18file').setInputFiles({
    name:filename,mimeType:'application/json',
    buffer:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload),'utf8')
  });
}
function legacy(data) {
  return {format:'hiszpanski-franka-backup',schema:1,appVersion:'17.1',data};
}

// R01: verify a real browser download and current schema without changing data.
test('R01 — export downloads valid versioned JSON preserving profile data', async ({ page }) => {
  await openBackup(page);
  await page.evaluate(() => window.frankaStore.setItem('hiszpanskiFrankaRegression28',JSON.stringify({marker:'safe-export'})));
  const before=await page.evaluate(() => JSON.stringify(window.hfProfiles19.getMeta()));
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#hf18export').click()]);
  expect(download.suggestedFilename()).toMatch(/^hiszpanski-franka-kopia-\d{4}-\d{2}-\d{2}\.json$/);
  const payload=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  expect(payload).toMatchObject({format:'hiszpanski-franka-backup',schema:2,appVersion:'27C.0',active:'franek'});
  expect(payload.profiles.some(p=>p.id==='franek')).toBe(true);
  expect(JSON.parse(payload.data.franek.hiszpanskiFrankaRegression28)).toEqual({marker:'safe-export'});
  expect(await page.evaluate(() => JSON.stringify(window.hfProfiles19.getMeta()))).toBe(before);
});

// R02: legacy schema 1 is imported as NEW profile; original progress remains intact.
test('R02 — legacy backup import adds isolated profile without overwriting current data', async ({ page }) => {
  await openBackup(page);
  await page.evaluate(() => window.frankaStore.setItem('hiszpanskiFrankaRegression28',JSON.stringify({marker:'original'})));
  page.on('dialog',d=>d.accept());
  await upload(page,legacy({hiszpanskiFrankaRegression28:JSON.stringify({marker:'imported'})}));
  await expect(page.locator('#hf18status')).toContainText('Import zakończony');
  const result=await page.evaluate(() => {
    const meta=window.hfProfiles19.getMeta(),added=meta.profiles.find(p=>p.id!=='franek');
    return {total:meta.profiles.length,active:meta.active,name:added?.name,
      original:localStorage.getItem('hf18:p:franek:hiszpanskiFrankaRegression28'),
      imported:added&&localStorage.getItem('hf18:p:'+added.id+':hiszpanskiFrankaRegression28')};
  });
  expect(result).toEqual({total:2,active:'franek',name:'Import 17.1',original:'{"marker":"original"}',imported:'{"marker":"imported"}'});
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>window.hfProfiles19.getMeta().profiles.length)).toBe(2);
});

// R03: malformed backup is rejected before it can create or modify any profile.
test('R03 — invalid JSON backup is rejected without changing existing profiles', async ({ page }) => {
  await openBackup(page);
  const before=await page.evaluate(()=>JSON.stringify(window.hfProfiles19.getMeta()));
  await upload(page,'{not-json', 'corrupt.json');
  await expect(page.locator('#hf18status')).toContainText('Import przerwany');
  const after=await page.evaluate(()=>({meta:JSON.stringify(window.hfProfiles19.getMeta()),orphan:[...Array(localStorage.length)].map((_,i)=>localStorage.key(i)).filter(k=>k.startsWith('hf27:stage:'))}));
  expect(after).toEqual({meta:before,orphan:[]});
});

// R04: force failure on the second permanent write and assert rollback + no orphaned stages.
test('R04 — interrupted backup import rolls back staged and committed writes', async ({ page }) => {
  await openBackup(page);
  const before=await page.evaluate(()=>JSON.stringify(window.hfProfiles19.getMeta()));
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    window.__restoreStorage28=()=>{Storage.prototype.setItem=original};
    Storage.prototype.setItem=function(k,v){
      if(k.startsWith('hf18:p:imp-')&&k.endsWith(':hiszpanskiFrankaProgressV1'))
        throw new DOMException('Simulated write error','QuotaExceededError');
      return original.call(this,k,v);
    };
  });
  page.on('dialog',d=>d.accept());
  await upload(page,legacy({
    hiszpanskiFrankaRegression28:JSON.stringify({marker:'temporary'}),
    hiszpanskiFrankaProgressV1:JSON.stringify({mastery:{}})
  }));
  await expect(page.locator('#hf18status')).toContainText('Import przerwany');
  const after=await page.evaluate(()=>{
    window.__restoreStorage28();
    return {meta:JSON.stringify(window.hfProfiles19.getMeta()),
      leftovers:[...Array(localStorage.length)].map((_,i)=>localStorage.key(i)).filter(k=>k.startsWith('hf27:stage:')||k.startsWith('hf18:p:imp-'))};
  });
  expect(after).toEqual({meta:before,leftovers:[]});
});
