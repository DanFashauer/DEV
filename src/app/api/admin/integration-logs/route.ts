/**
 * Integration Logs API
 * 
 * GET /api/admin/integration-logs
 * Returns mock integration payloads for demo visibility
 */

import { NextResponse } from 'next/server';
import { getIntegrationLogs, type IntegrationLog } from '@/lib/integrationLogs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const logs = getIntegrationLogs(20);
  
  const siemLogs = logs.filter(l => l.type === 'siem');
  const itsmLogs = logs.filter(l => l.type === 'itsm');
  const nacLogs = logs.filter(l => l.type === 'nac');
  
  return NextResponse.json({
    logs,
    summary: {
      total: logs.length,
      siem: siemLogs.length,
      itsm: itsmLogs.length,
      nac: nacLogs.length,
    },
    latestPayloads: {
      siem: siemLogs[0]?.payload || null,
      itsm: itsmLogs[0]?.payload || null,
      nac: nacLogs[0]?.payload || null,
    },
  });
}
