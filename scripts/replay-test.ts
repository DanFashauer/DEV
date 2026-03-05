/**
 * Replay Protection Test
 * Sends same request twice - expects first 200, second 409
 */

import { randomBytes, createHmac } from 'node:crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SECRET = process.env.BACKEND_SIGNING_SECRET || 'development-secret-key';

function createSignature(
  method: string,
  fullUrl: string,
  timestamp: number,
  nonce: string,
  bodyString: string
): string {
  const data = `${method}|${fullUrl}|${timestamp}|${nonce}|${bodyString}`;
  return createHmac('sha256', SECRET).update(data).digest('hex');
}

// Create a valid BadgeEvent v1 payload
const badgeEvent = {
  schemaVersion: '1.0',
  eventType: 'badge.scan',
  eventId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  badge: {
    badgeId: 'BADGE-12345',
    employeeId: 'EMP-001',
    cardSerialNumber: 'CSN-ABC123',
  },
  reader: {
    readerId: 'READER-001',
    readerType: 'ble',
    readerName: 'Front Door Reader',
  },
  device: {
    deviceId: 'test-device-001',
    deviceSerial: 'SN-12345',
    deviceModel: 'iPhone 15 Pro',
    osVersion: '18.3',
  },
  mdm: {
    enrolled: true,
    managementId: 'MDM-001',
    personaAttributes: {
      department: 'Engineering',
      role: 'Developer',
    },
  },
  context: {
    locationId: 'LOC-001',
    locationName: 'Main Office',
    applicationId: 'APP-001',
  },
};

const bodyString = JSON.stringify(badgeEvent);
const timestamp = Date.now();
const nonce = randomBytes(16).toString('hex'); // 32 hex chars > 16

const fullUrl = `${BASE_URL}/api/session/start`;
const signature = createSignature('POST', fullUrl, timestamp, nonce, bodyString);

async function testReplay() {
  console.log('=== Replay Protection Test ===\n');
  console.log('Nonce:', nonce);
  console.log('Timestamp:', timestamp);
  console.log('Signature:', signature.substring(0, 16) + '...\n');

  const headers = {
    'Content-Type': 'application/json',
    'x-signature': signature,
    'x-timestamp': timestamp.toString(),
    'x-nonce': nonce,
  };

  console.log('Sending first request...');
  const resp1 = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: bodyString,
  });
  const data1 = await resp1.json();
  console.log('First request:', resp1.status, JSON.stringify(data1).substring(0, 200));

  console.log('\nSending second request with SAME nonce...');
  const resp2 = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: bodyString,
  });
  const data2 = await resp2.json();
  console.log('Second request:', resp2.status, JSON.stringify(data2).substring(0, 200));

  console.log('\n=== Results ===');
  const replayRejected = resp2.status === 409 || resp2.status === 401;
  if (resp1.status === 200 && replayRejected) {
    console.log('✅ PASS: First request accepted, second rejected (replay protection works!)');
    console.log('  First status:', resp1.status);
    console.log('  Second status:', resp2.status, '(401 or 409 = replay rejected)');
    process.exit(0);
  } else {
    console.log('❌ FAIL: Expected 200 then 401/409');
    console.log('  First status:', resp1.status);
    console.log('  Second status:', resp2.status);
    process.exit(1);
  }
}

testReplay().catch(console.error);
