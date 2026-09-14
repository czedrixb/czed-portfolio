import { expect, test } from '@playwright/test';

test('portfolio follows the reference bento composition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1680, height: 960 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const boxes = await page.locator('.intro-panel, .project-panel, .experience-panel, .technologies-panel, .contact-panel')
    .evaluateAll(elements => Object.fromEntries(elements.map(element => {
      const rect = element.getBoundingClientRect();
      const key = element.classList.contains('intro-panel') ? 'intro'
        : element.classList.contains('experience-panel') ? 'experience'
        : element.classList.contains('technologies-panel') ? 'tools'
        : element.classList.contains('contact-panel') ? 'contact'
        : [...element.classList].find(name => /^project-\d$/.test(name));
      return [key, { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom }];
    })));

  expect(Math.abs(boxes.intro.y - boxes['project-0'].y)).toBeLessThan(2);
  expect(Math.abs(boxes['project-0'].y - boxes['project-1'].y)).toBeLessThan(2);
  expect(Math.abs(boxes['project-1'].y - boxes.experience.y)).toBeLessThan(2);
  expect(Math.abs(boxes['project-2'].y - boxes['project-3'].y)).toBeLessThan(2);
  expect(Math.abs(boxes['project-3'].y - boxes['project-4'].y)).toBeLessThan(2);
  expect(Math.abs(boxes['project-2'].y - boxes.tools.y)).toBeLessThan(2);
  expect(Math.abs(boxes.experience.x - boxes.tools.x)).toBeLessThan(2);
  expect(Math.abs(boxes.tools.x - boxes.contact.x)).toBeLessThan(2);
  expect(Math.abs(boxes.experience.bottom - boxes['project-1'].bottom)).toBeLessThan(2);
  expect(Math.abs(boxes.contact.bottom - boxes['project-4'].bottom)).toBeLessThan(2);
  expect(boxes['project-0'].width).toBeGreaterThan(boxes.intro.width);
  expect(boxes.experience.width).toBeLessThan(boxes['project-1'].width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
