/**
 * Demo Flow Script
 * 
 * Runs a complete end-to-end demonstration of the SignalGrid/EnterpriseShell system.
 * This script creates a polished, deterministic demo for sales and pilot scenarios.
 * 
 * Demo Story:
 * 1. Healthcare scenario: Nurse badges into shared iPad at nurse station
 * 2. FleetDM reports device out of compliance (jailbroken)
 * 3. Policy triggers: quarantine_device + create_itsm_ticket
 * 4. SIEM event sent to security team
 * 5. NAC enforces network quarantine
 * 
 * Usage: 
 *   bun run demo:flow              # Run full demo
 *   bun run demo:flow --healthcare # Healthcare scenario only
 *   bun run demo:flow --retail     # Retail scenario only
 *   bun run demo:flow --logistics # Logistics scenario only
 */

const DEMO_DELAY_MS = 300;

// Demo scenario configurations
const SCENARIOS = {
  healthcare: {
    name: "Healthcare - Shared iPad",
    description: "Nurse station tablet with shared badge access",
    deviceId: "iPad-Nurse-Station-01",
    badgeUid: "badge-healthcare-001",
    user: "jane.nurse@hospital.org",
    riskLevel: "medium",
    violations: ["device.jailbroken"],
  },
  retail: {
    name: "Retail - POS Tablet",
    description: "Store checkout tablet with inventory access",
    deviceId: "POS-Tablet-Store-42",
    badgeUid: "badge-retail-001",
    user: "bob.cashier@retail.com",
    riskLevel: "low",
    violations: [],
  },
  logistics: {
    name: "Logistics - Warehouse Android",
    description: "Warehouse device with shipping permissions",
    deviceId: "Android-Warehouse-07",
    badgeUid: "badge-logistics-001",
    user: "mike.warehouse@logistics.com",
    riskLevel: "high",
    violations: ["os.outdated", "encryption.disabled"],
  },
};

// Helper to run a command with delay and formatting
async function runCommand(
  label: string, 
  command: string,
  emoji: string = "📋"
): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${emoji} ${label}`);
  console.log('='.repeat(60));
  
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${label} - SUCCESS`);
        resolve(true);
      } else {
        console.log(`\n❌ ${label} - FAILED (exit code: ${code})`);
        resolve(false);
      }
    });
  });
}

// Print banner
function printBanner() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  SignalGrid - End-to-End Demo Flow                        ║
║                                                                            ║
║  Automated demonstration of shared device security and compliance         ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

// Print scenario info
function printScenario(scenario: keyof typeof SCENARIOS) {
  const s = SCENARIOS[scenario];
  console.log(`
┌────────────────────────────────────────────────────────────────────────────┐
│  SCENARIO: ${s.name}
├────────────────────────────────────────────────────────────────────────────┤
│  ${s.description}
│  
│  Device:    ${s.deviceId}
│  User:      ${s.user}
│  Risk:      ${s.riskLevel.toUpperCase()}
│  Violations: ${s.violations.length > 0 ? s.violations.join(', ') : 'None'}
└────────────────────────────────────────────────────────────────────────────┘
  `);
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let scenario: keyof typeof SCENARIOS | 'all' = 'all';
  
  if (args.includes('--healthcare')) scenario = 'healthcare';
  else if (args.includes('--retail')) scenario = 'retail';
  else if (args.includes('--logistics')) scenario = 'logistics';
  
  printBanner();
  
  // Check if server is running
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
  
  console.log(`\n🔍 Checking server at ${SERVER_URL}...`);
  
  try {
    const healthResponse = await fetch(SERVER_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (healthResponse.ok) {
      console.log('✅ Server is running and responding\n');
    } else {
      console.log(`❌ Server responded with status ${healthResponse.status}`);
      console.log('\n💡 Start the server with: bun run dev');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Server is not reachable');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('\n💡 Start the server with: bun run dev');
    process.exit(1);
  }

  const results: { step: string; success: boolean }[] = [];

  // Run selected scenarios
  const scenariosToRun = scenario === 'all' 
    ? (Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[])
    : [scenario];

  for (const s of scenariosToRun) {
    printScenario(s);
    
    const scenarioConfig = SCENARIOS[s];
    
    // Step 1: Seed policies for the scenario
    console.log('\n📋 Step 1: Seeding policies...');
    const seedPoliciesResult = await runCommand(
      'Seeding policies for demo scenario',
      'bun run seed:policies'
    );
    results.push({ step: `seed:policies (${s})`, success: seedPoliciesResult });
    await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
    
    // Step 2: Enroll badge then simulate badge scan → session start
    console.log(`\n📋 Step 2: Enroll badge and scan for ${s}...`);
    const simBadgeResult = await runCommand(
      `Simulating badge scan for ${scenarioConfig.name}`,
      `bun run sim:badge --enroll --deviceId "${scenarioConfig.deviceId}" --badgeUid "${scenarioConfig.badgeUid}" --user "${scenarioConfig.user}"`
    );
    results.push({ step: `sim:badge (${s})`, success: simBadgeResult });
    await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
    
    // Step 3: Simulate posture check (if violations exist)
    if (scenarioConfig.violations.length > 0) {
      console.log(`\n📋 Step 3: FleetDM posture check (${s})...`);
      const simPostureResult = await runCommand(
        `Simulating FleetDM posture check with violations`,
        `bun run sim:posture --deviceId "${scenarioConfig.deviceId}" --violations "${scenarioConfig.violations.join(',')}"`
      );
      results.push({ step: `sim:posture (${s})`, success: simPostureResult });
      await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
    }
    
    // Step 4: Report location
    console.log(`\n📋 Step 4: Location signal report (${s})...`);
    const simLocationResult = await runCommand(
      'Reporting location signal',
      'bun run sim:location'
    );
    results.push({ step: `sim:location (${s})`, success: simLocationResult });
    await new Promise(r => setTimeout(r, DEMO_DELAY_MS));
  }

  // Final step: Verify audit
  console.log(`\n📋 Final Step: Audit verification...`);
  const auditVerifyResult = await runCommand(
    'Verifying audit ledger integrity',
    'bun run audit:verify',
    "🔐"
  );
  results.push({ step: 'audit:verify', success: auditVerifyResult });

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         DEMO SUMMARY                                        ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
  
  let allPassed = true;
  for (const r of results) {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}  ${r.step}`);
    if (!r.success) allPassed = false;
  }
  
  console.log(`
${allPassed ? '🎉 All demo steps completed successfully!' : '⚠️  Some steps failed - check logs above'}

Demo scenarios run: ${scenariosToRun.join(', ')}

For admin dashboard: open http://localhost:3000/admin
Navigate to "Receipts" tab to see the full demo story!

Demo completed at: ${new Date().toISOString()}
  `);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
