const { test, expect } = require('playwright/test');

test.describe('Super Student app flow', () => {
  test('boots and renders colorful welcome UI', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#game-canvas')).toBeVisible();
    await expect(page.locator('.game-title')).toHaveText(/Super Student/i);
    await expect(page.locator('.display-btn.default')).toBeVisible();
    await expect(page.locator('.display-btn.qboard')).toBeVisible();
  });

  test('welcome screen is interactable within startup budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await expect(page.locator('.display-btn.default')).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('selecting mode persists selection and starts transition', async ({ page }) => {
    await page.goto('/');
    await page.click('.display-btn.qboard');
    await expect(page.locator('.mode-selected-text')).toContainText('QBOARD');

    const storedMode = await page.evaluate(() => localStorage.getItem('displayMode'));
    expect(storedMode).toBe('QBOARD');
  });

  test('debug mode exposes monitoring hooks without runtime errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/?debug=1');
    await page.waitForTimeout(500);

    const trackerAvailable = await page.evaluate(() => Boolean(window.__superStudentEventTracker));
    expect(trackerAvailable).toBeTruthy();
    expect(pageErrors).toEqual([]);
  });
});
