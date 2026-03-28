import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });
}

test('app reloads offline after first online visit and keeps offline data', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /notes/i }).click();

  await page.getByPlaceholder('Title').first().fill('Offline anchor note');
  await page.getByPlaceholder('Write a free bridge note').fill('Saved before going offline.');
  await page.getByRole('button', { name: /save free note/i }).click();
  await expect(page.getByText('Offline anchor note')).toBeVisible();

  await page.reload();
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('link', { name: /notes/i })).toBeVisible();
  await expect(page.getByText('Offline anchor note')).toBeVisible();
});
