/**
 * Demo Mode Configuration
 * 
 * When DEMO_MODE=true, the system:
 * - Always seeds known scenarios
 * - Always produces DENY flow for compliance testing
 * - No randomness
 */

export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const DEMO_CONFIG = {
  // Device that will always fail compliance
  jailbrokenDeviceId: 'iPad-Nurse-Station-01',
  
  // Badge that will be used
  demoBadgeUid: 'badge-healthcare-001',
  
  // Demo user
  demoUser: 'jane.nurse@hospital.org',
  demoUserName: 'Jane Nurse',
  
  // Expected outcome in demo mode
  expectedDecision: 'DENY' as const,
  expectedActions: ['quarantine_device', 'emit_siem_event', 'send_itsm_ticket'],
};

export function isDemoMode(): boolean {
  return DEMO_MODE;
}
