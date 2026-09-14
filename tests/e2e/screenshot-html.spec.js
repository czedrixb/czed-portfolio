import {test, expect} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

test('screenshot showcase opens offline with every image embedded', async ({page, context}) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve('docs/project-screenshots.html')).href);
  await expect(page.getByRole('heading', {name:'Portfolio screenshot showcase', exact:true})).toBeVisible();
  const images = page.locator('img');
  expect(await images.count()).toBeGreaterThan(10);
  for (const img of await images.all()) {
    await expect(img).toHaveAttribute('src', /^data:image\//);
    await expect.poll(() => img.evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
