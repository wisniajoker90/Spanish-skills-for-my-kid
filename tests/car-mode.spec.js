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
  await page.locator('#carPause').click();
  const free = await page.evaluate(() => {
    const claimed = window.hf27bAudio.claim('general');
    const owner = window.hf27bAudio.owner;
    window.hf27bAudio.release('general');
    return { claimed, owner };
  });
  expect(free).toEqual({ claimed: true, owner: 'general' });
});
