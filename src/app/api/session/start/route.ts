/**
 * Session Start API Route
 * 
 * POST /api/session/start
 * 
 * Validates BadgeEvent v1 payload from iOS kiosk app and returns session token.
 * 
 * Security:
 * - HMAC-SHA256 request signature verification
 * - Timestamp validation (5-min window)
 * - Replay attack prevention (nonce)
 * - Schema validation
 */

// Force Node.js runtime to access Node crypto module
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { validateAndAuthorizeSessionStart, generateRandomHex } from '@/lib/backend/validation';

/**
 * Simple in-memory rate limiter
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * POST /api/session/start
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Get full URL for signature verification
    const url = new URL(request.url);
    const fullUrl = `${url.protocol}//${url.host}${url.pathname}`;
    
    // Parse body
    const body = await request.json();
    
    // Get security headers
    const headers: Record<string, string | undefined> = {
      'x-signature': request.headers.get('x-signature') ?? undefined,
      'x-timestamp': request.headers.get('x-timestamp') ?? undefined,
      'x-nonce': request.headers.get('x-nonce') ?? undefined,
    };
    
    // Validate request
    const validation = await validateAndAuthorizeSessionStart(
      headers,
      body,
      fullUrl,
      'POST'
    );
    
    if (!validation.valid) {
      console.error('[SessionStart] Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    const event = validation.event!;
    
    // Log badge scan event
    console.log('[SessionStart] Badge scan event:', {
      eventId: event.eventId,
      badgeId: event.badge.badgeId,
      readerType: event.reader.readerType,
      timestamp: event.timestamp,
    });
    
    // TODO: Validate badge against backend database
    // TODO: Check enrollment status
    // TODO: Generate session token
    
    // For now, return a mock response for development
    const sessionToken = generateRandomHex(32);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
    
    return NextResponse.json({
      success: true,
      sessionToken,
      persona: {
        roleId: 'role-001',
        roleName: 'Standard User',
        permissions: ['read', 'write'],
        workspaceConfig: {
          layout: 'grid',
          visibleModules: ['dashboard', 'apps', 'settings'],
          theme: {
            primaryColor: '#007bff',
            accentColor: '#6610f2',
          },
        },
        appLaunchConfig: {
          apps: [
            { bundleId: 'com.example.app1', name: 'App 1' },
            { bundleId: 'com.example.app2', name: 'App 2' },
          ],
        },
      },
      expiresAt,
    });
  } catch (error) {
    console.error('[SessionStart] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
