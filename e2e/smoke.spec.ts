import { test, expect } from '@playwright/test';

test('deck shell is Polish', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
});
