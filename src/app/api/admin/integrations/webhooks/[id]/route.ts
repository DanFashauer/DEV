/**
 * Webhook Single API Routes
 * 
 * Admin CRUD for single webhook:
 * - PATCH /api/admin/integrations/webhooks/:id (update)
 * - DELETE /api/admin/integrations/webhooks/:id (delete)
 * 
 * Step-up authentication required for:
 * - Secret rotation (PATCH with secret fields)
 * - Deletion (DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateWebhook, deleteWebhook, getWebhook } from '@/lib/integrations/webhooks/store';
import { UpdateWebhookSchema } from '@/lib/integrations/webhooks/types';
import { requireAdminAuth, requireStepUpAuth } from '@/lib/adminAuth';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if the update request includes secret rotation
 */
function includesSecretRotation(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const obj = body as Record<string, unknown>;
  return 'signingSecret' in obj || 'authHeader' in obj;
}

// ============================================================================
// PATCH /api/admin/integrations/webhooks/:id
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // First, require admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;
    
    const { id } = await params;
    
    // Check if webhook exists
    const existing = await getWebhook(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate request
    const parsed = UpdateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if this update includes secret rotation - require step-up
    if (includesSecretRotation(body)) {
      const stepUpError = await requireStepUpAuth(request, 'webhook_secret_rotate');
      if (stepUpError) return stepUpError;
    }

    // Update webhook
    const webhook = await updateWebhook(id, parsed.data);

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/admin/integrations/webhooks/:id
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // First, require admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;
    
    // Require step-up for deletion (high-risk operation)
    const stepUpError = await requireStepUpAuth(request, 'admin_delete');
    if (stepUpError) return stepUpError;
    
    const { id } = await params;
    
    // Check if webhook exists
    const existing = await getWebhook(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Delete webhook
    const deleted = await deleteWebhook(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
