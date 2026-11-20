import { expect, test } from '@playwright/test';

const parseTreasury = (raw: string | null): number => {
  if (!raw) return NaN;
  return Number(raw.replace(/[^0-9.-]/g, ''));
};

test('start -> build road & house -> budget/services/graphics/photo UI -> reload persists city', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');

  const startBtn = page.getByRole('button', { name: /initialize simulation/i });
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  const treasury = page.getByTestId('treasury-value');
  await expect(treasury).toBeVisible();
  await expect(page.getByText(/City Advisor/i)).toBeVisible();
  await expect(page.getByText(/Goal:/i)).toBeVisible();
  await expect(page.getByTestId('milestone-badge')).toHaveText(/village/i);
  await expect(page.getByLabel('RCI demand bars')).toBeVisible();
  await expect(page.getByTestId('fps-counter')).toBeVisible();
  await expect(page.getByRole('button', { name: /^services$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /\bfire\b/i })).toBeDisabled();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  // Wait for lazy IsoMap chunk + initial WebGL frame & raycast setup
  await page.waitForTimeout(1200);

  const initialSave = await page.evaluate(() => {
    const raw = window.localStorage.getItem('cityverse_save_v1');
    return raw ? JSON.parse(raw) : null;
  });
  expect(initialSave).not.toBeNull();

  // Tile (3, 7) is empty land adjacent to pre-built road at (4, 7)
  await page.mouse.move(513, 280);
  await page.waitForTimeout(80);
  await page.mouse.click(513, 280);

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = window.localStorage.getItem('cityverse_save_v1');
        return raw ? JSON.parse(raw).grid?.[7]?.[3]?.buildingType : null;
      });
    }, { timeout: 5000 })
    .toBe('Road');

  const treasuryAfterRoad = parseTreasury(await treasury.textContent());

  // Select House tool and build on (3, 6), adjacent to the new road at (3, 7)
  await page.getByRole('button', { name: /house/i }).click();
  await page.mouse.move(545, 261);
  await page.waitForTimeout(80);
  await page.mouse.click(545, 261);

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = window.localStorage.getItem('cityverse_save_v1');
        return raw ? JSON.parse(raw).grid?.[6]?.[3]?.buildingType : null;
      });
    }, { timeout: 5000 })
    .toBe('Residential');

  await expect
    .poll(async () => parseTreasury(await treasury.textContent()), {
      timeout: 5000,
    })
    .toBeLessThan(treasuryAfterRoad);

  // Undo reverts house placement, Redo restores it
  await page.getByRole('button', { name: /^undo$/i }).click();
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = window.localStorage.getItem('cityverse_save_v1');
        return raw ? JSON.parse(raw).grid?.[6]?.[3]?.buildingType : null;
      });
    }, { timeout: 5000 })
    .toBe('None');

  await page.getByRole('button', { name: /^redo$/i }).click();
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = window.localStorage.getItem('cityverse_save_v1');
        return raw ? JSON.parse(raw).grid?.[6]?.[3]?.buildingType : null;
      });
    }, { timeout: 5000 })
    .toBe('Residential');

  // Keyboard hotkeys: Space toggles Pause badge, R & 2 switch tools without error
  await page.keyboard.press('Space');
  await expect(page.getByText(/^paused$/i)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByText(/^paused$/i)).toBeHidden();
  await page.keyboard.press('r');
  await page.keyboard.press('2');

  // Locale toggle switches HUD to Turkish and back to English
  await page.getByTestId('lang-toggle').click();
  await expect(page.getByText(/^Hazine$/)).toBeVisible();
  await expect(page.getByTestId('milestone-badge')).toHaveText(/köy/i);
  await page.getByTestId('lang-toggle').click();
  await expect(page.getByText(/^Treasury$/)).toBeVisible();

  // Switch graphics preset to Low
  await page.getByRole('button', { name: /^low$/i }).click();

  // Photo mode hides HUD and exits cleanly
  await page.getByRole('button', { name: /photo mode/i }).click();
  await expect(page.getByRole('button', { name: /exit photo mode/i })).toBeVisible();
  await expect(treasury).toBeHidden();
  await page.getByRole('button', { name: /exit photo mode/i }).click();
  await expect(treasury).toBeVisible();

  // Q/E camera rotation keys run without error
  await page.keyboard.press('q');
  await page.keyboard.press('e');

  // Open budget panel, inspect map expansion card & adjust tax rate
  await page.getByRole('button', { name: /budget/i }).click();
  await expect(page.getByTestId('budget-panel')).toBeVisible();
  await expect(page.getByText(/15×15/)).toBeVisible();
  await expect(page.getByRole('button', { name: /expand land/i })).toBeVisible();
  const taxSlider = page.locator('#tax-slider');
  await expect(taxSlider).toHaveValue('9');
  await taxSlider.fill('12');
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = window.localStorage.getItem('cityverse_save_v1');
        return raw ? JSON.parse(raw).stats?.taxRate : null;
      });
    }, { timeout: 5000 })
    .toBe(12);
  await page.getByRole('button', { name: /close budget/i }).click();

  // Switch to services data overlay
  await page.getByRole('button', { name: /^services$/i }).click();
  await expect(
    page.getByText(/build tools disabled while data overlay is active/i),
  ).toBeVisible();

  // Verify mute toggle writes preference
  const muteBtn = page.getByRole('button', { name: /mute audio/i });
  await muteBtn.click();
  const mutedValue = await page.evaluate(() =>
    window.localStorage.getItem('cityverse_muted'),
  );
  expect(mutedValue).toBe('true');

  // Reload and continue saved city
  await page.reload();
  const continueBtn = page.getByRole('button', { name: /continue city/i });
  await expect(continueBtn).toBeVisible();
  await continueBtn.click();

  await expect(treasury).toBeVisible();
  const savedCheck = await page.evaluate(() => {
    const raw = window.localStorage.getItem('cityverse_save_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      road: parsed.grid?.[7]?.[3]?.buildingType,
      house: parsed.grid?.[6]?.[3]?.buildingType,
      taxRate: parsed.stats?.taxRate,
    };
  });
  expect(savedCheck).toEqual({ road: 'Road', house: 'Residential', taxRate: 12 });
  expect(pageErrors).toEqual([]);
});
