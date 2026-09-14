import { expect, test } from '@playwright/test';

test.use({ screenshot: 'off' });

test.describe('glass theme and gradient waves', () => {
  test('follows the system theme, toggles smoothly, and persists the choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('portfolio-theme'));
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toggle).toBeVisible();

    const lightGlass = await page.locator('.intro-panel').evaluate(element => {
      const style = getComputedStyle(element);
      return {
        backdrop: style.backdropFilter || style.webkitBackdropFilter,
        background: style.backgroundColor,
        transition: style.transitionDuration,
        themeDuration: getComputedStyle(document.documentElement).getPropertyValue('--theme-duration').trim(),
        reducesMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    });
    const reducesTransparency = await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches);
    if (reducesTransparency) expect(lightGlass.backdrop).toBe('none');
    else expect(lightGlass.backdrop).toContain('blur');
    expect(lightGlass.background).not.toBe('rgb(23, 24, 23)');
    expect(lightGlass.themeDuration).toBe('440ms');
    if (lightGlass.reducesMotion) expect(lightGlass.transition).toBe('0s');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  });

  test('renders the wave layer and preserves the project tray motion path', async ({ page }) => {
    await page.goto('/');
    const waves = page.locator('.gradient-waves');
    await expect(waves).toBeAttached();
    await expect.poll(() => waves.getAttribute('data-rendering')).toMatch(/active|fallback/);

    const trigger = page.getByRole('button', { name: 'Open Sentrix project details' });
    await expect(trigger).toBeEnabled();
    await trigger.evaluate(button => button.click());
    const tray = page.getByRole('dialog', { name: 'Sentrix', exact: true });
    await expect(tray).toBeVisible();
    const openingFrames = await tray.evaluate(element => element.getAnimations()[0]?.effect?.getKeyframes() || []);
    expect(openingFrames.length).toBe(2);
    expect(openingFrames[0].transform).not.toBe(openingFrames[1].transform);
    const trayMaterial = await tray.evaluate(element => ({
      backdrop: getComputedStyle(element).backdropFilter,
      reducesTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches,
    }));
    if (trayMaterial.reducesTransparency) expect(trayMaterial.backdrop).toBe('none');
    else expect(trayMaterial.backdrop).toContain('blur');

    await page.keyboard.press('Escape');
    await expect(tray).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('uses stable reduced-motion states without mobile overflow', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('.gradient-waves')).toHaveAttribute('data-rendering', 'static');
    await expect(page.locator('.reveal-panel').first()).toHaveCSS('animation-name', 'none');
    const overflow = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      elements: [...document.querySelectorAll('body *')].filter(element => {
        const rect = element.getBoundingClientRect();
        if (rect.right <= innerWidth + 1 && rect.left >= -1) return false;
        // An element intentionally larger than an ancestor with overflow
        // hidden (e.g. the oversized crop source image in .reference-character)
        // is clipped before it can cause real page-level scroll overflow.
        for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
          const { overflowX, overflowY } = getComputedStyle(ancestor);
          if (overflowX === 'hidden' || overflowY === 'hidden') return false;
        }
        return true;
      }).slice(0, 8).map(element => ({ className: element.className, tag: element.tagName, rect: element.getBoundingClientRect().toJSON() })),
    }));
    expect(overflow).toEqual({ pageWidth: 390, viewportWidth: 390, elements: [] });

    const trigger = page.getByRole('button', { name: 'Open Sentrix project details' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const tray = page.getByRole('dialog', { name: 'Sentrix', exact: true });
    await expect(tray).toBeVisible();
    expect(await tray.evaluate(element => element.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(tray).toBeHidden();
  });
});
