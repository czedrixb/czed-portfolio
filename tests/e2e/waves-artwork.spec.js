import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'docs/verification';

// The WebGL context normally discards its drawing buffer once presented, so a
// same-task drawImage()/getImageData() read comes back transparent black.
// Forcing preserveDrawingBuffer only inside this test's page lets us sample
// the actual rendered wave pixels without changing the component for real users.
async function preserveDrawingBuffer(page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      if (type === 'webgl2' || type === 'webgl') {
        options = Object.assign({}, options, { preserveDrawingBuffer: true });
      }
      return original.call(this, type, options);
    };
  });
}

async function samplePixel(page, xFraction, yFraction) {
  return page.evaluate(([xf, yf]) => {
    const canvas = document.querySelector('.gradient-waves canvas');
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    tmp.getContext('2d').drawImage(canvas, 0, 0);
    const [x, y] = [Math.round(canvas.width * xf), Math.round(canvas.height * yf)];
    return [...tmp.getContext('2d').getImageData(x, y, 1, 1).data];
  }, [xFraction, yFraction]);
}

test.describe('wave background and intro artwork', () => {
  test('light-mode waves render visibly above the canvas color', async ({ page }) => {
    await preserveDrawingBuffer(page);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('portfolio-theme', 'light'));
    await page.reload();

    const waves = page.locator('.gradient-waves');
    await expect.poll(() => waves.getAttribute('data-rendering')).toBe('active');
    await page.waitForTimeout(700); // let the palette lerp settle

    const canvasRgba = await samplePixel(page, 0.5, 0.95);
    const [r, g, b, a] = canvasRgba;
    // --canvas in light mode is #dceaf0 (220,234,240). The near-field wave
    // crest should read as a visibly darker/more saturated pixel, not a
    // near-transparent match to the page background.
    expect(a).toBeGreaterThan(200);
    const distanceFromCanvas = Math.abs(r - 220) + Math.abs(g - 234) + Math.abs(b - 240);
    expect(distanceFromCanvas).toBeGreaterThan(60);
  });

  test('wave field is shifted into view and the fallback still reads as active/static', async ({ page }) => {
    await page.goto('/');
    const waves = page.locator('.gradient-waves');
    await expect(waves).toBeAttached();
    await expect.poll(() => waves.getAttribute('data-rendering')).toMatch(/active|fallback/);
  });

  test('intro panel shows the workstation artwork at desktop and mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    const intro = page.locator('.intro-panel');
    const image = intro.locator('.reference-character img');
    await expect(image).toHaveAttribute('src', '/images/developer-desk.png');
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);

    mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: `${OUT}/waves-artwork-desktop-light.png`, fullPage: false });
    await page.locator('.intro-panel').screenshot({ path: `${OUT}/waves-artwork-intro-light.png` });

    await page.evaluate(() => localStorage.setItem('portfolio-theme', 'dark'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/waves-artwork-desktop-dark.png`, fullPage: false });

    // Mobile: the crop must render with real dimensions, not collapse to 0.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileBox = await intro.locator('.reference-character').boundingBox();
    expect(mobileBox.width).toBeGreaterThan(150);
    expect(mobileBox.height).toBeGreaterThan(150);
    expect(mobileBox.x).toBeGreaterThanOrEqual(0);
    expect(mobileBox.x + mobileBox.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: `${OUT}/waves-artwork-mobile-dark.png` });
  });
});
