/**
 * ITSM Integration Admin API
 * 
 * Base route for ITSM integrations management.
 * GET /api/admin/integrations/itsm - List all ITSM configurations
 * POST /api/admin/integrations/itsm - Create new ITSM configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createITSMConfig, listITSMConfigs, seedTicketTemplates } from '@/lib/integrations/itsm/store';
import { requireAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/integrations/itsm
 * List all ITSM configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    
    // Seed templates on first access (in background, non-blocking)
    seedTicketTemplates().catch(console.error);
    
    const configs = await listITSMConfigs();
    
    return NextResponse.json({
      configs,
      templates: ['lost_device', 'auth_failure_spike', 'noncompliant_device', 'policy_quarantine'],
    });
  } catch (error) {
    console.error('Failed to list ITSM configs:', error);
    return NextResponse.json(
      { error: 'Failed to list ITSM configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/itsm
 * Create a new ITSM configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    
    const body = await request.json();
    
    const config = await createITSMConfig({
      name: body.name,
      vendor: body.vendor,
      enabled: body.enabled ?? true,
      instanceUrl: body.instanceUrl,
      table: body.table,
      projectKey: body.projectKey,
      subdomain: body.subdomain,
      credentials: body.credentials,
    });
    
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Failed to create ITSM config:', error);
    return NextResponse.json(
      { error: 'Failed to create ITSM configuration' },
      { status: 500 }
    );
  }
}
