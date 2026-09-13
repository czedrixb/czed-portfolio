import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
test.use({ viewport: { width: 1440, height: 1000 } });
test('intro character uses the original reference artwork', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('.intro-panel');
  await expect(page.getByRole('button', { name: 'Open Sentrix project details' })).toBeEnabled();
  if (process.env.CHARACTER_BASELINE === '1') {
    mkdirSync('docs/verification', { recursive: true });
    await page.screenshot({ path: 'docs/verification/character-before.png', clip: await intro.boundingBox() });
    return;
  }
  const image = intro.locator('.reference-character img');
  await expect(image).toHaveAttribute('src', '/images/homepage-character-reference.png');
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(intro.getByRole('link', { name: 'View my CV ↗' })).toBeVisible();
  mkdirSync('docs/verification', { recursive: true });
  await page.screenshot({ path: 'docs/verification/character-after.png', clip: await intro.boundingBox() });
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await intro.locator('.reference-character').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
});
