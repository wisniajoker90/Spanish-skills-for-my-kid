'use strict';
const { expect } = require('@playwright/test');

// All tests open the local HTTP server configured by playwright.config.js.
// Playwright creates an independent browser context per test: production data is NEVER opened.
async function ready(page) {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() =>
    !!(window.hfProfiles19 && window.frankaStore && window.frankaPath10 &&
       window.hfDailyMission20 && window.hfCar26)
  )).toBe(true);
}

// Deterministic fake of browser TTS: no real audio, voice packs or microphone needed.
// autoEnd=true ends an utterance asynchronously; manual mode waits for __ttsTest.finishOne().
async function installTTS(page, { autoEnd = false } = {}) {
  await page.addInitScript(({ autoEnd }) => {
    const queue = [];
    const recorder = {
      calls: [], cancellations: 0,
      getVoices: () => [{ name: 'Spanish test voice', lang: 'es-ES' }, { name: 'Polish test voice', lang: 'pl-PL' }],
      addEventListener: () => {},
      speak(u) {
        this.calls.push({ text: u.text, lang: u.lang, rate: u.rate });
        queue.push(u);
        if (autoEnd) setTimeout(() => this.finishOne(), 0);
      },
      cancel() { this.cancellations++; queue.length = 0; },
      finishOne() {
        const u = queue.shift();
        if (u) { u.onend?.({ type: 'end' }); return true; }
        return false;
      },
      pendingCount() { return queue.length; }
    };
    class FakeUtterance {
      constructor(text) { this.text = String(text); this.lang = ''; this.rate = 1; this.onend = null; this.onerror = null; }
    }
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: recorder });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
    window.__ttsTest = recorder;
  }, { autoEnd });
}

const carKey = 'hiszpanskiFrankaCar26V1';
const missionKey = 'hiszpanskiFrankaDailyMission20V1';
const pathKey = 'hiszpanskiFrankaPath10V2';
const progressKey = 'hiszpanskiFrankaProgressV1';

// Seed a saved Car Mode session using words already present in the real app.
// This deliberately exercises the real resume/validation path, not a test-only API.
async function seedCarSession(page, opts = {}) {
  await ready(page);
  await page.evaluate(({ key, opts }) => {
    const sample = units[1].cards.slice(0, opts.length || 2).map(c => ({ u: 1, es: c[1], pl: c[2] }));
    const d = {
      pending: {
        profile: window.hfProfiles19.getMeta().active,
        queue: sample,
        index: opts.index ?? 0,
        seconds: opts.seconds ?? 200,
        duration: 300,
        completed: opts.completed ?? 0,
        phase: opts.phase || 'question',
        at: Date.now()
      }
    };
    window.frankaStore.setItem(key, JSON.stringify(d));
  }, { key: carKey, opts });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!window.hfCar26)).toBe(true);
  await page.locator('#s15CarGo').click();
  await expect(page.locator('#carResume')).toBeVisible();
}

async function stored(page, key) {
  return page.evaluate(key => JSON.parse(window.frankaStore.getItem(key) || 'null'), key);
}

module.exports = { ready, installTTS, seedCarSession, stored, carKey, missionKey, pathKey, progressKey };
