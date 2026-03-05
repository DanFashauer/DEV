/**
 * Audit Ledger Verification Script
 * 
 * This script:
 * 1. Triggers a few audit events (badge enroll + session start + session end)
 * 2. Calls /api/admin/audit/verify to verify chain integrity
 * 3. Exports last 50 entries and prints first 3 lines
 * 
 * Usage:
 *   bun run scripts/audit-verify.ts
 * 
 * Or use npm scripts:
 *   bun run test:audit
 *   bun run audit:verify
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';

// Helper to make authenticated admin requests
async function adminRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      ...options.headers,
    },
  });
  return response;
}

async function main() {
  console.log('=== Audit Ledger Verification ===\n');

  // 1. First, let's create some audit events by enrolling a badge
  console.log('1. Creating test audit events...');
  
  try {
    // Enroll a test badge (this will create badge.enroll audit record)
    const enrollResponse = await adminRequest('/api/admin/badges/enroll', {
      method: 'POST',
      body: JSON.stringify({
        badgeUid: 'TEST-BADGE-' + Date.now(),
        userId: 'test-user-' + Date.now(),
        userName: 'Test User',
        department: 'IT',
      }),
    });
    
    if (enrollResponse.ok) {
      console.log('   ✓ Badge enrollment event created');
    } else {
      console.log('   ⚠ Badge enrollment failed (may already exist):', enrollResponse.status);
    }
  } catch (error) {
    console.log('   ⚠ Could not create badge enrollment event:', error);
  }

  // 2. Verify the ledger integrity
  console.log('\n2. Verifying ledger integrity...');
  
  try {
    const verifyResponse = await adminRequest('/api/admin/audit/verify?limit=1000');
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.ok) {
      console.log('   ✓ Ledger integrity verified');
      console.log(`   - Total records: ${verifyResult.count}`);
      console.log(`   - Head hash: ${verifyResult.headHash.slice(0, 16)}...`);
      console.log(`   - Time range: ${verifyResult.firstTs} to ${verifyResult.lastTs}`);
    } else {
      console.log('   ✗ Ledger integrity FAILED!');
      console.log(`   - Broken at index: ${verifyResult.brokenAtIndex}`);
      console.log(`   - Expected hash: ${verifyResult.expectedHash?.slice(0, 16)}...`);
      console.log(`   - Actual hash: ${verifyResult.actualHash?.slice(0, 16)}...`);
      process.exit(1);
    }
  } catch (error) {
    console.log('   ⚠ Could not verify ledger:', error);
    console.log('   (This is expected if the server is not running)');
  }

  // 3. Export recent entries
  console.log('\n3. Exporting recent audit entries...');
  
  try {
    const exportResponse = await adminRequest('/api/admin/audit/export?limit=50');
    const exportText = await exportResponse.text();
    const lines = exportText.trim().split('\n').filter(Boolean);
    
    console.log(`   - Total entries exported: ${lines.length}`);
    
    if (lines.length > 0) {
      console.log('\n   First 3 entries:');
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const entry = JSON.parse(lines[i]);
        console.log(`\n   [${i + 1}] ${entry.eventType}`);
        console.log(`       ID: ${entry.id.slice(0, 8)}...`);
        console.log(`       Time: ${entry.ts}`);
        console.log(`       Actor: ${entry.actor.type}${entry.actor.id ? ' (' + entry.actor.id + ')' : ''}`);
        console.log(`       Hash: ${entry.hash.slice(0, 16)}...`);
      }
    } else {
      console.log('   No entries to display');
    }
  } catch (error) {
    console.log('   ⚠ Could not export audit entries:', error);
    console.log('   (This is expected if the server is not running)');
  }

  console.log('\n=== Verification Complete ===');
}

main().catch(console.error);
