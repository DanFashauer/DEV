#!/usr/bin/env bun
/**
 * Multi-Tenant Isolation Proof
 * 
 * Proves that data is isolated between tenants when using x-tenant-id header.
 */

import { getBadgeRegistry } from '../src/lib/tenant/badgeRegistry';
import { getSessionStore } from '../src/lib/tenant/sessionStore';
import { getPolicyStore } from '../src/lib/tenant/policyStore';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${name}`);
    passed++;
  } else {
    console.log(`  ${RED}✗${RESET} ${name}`);
    failed++;
  }
}

async function main() {
  console.log('\n=== Multi-Tenant Isolation Proof ===\n');

  const tenantA = 'acme-corp';
  const tenantB = 'beta-ltd';

  // --- Badge Isolation ---
  console.log('Badge Registry Isolation:');
  const badgesA = getBadgeRegistry(tenantA);
  const badgesB = getBadgeRegistry(tenantB);

  await badgesA.enroll({ badgeUid: 'badge-001', userId: 'user-a', userName: 'Alice' });
  await badgesB.enroll({ badgeUid: 'badge-001', userId: 'user-b', userName: 'Bob' });

  const badgeA = await badgesA.get('badge-001');
  const badgeB = await badgesB.get('badge-001');

  check('Same badge UID enrolled in both tenants', badgeA !== null && badgeB !== null);
  check('Tenant A badge has Alice', badgeA?.userName === 'Alice');
  check('Tenant B badge has Bob', badgeB?.userName === 'Bob');
  check('Badge data is isolated', badgeA?.userId !== badgeB?.userId);

  const allBadgesA = await badgesA.list();
  const allBadgesB = await badgesB.list();
  check('Tenant A list only shows tenant A badges', allBadgesA.length === 1 && allBadgesA[0].userId === 'user-a');
  check('Tenant B list only shows tenant B badges', allBadgesB.length === 1 && allBadgesB[0].userId === 'user-b');

  // --- Session Isolation ---
  console.log('\nSession Store Isolation:');
  const sessionsA = getSessionStore(tenantA);
  const sessionsB = getSessionStore(tenantB);

  const sessionA = await sessionsA.create({ userId: 'user-a', badgeUid: 'badge-001', deviceId: 'device-a' });
  const sessionB = await sessionsB.create({ userId: 'user-b', badgeUid: 'badge-001', deviceId: 'device-b' });

  check('Sessions created in both tenants', sessionA.sessionId !== sessionB.sessionId);

  const lookupA = await sessionsA.get(sessionA.sessionId);
  const lookupB = await sessionsB.get(sessionB.sessionId);
  check('Session A retrievable in tenant A', lookupA?.userId === 'user-a');
  check('Session B retrievable in tenant B', lookupB?.userId === 'user-b');

  // Cross-tenant lookup should fail
  const crossLookupA = await sessionsA.get(sessionB.sessionId);
  const crossLookupB = await sessionsB.get(sessionA.sessionId);
  check('Session B NOT retrievable in tenant A', crossLookupA === null);
  check('Session A NOT retrievable in tenant B', crossLookupB === null);

  // Terminate in one tenant doesn't affect other
  await sessionsA.terminate(sessionA.sessionId);
  const terminatedA = await sessionsA.get(sessionA.sessionId);
  const stillActiveB = await sessionsB.get(sessionB.sessionId);
  check('Terminating A does not affect B', stillActiveB?.status === 'active');

  // --- Policy Isolation ---
  console.log('\nPolicy Store Isolation:');
  const policiesA = getPolicyStore(tenantA);
  const policiesB = getPolicyStore(tenantB);

  policiesA.createPolicy({
    name: 'Policy A',
    enabled: true,
    priority: 100,
    conditions: [{ field: 'device.compliant', operator: 'eq', value: false }],
    actions: [{ type: 'quarantine_device' }],
  });

  policiesB.createPolicy({
    name: 'Policy B',
    enabled: true,
    priority: 200,
    conditions: [{ field: 'device.compliant', operator: 'eq', value: true }],
    actions: [{ type: 'launch_app' }],
  });

  const policiesAList = policiesA.listPolicies();
  const policiesBList = policiesB.listPolicies();

  check('Tenant A has 1 policy', policiesAList.length === 1);
  check('Tenant B has 1 policy', policiesBList.length === 1);
  check('Tenant A policy is Policy A', policiesAList[0].name === 'Policy A');
  check('Tenant B policy is Policy B', policiesBList[0].name === 'Policy B');

  // Default tenant is isolated from custom tenants
  const badgesDefault = getBadgeRegistry('default');
  const defaultBadge = await badgesDefault.get('badge-001');
  check('Default tenant has no badge-001', defaultBadge === null);

  // --- Summary ---
  console.log('\n=== Summary ===');
  console.log(`Passed: ${GREEN}${passed}${RESET}`);
  console.log(`Failed: ${RED}${failed}${RESET}`);
  console.log();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Proof failed:', err);
  process.exit(1);
});
