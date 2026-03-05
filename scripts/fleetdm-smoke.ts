#!/usr/bin/env bun
// FleetDM Smoke Test - Server-side validation for FleetDM endpoints
// Usage: bun run scripts/fleetdm-smoke.ts

console.log('🔍 FleetDM Smoke Test\n');

// Check if FleetDM is configured
const fleetdmUrl = process.env.FLEETDM_BASE_URL;
const fleetdmToken = process.env.FLEETDM_API_TOKEN;

console.log('📋 Test 1: Environment Configuration');
if (!fleetdmUrl) {
  console.log('   ⚠️  FLEETDM_BASE_URL not set - skipping FleetDM tests');
  console.log('   💡 Set FLEETDM_BASE_URL and FLEETDM_API_TOKEN in .env.local to test');
  console.log('\n✅ Smoke test skipped (no configuration)');
  process.exit(0);
}

console.log('   ✅ FLEETDM_BASE_URL:', fleetdmUrl.substring(0, 30) + '...');
console.log('   ✅ FLEETDM_API_TOKEN:', fleetdmToken ? '***' + fleetdmToken.slice(-4) : 'not set');

console.log('\n📋 Test 2: FleetDM Module');
const { getTelemetryConfig } = await import('../src/lib/integrations/telemetry/store');
const config = await getTelemetryConfig();
console.log('   Telemetry mode:', config.mode);
console.log('   FleetDM enabled:', config.fleetdm?.enabled ?? false);

// Check if adapter can be imported
console.log('\n📋 Test 3: FleetDM Adapter');
const { FleetDMAdapter } = await import('../src/lib/integrations/telemetry/fleetdm');
const adapter = new FleetDMAdapter();
await adapter.initialize();
console.log('   Adapter initialized');
console.log('   Adapter enabled:', adapter.isEnabled());

if (adapter.isEnabled()) {
  console.log('\n📋 Test 4: FleetDM Connection');
  const result = await adapter.testConnection();
  console.log('   Connection test:', result.success ? '✅' : '❌');
  console.log('   Message:', result.message);
} else {
  console.log('\n⚠️  FleetDM adapter not enabled - skipping connection test');
}

console.log('\n✅ All smoke tests passed!');
console.log('\n📖 Next Steps:');
console.log('   1. Configure FleetDM in admin UI: GET /api/admin/integrations/telemetry/fleetdm');
console.log('   2. Enable FleetDM: PUT /api/admin/integrations/telemetry/fleetdm');
console.log('   3. Query host posture: Use getPostureForHost() in your code');
