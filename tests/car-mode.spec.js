'use strict';
const { test, expect } = require('@playwright/test');
const { ready, installTTS, seedCarSession, stored, carKey, progressKey } = require('./helpers');

test('A01 — unpracticed vocabulary is not played in Car Mode', async ({ page }) => {
  await installTTS(page);
  await ready(page);
  await page.locator('#s15CarGo').click();
  await page.locator('#carUnit').selectOption('1');
  await page.locator('#carStart').click();
  expect(await page.evaluate(() => window.hfCar26.isRunning())).toBe(false);
  await expect(page.locator('#carStatus')).toContainText('Brak dostępnego materiału');
});

test('A02 — new session queues only previously practiced words', async ({ page }) => {
  await installTTS(page);
  await ready(page);
  const words = await page.evaluate(key => {
    const cards = units[1].cards.slice(0, 2);
    const d = JSON.parse(window.frankaStore.getItem(key) || '{}');
    d.mastery = Object.fromEntries(cards.map(c => [trainingKey(1, c[1]), { right: 2, wrong: 0, due: 0, level: 1 }]));
    window.frankaStore.setItem(key, JSON.stringify(d));
    return cards.map(c => c[1]);
  }, progressKey);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!window.hfCar26)).toBe(true);
  await page.locator('#s15CarGo').click();
  await page.locator('#carUnit').selectOption('1');
  await page.locator('#carStart').click();
  const d = await stored(page, carKey);
  expect(d.pending.queue.length).toBeGreaterThan(0);
  expect(d.pending.queue.every(x => words.includes(x.es))).toBe(true);
  expect(await page.evaluate(() => window.hfCar26.isRunning())).toBe(true);
});

test('A03 — pause and resume preserve task phase and audio ownership', async ({ page }) => {
  await installTTS(page);
  await seedCarSession(page);
  await page.locator('#carResume').click();
  await expect.poll(() => page.evaluate(() => window.__ttsTest.pendingCount())).toBe(1);
  await page.locator('#carPause').click();
  expect(await stored(page, carKey)).toMatchObject({ pending: { index: 0, phase: 'question', completed: 0 } });
  expect(await page.evaluate(() => window.hf27bAudio.owner)).toBeNull();
  await page.locator('#carPause').click();
  await expect.poll(() => page.evaluate(() => window.__ttsTest.pendingCount())).toBe(1);
  expect(await page.evaluate(() => window.hf27bAudio.owner)).toBe('car26');
});

test('A04 — an audio task is counted once after its final pause', async ({ page }) => {
  await installTTS(page);
  await seedCarSession(page, { phase: 'answerWait', seconds: 40, length: 2 });
  await page.locator('#carResume').click();
  await expect.poll(async () => (await stored(page, carKey))?.pending?.completed, { timeout: 7000 }).toBe(1);
  await expect.poll(async () => (await stored(page, carKey))?.pending?.index).toBe(1);
  // The next question is waiting for TTS; completed must not increase twice.
  expect((await stored(page, carKey)).pending.completed).toBe(1);
});

test('A05 — timed-out Car Mode finishes the current task before summary', async ({ page }) => {
  await installTTS(page);
  await seedCarSession(page, { phase: 'answerWait', seconds: 0, length: 1 });
  await page.locator('#carResume').click();
  await expect.poll(async () => (await stored(page, carKey))?.sessions?.length, { timeout: 7000 }).toBe(1);
  const d = await stored(page, carKey);
  expect(d.pending).toBeUndefined();
  expect(d.sessions[0]).toMatchObject({ items: 1, finished: true, kind: 'listening' });
  await expect(page.locator('#carSummary')).toBeVisible();
});

test('A06 — exclusive TTS ownership rejects competing audio while Car Mode plays', async ({ page }) => {
  await installTTS(page);
  await seedCarSession(page);
  await page.locator('#carResume').click();
  const locked = await page.evaluate(() => ({ owner: window.hf27bAudio.owner, canClaim: window.hf27bAudio.claim('general') }));
  expect(locked).toEqual({ owner: 'car26', canClaim: false });
  // A paused session is still active: the coordinator must keep competing audio blocked.
  await page.locator('#carPause').click();
  const paused = await page.evaluate(() => ({
    active: window.hfCar26.isRunning(),
    owner: window.hf27bAudio.owner,
    canClaim: window.hf27bAudio.claim('general')
  }));
  expect(paused).toEqual({ active: true, owner: null, canClaim: false });

  // Only ending the Car Mode session frees the controller for other activities.
  await page.locator('#carStop').click();
  expect(await page.evaluate(() => window.hfCar26.isRunning())).toBe(false);
  const free = await page.evaluate(() => {
    const claimed = window.hf27bAudio.claim('general');
    const owner = window.hf27bAudio.owner;
    window.hf27bAudio.release('general');
    return { claimed, owner };
  });
  expect(free).toEqual({ claimed: true, owner: 'general' });
});

test('CAR35-01 — conversation gives time to answer, resumes its phase and finishes ten minutes hands-free',async({page})=>{
 await installTTS(page,{autoEnd:true});
 await ready(page);
 await page.locator('#s15CarGo').click();
 await page.locator('#carMode').selectOption('conversation');
 await page.locator('#carUnit').selectOption('2');
 await page.locator('#carWait').selectOption('7000');
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+2000));
 await page.locator('#carStart').click();
 await page.clock.runFor(100);
 const before=await stored(page,carKey);
 expect(before.pending).toMatchObject({duration:600,phase:'questionWait',wait:'7000'});
 expect(await page.evaluate(()=>__ttsTest.calls.map(x=>x.text))).toEqual(['¿Qué tiempo hace?']);
 await page.clock.runFor(6000);
 expect(await page.evaluate(()=>__ttsTest.calls.length)).toBe(1);
 await page.locator('#carPause').click();
 await page.clock.runFor(8000);
 expect(await page.evaluate(()=>__ttsTest.calls.length)).toBe(1);
 await page.locator('#carPause').click();
 await page.clock.runFor(7200);
 expect(await page.evaluate(()=>__ttsTest.calls.at(-1).text)).toBe('Hace frío.');
 await page.clock.runFor(610000);
 await expect(page.locator('#carSummary')).toBeVisible();
 const saved=await stored(page,carKey);
 expect(saved.sessions.at(-1)).toMatchObject({seconds:600,kind:'listening',correct:null});
 expect(saved.pending).toBeUndefined();
});

test('CAR35-02 — child-led prompts, all seasons and restart keep learning evidence intact',async({page})=>{
 await installTTS(page);
 await ready(page);
 await page.locator('#s15CarGo').click();
 await page.locator('#carMode').selectOption('conversation');
 await page.locator('#carUnit').selectOption('-1');
 await page.locator('#carStart').click();
 const queue=(await stored(page,carKey)).pending.queue;
 expect([...new Set(queue.map(x=>x.u))]).toEqual([1,2,3,4]);
 expect(queue.filter(x=>x.u===3)[1]).toMatchObject({lang:'pl-PL',model:'¿Y a ti?',reply:'Me gusta montar en bici.'});
 await page.locator('#carStop').click();
 await page.locator('#carUnit').selectOption('4');
 const evidenceKeys=['hiszpanskiFrankaA1ProgressV1','hiszpanskiFrankaPath10V2',progressKey];
 const evidence=async()=>Promise.all(evidenceKeys.map(key=>stored(page,key)));
 const before=await evidence();
 await page.locator('#carStart').click();
 const first=await page.evaluate(()=>__ttsTest.calls.at(-1));
 expect(first.lang).toBe('pl-PL');
 expect(first.text).toContain('Poproś');
 await page.locator('#carStop').click();
 await page.reload();
 await page.locator('#s15CarGo').click();
 await page.locator('#carResume').click();
 expect(await page.evaluate(()=>__ttsTest.calls.at(-1).text)).toBe(first.text);
 await page.locator('#carStop').click();
 expect(await evidence()).toEqual(before);
});
