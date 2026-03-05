/**
 * ITSM Vendor Configuration API
 * 
 * Route: /api/admin/integrations/itsm/[vendor]
 * GET - Get vendor config (redacted)
 * PUT - Update vendor config
 * DELETE - Delete vendor config
 * POST /test - Test connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getITSMConfig, 
  getITSMConfigWithCredentials,
  getITSMConfigByVendor,
  updateITSMConfig, 
  deleteITSMConfig, 
  updateLastTestResult,
  ITSMVendor,
  CreateITSMConfigRequest,
  UpdateITSMConfigRequest,
} from '@/lib/integrations/itsm/store';
import { createITSMAdapter } from '@/lib/integrations/itsm/adapter';
import { requireAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/integrations/itsm/[vendor]
 * Get ITSM configuration for a vendor (redacted - no credentials)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendor: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    
    const { vendor } = await params;
    
    // Validate vendor
    if (!['servicenow', 'jira', 'zendesk', 'freshservice', 'bmc-helix', 'ivanti', 'manageengine'].includes(vendor)) {
      return NextResponse.json(
        { error: `Invalid vendor: ${vendor}` },
        { status: 400 }
      );
    }
    
    const config = await getITSMConfigByVendor(vendor as ITSMVendor);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }
    
    // Return without credentials
    const { credentials, ...redacted } = config;
    return NextResponse.json(redacted);
  } catch (error) {
    console.error('Failed to get ITSM config:', error);
    return NextResponse.json(
      { error: 'Failed to get ITSM configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/integrations/itsm/[vendor]
 * Update ITSM configuration for a vendor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vendor: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    
    const { vendor } = await params;
    
    // Validate vendor
    if (!['servicenow', 'jira', 'zendesk', 'freshservice', 'bmc-helix', 'ivanti', 'manageengine'].includes(vendor)) {
      return NextResponse.json(
        { error: `Invalid vendor: ${vendor}` },
        { status: 400 }
      );
    }
    
    const existing = await getITSMConfigByVendor(vendor as ITSMVendor);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Configuration not found. Use POST to create.' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    const input: UpdateITSMConfigRequest = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.instanceUrl !== undefined && { instanceUrl: body.instanceUrl }),
      ...(body.table !== undefined && { table: body.table }),
      ...(body.projectKey !== undefined && { projectKey: body.projectKey }),
      ...(body.subdomain !== undefined && { subdomain: body.subdomain }),
      ...(body.credentials !== undefined && { credentials: body.credentials }),
      ...(body.clearCredentials !== undefined && { clearCredentials: body.clearCredentials }),
    };
    
    const updated = await updateITSMConfig(existing.id, input);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update ITSM config:', error);
    return NextResponse.json(
      { error: 'Failed to update ITSM configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/integrations/itsm/[vendor]
 * Delete ITSM configuration for a vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vendor: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    
    const { vendor } = await params;
    
    // Validate vendor
    if (!['servicenow', 'jira', 'zendesk', 'freshservice', 'bmc-helix', 'ivanti', 'manageengine'].includes(vendor)) {
      return NextResponse.json(
        { error: `Invalid vendor: ${vendor}` },
        { status: 400 }
      );
    }
    
    const existing = await getITSMConfigByVendor(vendor as ITSMVendor);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }
    
    const deleted = await deleteITSMConfig(existing.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete ITSM config:', error);
    return NextResponse.json(
      { error: 'Failed to delete ITSM configuration' },
      { status: 500 }
    );
  }
}
