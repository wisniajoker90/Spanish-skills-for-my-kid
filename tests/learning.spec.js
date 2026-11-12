'use strict';
const { test, expect } = require('@playwright/test');
const { ready, stored, missionKey, pathKey, progressKey } = require('./helpers');

async function openFirstLesson(page) {
  await page.evaluate(() => document.querySelector('#s10Steps button.s10-step:not([disabled])').click());
  await expect(page.locator('#s10Lesson')).toBeVisible();
}

async function chooseLessonAnswer(page, correct) {
  await page.locator('#s10LessonBody button').filter({ hasText: 'Spróbuję odpowiedzieć' }).click();
  const answer = await page.evaluate(() => {
    const q = document.querySelector('#s10LessonBody .s10-question')?.textContent;
    const stage = window.frankaPath10.stages(Number(document.querySelector('#uxUnit').value))[0];
    const card = stage.raw.find(c => c[1] === q);
    return card?.[2];
  });
  expect(answer, 'Lesson question should match the current stage').toBeTruthy();
  const grid = page.locator('#s10LessonBody .s10-answer-grid');
  const options = grid.getByRole('button');
  if (correct) {
    await grid.getByRole('button', { name: answer, exact: true }).click();
  } else {
    const wrong = (await options.allTextContents()).find(x => x.trim() !== answer);
    expect(wrong).toBeTruthy();
    await grid.getByRole('button', { name: wrong.trim(), exact: true }).click();
  }
  return answer;
}

test('L01 — journey presents a stable sequence with locked future stages', async ({ page }) => {
  await ready(page);
  const info = await page.evaluate(() => ({
    stages: window.frankaPath10.stages(1).map(x => ({ kind: x.kind, id: x.id })),
    buttons: [...document.querySelectorAll('#s10Steps button.s10-step')].map(b => ({ disabled: b.disabled, id: b.dataset.journeyStageId }))
  }));
  expect(info.stages.length).toBeGreaterThan(2);
  expect(info.stages[0].kind).toBe('school');
  expect(info.buttons[0]).toMatchObject({ disabled: false, id: info.stages[0].id });
  expect(info.buttons[1].disabled).toBe(true);
  expect(new Set(info.stages.map(x => x.id)).size).toBe(info.stages.length);
});

test('L02 — correct answer records mastery once', async ({ page }) => {
  await ready(page);
  await openFirstLesson(page);
  await chooseLessonAnswer(page, true);
  const data = await stored(page, progressKey);
  expect(data?.mastery).toBeTruthy();
  const attempts = Object.values(data.mastery).reduce((n, v) => n + (Number(v.right) || 0) + (Number(v.wrong) || 0), 0);
  expect(attempts).toBe(1);
  await expect(page.locator('#s10LessonFeedback')).toContainText('Świetnie');
});

test('L03 — completing a lesson unlocks the next stage after reload', async ({ page }) => {
  await ready(page);
  const id = await page.evaluate(() => window.frankaPath10.stages(1)[0].id);
  await openFirstLesson(page);
  const count = await page.evaluate(() => window.frankaPath10.stages(1)[0].raw.length);
  for (let i = 0; i < count; i++) {
    await chooseLessonAnswer(page, true);
    await page.locator('#s10LessonBody button.epic-primary').last().click();
  }
  await expect(page.locator('#s10LessonBody')).toContainText('Etap zaliczony');
  expect((await stored(page, pathKey))?.['1']?.[id]?.done).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!window.frankaPath10)).toBe(true);
  const buttons = await page.evaluate(() => [...document.querySelectorAll('#s10Steps button.s10-step')].slice(0,2).map(x => x.disabled));
  expect(buttons).toEqual([false, false]);
});

test('L04 — unsuccessful lesson does not unlock the next stage', async ({ page }) => {
  await ready(page);
  await openFirstLesson(page);
  const count = await page.evaluate(() => window.frankaPath10.stages(1)[0].raw.length);
  for (let i = 0; i < count; i++) {
    await chooseLessonAnswer(page, false);
    await page.locator('#s10LessonBody button.epic-primary').last().click();
  }
  await expect(page.locator('#s10LessonBody')).toContainText('Poćwiczmy jeszcze trochę');
  const result = await page.evaluate(() => ({
    nextDisabled: document.querySelectorAll('#s10Steps button.s10-step')[1].disabled,
    progress: document.querySelector('#s10PathProgress').textContent
  }));
  expect(result.nextDisabled).toBe(true);
  expect(result.progress).toMatch(/^0\//);
});

test('L05 — path completion belongs to the chosen season', async ({ page }) => {
  await ready(page);
  const id = await page.evaluate(() => window.frankaPath10.stages(1)[0].id);
  await page.evaluate(({ key, id }) => window.frankaStore.setItem(key, JSON.stringify({ 1: { [id]: { done: true, date: '2026-11-12' } } })), { key: pathKey, id });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!window.frankaPath10)).toBe(true);
  await expect(page.locator('#s10PathProgress')).toContainText('1/');
  await page.locator('#uxUnit').selectOption('2');
  await expect(page.locator('#s10PathProgress')).toContainText('0/');
  await page.locator('#uxUnit').selectOption('1');
  await expect(page.locator('#s10PathProgress')).toContainText('1/');
});

test('L06 — daily mission starts with ten items and four stages', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#hf201Shade')).toBeAttached();
  await page.evaluate(() => window.hfDailyMission20.start());
  const s = await stored(page, missionKey);
  expect(s).toMatchObject({ schema: 1, profileId: 'franek', stage: 0, step: 0, attempts: 0, completed: false });
  expect(s.items).toHaveLength(10);
  await expect(page.locator('#hf201Shade')).toHaveClass(/hf201-visible/);
  await expect(page.locator('#hf201Step')).toContainText('1/4');
});

test('L07 — daily answer counted once and resumes at next question', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#hf201Shade')).toBeAttached();
  await page.evaluate(() => window.hfDailyMission20.start());
  const mission = await stored(page, missionKey);
  const answer = mission.items[0].pl;
  await page.locator('#hf201Content .hf201-choices').getByRole('button', { name: answer, exact: true }).click();
  const first = await stored(page, missionKey);
  expect(first).toMatchObject({ attempts: 1, pending: true, stage: 0, step: 0 });
  await expect(page.locator('#hf201Content .hf201-choices button:enabled')).toHaveCount(0);
  await page.locator('#hf201Close').click();
  await expect.poll(async () => (await stored(page, missionKey)).step).toBe(1);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!window.hfDailyMission20 && !!document.querySelector('#hf201Shade'))).toBe(true);
  await page.evaluate(() => window.hfDailyMission20.start());
  expect(await stored(page, missionKey)).toMatchObject({ attempts: 1, step: 1, stage: 0 });
});
