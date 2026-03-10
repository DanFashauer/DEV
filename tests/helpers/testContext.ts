/**
 * Test Context Helper
 * 
 * Provides utilities for test setup including server health checks,
 * deterministic IDs, and common configuration.
 */

import { fetch } from 'vitest';

/**
 * Default test server configuration
 */
export const TEST_CONFIG = {
  port: 3010,
  host: `http://localhost:3010`,
  healthEndpoint: '/api/health',
  maxWaitSeconds: 60,
};

/**
 * Get the server URL from environment or default
 */
export function getServerUrl(): string {
  return process.env.SERVER_URL || TEST_CONFIG.host;
}

/**
 * Wait for the server to be healthy
 * 
 * @param serverUrl - The base server URL
 * @param maxWaitSeconds - Maximum time to wait
 * @returns true if server is healthy, false otherwise
 */
export async function waitForServer(
  serverUrl: string = getServerUrl(),
  maxWaitSeconds: number = TEST_CONFIG.maxWaitSeconds
): Promise<boolean> {
  const healthUrl = `${serverUrl}${TEST_CONFIG.healthEndpoint}`;
  const startTime = Date.now();
  
  console.log(`Waiting for server health at ${healthUrl}...`);
  
  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`Server is healthy: ${JSON.stringify(data)}`);
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error(`Server did not become healthy within ${maxWaitSeconds} seconds`);
  return false;
}

/**
 * Generate a deterministic test ID
 * 
 * @param prefix - Prefix for the ID
 * @param index - Optional index for uniqueness
 * @returns Deterministic ID string
 */
export function generateTestId(prefix: string, index: number = 0): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${index}`;
}

/**
 * Get common test headers
 * 
 * @returns Headers object for test requests
 */
export function getTestHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Verify server is running before tests
 * 
 * @param serverUrl - The base server URL
 * @throws Error if server is not reachable
 */
export async function verifyServerHealth(serverUrl: string = getServerUrl()): Promise<void> {
  const healthy = await waitForServer(serverUrl);
  if (!healthy) {
    throw new Error(
      `Server not reachable at ${serverUrl}. Start with: bun run scripts/test-server.ts start`
    );
  }
}

/**
 * Test context for demo scenarios
 */
export interface DemoScenario {
  name: string;
  deviceId: string;
  badgeUid: string;
  user: string;
  riskLevel: 'low' | 'medium' | 'high';
  violations?: string[];
}

/**
 * Predefined demo scenarios
 */
export const DEMO_SCENARIOS = {
  healthcare: {
    name: 'Healthcare - Shared iPad',
    deviceId: 'iPad-Nurse-Station-01',
    badgeUid: 'badge-healthcare-001',
    user: 'jane.nurse@hospital.org',
    riskLevel: 'medium' as const,
    violations: ['device.jailbroken'],
  },
  retail: {
    name: 'Retail - Shared Tablet',
    deviceId: 'Tablet-Register-01',
    badgeUid: 'badge-retail-001',
    user: 'john.cashier@store.org',
    riskLevel: 'low' as const,
  },
  logistics: {
    name: 'Logistics - Warehouse Device',
    deviceId: 'Scanner-Warehouse-01',
    badgeUid: 'badge-logistics-001',
    user: 'mike.warehouse@logistics.org',
    riskLevel: 'medium' as const,
    violations: ['device.os_outdated'],
  },
} as const;
