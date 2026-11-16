'use strict';
const { test, expect } = require('@playwright/test');
const { ready } = require('./helpers');

async function openParent(page) {
  await ready(page);
  // #hf192Open is intentionally hidden in v27C (iOS overlap fix).
  // Use the same visible profile menu that parents use on desktop and mobile.
  await page.locator('#hf19Launcher').click();
  await expect(page.locator('#hf19Overlay')).toHaveClass(/hf19-open/);
  await page.locator('#hf193Parent').click();
  await expect(page.locator('#hf192Shade')).toHaveClass(/hf192-visible/);
}
async function setupPin(page, pin='1234') {
  await page.locator('#hf192NewPin').fill(pin);
  await page.locator('#hf192RepeatPin').fill(pin);
  await page.locator('#hf192SetPin').click();
  await expect(page.locator('#hf192dashboard')).toBeVisible();
}

// P01: protect the dashboard; persist only salted hash, never a plaintext PIN.
test('P01 — parent PIN setup stores a salted hash and opens dashboard', async ({ page }) => {
  await openParent(page);
  await expect(page.locator('#hf192setup')).toBeVisible();
  await setupPin(page);
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('hf192:parent-pin')));
  expect(record.schema).toBe(1);
  expect(record.salt).toMatch(/^[0-9a-f]{32}$/);
  expect(record.digest).toMatch(/^[0-9a-f]{64}$/);
  expect(record.pin).toBeUndefined();
  expect(record.digest).not.toBe('1234');
  await expect(page.locator('#hf192Stats')).toContainText('Statystyki profilu');
});

// P02: wrong code must not open the panel; correct code must unlock it.
test('P02 — wrong PIN keeps dashboard locked and correct PIN unlocks it', async ({ page }) => {
  await openParent(page);
  await setupPin(page);
  await page.locator('#hf192Lock').click();
  await expect(page.locator('#hf192dashboard')).toBeHidden();
  await page.locator('#hf192Pin').fill('9999');
  await page.locator('#hf192Login').click();
  await expect(page.locator('#hf192Message')).toContainText('Nieprawidłowy PIN');
  await expect(page.locator('#hf192dashboard')).toBeHidden();
  await page.locator('#hf192Pin').fill('1234');
  await page.locator('#hf192Login').click();
  await expect(page.locator('#hf192dashboard')).toBeVisible();
});

// P03: lockout must survive a page reload and not expose the dashboard.
test('P03 — five wrong PIN attempts trigger persistent lockout', async ({ page }) => {
  await openParent(page);
  await setupPin(page);
  await page.locator('#hf192Lock').click();
  for (let i=0;i<5;i++) {
    await page.locator('#hf192Pin').fill('9999');
    await page.locator('#hf192Login').click();
    await expect.poll(() => page.evaluate(() => {
      const state=JSON.parse(localStorage.getItem('hf192:lock')||'{}');
      return state.until> Date.now() ? 'locked' : Number(state.fails||0);
    })).toBe(i===4?'locked':i+1);
    await expect(page.locator('#hf192Message')).toContainText(i===4?'Pięć błędnych prób':'Nieprawidłowy PIN');
  }
  const lock = await page.evaluate(() => JSON.parse(localStorage.getItem('hf192:lock')));
  expect(lock.until).toBeGreaterThan(Date.now());
  await page.reload();
  await openParent(page);
  await page.locator('#hf192Pin').fill('1234');
  await page.locator('#hf192Login').click();
  await expect(page.locator('#hf192Message')).toContainText('Zbyt wiele prób');
  await expect(page.locator('#hf192dashboard')).toBeHidden();
});

// P04: 7/30 day reporting and parent-selected profile isolation use synthetic data.
test('P04 — 7/30-day parent insights respect selected profile', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const meta=window.hfProfiles19.getMeta();
    const other={id:'p-qa-parent',name:'Testowy Uczeń',createdAt:new Date().toISOString()};
    window.hfProfiles19.saveMeta({...meta,profiles:[...meta.profiles,other]});
    const now=Date.now(),day=new Date(now).toLocaleDateString('sv-SE');
    localStorage.setItem('hf18:p:franek:hiszpanskiFrankaProgressV1',JSON.stringify({mastery:{'1|hola':{right:3,wrong:0,streak:2,due:0}}}));
    localStorage.setItem('hf18:p:franek:hiszpanskiFrankaInsights25V1',JSON.stringify({schema:1,events:[{id:'qa1',at:now,day,u:1,kind:'word',es:'hola',correct:true}]}));
    localStorage.setItem('hf18:p:p-qa-parent:hiszpanskiFrankaProgressV1',JSON.stringify({mastery:{}}));
    localStorage.setItem('hf18:p:p-qa-parent:hiszpanskiFrankaInsights25V1',JSON.stringify({schema:1,events:[]}));
  });
  await page.reload();
  await openParent(page);
  await setupPin(page);
  const days7=page.locator('#hf25Panel .hf25-tile').filter({hasText:'Aktywne dni · 7 dni'}).locator('strong');
  const days30=page.locator('#hf25Panel .hf25-tile').filter({hasText:'Aktywne dni · 30 dni'}).locator('strong');
  await expect(days7).toHaveText('1');
  await expect(days30).toHaveText('1');
  await expect(page.locator('#hf192Stats')).toContainText('Statystyki profilu Franek');
  await page.locator('#hf192Profile').selectOption('p-qa-parent');
  await expect(page.locator('#hf192Stats')).toContainText('Statystyki profilu Testowy Uczeń');
  await expect(days7).toHaveText('0');
  await expect(days30).toHaveText('0');
});
