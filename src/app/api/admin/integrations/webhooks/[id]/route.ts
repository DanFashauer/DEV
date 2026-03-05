/**
 * Webhook Single API Routes
 * 
 * Admin CRUD for single webhook:
 * - PATCH /api/admin/integrations/webhooks/:id (update)
 * - DELETE /api/admin/integrations/webhooks/:id (delete)
 */

import { NextResponse } from 'next/server';
import { updateWebhook, deleteWebhook, getWebhook } from '@/lib/integrations/webhooks/store';
import { UpdateWebhookSchema } from '@/lib/integrations/webhooks/types';

/**
 * PATCH /api/admin/integrations/webhooks/:id
 * Update a webhook
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

/**
 * DELETE /api/admin/integrations/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
