/**
 * Session Status API Route
 * 
 * GET /api/session/:sessionId
 * 
 * Polls for session status by session ID.
 * Used by iOS kiosk app to check session state.
 * 
 * Query parameters:
 * - action: Optional action to perform (extend, terminate)
 * 
 * Security:
 * - Requires valid session ID
 * - Optional API key for extended access
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSessionStoreFromRequest } from '@/lib/tenant/sessionStore';
import { appendAuditRecord } from '@/lib/auditLedger';
import { emitSessionEnd } from '@/lib/integrations/webhooks/emitter';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const sessionStore = getSessionStoreFromRequest(request);
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = await sessionStore.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Session not found or expired',
          code: 'SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    // Check if session is still active
    if (session.status !== 'active') {
      return NextResponse.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          status: session.status,
          expiresAt: session.expiresAt,
        },
        message: `Session is ${session.status}`,
      });
    }
    
    // Return session info
    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        status: session.status,
        nextAction: session.nextAction,
        bundleId: session.bundleId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActivityAt: session.lastActivityAt,
      },
    });
  } catch (error) {
    console.error('[SessionGet] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/session/:sessionId
 * 
 * Terminates a session
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const sessionStore = getSessionStoreFromRequest(request);
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    // Check for admin auth header (optional - can be called by device)
    const authHeader = request.headers.get('authorization');
    const isAdmin = authHeader && authHeader.startsWith('Bearer ');
    
    // Get session first to check ownership
    const session = await sessionStore.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Terminate session
    const terminated = await sessionStore.terminate(sessionId);
    
    if (!terminated) {
      return NextResponse.json(
        { error: 'Failed to terminate session' },
        { status: 500 }
      );
    }
    
    console.log('[SessionDelete] Session terminated:', {
      sessionId,
      userId: session.userId,
      isAdmin,
    });
    
    // Record session end in audit ledger
    await appendAuditRecord('session.end', { type: isAdmin ? 'admin' : 'device', id: isAdmin ? 'admin' : session.deviceId }, {
      target: { type: 'session', id: sessionId },
      meta: { userId: session.userId, terminatedBy: isAdmin ? 'admin' : 'device' },
    });
    
    // Emit webhook event (best-effort, non-blocking)
    emitSessionEnd({
      sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      reason: isAdmin ? 'admin_terminated' : 'device_logout',
      timestamp: new Date().toISOString(),
    }).catch(err => console.error('[Webhook] Failed to emit session.end:', err));
    
    return NextResponse.json({
      success: true,
      message: 'Session terminated',
    });
  } catch (error) {
    console.error('[SessionDelete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
