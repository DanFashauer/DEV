import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: [
      'tests/e2e/**',
      'tests/load/**',
      // These suites exercise a live Next.js server and are run via `npm run test:api:server`.
      'tests/api/integration-v1.test.ts',
      'tests/api/integrations-itsm.test.ts',
      'tests/api/integrations-webhooks.test.ts',
      'tests/api/location-report.test.ts',
      'tests/api/policies.test.ts',
      'tests/api/webauthn-admin.test.ts',
      'tests/demo/*.test.ts',
      'tests/security/rate-limit.test.ts',
      'tests/security/replay-attack.test.ts',
      'tests/security/secret-redaction.test.ts',
      'tests/security/stepup-enforcement.test.ts',
      'tests/security/webhook-signing.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: false,
});
