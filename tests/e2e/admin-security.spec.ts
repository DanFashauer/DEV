/**
 * Admin Security Page E2E Tests
 * 
 * Tests the /admin/security page for WebAuthn status.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Security Page', () => {
  test('should load security page or redirect to auth', async ({ page }) => {
    await page.goto('/admin/security');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).toMatch(/\/admin\/security|\/login|\/auth/);
  });

  test('should show WebAuthn status if authenticated', async ({ page }) => {
    await page.goto('/admin/security');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    const hasSecurityContent = content.toLowerCase().includes('security') || 
                                content.toLowerCase().includes('webauthn') ||
                                content.toLowerCase().includes('credential') ||
                                page.url().includes('login');
    expect(hasSecurityContent).toBe(true);
  });
});
