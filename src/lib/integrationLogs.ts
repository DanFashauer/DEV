/**
 * Integration Logs Store
 * 
 * Tracks mock integration payloads for demo visibility
 */

export interface IntegrationLog {
  id: string;
  type: 'siem' | 'itsm' | 'nac';
  timestamp: string;
  payload: Record<string, unknown>;
  status: 'sent' | 'pending' | 'failed';
}

const integrationLogs: IntegrationLog[] = [];

export function addIntegrationLog(type: IntegrationLog['type'], payload: Record<string, unknown>) {
  const log: IntegrationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    payload,
    status: 'sent',
  };
  integrationLogs.unshift(log);
  
  // Keep last 20 logs
  if (integrationLogs.length > 20) {
    integrationLogs.length = 20;
  }
  
  console.log(`[IntegrationLog] ${type.toUpperCase()} event logged`);
}

export function getIntegrationLogs(limit = 10): IntegrationLog[] {
  return integrationLogs.slice(0, limit);
}

export function getIntegrationLogsByType(type: IntegrationLog['type']): IntegrationLog[] {
  return integrationLogs.filter(log => log.type === type);
}

export function clearIntegrationLogs() {
  integrationLogs.length = 0;
}
