import { expect, test } from '@playwright/test';

const projectButton = (page) => page.getByRole('button', { name: 'Open Sentrix project details' });
const tray = (page) => page.getByRole('dialog', { name: 'Sentrix', exact: true });

async function captureClosingFrame(page, path) {
  await page.keyboard.press('Escape');
  await tray(page).evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = Number(animation.effect.getTiming().duration) * 0.55;
  });
  await page.screenshot({ path, animations: 'allow' });
}

async function expectScrollReleased(page) {
  await expect.poll(() => page.evaluate(() => ({
    overflow: document.documentElement.style.overflow,
    modalOpen: document.body.classList.contains('modal-open'),
    inert: document.querySelector('.site-frame')?.hasAttribute('inert')
  }))).toEqual({ overflow: '', modalOpen: false, inert: false });
}

test.describe('iOS-style project panel motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('animates the real tray from its card without moving the page', async ({ page }) => {
    await page.goto('/');
    await expect(projectButton(page)).toBeVisible();
    await expect(projectButton(page)).toBeEnabled();
    await page.evaluate(() => window.scrollTo(0, 120));
    const before = await page.evaluate(() => {
      const rect = document.querySelector('.portfolio-shell').getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, scrollY };
    });

    await projectButton(page).evaluate((button) => button.click());
    await expect(tray(page)).toBeVisible();

    const state = await page.evaluate(() => {
      const modal = document.querySelector('.project-tray');
      const animations = modal.getAnimations();
      const frames = animations[0]?.effect?.getKeyframes() || [];
      const unexpectedMorphs = [...document.body.children].filter((element) => {
        if (element.matches('#__nuxt, script')) return false;
        const style = getComputedStyle(element);
        return style.position === 'fixed' && !element.classList.contains('overlay');
      });
      const rect = document.querySelector('.portfolio-shell').getBoundingClientRect();
      return {
        frameCount: frames.length,
        startsSpatially: frames[0]?.transform !== frames.at(-1)?.transform,
        unexpectedMorphCount: unexpectedMorphs.length,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        scrollY,
        locked: document.documentElement.style.overflow === 'hidden'
      };
    });

    expect(state.frameCount).toBeGreaterThanOrEqual(2);
    expect(state.startsSpatially).toBe(true);
    expect(state.unexpectedMorphCount).toBe(0);
    expect(state.locked).toBe(true);
    expect({ x: state.x, y: state.y, width: state.width, scrollY: state.scrollY }).toEqual(before);

    await page.keyboard.press('Escape');
    const closingState = await tray(page).evaluate((element) => {
      const frames = element.getAnimations()[0]?.effect?.getKeyframes() || [];
      return { frameCount: frames.length, endsSpatially: frames[0]?.transform !== frames.at(-1)?.transform };
    });
    expect(closingState).toEqual({ frameCount: 2, endsSpatially: true });
    await expect(tray(page)).toBeHidden();
    await expect(projectButton(page)).toBeFocused();
    await expectScrollReleased(page);
  });

  test('closing follows a smooth reciprocal path back to the project card', async ({ page }) => {
    await page.goto('/');
    await expect(projectButton(page)).toBeVisible();
    await projectButton(page).click();
    await expect(tray(page)).toBeVisible();

    await page.keyboard.press('Escape');
    const motion = await tray(page).evaluate((element) => {
      const animation = element.getAnimations()[0];
      const frames = animation?.effect?.getKeyframes() || [];
      const timing = animation?.effect?.getTiming();
      return {
        frameCount: frames.length,
        duration: timing?.duration,
        easing: timing?.easing,
        startsExpanded: frames[0]?.transform === 'translate3d(0px, 0px, 0px) scale(1)',
        endsAtCard: frames[0]?.transform !== frames.at(-1)?.transform
      };
    });

    expect(motion).toEqual({
      frameCount: 2,
      duration: 380,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      startsExpanded: true,
      endsAtCard: true
    });
    await expect(tray(page)).toBeHidden();
    await expectScrollReleased(page);
  });

  test('captures the closing panel at a stable comparison frame', async ({ page }) => {
    test.skip(!process.env.PANEL_SCREENSHOT_PATH, 'Run only when producing the verification report');
    await page.goto('/');
    await expect(projectButton(page)).toBeVisible();
    await projectButton(page).click();
    await expect(tray(page)).toBeVisible();
    await captureClosingFrame(page, process.env.PANEL_SCREENSHOT_PATH);
  });

  test('every close path releases scroll lock and restores focus', async ({ page }) => {
    await page.goto('/');

    for (const closeWith of ['button', 'backdrop', 'escape', 'repeated escape']) {
      await projectButton(page).click();
      await expect(tray(page)).toBeVisible();

      if (closeWith === 'button') {
        await tray(page).getByRole('button', { name: 'Close project details' }).click();
      } else if (closeWith === 'backdrop') {
        await page.locator('.overlay').click({ position: { x: 5, y: 5 } });
      } else {
        await page.keyboard.press('Escape');
        if (closeWith === 'repeated escape') await page.keyboard.press('Escape');
      }

      await expect(tray(page)).toBeHidden();
      await expect(projectButton(page)).toBeFocused();
      await expectScrollReleased(page);
    }
  });
});

test('mobile panel opens and closes without shifting the background', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await projectButton(page).scrollIntoViewIfNeeded();
  await expect(projectButton(page)).toBeEnabled();
  const before = await page.locator('.portfolio-shell').boundingBox();
  await projectButton(page).evaluate((button) => button.click());
  await expect(tray(page)).toBeVisible();
  await expect(tray(page).getByRole('button', { name: 'Close project details' })).toBeInViewport();
  const during = await page.locator('.portfolio-shell').boundingBox();
  expect(during).toEqual(before);
  await tray(page).getByRole('button', { name: 'Close project details' }).click();
  await expectScrollReleased(page);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('uses an immediate centered panel without spatial animation', async ({ page }) => {
    await page.goto('/');
    await projectButton(page).click();
    await expect(tray(page)).toBeVisible();
    expect(await tray(page).evaluate((element) => element.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(tray(page)).toBeHidden();
    await expectScrollReleased(page);
  });
});
