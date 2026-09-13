import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
test('capture current homepage before reference correction', async ({ page }) => {
  test.skip(process.env.CAPTURE_REFERENCE_BASELINE !== '1', 'Explicit baseline capture only; do not overwrite the prior state.');
  await page.goto('/');
  mkdirSync('docs/verification', { recursive: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/verification/homepage-before.png', fullPage: true });
});
