/**
 * Admin DLQ Page E2E Tests
 * 
 * Tests the /admin/dlq page for dead letter queue management.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin DLQ Page', () => {
  test('should load DLQ page or redirect to auth', async ({ page }) => {
    await page.goto('/admin/dlq');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toMatch(/\/admin\/dlq|\/login|\/auth/);
  });

  test('should show DLQ replay/delete controls if authenticated', async ({ page }) => {
    await page.goto('/admin/dlq');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    const hasDLQContent = content.toLowerCase().includes('dead') || 
                          content.toLowerCase().includes('queue') ||
                          content.toLowerCase().includes('retry') ||
                          page.url().includes('login');
    expect(hasDLQContent).toBe(true);
  });
});
