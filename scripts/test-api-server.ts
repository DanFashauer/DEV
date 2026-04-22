#!/usr/bin/env bun

import { spawn } from 'node:child_process';

const PORT = Number(process.env.TEST_SERVER_PORT || '3010');
const SERVER_URL = `http://localhost:${PORT}`;
const HEALTH_URL = `${SERVER_URL}/api/health`;
const SERVER_SUITES = [
  'tests/api/integrations-itsm.test.ts',
  'tests/api/integrations-webhooks.test.ts',
  'tests/api/location-report.test.ts',
  'tests/api/policies.test.ts',
  'tests/api/webauthn-admin.test.ts',
];

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function isHealthy() {
  try {
    const res = await fetch(HEALTH_URL);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isHealthy()) return true;
    await sleep(1000);
  }
  return false;
}

function startDetachedServer() {
  const child = spawn('bun', ['run', 'dev', '--port', String(PORT)], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT) },
  });
  child.unref();
  return child.pid ?? 0;
}

async function stopServer(serverPid?: number) {
  if (serverPid && Number.isFinite(serverPid) && serverPid > 0) {
    try {
      process.kill(-serverPid, 'SIGTERM');
      await sleep(500);
    } catch {
      try {
        process.kill(serverPid, 'SIGTERM');
      } catch {
        // ignore
      }
    }
  }

  // Safety fallback for orphaned Next.js test server processes
  try {
    await Bun.$`pkill -f 'next dev --port ${PORT}'`.quiet();
  } catch {
    // ignore when no process matches
  }
}

async function main() {
  let exitCode = 0;
  let spawnedPid: number | undefined;
  const serverWasAlreadyRunning = await isHealthy();

  try {
    if (!serverWasAlreadyRunning) {
      console.log(`🚀 Starting test server on ${SERVER_URL}...`);
      spawnedPid = startDetachedServer();

      const healthy = await waitForHealth();
      if (!healthy) {
        throw new Error(`Test server did not become healthy at ${HEALTH_URL}`);
      }
    } else {
      console.log(`✅ Reusing existing test server at ${SERVER_URL}`);
    }

    console.log('🧪 Running server-dependent API suites...');
    await Bun.$`bunx vitest run ${SERVER_SUITES}`;
  } catch (error) {
    exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Server-dependent API tests failed: ${message}`);
  } finally {
    if (!serverWasAlreadyRunning) {
      console.log('🛑 Stopping test server...');
      await stopServer(spawnedPid);
    }
  }

  process.exit(exitCode);
}

main();
