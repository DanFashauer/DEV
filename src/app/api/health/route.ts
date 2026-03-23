/**
 * Health Check & Integration Status Endpoint
 * 
 * GET /api/health
 * 
 * Provides health check for test infrastructure, load balancers, and integrations.
 * 
 * Response includes:
 * - Basic status
 * - Version info
 * - Integration status (for external monitoring)
 * - Capabilities (for integration partners)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    // Basic status
    ok: true,
    service: 'signalgrid',
    timestamp: new Date().toISOString(),
    
    // Version info for integrations
    version: {
      api: 'v1',
      platform: 'cloud',
      build: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    },
    
    // Capabilities (for integration partners)
    capabilities: {
      session: {
        start: true,
        end: true,
        extend: true,
      },
      policy: {
        evaluate: true,
        list: true,
      },
      device: {
        posture: true,
        identity: true,
        quarantine: true,
      },
      integrations: {
        siem: true,
        itsm: true,
        nac: true,
        webhooks: true,
        mdm: true,
      },
      location: {
        report: true,
        zones: true,
      },
    },
    
    // Integration endpoints (public)
    endpoints: {
      sessionStart: '/api/session/start',
      sessionEnd: '/api/session/{sessionId}',
      locationReport: '/api/location/report',
      webhookEvents: '/api/events',
    },
    
    // Admin endpoints (require auth)
    admin: {
      events: '/api/admin/security-events',
      policies: '/api/admin/policies',
      devices: '/api/admin/devices',
      integrations: '/api/admin/integrations',
    },
  });
}
