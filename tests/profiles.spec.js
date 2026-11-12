const { test, expect } = require('@playwright/test');
// Each Playwright test uses a fresh isolated browser context; never point at the live site.
async function ready(page) {
  await page.goto('/');
  await expect.poll(async () => page.evaluate(() => !!window.hfProfiles19 && !!window.frankaStore)).toBe(true);
}

test('F01 — first visit creates a valid default profile', async ({ page }) => {
  await ready(page);
  const meta = await page.evaluate(() => window.hfProfiles19.getMeta());
  expect(meta.active).toBe('franek');
  expect(meta.profiles.find(p => p.id === 'franek')?.name).toBe('Franek');
});

test('F02 — new profile is created with a distinct id', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.hfProfiles19.createProfile('Testowy Uczeń', '🦊'));
  await expect.poll(async () => page.evaluate(() => window.hfProfiles19.getMeta().profiles.length)).toBe(2);
  const meta = await page.evaluate(() => window.hfProfiles19.getMeta());
  expect(meta.active).not.toBe('franek');
  expect(meta.profiles.find(p => p.id === meta.active)?.name).toBe('Testowy Uczeń');
});

test('F03 — switching profiles isolates learning data', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.frankaStore.setItem('hiszpanskiFrankaRegression28', 'franek-only'));
  await page.evaluate(() => window.hfProfiles19.createProfile('Test', '🦊'));
  await expect.poll(async () => page.evaluate(() => window.hfProfiles19.getMeta().active)).not.toBe('franek');
  expect(await page.evaluate(() => window.frankaStore.getItem('hiszpanskiFrankaRegression28'))).toBeNull();
  await page.evaluate(() => window.frankaStore.setItem('hiszpanskiFrankaRegression28', 'test-only'));
  await page.evaluate(() => window.hfProfiles19.switchTo('franek'));
  await expect.poll(async () => page.evaluate(() => window.hfProfiles19.getMeta().active)).toBe('franek');
  expect(await page.evaluate(() => window.frankaStore.getItem('hiszpanskiFrankaRegression28'))).toBe('franek-only');
});

test('F04 — learning data survives reload', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.frankaStore.setItem('hiszpanskiFrankaRegression28', JSON.stringify({ done: 3 })));
  await page.reload();
  expect(await page.evaluate(() => window.frankaStore.getItem('hiszpanskiFrankaRegression28'))).toBe('{"done":3}');
});

test('F05 — invalid profile creation leaves metadata unchanged', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const before = JSON.stringify(window.hfProfiles19.getMeta());
    let rejected = false;
    try { window.hfProfiles19.createProfile(''); } catch { rejected = true; }
    return { rejected, unchanged: JSON.stringify(window.hfProfiles19.getMeta()) === before };
  });
  expect(result).toEqual({ rejected: true, unchanged: true });
});

test('F06 — simulated storage write failure does not switch profile', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    const before = JSON.stringify(window.hfProfiles19.getMeta());
    Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
    let rejected = false;
    try { window.hfProfiles19.createProfile('Nie zapisuj'); } catch { rejected = true; }
    finally { Storage.prototype.setItem = original; }
    return { rejected, unchanged: JSON.stringify(window.hfProfiles19.getMeta()) === before };
  });
  expect(result).toEqual({ rejected: true, unchanged: true });
});

test('F07 — legacy profile snapshot remains available after migration', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hiszpanskiFrankaRegressionLegacy', 'legacy-value'));
  await ready(page);
  const result = await page.evaluate(() => ({
    snapshot: JSON.parse(localStorage.getItem('hf18:legacy-snapshot')),
    migrated: window.frankaStore.getItem('hiszpanskiFrankaRegressionLegacy'),
    legacy: localStorage.getItem('hiszpanskiFrankaRegressionLegacy')
  }));
  expect(result.snapshot.data.hiszpanskiFrankaRegressionLegacy).toBe('legacy-value');
  expect(result.migrated).toBe('legacy-value');
  expect(result.legacy).toBe('legacy-value');
});
