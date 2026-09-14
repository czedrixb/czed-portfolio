import { expect, test } from '@playwright/test';

const open = (page, name) => page.getByRole('button', { name: 'Open ' + name + ' project details' });
const shot = (tray, n) => tray.getByRole('button', { name: 'Show screenshot ' + n, exact: true });
// Real-time waits, not page.clock: Playwright's fake clock also freezes
// requestAnimationFrame/rAF-driven hydration and stalls the app before the
// tray can even open, so these wait out the real 4.5s autoplay interval.
const PAST_ONE_INTERVAL = 4900;

// Sentrix has 5 gallery images, so it exercises auto-advance without wrapping
// back to screenshot 1 inside the wait below.
test('project gallery auto-advances with a fade, and stops once a screenshot is picked manually', async ({ page }) => {
  await page.goto('/');
  await open(page, 'Sentrix').click();
  const tray = page.getByRole('dialog', { name: 'Sentrix', exact: true });
  await expect(tray).toBeVisible();
  await expect(shot(tray, 1)).toHaveAttribute('aria-pressed', 'true');

  // Past one autoplay interval, the stage should have moved on by itself.
  await page.waitForTimeout(PAST_ONE_INTERVAL);
  await expect(shot(tray, 2)).toHaveAttribute('aria-pressed', 'true');
  await expect(tray.locator('.gallery-stage img')).toHaveClass(/decoded/);
  await expect(tray.locator('.gallery-stage img')).toHaveCSS('opacity', '1');

  // Picking a screenshot by hand takes over and autoplay does not resume.
  await shot(tray, 4).click();
  await expect(shot(tray, 4)).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(PAST_ONE_INTERVAL);
  await expect(shot(tray, 4)).toHaveAttribute('aria-pressed', 'true');
});

test('opening the fullscreen viewer pauses autoplay', async ({ page }) => {
  await page.goto('/');
  await open(page, 'Sentrix').click();
  const tray = page.getByRole('dialog', { name: 'Sentrix', exact: true });
  await tray.getByRole('button', { name: 'Expand project image' }).click();
  await expect(page.getByRole('dialog', { name: 'Expanded project image' })).toBeVisible();
  await page.waitForTimeout(PAST_ONE_INTERVAL);
  // Still on screenshot 1: the timer must not advance the gallery underneath
  // an open viewer.
  await expect(shot(tray, 1)).toHaveAttribute('aria-pressed', 'true');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('gallery does not autoplay', async ({ page }) => {
    await page.goto('/');
    await open(page, 'Sentrix').click();
    const tray = page.getByRole('dialog', { name: 'Sentrix', exact: true });
    await expect(tray).toBeVisible();
    await page.waitForTimeout(PAST_ONE_INTERVAL);
    await expect(shot(tray, 1)).toHaveAttribute('aria-pressed', 'true');
  });
});
