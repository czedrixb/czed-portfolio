import { test, expect } from '@playwright/test';

test('support panels stay compact and contact links remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const tools = page.locator('.technologies-panel');
  const contact = page.locator('.contact-panel');
  const experience = page.locator('.experience-panel');
  await expect(tools).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const t = await tools.boundingBox(), c = await contact.boundingBox(), e = await experience.boundingBox();
  // The reference composition uses one right rail: experience aligns with the
  // top project row, then Tools I use and Let's talk stack below it.
  expect(e.y).toBeLessThan(t.y);
  expect(t.x).toBe(c.x);
  expect(c.y).toBeGreaterThan(t.y + t.height - 2);
  expect(Math.abs(t.x - e.x)).toBeLessThan(2);
  // Neither support panel should carry more than a little slack under its content.
  const toolsContentHeight = await tools.evaluate(el => el.scrollHeight);
  const contactContentHeight = await contact.evaluate(el => el.scrollHeight);
  expect(t.height - toolsContentHeight).toBeLessThan(40);
  expect(c.height - contactContentHeight).toBeLessThan(40);
  const gridWidth = await page.locator('.bento-grid').evaluate(el => el.getBoundingClientRect().width);
  expect(e.width / gridWidth).toBeLessThan(0.25);
  const gap = await page.evaluate(() => {
    const cv = document.querySelector('.experience-panel .cv-link').getBoundingClientRect();
    const label = document.querySelector('.experience-open-label').getBoundingClientRect();
    return label.top - cv.bottom;
  });
  expect(gap).toBeGreaterThanOrEqual(0); // no overlap between the CV link and the footer label
  expect(gap).toBeLessThan(25); // no leftover dead space pooling above the footer
  await expect(contact.getByRole('link', {name:'Start a conversation by email'})).toHaveAttribute('href','mailto:czedrixb@gmail.com');
  for (const width of [1100, 768, 390]) {
    await page.setViewportSize({width,height:900});
    if (width >= 981) {
      // Regression check for the 981-1250px breakpoint, which used to clip the
      // experience panel's bottom padding and let the footer overlap the CV link.
      const gapAtWidth = await page.evaluate(() => {
        const cv = document.querySelector('.experience-panel .cv-link').getBoundingClientRect();
        const label = document.querySelector('.experience-open-label').getBoundingClientRect();
        return label.top - cv.bottom;
      });
      expect(gapAtWidth).toBeGreaterThanOrEqual(0);
      continue;
    }
    await expect(contact.getByRole('link', {name:'GitHub'})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const panel of [tools, contact]) expect(await panel.evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  }
});
