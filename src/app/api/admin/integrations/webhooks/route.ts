/**
 * Webhooks API Routes
 * 
 * Admin CRUD for webhook endpoints:
 * - POST   /api/admin/integrations/webhooks      (create)
 * - GET    /api/admin/integrations/webhooks      (list)
 */

import { NextResponse } from 'next/server';
import { createWebhook, listWebhooks, getWebhook } from '@/lib/integrations/webhooks/store';
import { CreateWebhookSchema } from '@/lib/integrations/webhooks/types';

/**
 * POST /api/admin/integrations/webhooks
 * Create a new webhook endpoint
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const parsed = CreateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Create webhook
    const webhook = await createWebhook(parsed.data);

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/integrations/webhooks
 * List all webhooks
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID provided, return single webhook
    if (id) {
      const webhook = await getWebhook(id);
      if (!webhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(webhook);
    }

    // Return all webhooks
    const webhooks = await listWebhooks();
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Failed to list webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}
