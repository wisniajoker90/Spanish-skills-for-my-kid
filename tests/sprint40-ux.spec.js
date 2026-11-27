'use strict';
const {test,expect}=require('@playwright/test');
const {ready,installTTS,pathKey}=require('./helpers');

test('S40 — lesson waits for an attempt before showing any translation',async({page})=>{
 await installTTS(page);
 await ready(page);
 await page.getByRole('button',{name:'Nauka',exact:true}).click();
 const step=page.locator('#s10Steps .s10-step:not([disabled])').first();
 await step.click();
 const lesson=page.locator('#s10Lesson');
 const spanish=await lesson.locator('.s10-question').textContent();
 await expect(lesson.locator('.s10-help')).toHaveCount(0);
 await expect(lesson.locator('.s10-answer-grid')).toBeHidden();
 await lesson.getByRole('button',{name:'Posłuchaj'}).click();
 await expect.poll(()=>page.evaluate(()=>__ttsTest.calls.at(-1)?.text)).toBe(spanish);
 await lesson.getByRole('button',{name:'Spróbuję odpowiedzieć'}).click();
 await expect(lesson.locator('.s10-answer-grid button').first()).toBeFocused();
 await lesson.getByRole('button',{name:'Zamknij'}).click();
 await expect(step).toBeFocused();
});

test('S40 — one season follows the learner from dialogues to games',async({page})=>{
 await installTTS(page);
 await page.setViewportSize({width:320,height:640});
 await ready(page);
 await page.getByRole('button',{name:'Nauka',exact:true}).click();
 await page.getByRole('tab',{name:'Dialogi'}).click();
 await expect(page.locator('#s10Steps')).toBeHidden();
 await expect(page.locator('#hf203Checkpoints')).toBeHidden();
 await page.getByLabel('Sezon',{exact:true}).selectOption('2');
 await expect(page.locator('#uxLearningStage')).toBeVisible();
 await expect(page.locator('#uxStageTitle')).toContainText('Invierno');
 await expect.poll(()=>page.evaluate(k=>frankaStore.getItem(k),pathKey)).toBe(null);
 await page.getByRole('tab',{name:'Gry'}).click();
 await expect(page.locator('#epicUnit')).toHaveValue('2');
 await expect(page.locator('#epicUnit')).toBeHidden();
 await expect(page.locator('#juniorMode')).toBeHidden();
 await page.getByText('Więcej gier',{exact:true}).click();
 await page.locator('.s40-letter-options > summary').click();
 await expect(page.locator('#juniorMode')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(322);
});

test('S40 — parked quiz is visible, leaves car controls intact and closes on navigation',async({page})=>{
 await ready(page);
 await page.locator('#s15CarGo').click();
 await expect(page.locator('#s15Seasons')).toBeHidden();
 await expect(page.locator('#s15ContinueSlot')).toBeHidden();
 await expect(page.locator('#carDuration')).toBeHidden();
 await expect(page.locator('#carDuration')).toHaveValue('10');
 await expect(page.locator('#carQuiz')).toBeDisabled();
 await page.locator('#carParked').check();
 await page.locator('#carQuiz').click();
 await expect(page.locator('#s40CarQuizSlot #choices button').first()).toBeVisible();
 await page.getByRole('button',{name:'Dziś',exact:true}).click();
 await page.locator('#s15CarGo').click();
 await expect(page.locator('#carQuiz')).toBeDisabled();
 await expect(page.locator('#game')).toBeHidden();
});

test('S40 — connected and local profiles have different parent copy and offline copy stays local',async({page,context})=>{
 await ready(page);
 await expect(page.locator('#fs37Launch')).toBeHidden();
 await page.getByRole('button',{name:'Postępy',exact:true}).click();
 await page.getByText('Dla rodzica',{exact:true}).click();
 await expect(page.locator('#s40ProfileSync')).toContainText('Profil lokalny');
 await expect(page.locator('#fs37Launch')).toBeVisible();
 await page.evaluate(()=>{
  const id=hfProfiles19.getMeta().active;
  for(const prefix of ['hf37prod','hf37']){
   localStorage.setItem(prefix+':learning:'+id,JSON.stringify({base:{},revision:1,remoteId:'00000000-0000-4000-8000-000000000037'}));
   localStorage.setItem(prefix+':auto:'+id,'1');
  }
 });
 await context.setOffline(true);
 await page.getByRole('button',{name:'Dziś',exact:true}).click();
 await expect(page.locator('#fs37AutoStatus')).toContainText('postęp zapisany lokalnie');
 await page.getByRole('button',{name:'Postępy',exact:true}).click();
 await page.locator('#fs37Launch').click();
 await expect(page.locator('#s40ProfileSync')).toContainText('Profil połączony');
});
