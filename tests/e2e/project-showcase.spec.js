import { expect, test } from '@playwright/test';

test('five featured projects use the planned order, highlights, and real previews', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.project-panel');
  await expect(cards).toHaveCount(5);
  expect(await cards.locator('h2').allTextContents()).toEqual([
    'Sentrix', 'Forkcast', 'Arawan', 'Tindahan', 'My Notes',
  ]);
  await expect(page.getByText('Pokéfinder')).toHaveCount(0);

  const previews = cards.locator('.project-preview img');
  for (const preview of await previews.all()) {
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveClass(/decoded/);
  }
  expect(await previews.evaluateAll(images => images.map(image => image.naturalWidth > 0))).toEqual([
    true, true, true, true, true,
  ]);

  const chipSymbols = await cards.locator('.project-tech .tech-symbol').allTextContents();
  expect(chipSymbols).not.toContain('◇');
  const arawanCard = cards.filter({ hasText: 'Arawan' });
  expect(await arawanCard.locator('.project-tech li').allTextContents()).toEqual([
    '△Nuxt 4', '⚡Supabase', '⬡PWA',
  ]);

  await page.getByRole('button', { name: 'Open Arawan project details' }).click();
  const arawan = page.getByRole('dialog', { name: 'Arawan', exact: true });
  await expect(arawan.getByText(/Payment corrections are preserved as reversals/)).toBeVisible();
  await expect(arawan.locator('.gallery-stage img')).toHaveAttribute('src', '/images/arawan/overview.jpg');
  await page.getByRole('button', { name: 'Next project', exact: true }).click();
  const tindahan = page.getByRole('dialog', { name: 'Tindahan', exact: true });
  await expect(tindahan.getByText(/weekly physical counts/)).toBeVisible();
  await expect(tindahan.locator('.gallery-stage img')).toHaveAttribute('src', '/images/tindahan/today.jpg');
});
