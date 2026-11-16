'use strict';
const { test, expect } = require('@playwright/test');
const { ready, installTTS, stored, progressKey } = require('./helpers');

// U01: verify the actual navigation router and visible screens.
test('U01 — main navigation reveals Today, Learning and Progress views', async ({ page }) => {
  await ready(page);
  const transitions=[['today','#s15Today'],['path','#s15Learning'],['awards','#s15Progress']];
  for(const [destination,selector] of transitions){
    expect(await page.evaluate(to=>window.frankaNav15_2.go(to,{focus:false}),destination)).toBe(true);
    await expect(page.locator(selector)).toHaveClass(/s15-active/);
    await expect(page.locator(selector)).toBeVisible();
  }
});

// U02: game starts from the supported user-facing navigation and builds a real deck.
test('U02 — Memory quick start displays a playable deck', async ({ page }) => {
  await installTTS(page);
  await ready(page);
  expect(await page.evaluate(()=>window.frankaNav15_2.go('memory',{focus:false}))).toBe(true);
  await expect(page.locator('#epicStage')).toBeVisible();
  await expect(page.locator('#epicTitle')).toContainText('Memory');
  const count=await page.locator('#epicContent button.epic-card').count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count%2).toBe(0);
  await expect(page.locator('#epicScore')).toContainText('Znalezione pary: 0/');
});

// U03: deterministic Fisher–Yates (Math.random=0) yields first & last cards as a pair.
test('U03 — matching a Memory pair records progress and updates score once', async ({ page }) => {
  await installTTS(page,{autoEnd:true});
  await ready(page);
  await page.evaluate(()=>{Math.random=()=>0;window.frankaNav15_2.go('memory',{focus:false})});
  const cards=page.locator('#epicContent button.epic-card');
  expect(await cards.count()).toBeGreaterThanOrEqual(4);
  await cards.first().click();
  await cards.last().click();
  await expect(page.locator('#epicScore')).toContainText('Znalezione pary: 1/');
  const data=await stored(page,progressKey);
  expect(Object.values(data?.mastery||{}).reduce((n,v)=>n+(Number(v.right)||0),0)).toBe(1);
  await expect(page.locator('#epicContent button.epic-card.done')).toHaveCount(2);
});

// U04: keyboard and mobile layout smoke; no device-specific audio claims.
test('U04 — mobile-sized app remains navigable by keyboard', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await ready(page);
  const button=page.locator('.s15-dock [data-s15-view="learning"]');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#s15Learning')).toHaveClass(/s15-active/);
  await expect(button).toHaveAttribute('aria-current','page');
  const dock=await page.locator('.s15-dock').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:window.innerWidth}));
  expect(dock.left).toBeGreaterThanOrEqual(-1);
  expect(dock.right).toBeLessThanOrEqual(dock.width+1);
});

// U05: local test server serves the repository's *real* sw.js and app shell.
// Register explicitly on localhost because production code registers automatically only on HTTPS.
// Reload with the browser genuinely offline; no network-mocking response is substituted.
test('U05 — service worker keeps installed application shell usable offline', async ({ page, context }) => {
  await ready(page);
  const registration=await page.evaluate(async ()=>{
    if(!('serviceWorker' in navigator))throw Error('Service Worker unavailable');
    const r=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
    await navigator.serviceWorker.ready;
    return {scope:r.scope,active:!!r.active};
  });
  expect(registration.active).toBe(true);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#s15Shell')).toBeVisible();
  await page.locator('.s15-dock [data-s15-view="learning"]').click();
  await expect(page.locator('#s15Learning')).toHaveClass(/s15-active/);
});
