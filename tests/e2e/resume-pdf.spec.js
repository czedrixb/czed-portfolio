import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const resumePath = '/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf';
const expectedSha256 = '103616ba17b27910f04679da885f496830794a81114921dceeaec34cb81843a3';
const reportDir = process.env.RESUME_REPORT_DIR;
const phase = process.env.RESUME_PHASE || 'after';

test('portfolio CV links serve the updated resume PDF', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const cvLinks = page.getByRole('link', { name: /View (my|full) CV/ });
  await expect(cvLinks).toHaveCount(2);
  for (const link of await cvLinks.all()) {
    await expect(link).toHaveAttribute('href', resumePath);
    await expect(link).toHaveAttribute('target', '_blank');
  }

  const response = await request.get(resumePath);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const body = await response.body();
  expect(body.subarray(0, 5).toString()).toBe('%PDF-');

  if (phase === 'after') {
    expect(createHash('sha256').update(body).digest('hex')).toBe(expectedSha256);
  }

  if (reportDir) {
    mkdirSync(reportDir, { recursive: true });
    await page.locator('.experience-panel').screenshot({
      path: `${reportDir}/resume-link-${phase}.png`,
    });
  }
});
