import { expect, test } from '@playwright/test';

const linkedInUrl = 'https://www.linkedin.com/in/czedrix-barcena/';
const reportShots = process.env.REPORT_SHOTS;

test('contact panel exposes LinkedIn and the experience card opens its tray except for the CV link', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const experiencePanel = page.locator('.experience-panel');
  const contactPanel = page.locator('.contact-panel');
  await expect(experiencePanel).toBeVisible({ timeout: 30_000 });
  await expect(contactPanel).toBeVisible({ timeout: 30_000 });
  if (reportShots) {
    const baselineStyle = await page.addStyleTag({ content: `
      .contact-actions { display:flex; gap:10px; }
      .contact-actions a { padding:11px 9px; }
      .contact-actions a:nth-child(3) { display:none; }
      .experience-open { position:relative; display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:12px; padding:11px 0 0; border:0; border-top:1px solid #ffffff22; border-radius:0; }
      .experience-open-label { position:static; padding:0; border:0; }
      .experience-open .round-arrow { position:static; }
    ` });
    await experiencePanel.screenshot({ path: `${reportShots}/experience-before.png` });
    await contactPanel.screenshot({ path: `${reportShots}/contact-before.png` });
    await baselineStyle.evaluate((element) => element.remove());
  }

  const linkedIn = contactPanel.getByRole('link', { name: 'LinkedIn ↗', exact: true });
  await expect(linkedIn).toHaveAttribute('href', linkedInUrl);
  await expect(linkedIn).toHaveAttribute('target', '_blank');
  await expect(linkedIn).toHaveAttribute('rel', 'noopener');

  const cv = experiencePanel.getByRole('link', { name: 'View full CV ↗', exact: true });
  await expect(cv).toHaveAttribute('href', '/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf');

  const headingBox = await experiencePanel.getByRole('heading', { name: 'Work experience', exact: true }).boundingBox();
  await page.mouse.click(headingBox.x + headingBox.width / 2, headingBox.y + headingBox.height / 2);
  const tray = page.getByRole('dialog', { name: 'Experience', exact: true });
  await expect(tray).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tray).toBeHidden();
  await expect(experiencePanel.getByRole('button', { name: 'Open work experience details' })).toBeFocused();

  if (reportShots) {
    await experiencePanel.screenshot({ path: `${reportShots}/experience-after.png` });
    await contactPanel.screenshot({ path: `${reportShots}/contact-after.png` });
  }
});
