/**
 * Integration Router
 * 
 * Routes /api/integrations/v1/* requests to appropriate handlers
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory store for demo
const deviceStates = new Map<string, any>();

/**
 * Route handler for /api/integrations/v1/*
 * 
 * Provides open endpoints for external integrations:
 * - POST /posture - MDM posture updates
 * - POST /badge - Badge tap events  
 * - POST /location - Device location updates
 * - POST /heartbeat - Health monitoring
 * - GET /status - Integration capabilities
 * - GET /device/:id - Device status
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/integrations/v1', '');
  
  // GET /status
  if (path === '/status' || path === '') {
    return NextResponse.json({
      service: 'signalgrid',
      status: 'operational',
      version: 'v1',
      timestamp: new Date().toISOString(),
      integrations: {
        supported: ['mdm-posture', 'badge-events', 'location-updates', 'webhook-events'],
      },
      endpoints: {
        'POST /posture': 'Report device posture from MDM',
        'POST /badge': 'Report badge tap event',
        'POST /location': 'Report device location',
        'POST /heartbeat': 'Health heartbeat',
        'GET /device/:id': 'Get device status',
        'GET /status': 'Integration capabilities',
      },
    });
  }
  
  // GET /device/:id
  const deviceMatch = path.match(/^\/device\/(.+)$/);
  if (deviceMatch) {
    const deviceId = deviceMatch[1];
    const posture = deviceStates.get(`posture:${deviceId}`);
    const location = deviceStates.get(`location:${deviceId}`);
    
    if (!posture && !location) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      deviceId,
      posture: posture || null,
      location: location || null,
      lastUpdate: new Date().toISOString(),
    });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/integrations/v1', '');
  
  try {
    const body = await request.json().catch(() => ({}));
    
    // POST /posture - MDM posture updates
    if (path === '/posture') {
      const { deviceId, complianceStatus, violations, mdm } = body;
      
      if (!deviceId) {
        return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
      }
      
      const postureData = {
        deviceId,
        complianceStatus: complianceStatus || 'unknown',
        violations: violations || [],
        lastChecked: body.lastChecked || new Date().toISOString(),
        mdm: mdm || 'unknown',
        receivedAt: new Date().toISOString(),
      };
      
      deviceStates.set(`posture:${deviceId}`, postureData);
      
      return NextResponse.json({
        success: true,
        deviceId,
        status: 'posture_updated',
      });
    }
    
    // POST /badge - Badge tap events
    if (path === '/badge') {
      const { badgeUid, readerId, location } = body;
      
      if (!badgeUid || !readerId) {
        return NextResponse.json({ error: 'badgeUid and readerId required' }, { status: 400 });
      }
      
      const badgeEvent = {
        badgeUid,
        readerId,
        location: location || 'unknown',
        timestamp: body.timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      };
      
      deviceStates.set(`badge:${badgeUid}`, badgeEvent);
      
      return NextResponse.json({
        success: true,
        event: 'badge_tapped',
        badgeUid,
      });
    }
    
    // POST /location - Device location updates
    if (path === '/location') {
      const { deviceId, latitude, longitude, zone, method } = body;
      
      if (!deviceId) {
        return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
      }
      
      const locationData = {
        deviceId,
        latitude,
        longitude,
        accuracy: body.accuracy,
        zone: zone || 'unknown',
        method: method || 'network',
        timestamp: body.timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      };
      
      deviceStates.set(`location:${deviceId}`, locationData);
      
      return NextResponse.json({
        success: true,
        deviceId,
        status: 'location_updated',
      });
    }
    
    // POST /heartbeat - Health monitoring
    if (path === '/heartbeat') {
      return NextResponse.json({
        status: 'ok',
        received: body,
        timestamp: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
