/**
 * Admin Devices Page E2E Tests
 * 
 * Tests the /admin/devices page for device management.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Devices Page', () => {
  test('should load devices page or redirect to auth', async ({ page }) => {
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toMatch(/\/admin\/devices|\/login|\/auth/);
  });

  test('should show device UI elements if authenticated', async ({ page }) => {
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    const hasDeviceContent = content.toLowerCase().includes('device') || 
                             content.toLowerCase().includes('registry') ||
                             page.url().includes('login');
    expect(hasDeviceContent).toBe(true);
  });
});
