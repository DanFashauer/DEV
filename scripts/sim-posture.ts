#!/usr/bin/env bun
// Simulate posture updates from FleetDM for testing
// Usage: bun run scripts/sim-posture.ts --device-id <id> --compliant <true|false>

const args = process.argv.slice(2);
let deviceId = 'test-device-001';
let compliant = true;
let platform = 'darwin';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--device-id' && args[i + 1]) {
    deviceId = args[i + 1];
    i++;
  } else if (args[i] === '--compliant' && args[i + 1]) {
    compliant = args[i + 1] === 'true';
    i++;
  } else if (args[i] === '--platform' && args[i + 1]) {
    platform = args[i + 1];
    i++;
  }
}

const postureSignal = {
  hostUuid: deviceId,
  platform,
  compliant,
  lastCheckAt: new Date().toISOString(),
  policies: [
    {
      id: 1,
      name: 'FileVault Enabled',
      response: compliant ? 'pass' : 'fail',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Firewall Enabled',
      response: compliant ? 'pass' : 'fail',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Anti-virus Running',
      response: compliant ? 'pass' : 'fail',
      updatedAt: new Date().toISOString(),
    },
  ],
  rawSignals: {
    os_version: '14.2.1',
    hardware_model: 'MacBookPro18,1',
    serial_number: 'C02ABC123DEF',
    uptime: 86400,
    memory: 32768,
  },
};

console.log('📤 Simulating posture update:');
console.log(JSON.stringify(postureSignal, null, 2));

// Simulate API call to store posture
// In real implementation, this would call the FleetDM adapter
console.log('\n✅ Posture signal generated');
console.log('   Device:', deviceId);
console.log('   Platform:', platform);
console.log('   Compliant:', compliant);
console.log('   Policies:', postureSignal.policies.length);
console.log('\n💡 To use with the backend, POST to /api/location/report with:');
console.log(JSON.stringify({
  deviceId,
  location: {
    mode: 'presence',
    zone: 'hq',
  },
  posture: postureSignal,
}, null, 2));
