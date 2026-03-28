import { expect, test } from '@playwright/test';

test('home to detail to complete', async ({ page }) => {
  await page.goto('/');

  const openDetailsButton = page.getByRole('button', { name: /open details for prepare for watch handover/i });

  await expect(openDetailsButton).toBeVisible();
  await openDetailsButton.click();

  const detailDialog = page.getByRole('dialog', { name: /task details/i });

  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByRole('heading', { name: 'Prepare for watch handover' })).toBeVisible();
  await detailDialog.getByRole('button', { name: /complete task/i }).click();

  const recentCompletions = page.locator('section').filter({ has: page.getByRole('heading', { name: /recent completions/i }) });

  await expect(recentCompletions).toBeVisible();
  await expect(recentCompletions.getByText('Prepare for watch handover')).toBeVisible();
});
