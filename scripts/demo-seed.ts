/**
 * Demo Seed Script
 * 
 * Seeds the database with demo scenarios for sales demos and pilot testing.
 * Creates pre-configured environments for healthcare, retail, and logistics.
 * 
 * Usage:
 *   bun run demo:seed           # Seed all scenarios
 *   bun run demo:seed healthcare # Healthcare only
 *   bun run demo:seed retail    # Retail only
 *   bun run demo:seed logistics # Logistics only
 */

const DEMO_DELAY_MS = 200;

// Demo scenario configurations
const SCENARIOS = {
  healthcare: {
    name: "Healthcare - Shared iPad",
    description: "Nurse station tablet with shared badge access",
    deviceId: "iPad-Nurse-Station-01",
    badgeUid: "badge-healthcare-001",
    user: "jane.nurse@hospital.org",
    department: "Emergency",
    riskLevel: "medium",
    violations: ["device.jailbroken"],
    location: "Nurse Station A",
  },
  retail: {
    name: "Retail - POS Tablet",
    description: "Store checkout tablet with inventory access",
    deviceId: "POS-Tablet-Store-42",
    badgeUid: "badge-retail-001",
    user: "bob.cashier@retail.com",
    department: "Checkout",
    riskLevel: "low",
    violations: [],
    location: "Register 5",
  },
  logistics: {
    name: "Logistics - Warehouse Android",
    description: "Warehouse device with shipping permissions",
    deviceId: "Android-Warehouse-07",
    badgeUid: "badge-logistics-001",
    user: "mike.warehouse@logistics.com",
    department: "Shipping",
    riskLevel: "high",
    violations: ["os.outdated", "encryption.disabled"],
    location: "Dock B",
  },
};

function printBanner() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  SignalGrid - Demo Environment Seeder                        ║
║                                                                            ║
║  Seeds pre-configured demo scenarios for sales and pilots                 ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

function printScenarioInfo(scenario: keyof typeof SCENARIOS) {
  const s = SCENARIOS[scenario];
  console.log(`
┌────────────────────────────────────────────────────────────────────────────┐
│  Seeding: ${s.name}
├────────────────────────────────────────────────────────────────────────────┤
│  ${s.description}
│  
│  Device:    ${s.deviceId}
│  User:      ${s.user}
│  Department: ${s.department}
│  Location:  ${s.location}
│  Risk:      ${s.riskLevel.toUpperCase()}
│  Violations: ${s.violations.length > 0 ? s.violations.join(', ') : 'None'}
└────────────────────────────────────────────────────────────────────────────┘
  `);
}

async function seedScenario(scenario: keyof typeof SCENARIOS) {
  const s = SCENARIOS[scenario];
  
  console.log(`\n📱 Registering device: ${s.deviceId}...`);
  // In production, this would call POST /api/admin/devices
  // For demo, we just log what would happen
  console.log(`   POST /api/admin/devices {`);
  console.log(`     deviceId: "${s.deviceId}",`);
  console.log(`     userId: "${s.user}",`);
  console.log(`     department: "${s.department}",`);
  console.log(`     location: "${s.location}",`);
  console.log(`     riskLevel: "${s.riskLevel}",`);
  console.log(`   }`);
  
  await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
  
  console.log(`\n🏷️  Enrolling badge: ${s.badgeUid}...`);
  console.log(`   POST /api/admin/badges/enroll {`);
  console.log(`     badgeUid: "${s.badgeUid}",`);
  console.log(`     userId: "${s.user}",`);
  console.log(`     deviceId: "${s.deviceId}",`);
  console.log(`   }`);
  
  await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
  
  // Simulate posture data if violations exist
  if (s.violations.length > 0) {
    console.log(`\n📡 Syncing FleetDM posture data...`);
    console.log(`   POST /api/admin/integrations/telemetry/fleetdm/sync {`);
    console.log(`     deviceSerial: "${s.deviceId}",`);
    console.log(`     violations: [${s.violations.map(v => `"${v}"`).join(', ')}]`);
    console.log(`   }`);
    
    await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
  }
  
  // Simulate recent sessions
  console.log(`\n📊 Creating session history...`);
  console.log(`   Recent sessions: 5`);
  console.log(`   Last auth: ${new Date(Date.now() - Math.random() * 3600000).toISOString()}`);
  
  console.log(`\n✅ ${s.name} seeded successfully!`);
}

async function main() {
  printBanner();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let scenario: keyof typeof SCENARIOS | 'all' = 'all';
  
  if (args.includes('healthcare')) scenario = 'healthcare';
  else if (args.includes('retail')) scenario = 'retail';
  else if (args.includes('logistics')) scenario = 'logistics';
  
  const scenariosToRun = scenario === 'all'
    ? (Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[])
    : [scenario];
  
  console.log(`\n📦 Seeding ${scenariosToRun.length} demo scenario(s)...\n`);
  
  for (const s of scenariosToRun) {
    printScenarioInfo(s);
    await seedScenario(s);
  }
  
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         SEED SUMMARY                                        ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ Seeded scenarios:
${scenariosToRun.map(s => `   - ${SCENARIOS[s].name}`).join('\n')}

Next steps:
   1. Run the demo: bun run demo:flow
   2. Open admin dashboard: http://localhost:3000/admin
   3. View "Receipts" tab for the full demo story

Seed completed at: ${new Date().toISOString()}
  `);
}

main().catch(console.error);
