#!/usr/bin/env bun
/**
 * Demo Control Script
 * 
 * Usage:
 *   bun run demo:up     - Start server, wait for health, print URLs
 *   bun run demo:down   - Stop server
 *   bun run demo:reset - Clear and reseed demo state
 *   bun run demo:exec   - Run the executive demo (existing)
 *   bun run demo:doctor - Diagnose demo environment
 */

const DEMO_PORT = process.env.PORT || '3000';
const SERVER_URL = `http://localhost:${DEMO_PORT}`;

async function checkPort(port: string): Promise<{ inUse: boolean; process?: string }> {
  try {
    const net = await import('node:net');

    const inUse = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host: '127.0.0.1', port: Number(port) });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        resolve(false);
      });
      socket.setTimeout(1000, () => {
        socket.destroy();
        resolve(false);
      });
    });

    return inUse
      ? { inUse: true, process: `Something is listening on port ${port}` }
      : { inUse: false };
  } catch {
    return { inUse: false };
  }
}

async function verifySignalGrid(): Promise<{ healthy: boolean; message: string }> {
  try {
    const res = await fetch(`${SERVER_URL}/api/health`);
    if (res.ok) {
      const data = await res.json();
      return { healthy: true, message: JSON.stringify(data) };
    }
    return { healthy: false, message: `Health endpoint returned ${res.status}` };
  } catch (e) {
    return { healthy: false, message: `Cannot connect: ${e}` };
  }
}

async function verifyDemoRoutes(): Promise<{ available: boolean; message: string }> {
  try {
    const res = await fetch(`${SERVER_URL}/api/demo/verify`);
    if (res.ok) {
      return { available: true, message: 'Demo verify endpoint available' };
    }
    return { available: false, message: `Demo verify returned ${res.status}` };
  } catch (e) {
    return { available: false, message: `Cannot connect: ${e}` };
  }
}

async function runDoctor() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              SignalGrid Demo Doctor                         ║
╚══════════════════════════════════════════════════════════════╝
`);
  
  let allPass = true;
  
  // Check port
  console.log('📋 Checking port usage...');
  const portCheck = await checkPort(DEMO_PORT);
  if (portCheck.inUse) {
    console.log(`  ⚠️  Port ${DEMO_PORT} is in use`);
    console.log(`      ${portCheck.process?.split('\n').join('\n      ')}`);
    
    // Check if it's SignalGrid
    console.log('\n📡 Checking if SignalGrid is running...');
    const health = await verifySignalGrid();
    if (health.healthy) {
      console.log('  ✅ SignalGrid is running on this port');
      console.log(`      ${health.message}`);
    } else {
      console.log(`  ❌ Port ${DEMO_PORT} is occupied by another process`);
      console.log(`      ${health.message}`);
      if (DEMO_PORT !== '3000') {
        console.log(`\n💡 Try: SERVER_URL=http://localhost:${DEMO_PORT} bun run demo:exec`);
      } else {
        console.log('\n💡 Try: PORT=3011 bun run demo:up');
      }
      allPass = false;
    }
    
    // Check demo routes
    console.log('\n📡 Checking demo routes...');
    const routes = await verifyDemoRoutes();
    if (routes.available) {
      console.log('  ✅ /api/demo/verify is available');
    } else {
      console.log(`  ❌ ${routes.message}`);
      allPass = false;
    }
  } else {
    console.log(`  ✅ Port ${DEMO_PORT} is free`);
    console.log('\n💡 Run: bun run demo:up to start the server');
    allPass = false;
  }
  
  console.log('\n' + '='.repeat(62));
  if (allPass) {
    console.log('✅ PASS: Demo environment is healthy');
    console.log('\nNext: bun run demo:exec');
  } else {
    console.log('❌ FAIL: Demo environment needs attention');
  }
  console.log('='.repeat(62) + '\n');
  
  process.exit(allPass ? 0 : 1);
}

async function runReport() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              SignalGrid Demo Report                          ║
╚══════════════════════════════════════════════════════════════╝
`);

  const timestamp = new Date().toISOString();
  console.log(`🕐 Timestamp: ${timestamp}`);
  console.log(`🔌 Port: ${DEMO_PORT}`);
  console.log(`🌐 Server: ${SERVER_URL}`);
  console.log('');

  // Check health
  console.log('🔍 Health Check:');
  const health = await verifySignalGrid();
  if (health.healthy) {
    console.log('  ✅ PASS: /api/health OK');
  } else {
    console.log(`  ❌ FAIL: ${health.message}`);
    console.log('\n💡 Run: bun run demo:up first');
    process.exit(1);
  }

  // Check demo routes
  console.log('\n🔍 Demo Routes:');
  const routes = await verifyDemoRoutes();
  if (routes.available) {
    console.log('  ✅ PASS: /api/demo/verify OK');
  } else {
    console.log(`  ❌ FAIL: ${routes.message}`);
    process.exit(1);
  }

  // Check verify endpoint status
  console.log('\n🔍 Verify Endpoint Status:');
  try {
    const verifyRes = await fetch(`${SERVER_URL}/api/demo/verify`);
    const verifyData = await verifyRes.json();
    console.log(`  Status: ${verifyData.status}`);
    console.log(`  Decision: ${verifyData.decision}`);
    console.log(`  Actions: ${verifyData.actions?.join(', ') || 'none'}`);
    console.log(`  Timeline Complete: ${verifyData.timelineComplete}`);
    console.log(`  Event Counts:`);
    console.log(`    - Total: ${verifyData.eventCounts?.total || 0}`);
    console.log(`    - Denied: ${verifyData.eventCounts?.denied || 0}`);
    console.log(`    - Allowed: ${verifyData.eventCounts?.allowed || 0}`);
    console.log(`    - Quarantined: ${verifyData.eventCounts?.quarantined || 0}`);
    console.log(`    - SIEM: ${verifyData.eventCounts?.siemAlerts || 0}`);
    console.log(`    - ITSM: ${verifyData.eventCounts?.itsmTickets || 0}`);
  } catch (e) {
    console.log(`  ❌ FAIL: Cannot parse verify response`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(62));
  console.log('✅ Demo Report Complete');
  console.log('='.repeat(62) + '\n');
}

async function startServer() {
  console.log('🚀 Starting SignalGrid demo...\n');
  
  // Check if port is already in use
  const portCheck = await checkPort(DEMO_PORT);
  if (portCheck.inUse) {
    console.log(`⚠️  Port ${DEMO_PORT} is already in use. Checking if it's SignalGrid...`);
    const health = await verifySignalGrid();
    if (health.healthy) {
      console.log('✅ SignalGrid is already running!');
      printUrls();
      return;
    }
    console.log(`❌ Port ${DEMO_PORT} is occupied by another process.`);
    console.log(`    ${portCheck.process}`);
    console.log('\n💡 Try: PORT=3011 bun run demo:up');
    process.exit(1);
  }
  
  const { spawn } = await import('child_process');
  
  // Start server in background
  const demoEnv = {
    ...process.env,
    PORT: DEMO_PORT,
    ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'dev-admin-key-12345',
    BACKEND_SIGNING_SECRET:
      process.env.BACKEND_SIGNING_SECRET || 'development-secret-key-do-not-use-in-production',
  };

  const serverProcess = spawn('bun', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: demoEnv,
    detached: true,
  });
  
  // Write PID to file for cleanup
  const pidFile = '/tmp/signalgrid-demo.pid';
  await Bun.write(pidFile, serverProcess.pid.toString());
  
  serverProcess.stdout?.on('data', (data) => {
    const str = data.toString();
    process.stdout.write(str);
    if (str.includes('Ready in') || str.includes('compiled')) {
      checkHealth();
    }
  });
  
  serverProcess.stderr?.on('data', (data) => {
    process.stderr.write(data.toString());
  });
  
  async function checkHealth() {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${SERVER_URL}/api/health`);
        if (res.ok) {
          console.log('\n✅ Server ready!\n');
          printUrls();
          return;
        }
      } catch {}
      attempts++;
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.error('❌ Server failed to start');
    process.exit(1);
  }
}

function printUrls() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📍 Admin Portal:    http://localhost:${DEMO_PORT}/admin`);
  console.log(`📍 Health Check:    http://localhost:${DEMO_PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Env defaults used by demo:');
  console.log('  - ADMIN_API_KEY=dev-admin-key-12345 (if not already set)');
  console.log('  - BACKEND_SIGNING_SECRET=development-secret-key-do-not-use-in-production (if not already set)');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Open http://localhost:${DEMO_PORT}/admin in your browser`);
  if (DEMO_PORT !== '3000') {
    console.log(`  2. SERVER_URL=http://localhost:${DEMO_PORT} bun run demo:exec`);
  } else {
    console.log('  2. bun run demo:exec');
  }
  console.log('  3. Watch events appear in the dashboard\n');
}

async function stopServer() {
  console.log('🛑 Stopping SignalGrid demo...\n');

  const pidFile = '/tmp/signalgrid-demo.pid';

  try {
    const pidText = await Bun.readFile(pidFile).then((b) => b.toString()).catch(() => '');
    const pid = Number.parseInt(pidText, 10);
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        process.kill(pid, 'SIGTERM');
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch {
    // ignore
  }

  // Safety fallback for orphan dev processes
  try {
    await Bun.$`pkill -f '/workspace/DEV/node_modules/.bin/next dev'`.quiet();
  } catch {
    // ignore when no process matches
  }

  await Bun.write(pidFile, '');
  console.log('✅ Demo services stopped');
}

async function resetDemo() {
  console.log('🔄 Resetting demo state...\n');
  
  // Clear any existing state
  const { clearSecurityEvents } = await import('./src/lib/securityEvents.ts');
  if (clearSecurityEvents) {
    clearSecurityEvents();
    console.log('✅ Security events cleared');
  }
  
  console.log('✅ Demo state reset complete');
  console.log('\nRun bun run demo:exec to generate new events');
}

const commandArg = process.argv[2] || '';
const command = commandArg.replace('demo:', '') || '';

switch (command) {
  case 'up':
    startServer();
    break;
  case 'down':
    stopServer();
    break;
  case 'reset':
    resetDemo();
    break;
  case 'doctor':
    runDoctor();
    break;
  case 'report':
    runReport();
    break;
  default:
    console.log(`
SignalGrid Demo Control

Usage:
  bun run demo:up     Start demo server and show URLs
  bun run demo:down   Stop demo server
  bun run demo:reset  Clear demo state
  bun run demo:exec   Run executive demo scenario
  bun run demo:doctor Diagnose demo environment
  bun run demo:report Print demo status report
  bun run demo:exec   Run executive demo scenario
  bun run demo:doctor Diagnose demo environment

Quick Start:
  1. bun run demo:up     # Starts server, opens admin portal
  2. bun run demo:exec   # Runs the demo scenario
  3. bun run demo:down   # When done, stops server

Alternative Port:
  PORT=3011 bun run demo:up   # Use port 3011 if 3000 is busy
`);
}
