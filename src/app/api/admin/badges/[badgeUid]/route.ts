/**
 * Badge Delete API Route
 * 
 * DELETE /api/admin/badges/:badgeUid
 * 
 * Deletes a badge to user mapping.
 * 
 * Security:
 * - Requires admin API key authentication
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { badgeRegistry } from '@/lib/badgeRegistry';
import { requireAdminAuth } from '@/lib/adminAuth';

interface RouteParams {
  params: Promise<{
    badgeUid: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate request
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }
    
    const { badgeUid } = await params;
    
    if (!badgeUid) {
      return NextResponse.json(
        { error: 'badgeUid is required' },
        { status: 400 }
      );
    }
    
    // Check if badge exists
    const existing = await badgeRegistry.get(badgeUid);
    if (!existing) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }
    
    // Delete badge mapping
    const deleted = await badgeRegistry.remove(badgeUid);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete badge' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Badge mapping removed',
    });
  } catch (error) {
    console.error('[BadgeDelete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
