#!/usr/bin/env bun
/**
 * Badge Simulator
 * 
 * Simulates badge scan events for testing the session start endpoint.
 * Generates signed BadgeEvent v1 payloads and sends them to the backend.
 * 
 * Usage:
 *   bun run sim:badge                    # Run with defaults
 *   bun run sim:badge --badgeUid 94AC22  # Custom badge UID
 *   bun run sim:badge --deviceId DEVICE1 # Custom device ID
 *   bun run sim:badge --url http://localhost:3000 # Custom backend URL
 *   bun run sim:badge --enroll           # Auto-enroll badge before testing
 * 
 * Environment variables:
 *   BACKEND_URL      - Backend base URL (default: http://localhost:3000)
 *   BACKEND_SECRET  - HMAC signing secret (default: development-secret-key)
 *   ADMIN_API_KEY   - Admin API key for enrollment
 */

import { createHmac, randomBytes } from 'node:crypto';

interface BadgeSimulatorOptions {
  badgeUid?: string;
  deviceId?: string;
  deviceSerial?: string;
  deviceModel?: string;
  readerType?: 'ble' | 'usb' | 'nfc';
  userId?: string;
  userName?: string;
  backendUrl?: string;
  secret?: string;
}

interface BadgeEventPayload {
  schemaVersion: '1.0';
  eventType: 'badge.scan';
  eventId: string;
  timestamp: string;
  badge: {
    badgeId: string;
    employeeId?: string;
    cardSerialNumber?: string;
  };
  reader: {
    readerId: string;
    readerType: string;
    readerName?: string;
  };
  device: {
    deviceId: string;
    deviceSerial: string;
    deviceModel: string;
    osVersion: string;
  };
  mdm: {
    enrolled: boolean;
    managementId?: string;
    personaAttributes?: Record<string, string>;
  };
  context?: {
    locationId?: string;
    locationName?: string;
    applicationId?: string;
  };
}

function generateSignature(
  method: string,
  url: string,
  timestamp: number,
  nonce: string,
  body: object,
  secret: string
): string {
  const bodyString = JSON.stringify(body);
  const signatureBase = `${method}|${url}|${timestamp}|${nonce}|${bodyString}`;
  return createHmac('sha256', secret).update(signatureBase).digest('hex');
}

function generateUuid(): string {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, 
    '$1-$2-$3-$4-$5');
}

async function enrollBadge(
  badgeUid: string,
  userId: string,
  userName: string | undefined,
  backendUrl: string,
  adminKey: string | undefined
): Promise<boolean> {
  if (!adminKey) {
    console.warn('[Sim] No ADMIN_API_KEY set, skipping enrollment');
    return false;
  }

  console.log(`[Sim] Enrolling badge ${badgeUid} -> user ${userId}...`);
  
  try {
    const response = await fetch(`${backendUrl}/api/admin/badges/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-api-key': adminKey,
      },
      body: JSON.stringify({
        badgeUid,
        userId,
        userName,
        department: 'IT',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Sim] Enrollment failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('[Sim] Enrollment successful:', result.message);
    return true;
  } catch (error) {
    console.error('[Sim] Enrollment error:', error);
    return false;
  }
}

async function simulateBadgeScan(options: BadgeSimulatorOptions): Promise<void> {
  const {
    badgeUid = '94AC22',
    deviceId = 'SIM-DEVICE-001',
    deviceSerial = 'SIM123456',
    deviceModel = 'iPhone 15 Pro',
    readerType = 'ble',
    userId = 'dan@hospital.org',
    userName = 'Dan Test User',
    backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000',
    secret = process.env.BACKEND_SECRET ?? 'development-secret-key',
  } = options;

  // Check for enrollment flag
  const shouldEnroll = process.argv.includes('--enroll') || process.argv.includes('-e');
  
  if (shouldEnroll) {
    const adminKey = process.env.ADMIN_API_KEY;
    await enrollBadge(badgeUid, userId, userName, backendUrl, adminKey);
  }

  // Generate event payload
  const eventId = generateUuid();
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');

  const payload: BadgeEventPayload = {
    schemaVersion: '1.0',
    eventType: 'badge.scan',
    eventId,
    timestamp: new Date(timestamp).toISOString(),
    badge: {
      badgeId: badgeUid,
      employeeId: 'EMP001',
      cardSerialNumber: 'CSN123456789',
    },
    reader: {
      readerId: `READER-${readerType.toUpperCase()}-001`,
      readerType,
      readerName: `Simulated ${readerType.toUpperCase()} Reader`,
    },
    device: {
      deviceId,
      deviceSerial,
      deviceModel,
      osVersion: '17.2',
    },
    mdm: {
      enrolled: true,
      managementId: 'MDM-001',
      personaAttributes: {
        department: 'IT',
        role: 'engineer',
      },
    },
    context: {
      locationId: 'LOC-001',
      locationName: 'Main Building',
      applicationId: 'com.enterprise.shell',
    },
  };

  const url = `${backendUrl}/api/session/start`;
  const signature = generateSignature('POST', url, timestamp, nonce, payload, secret);

  console.log('\n[Sim] Sending badge scan event:');
  console.log(`  Event ID: ${eventId}`);
  console.log(`  Badge UID: ${badgeUid}`);
  console.log(`  Device ID: ${deviceId}`);
  console.log(`  Reader Type: ${readerType}`);
  console.log(`  Timestamp: ${new Date(timestamp).toISOString()}`);
  console.log(`  Nonce: ${nonce.substring(0, 16)}...\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
        'x-timestamp': timestamp.toString(),
        'x-nonce': nonce,
      },
      body: JSON.stringify(payload),
    });

    // Handle non-2xx responses
    if (!response.ok) {
      console.log('[Sim] Response:');
      console.log(`  Status: ${response.status}`);
      console.log('  Success: false');
      
      try {
        const errorResult = await response.json();
        console.log('\n[Sim] Error:');
        console.log(`  Error: ${errorResult.error || 'Unknown error'}`);
        console.log(`  Code: ${errorResult.code}`);
      } catch {
        console.log('\n[Sim] Error:');
        console.log(`  Error: HTTP ${response.status}`);
      }
      
      // Return non-zero exit code for failed requests
      process.exitCode = 1;
      return;
    }

    const result = await response.json();

    console.log('[Sim] Response:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Success: ${result.success}`);
    
    if (result.success) {
      console.log('\n[Sim] Session created:');
      console.log(`  Session ID: ${result.session?.sessionId}`);
      console.log(`  User ID: ${result.session?.userId}`);
      console.log(`  Next Action: ${result.session?.nextAction}`);
      console.log(`  Bundle ID: ${result.session?.bundleId}`);
      console.log(`  Expires: ${result.session?.expiresAt}`);
    } else {
      console.log('\n[Sim] Error:');
      console.log(`  Error: ${result.error}`);
      console.log(`  Code: ${result.code}`);
      console.log(`  Hint: ${result.hint}`);
    }

    console.log('');
  } catch (error) {
    console.error('[Sim] Request failed:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BadgeSimulatorOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--badgeUid':
    case '-b':
      options.badgeUid = args[++i];
      break;
    case '--deviceId':
    case '-d':
      options.deviceId = args[++i];
      break;
    case '--userId':
    case '-u':
      options.userId = args[++i];
      break;
    case '--url':
    case '--backend':
    case '-l':
      options.backendUrl = args[++i];
      break;
    case '--secret':
    case '-s':
      options.secret = args[++i];
      break;
    case '--help':
    case '-h':
      console.log(`
Badge Simulator

Usage:
  bun run sim:badge [options]

Options:
  -b, --badgeUid <uid>     Badge UID to simulate (default: 94AC22)
  -d, --deviceId <id>      Device ID to simulate (default: SIM-DEVICE-001)
  -u, --userId <id>        User ID for enrollment (default: dan@hospital.org)
  -l, --url <url>          Backend URL (default: http://localhost:3000)
  -s, --secret <key>       HMAC signing secret
  -e, --enroll             Enroll badge before testing
  -h, --help               Show this help message

Environment variables:
  BACKEND_URL      Backend base URL
  BACKEND_SECRET   HMAC signing secret
  ADMIN_API_KEY    Admin API key for enrollment

Example:
  # Simulate badge scan with defaults
  bun run sim:badge

  # Enroll badge and simulate scan
  bun run sim:badge --enroll

  # Custom badge and device
  bun run sim:badge --badgeUid ABC123 --deviceId MY-IPAD
`);
      process.exit(0);
  }
}

simulateBadgeScan(options);
