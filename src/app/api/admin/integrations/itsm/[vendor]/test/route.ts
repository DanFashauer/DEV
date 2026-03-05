/**
 * ITSM Connection Test API
 * 
 * Route: /api/admin/integrations/itsm/[vendor]/test
 * POST - Test connection to ITSM vendor (dry-run)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getITSMConfigWithCredentials, 
  updateLastTestResult,
  ITSMVendor,
} from '@/lib/integrations/itsm/store';
import { createITSMAdapter } from '@/lib/integrations/itsm/adapter';
import { requireAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/integrations/itsm/[vendor]/test
 * Test connection to ITSM vendor
 * 
 * Creates a dry-run ticket to verify connectivity and credentials.
 */
export async function POST(
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
    const validVendors = ['servicenow', 'jira', 'zendesk', 'freshservice', 'bmc-helix', 'ivanti', 'manageengine'];
    if (!validVendors.includes(vendor)) {
      return NextResponse.json(
        { error: `Invalid vendor: ${vendor}` },
        { status: 400 }
      );
    }
    
    // Get config with credentials
    const config = await getITSMConfigWithCredentials(vendor as ITSMVendor);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }
    
    // Create adapter
    const adapter = createITSMAdapter(vendor as ITSMVendor, config);
    
    if (!adapter) {
      await updateLastTestResult(config.id, 'failed');
      return NextResponse.json(
        { error: 'Failed to create adapter - check configuration' },
        { status: 400 }
      );
    }
    
    // Test connection using healthCheck if available, otherwise try dry-run ticket
    let success = false;
    let message = '';
    let details: Record<string, unknown> = {};
    
    try {
      if (adapter.healthCheck) {
        success = await adapter.healthCheck();
        if (success) {
          message = 'Health check passed';
        } else {
          message = 'Health check failed';
        }
      } else {
        // Fallback: try to create a dry-run ticket
        const testTicket = {
          title: '[DRY-RUN] Test Connection',
          description: 'This is a dry-run test ticket to verify connectivity.',
          severity: 'low' as const,
          category: 'test',
          source: 'itsm-integration-test',
        };
        
        const result = await adapter.createTicket(testTicket);
        success = true;
        message = 'Dry-run ticket created successfully';
        details = { ticketId: result.ticketId, ticketUrl: result.ticketUrl };
      }
    } catch (err) {
      success = false;
      message = err instanceof Error ? err.message : 'Unknown error';
      details = { error: message };
    }
    
    // Update last test result
    await updateLastTestResult(config.id, success ? 'success' : 'failed');
    
    // Log - skip audit for now since itsm.ticket.* types don't exist yet
    console.log(`[ITSM Test] ${vendor}: ${success ? 'SUCCESS' : 'FAILED'} - ${message}`);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message,
        vendor,
        ...details,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Connection test failed',
        vendor,
        error: message,
        details,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('ITSM test failed:', error);
    return NextResponse.json(
      { error: 'Failed to test ITSM connection' },
      { status: 500 }
    );
  }
}
