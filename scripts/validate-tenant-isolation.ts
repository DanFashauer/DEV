#!/usr/bin/env bun
/**
 * Tenant Isolation Validation Script
 * 
 * Validates that multi-tenant isolation is properly implemented by checking:
 * 1. Tenant-aware stores are imported in routes
 * 2. Policy evaluation is tenant-scoped
 * 3. Nonce validation includes tenant ID
 * 4. No global store imports remain in critical paths
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function checkFile(filePath: string, patterns: { pattern: RegExp; shouldMatch: boolean; description: string }[]): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    for (const { pattern, shouldMatch, description } of patterns) {
      const matches = pattern.test(content);
      if (shouldMatch && !matches) {
        issues.push(`Expected to find: ${description}`);
      } else if (!shouldMatch && matches) {
        issues.push(`Should NOT contain: ${description}`);
      }
    }
  } catch (e) {
    issues.push(`Failed to read: ${filePath}`);
  }
  
  return { passed: issues.length === 0, issues };
}

console.log('\n=== Tenant Isolation Validation ===\n');

// Check session start route
const sessionRoute = 'src/app/api/session/start/route.ts';
const sessionCheck = checkFile(sessionRoute, [
  { pattern: /from ['"]@\/lib\/tenant\/badgeRegistry['"]/, shouldMatch: true, description: 'tenant badgeRegistry import' },
  { pattern: /from ['"]@\/lib\/tenant\/sessionStore['"]/, shouldMatch: true, description: 'tenant sessionStore import' },
  { pattern: /from ['"]@\/lib\/tenant\/policyEvaluator['"]/, shouldMatch: true, description: 'tenant policyEvaluator import' },
  { pattern: /from ['"]@\/lib\/tenant\/tenantContext['"]/, shouldMatch: true, description: 'tenantContext import' },
  { pattern: /from ['"]@\/lib\/badgeRegistry['"]/, shouldMatch: false, description: 'global badgeRegistry import' },
  { pattern: /from ['"]@\/lib\/sessionStore['"]/, shouldMatch: false, description: 'global sessionStore import' },
  { pattern: /from ['"]@\/lib\/policy\/runtime\/evaluate['"]/, shouldMatch: false, description: 'global evaluatePolicies import' },
  { pattern: /getEvaluator\(tenantId\)/, shouldMatch: true, description: 'tenant-aware evaluator instantiation' },
  { pattern: /resolveTenantId\(request\)/, shouldMatch: true, description: 'tenant resolution' },
]);

console.log(`Session Route: ${sessionCheck.passed ? GREEN + 'PASS' + RESET : RED + 'FAIL' + RESET}`);
if (!sessionCheck.passed) {
  sessionCheck.issues.forEach(i => console.log(`  ${RED}✗${RESET} ${i}`));
}

// Check admin policies route
const adminPoliciesRoute = 'src/app/api/admin/policies/route.ts';
const adminPoliciesCheck = checkFile(adminPoliciesRoute, [
  { pattern: /from ['"]@\/lib\/tenant\/policyStore['"]/, shouldMatch: true, description: 'tenant policyStore import' },
  { pattern: /from ['"]@\/lib\/tenant\/tenantContext['"]/, shouldMatch: true, description: 'tenantContext import' },
  { pattern: /from ['"]@\/lib\/policy\/store\/policyStore['"]/, shouldMatch: false, description: 'global policyStore import' },
  { pattern: /getPolicyStore\(tenantId\)/, shouldMatch: true, description: 'tenant-aware policyStore' },
]);

console.log(`Admin Policies Route: ${adminPoliciesCheck.passed ? GREEN + 'PASS' + RESET : RED + 'FAIL' + RESET}`);
if (!adminPoliciesCheck.passed) {
  adminPoliciesCheck.issues.forEach(i => console.log(`  ${RED}✗${RESET} ${i}`));
}

// Check admin policies [id] route
const adminPolicyIdRoute = 'src/app/api/admin/policies/[id]/route.ts';
const adminPolicyIdCheck = checkFile(adminPolicyIdRoute, [
  { pattern: /from ['"]@\/lib\/tenant\/policyStore['"]/, shouldMatch: true, description: 'tenant policyStore import' },
  { pattern: /from ['"]@\/lib\/tenant\/tenantContext['"]/, shouldMatch: true, description: 'tenantContext import' },
  { pattern: /from ['"]@\/lib\/policy\/store\/policyStore['"]/, shouldMatch: false, description: 'global policyStore import' },
  { pattern: /getPolicyStore\(tenantId\)/, shouldMatch: true, description: 'tenant-aware policyStore' },
]);

console.log(`Admin Policy [id] Route: ${adminPolicyIdCheck.passed ? GREEN + 'PASS' + RESET : RED + 'FAIL' + RESET}`);
if (!adminPolicyIdCheck.passed) {
  adminPolicyIdCheck.issues.forEach(i => console.log(`  ${RED}✗${RESET} ${i}`));
}

// Check validation.ts for tenant-aware nonce
const validationFile = 'src/lib/backend/validation.ts';
const validationCheck = checkFile(validationFile, [
  { pattern: /tenantKey/, shouldMatch: true, description: 'tenantKey function usage' },
  { pattern: /tenantId: string = 'default'/, shouldMatch: true, description: 'tenantId parameter with default' },
  { pattern: /isNonceValid\(deviceId, nonce, tenantId\)/, shouldMatch: true, description: 'tenant-aware nonce validation' },
]);

console.log(`Validation Module: ${validationCheck.passed ? GREEN + 'PASS' + RESET : RED + 'FAIL' + RESET}`);
if (!validationCheck.passed) {
  validationCheck.issues.forEach(i => console.log(`  ${RED}✗${RESET} ${i}`));
}

// Check tenant modules exist
const tenantModules = [
  'src/lib/tenant/tenantContext.ts',
  'src/lib/tenant/badgeRegistry.ts',
  'src/lib/tenant/sessionStore.ts',
  'src/lib/tenant/policyStore.ts',
  'src/lib/tenant/policyEvaluator.ts',
];

console.log('\nTenant Modules:');
for (const mod of tenantModules) {
  try {
    readFileSync(mod, 'utf-8');
    console.log(`  ${GREEN}✓${RESET} ${mod}`);
  } catch {
    console.log(`  ${RED}✗${RESET} ${mod} (missing)`);
  }
}

// Summary
const allPassed = sessionCheck.passed && adminPoliciesCheck.passed && adminPolicyIdCheck.passed && validationCheck.passed;
console.log(`\n=== Summary: ${allPassed ? GREEN + 'ALL CHECKS PASSED' + RESET : RED + 'SOME CHECKS FAILED' + RESET} ===\n`);

if (!allPassed) {
  process.exit(1);
}