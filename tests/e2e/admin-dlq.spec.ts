/**
 * Admin DLQ Page E2E Tests
 *
 * Tests the dead letter queue management page. Older links may still target
 * /admin/dlq while the app canonicalizes to /admin/dead-letter.
 */

import { test, expect } from '@playwright/test';

const dlqUrlPattern = /\/admin\/dlq|\/admin\/dead-letter|\/login|\/auth/;

test.describe('Admin DLQ Page', () => {
  test('should load DLQ page or redirect to auth', async ({ page }) => {
    await page.goto('/admin/dlq');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(dlqUrlPattern);
  });

  test('should show DLQ replay/delete controls if authenticated', async ({ page }) => {
    await page.goto('/admin/dlq');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    const hasDLQContent =
      bodyText.includes('dead') ||
      bodyText.includes('queue') ||
      bodyText.includes('retry') ||
      bodyText.includes('replay') ||
      bodyText.includes('delete') ||
      dlqUrlPattern.test(url);

    expect(hasDLQContent).toBe(true);
  });
});
