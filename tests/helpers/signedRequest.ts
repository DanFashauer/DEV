/**
 * Signed Request Helper
 * 
 * Provides utilities for generating properly signed requests to the backend.
 * Used for tests that need to call endpoints requiring HMAC-SHA256 signatures.
 */

import { createHmac, randomBytes } from 'node:crypto';

/**
 * Generate a valid UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_SECRET = 'development-secret-key';

/**
 * Generate a signed request to the session start endpoint
 */
export async function createSignedSessionRequest(
  baseUrl: string,
  body: {
    badgeUid: string;
    deviceId: string;
    deviceSerial?: string;
    deviceModel?: string;
    readerType?: string;
    userId?: string;
    userName?: string;
  },
  secret: string = DEFAULT_SECRET
): Promise<RequestInit> {
  const method = 'POST';
  const url = `${baseUrl}/api/session/start`;
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  
  // Build the BadgeEvent payload
  const payload = {
    schemaVersion: '1.0',
    eventType: 'badge.scan',
    eventId: generateUUID(),
    timestamp: new Date(timestamp).toISOString(),
    badge: {
      badgeId: body.badgeUid,
      employeeId: body.userId,
    },
    reader: {
      readerId: `reader-${body.readerType || 'ble'}`,
      readerType: body.readerType || 'ble',
    },
    device: {
      deviceId: body.deviceId,
      deviceSerial: body.deviceSerial || body.deviceId,
      deviceModel: body.deviceModel || 'Test Device',
      osVersion: '17.0',
    },
    mdm: {
      enrolled: true,
      managementId: 'test-mdm',
    },
    context: {
      userId: body.userId,
    },
  };
  
  // Generate signature
  const bodyString = JSON.stringify(payload);
  const signatureBase = `${method}|${url}|${timestamp}|${nonce}|${bodyString}`;
  const signature = createHmac('sha256', secret).update(signatureBase).digest('hex');
  
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
    },
    body: bodyString,
  };
}

/**
 * Generate a signed request for any endpoint
 */
export async function createSignedRequest(
  baseUrl: string,
  path: string,
  method: string,
  body: object | null,
  secret: string = DEFAULT_SECRET
): Promise<RequestInit> {
  const url = `${baseUrl}${path}`;
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  
  const bodyString = body ? JSON.stringify(body) : '';
  const signatureBase = `${method}|${url}|${timestamp}|${nonce}|${bodyString}`;
  const signature = createHmac('sha256', secret).update(signatureBase).digest('hex');
  
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
    },
    body: bodyString,
  };
}
