/**
 * Badge List API Route
 * 
 * GET /api/admin/badges
 * 
 * Lists all badge to user mappings.
 * 
 * Security:
 * - Requires admin API key authentication
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { badgeRegistry } from '@/lib/badgeRegistry';
import { requireAdminAuth } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }
    
    // Get all badge mappings
    const mappings = await badgeRegistry.list();
    
    return NextResponse.json({
      success: true,
      count: mappings.length,
      mappings: mappings.map(m => ({
        badgeUid: m.badgeUid,
        userId: m.userId,
        userName: m.userName,
        department: m.department,
        enrolledAt: m.enrolledAt,
        lastUsedAt: m.lastUsedAt,
        active: m.active,
      })),
    });
  } catch (error) {
    console.error('[BadgeList] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
