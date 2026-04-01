import { expect, test } from '@playwright/test';

test('home to detail to complete', async ({ page }) => {
  await page.goto('/');

  const openDetailsButton = page.getByRole('button', { name: /prepare for watch handover.*상세/i });

  await expect(openDetailsButton).toBeVisible();
  await openDetailsButton.click();

  const detailDialog = page.getByRole('dialog', { name: /업무 상세/i });

  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByRole('heading', { name: 'Prepare for watch handover' })).toBeVisible();
  await detailDialog.getByRole('button', { name: /업무 완료/i }).click();

  const recentCompletions = page.locator('section').filter({ has: page.getByRole('heading', { name: /최근 완료 기록/i }) });

  await expect(recentCompletions).toBeVisible();
  await expect(recentCompletions.getByText('Prepare for watch handover')).toBeVisible();
});
