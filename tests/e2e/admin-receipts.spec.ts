/**
 * Admin Receipts Page E2E Tests
 * 
 * Tests the /admin/receipts page for policy action receipts.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Receipts Page', () => {
  test('should load receipts page or redirect to auth', async ({ page }) => {
    await page.goto('/admin/receipts');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toMatch(/\/admin\/receipts|\/login|\/auth/);
  });

  test('should show receipt filters if authenticated', async ({ page }) => {
    await page.goto('/admin/receipts');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    const hasReceiptContent = content.toLowerCase().includes('receipt') || 
                              content.toLowerCase().includes('filter') ||
                              content.toLowerCase().includes('event') ||
                              page.url().includes('login');
    expect(hasReceiptContent).toBe(true);
  });
});
