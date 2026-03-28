import { expect, test } from '@playwright/test';

test('backup export and import restores note content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /notes/i }).click();

  await page.getByPlaceholder('Title').first().fill('Backup anchor note');
  await page.getByPlaceholder('Write a free bridge note').fill('This note should come back after restore.');
  await page.getByRole('button', { name: /save free note/i }).click();
  await expect(page.getByText('Backup anchor note')).toBeVisible();

  await page.getByRole('link', { name: /settings/i }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export backup json/i }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  expect(backupPath).not.toBeNull();

  await page.getByRole('link', { name: /notes/i }).click();
  await page.getByPlaceholder('Title').first().fill('Temporary note');
  await page.getByPlaceholder('Write a free bridge note').fill('This note should disappear after restore.');
  await page.getByRole('button', { name: /save free note/i }).click();
  await expect(page.getByText('Temporary note')).toBeVisible();

  await page.getByRole('link', { name: /settings/i }).click();
  await page.getByLabel('Import backup JSON').setInputFiles(backupPath!);
  await expect(page.getByRole('status')).toContainText(/imported backup/i);

  await page.getByRole('link', { name: /notes/i }).click();
  await page.reload();

  await expect(page.getByText('Backup anchor note')).toBeVisible();
  await expect(page.getByText('Temporary note')).toHaveCount(0);
});
