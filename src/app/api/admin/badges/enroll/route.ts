/**
 * Badge Enrollment API Route
 * 
 * POST /api/admin/badges/enroll
 * 
 * Enrolls a new badge UID to user mapping.
 * 
 * Request body:
 * {
 *   "badge (Uid": "stringrequired)",
 *   "userId": "string (required)",
 *   "userName": "string (optional)",
 *   "department": "string (optional)"
 * }
 * 
 * Security:
 * - Requires admin API key authentication
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { badgeRegistry } from '@/lib/badgeRegistry';
import { requireAdminAuth } from '@/lib/adminAuth';
import { appendAuditRecord, recordAdminAccess } from '@/lib/auditLedger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }
    
    // Parse request body
    const body = await request.json();
    const { badgeUid, userId, userName, department } = body;
    
    // Validate required fields
    if (!badgeUid || typeof badgeUid !== 'string') {
      return NextResponse.json(
        { error: 'badgeUid is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Enroll badge
    const mapping = await badgeRegistry.enroll({
      badgeUid: badgeUid.trim(),
      userId: userId.trim(),
      userName,
      department,
    });
    
    // Record badge enrollment in audit ledger
    await appendAuditRecord('badge.enroll', { type: 'admin', id: 'admin' }, {
      target: { type: 'badge', id: badgeUid.trim() },
      meta: { userId: userId.trim(), userName, department },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Badge enrolled successfully',
      mapping: {
        badgeUid: mapping.badgeUid,
        userId: mapping.userId,
        userName: mapping.userName,
        department: mapping.department,
        enrolledAt: mapping.enrolledAt,
        active: mapping.active,
      },
    });
  } catch (error) {
    console.error('[BadgeEnroll] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
