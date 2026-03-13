#!/usr/bin/env bun
/**
 * Executive Demo: Doctor Badge + Jailbroken Device
 * 
 * This script runs the deterministic executive demo scenario:
 * 1. Enroll device and badge
 * 2. Sync posture showing device is jailbroken (non-compliant)
 * 3. Doctor taps badge → SignalGrid checks posture
 * 4. Session DENIED due to non-compliant device
 * 5. Policy triggers: quarantine + SIEM + ITSM
 * 
 * Usage:
 *   bun run demo:exec    # Run executive demo
 */

const SERVER_URL = process.env.SERVER_URL || process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key-12345';

const DEMO_CONFIG = {
  deviceId: 'iPad-Nurse-Station-01',
  badgeUid: 'badge-healthcare-001',
  user: 'jane.nurse@hospital.org',
  userName: 'Jane Nurse',
  department: 'Emergency',
  violations: ['device.jailbroken'],
};

async function adminRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-api-key': ADMIN_API_KEY,
      ...options.headers,
    },
  });
  return response;
}

async function enrollDevice() {
  console.log('\n📱 Step 1: Enrolling device...');
  const response = await adminRequest('/api/admin/devices', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: DEMO_CONFIG.deviceId,
      userId: DEMO_CONFIG.user,
      department: DEMO_CONFIG.department,
      location: 'Nurse Station A',
      riskLevel: 'medium',
    }),
  });
  
  if (response.ok) {
    console.log('   ✅ Device enrolled');
  } else {
    console.log('   ⚠️  Device may already exist:', response.status);
  }
}

async function enrollBadge() {
  console.log('\n🏷️  Step 2: Enrolling badge...');
  const response = await adminRequest('/api/admin/badges/enroll', {
    method: 'POST',
    body: JSON.stringify({
      badgeUid: DEMO_CONFIG.badgeUid,
      userId: DEMO_CONFIG.user,
      userName: DEMO_CONFIG.userName,
      department: DEMO_CONFIG.department,
    }),
  });
  
  if (response.ok) {
    console.log('   ✅ Badge enrolled');
  } else {
    const text = await response.text();
    console.log('   ⚠️  Badge may already exist:', response.status, text);
  }
}

async function syncPosture() {
  console.log('\n📡 Step 3: Setting device posture (NON-COMPLIANT - jailbroken)...');
  
  // Set posture directly for demo
  const response = await adminRequest('/api/admin/test/posture', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: DEMO_CONFIG.deviceId,
      compliant: false,
      violations: DEMO_CONFIG.violations,
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('   ✅ Posture synced - Device flagged as non-compliant');
    console.log('   Violations:', DEMO_CONFIG.violations.join(', '));
  } else {
    console.log('   ⚠️  Posture sync response:', response.status);
  }
}

async function seedPolicies() {
  console.log('\n📋 Step 4: Seeding policies...');
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const proc = spawn('bun', ['run', 'seed:policies'], { stdio: 'inherit', shell: true });
    proc.on('close', (code) => resolve(code === 0));
  });
}

async function badgeScan() {
  console.log('\n👨‍⚕️  Step 5: Doctor taps badge on shared iPad...');
  
  // Create signed badge event
  const { createHmac, randomBytes } = await import('node:crypto');
  const { v4: uuidv4 } = await import('uuid');
  
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  
  const event = {
    schemaVersion: '1.0',
    eventType: 'badge.scan',
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    badge: {
      badgeId: DEMO_CONFIG.badgeUid,
      employeeId: 'EMP-001',
    },
    reader: {
      readerId: 'reader-nurse-station-a',
      readerType: 'ble',
    },
    device: {
      deviceId: DEMO_CONFIG.deviceId,
      deviceSerial: 'SERIAL-001',
      deviceModel: 'iPad13,1',
      osVersion: '17.2',
    },
    mdm: {
      enrolled: true,
    },
  };
  
  const bodyString = JSON.stringify(event);
  const secret = process.env.BACKEND_SECRET || 'development-secret-key';
  const signature = createHmac('sha256', secret)
    .update(`POST|${SERVER_URL}/api/session/start|${timestamp}|${nonce}|${bodyString}`)
    .digest('hex');
  
  const response = await fetch(`${SERVER_URL}/api/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
    },
    body: bodyString,
  });
  
  const data = await response.json();
  
  console.log('   Response Status:', response.status);
  console.log('   Response:', JSON.stringify(data, null, 2));
  
  if (response.status === 403 && data.code === 'DEVICE_NON_COMPLIANT') {
    console.log('\n   🎯 SESSION DENIED - Device is non-compliant!');
    console.log('   📋 Compliance Status:');
    console.log('      - FleetDM Compliant:', data.complianceStatus?.fleetCompliant);
    console.log('      - UEM Compliant:', data.complianceStatus?.uemCompliant);
    
    if (data.policyActions && data.policyActions.length > 0) {
      console.log('\n   🚨 Policy Actions Triggered:');
      for (const action of data.policyActions) {
        console.log(`      - ${action.type}: ${action.params?.reason || JSON.stringify(action.params)}`);
      }
    }
    return true;
  } else if (response.status === 200) {
    console.log('\n   ⚠️  Session was ALLOWED (unexpected!)');
    return false;
  } else {
    console.log('\n   ❌ Unexpected response:', response.status, data);
    return false;
  }
}

async function checkAudit() {
  console.log('\n🔍 Step 6: Checking audit ledger...');
  const response = await adminRequest('/api/admin/audit/export?limit=10');
  const text = await response.text();
  const lines = text.trim().split('\n').filter(Boolean);
  
  console.log('   Total audit entries:', lines.length);
  
  // Look for relevant events
  const relevantTypes = ['session.start', 'auth.failure', 'policy.matched', 'policy.action.executed'];
  for (const line of lines.slice(-5)) {
    try {
      const entry = JSON.parse(line);
      if (relevantTypes.includes(entry.eventType)) {
        console.log(`   📝 ${entry.eventType}: ${entry.actor?.type} (${entry.ts})`);
      }
    } catch {}
  }
}

function printBanner() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║          SignalGrid Executive Demo - Healthcare Scenario                 ║
║                                                                            ║
║  Scenario: Doctor taps badge on shared clinical tablet                    ║
║  Context:  Device flagged as jailbroken (non-compliant)                  ║
║  Expected: Session DENIED, quarantine triggered                           ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

async function main() {
  printBanner();
  
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Device: ${DEMO_CONFIG.deviceId}`);
  console.log(`Badge:  ${DEMO_CONFIG.badgeUid}`);
  
  // Check server health
  try {
    const health = await fetch(`${SERVER_URL}/api/health`);
    if (!health.ok) {
      console.error('\n❌ Server not healthy');
      process.exit(1);
    }
    console.log('\n✅ Server is healthy');
  } catch {
    console.error('\n❌ Server not reachable');
    process.exit(1);
  }
  
  // Run demo steps
  await enrollDevice();
  await enrollBadge();
  await syncPosture();
  await seedPolicies();
  
  const sessionDenied = await badgeScan();
  await checkAudit();
  
  console.log('\n' + '='.repeat(70));
  if (sessionDenied) {
    console.log('🎉 DEMO SUCCESSFUL - Session was correctly denied!');
    console.log('\n📊 What happened:');
    console.log('   1. Device enrolled with MDM');
    console.log('   2. Badge enrolled for doctor');
    console.log('   3. FleetDM reported device as jailbroken');
    console.log('   4. Doctor tapped badge');
    console.log('   5. SignalGrid checked device compliance');
    console.log('   6. Session DENIED - device is non-compliant');
    console.log('   7. Policy actions triggered (quarantine, SIEM, ITSM)');
  } else {
    console.log('⚠️  DEMO FAILED - Session should have been denied');
  }
  console.log('='.repeat(70));
  
  console.log('\n📍 View in Admin Dashboard:');
  console.log(`   ${SERVER_URL}/admin`);
  console.log('   Navigate to: Receipts tab');
  
  process.exit(sessionDenied ? 0 : 1);
}

main().catch(console.error);
