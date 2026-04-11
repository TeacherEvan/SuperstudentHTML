const { test, expect } = require('playwright/test');

const LEVELS = [
  { name: 'colors', label: 'Colors' },
  { name: 'shapes', label: 'Shapes' },
  { name: 'alphabet', label: 'Alphabet' },
  { name: 'numbers', label: 'Numbers' },
  { name: 'clcase', label: 'Lower-case Letters' },
  { name: 'phonics', label: 'Phonics' }
];

async function enableE2EMode(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('superstudent_e2e', '1');
  });
}

async function gotoWelcome(page, extraQuery = '') {
  await enableE2EMode(page);
  await page.goto(`/${extraQuery ? `?${extraQuery}&e2e=1` : '?e2e=1'}`);
  await expect(page.getByTestId('welcome-content')).toBeVisible();
  await expect(page.locator('#game-canvas')).toBeVisible();
}

async function enterMenuFromWelcome(page, mode = 'default') {
  await gotoWelcome(page);
  await page.getByTestId(`display-mode-${mode}`).click();
  await expect(page.getByTestId('mode-selected-text')).toContainText(/ready/i);
  await expect(page.getByTestId('level-menu')).toBeVisible();
  await expect(page.getByTestId('progress-banner')).toBeVisible();
}

async function startLevelFromMenu(page, levelName) {
  await page.getByTestId(`level-card-${levelName}`).click();

  const loadingSeen = await page.getByTestId('loading-content').isVisible().catch(() => false);
  await waitForRuntimeState(page, (snapshot) => snapshot.gameState === 'playing' && snapshot.currentLevelName === levelName);

  if (loadingSeen) {
    await expect(page.getByTestId('loading-content')).toBeHidden();
  }
}

async function waitForRuntimeState(page, predicate, timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const snapshot = await page.evaluate(() => window.__superStudentRuntime?.getStateSnapshot?.() ?? null);
    if (snapshot && predicate(snapshot)) {
      return snapshot;
    }
    await page.waitForTimeout(100);
  }

  throw new Error('Timed out waiting for runtime state');
}

async function waitForLevelTargets(page, timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await page.evaluate(() => ({
      snapshot: window.__superStudentRuntime?.getLevelSnapshot?.() ?? null,
      completionVisible: Boolean(document.getElementById('completion-screen'))
    }));

    if (result.completionVisible) {
      return null;
    }

    if (result.snapshot?.targets?.length) {
      return result.snapshot;
    }
    await page.waitForTimeout(100);
  }

  throw new Error('Timed out waiting for target snapshot');
}

async function clickCanvasPoint(page, point) {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error('Canvas bounding box not available');
  }

  await page.mouse.click(box.x + box.width * point.x, box.y + box.height * point.y);
}

async function completeLevelByPlaying(page, maxInteractions = 8) {
  for (let step = 0; step < maxInteractions; step += 1) {
    const completionVisible = await page.getByTestId('completion-content').isVisible().catch(() => false);
    if (completionVisible) {
      return;
    }

    const snapshot = await waitForLevelTargets(page);
    if (!snapshot) {
      return;
    }

    await clickCanvasPoint(page, snapshot.targets[0]);
    await page.waitForTimeout(180);
  }

  await expect(page.getByTestId('completion-content')).toBeVisible({ timeout: 15000 });
}

test.describe('Super Student feature journeys', () => {
  test('boots with warm welcome messaging and supports reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoWelcome(page);

    await expect(page.getByTestId('welcome-tagline')).toContainText(/superstar learners|bright new challenge|cozy learning adventure/i);
    await expect(page.getByText(/choose the display that fits your classroom best/i)).toBeVisible();
  });

  test('choosing a display mode persists the setting and opens the level menu', async ({ page }) => {
    await enterMenuFromWelcome(page, 'qboard');

    const storedMode = await page.evaluate(() => localStorage.getItem('displayMode'));
    expect(storedMode).toBe('QBOARD');
    await expect(page.getByTestId('progress-banner')).toContainText(/0% complete/i);
  });

  test('debug mode exposes monitoring hooks without runtime errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await enableE2EMode(page);
    await page.goto('/?debug=1&e2e=1');
    await page.waitForTimeout(500);

    const hooks = await page.evaluate(() => ({
      tracker: Boolean(window.__superStudentEventTracker),
      runtime: Boolean(window.__superStudentRuntime),
      e2e: window.__superStudentRuntime?.isE2EMode?.() || false
    }));

    expect(hooks).toEqual({ tracker: true, runtime: true, e2e: true });
    expect(pageErrors).toEqual([]);
  });

  for (const level of LEVELS) {
    test(`${level.label} level supports launch, representative play, and return to menu`, async ({ page }) => {
      test.slow();
      await enterMenuFromWelcome(page);
      await startLevelFromMenu(page, level.name);
      await completeLevelByPlaying(page, level.name === 'colors' ? 6 : 8);

      await expect(page.getByTestId('completion-title')).toContainText(/you did it|nice job|great effort/i);
      await page.getByTestId('completion-menu').click();
      await expect(page.getByTestId('level-menu')).toBeVisible();
      await expect(page.getByTestId('level-card-' + level.name)).toBeVisible();
    });
  }

  test('completion actions let players restart the same level', async ({ page }) => {
    await enterMenuFromWelcome(page);
    await startLevelFromMenu(page, 'colors');
    await completeLevelByPlaying(page, 6);

    await page.getByTestId('completion-restart').click();
    await waitForRuntimeState(page, (snapshot) => snapshot.gameState === 'playing' && snapshot.currentLevelName === 'colors');
  });

  test('completion actions can move to the next level', async ({ page }) => {
    await enterMenuFromWelcome(page);
    await startLevelFromMenu(page, 'colors');
    await completeLevelByPlaying(page, 6);

    await page.getByTestId('completion-next').click();
    await waitForRuntimeState(page, (snapshot) => snapshot.gameState === 'playing' && snapshot.currentLevelName === 'shapes');
  });
});
