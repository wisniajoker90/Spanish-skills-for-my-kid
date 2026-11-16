'use strict';
const { test, expect } = require('@playwright/test');
const { ready, installTTS, seedCarSession } = require('./helpers');

// Browser-event simulations complement, but do not replace, actual iPhone Safari testing.
async function openOtonoWords(page) {
  await ready(page);
  await page.evaluate(() => window.frankaNav15_2.go('path', { focus: false }));
  await page.locator('#uxStart').click();
  await expect(page.locator('#listen')).toBeVisible();
}

test('IA01 — rapid Otoño selection cannot cancel the first spoken word', async ({ page }) => {
  await installTTS(page);
  await openOtonoWords(page);
  const snapshot = await page.evaluate(() => {
    const season = document.querySelector('#uxUnit');
    season.value='2';season.dispatchEvent(new Event('change',{bubbles:true}));
    season.value='1';season.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#uxStart').click();
    const word = document.querySelector('#word').textContent.trim();
    document.querySelector('#listen').click();
    return { word, cancellations: __ttsTest.cancellations, calls: __ttsTest.calls.length };
  });
  await page.waitForTimeout(190);
  const result = await page.evaluate(() => ({
    calls: __ttsTest.calls.map(x=>x.text), cancellations: __ttsTest.cancellations,
    pending: __ttsTest.pendingCount()
  }));
  expect(result.calls.at(-1)).toBe(snapshot.word);
  expect(result.calls.length).toBe(snapshot.calls);
  expect(result.cancellations).toBe(snapshot.cancellations);
  expect(result.pending).toBe(1);
});

test('IA02 — repeated Listen keeps only the newest speech queued', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  await page.locator('#listen').click();
  await page.locator('#repeat').click();
  const x=await page.evaluate(() => ({calls:__ttsTest.calls,pending:__ttsTest.pendingCount(),owner:hf27bAudio.owner}));
  expect(x.calls).toHaveLength(2);
  expect(x.calls[0].text).toBe(x.calls[1].text);
  expect(x.pending).toBe(1); expect(x.owner).toBe('general');
});

test('IA03 — empty getVoices list never blocks the requested word', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  await page.evaluate(() => { __ttsTest.getVoices=()=>[]; });
  await page.locator('#listen').click();
  const x=await page.evaluate(() => ({calls:__ttsTest.calls,pending:__ttsTest.pendingCount()}));
  expect(x.calls).toHaveLength(1); expect(x.calls[0].lang).toBe('es-ES'); expect(x.pending).toBe(1);
});

test('IA04 — delayed voiceschanged never replays an obsolete word', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  await page.evaluate(() => {
    const listeners=[]; __ttsTest.getVoices=()=>[];
    __ttsTest.addEventListener=(event,fn)=>{if(event==='voiceschanged')listeners.push(fn)};
    window.__lateListeners=listeners;
    document.querySelector('#listen').click();
    document.querySelector('#next').click();
    document.querySelector('#listen').click();
  });
  await page.evaluate(() => __lateListeners.forEach(fn=>fn()));
  const x=await page.evaluate(() => ({count:__ttsTest.calls.length,pending:__ttsTest.pendingCount(),listeners:__lateListeners.length}));
  expect(x).toEqual({count:2,pending:1,listeners:0});
});

test('IA05 — stale onend and onerror never release the current speech owner', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  const x=await page.evaluate(() => {
    const originals=[],oldSpeak=__ttsTest.speak.bind(__ttsTest);
    __ttsTest.speak=u=>{originals.push(u);oldSpeak(u)};
    document.querySelector('#listen').click();
    document.querySelector('#repeat').click();
    originals[0].onend?.({type:'end'});
    const olderEnd=hf27bAudio.owner;
    originals[0].onerror?.({error:'interrupted'});
    const olderError=hf27bAudio.owner;
    originals[1].onend?.({type:'end'});
    return {olderEnd,olderError,newEnd:hf27bAudio.owner};
  });
  expect(x).toEqual({olderEnd:'general',olderError:'general',newEnd:null});
});

test('IA06 — season change while a word is speaking cannot interrupt it', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  const before=await page.evaluate(() => {
    document.querySelector('#listen').click();
    return {calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations};
  });
  await page.evaluate(() => {
    const s=document.querySelector('#uxUnit');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForTimeout(190);
  const x=await page.evaluate(() => ({
    calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations,
    pending:__ttsTest.pendingCount(),owner:hf27bAudio.owner
  }));
  expect(x).toEqual({calls:before.calls,cancels:before.cancels,pending:1,owner:'general'});
});

test('IA07 — next card playback leaves no obsolete audio in queue', async ({ page }) => {
  await installTTS(page); await openOtonoWords(page);
  await page.locator('#listen').click();const first=(await page.locator('#word').textContent()).trim();
  await page.locator('#next').click();const next=(await page.locator('#word').textContent()).trim();
  await page.locator('#listen').click();
  const x=await page.evaluate(() => ({calls:__ttsTest.calls.map(x=>x.text),pending:__ttsTest.pendingCount()}));
  expect(next).not.toBe(first);
  expect(x).toEqual({calls:[first,next],pending:1});
});

test('IA08 — lesson and season audio cannot take over active Car Mode', async ({ page }) => {
  await installTTS(page); await seedCarSession(page);
  await page.locator('#carResume').click();
  await expect.poll(() => page.evaluate(() => __ttsTest.pendingCount())).toBe(1);
  const before=await page.evaluate(() => ({calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations}));
  const denied=await page.evaluate(() => {
    hf29Audio.announceSeason('Otoño');return hf29Audio.speakWord('Erizo');
  });
  expect(denied).toBe(false);
  await page.waitForTimeout(180);
  const active=await page.evaluate(() => ({calls:__ttsTest.calls.length,cancels:__ttsTest.cancellations,owner:hf27bAudio.owner}));
  expect(active).toEqual({calls:before.calls,cancels:before.cancels,owner:'car26'});
  await page.locator('#carStop').click();
  expect(await page.evaluate(() => hf29Audio.speakWord('Erizo'))).toBe(true);
  expect(await page.evaluate(() => __ttsTest.calls.at(-1).text)).toBe('Erizo');
});
