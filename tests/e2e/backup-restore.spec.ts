import { expect, test } from '@playwright/test';

test('backup export and import restores note content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /log 메모/i }).click();

  await page.getByPlaceholder('제목').first().fill('Backup anchor note');
  await page.getByPlaceholder('자유 브릿지 메모 입력').fill('This note should come back after restore.');
  await page.getByRole('button', { name: /자유 메모 저장/i }).click();
  await expect(page.getByText('Backup anchor note')).toBeVisible();

  await page.getByRole('link', { name: /cfg 설정/i }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /백업 json 내보내기/i }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  expect(backupPath).not.toBeNull();

  await page.getByRole('link', { name: /log 메모/i }).click();
  await page.getByPlaceholder('제목').first().fill('Temporary note');
  await page.getByPlaceholder('자유 브릿지 메모 입력').fill('This note should disappear after restore.');
  await page.getByRole('button', { name: /자유 메모 저장/i }).click();
  await expect(page.getByText('Temporary note')).toBeVisible();

  await page.getByRole('link', { name: /cfg 설정/i }).click();
  await page.getByLabel('백업 JSON 가져오기').setInputFiles(backupPath!);
  await expect(page.getByRole('status')).toContainText(/백업을 불러왔습니다/i);

  await page.getByRole('link', { name: /log 메모/i }).click();
  await page.reload();

  await expect(page.getByText('Backup anchor note')).toBeVisible();
  await expect(page.getByText('Temporary note')).toHaveCount(0);
});
