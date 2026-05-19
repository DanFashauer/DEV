#!/usr/bin/env bun

import crypto from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

const PORT = Number(process.env.RC_SMOKE_PORT || '3000');
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key-12345';
const SIGNING_SECRET = process.env.DEVICE_WEBHOOK_SECRET || process.env.BACKEND_SIGNING_SECRET || 'dev-secret';

const localEnv = {
  ...process.env,
  PORT: String(PORT),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_API_KEY,
  DEVICE_WEBHOOK_SECRET: SIGNING_SECRET,
  BACKEND_SIGNING_SECRET: SIGNING_SECRET,
  UNKNOWN_POSTURE_MODE: process.env.UNKNOWN_POSTURE_MODE || 'allow',
  DISABLE_OUTBOUND_WEBHOOKS: '1',
  DEMO_MODE: '1',
};

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function record(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  const status = ok ? '✅' : '❌';
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ''}`);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function jsonFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  let body: any = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

async function isHealthy() {
  try {
    const r = await fetch(`${BASE_URL}/api/health`);
    return r.ok;
  } catch {
    return false;
  }
}

async function waitForHealthy(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isHealthy()) return true;
    await sleep(1000);
  }
  return false;
}

async function ensureServer(): Promise<{ child: ChildProcess | null; started: boolean }> {
  if (await isHealthy()) return { child: null, started: false };
  const child = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: localEnv,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  const healthy = await waitForHealthy();
  if (!healthy) throw new Error('Local server did not become healthy in time');
  return { child, started: true };
}

async function stopServer(child: ChildProcess | null, started: boolean) {
  if (!started) return;
  try {
    if (child?.pid) process.kill(-child.pid, 'SIGTERM');
  } catch {}
  try {
    await Bun.$`pkill -f 'next dev' || true`.quiet();
  } catch {}
}

function sign(payload: unknown) {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(JSON.stringify(payload)).digest('hex');
}

async function run() {
  let server: ChildProcess | null = null;
  let started = false;

  try {
    const ensured = await ensureServer();
    server = ensured.child;
    started = ensured.started;
    record('local server available', true, started ? 'started by rc-smoke' : 'reused existing');

    const health = await jsonFetch('/api/health');
    record('/api/health returns healthy', health.response.ok && (health.body?.ok === true || health.body?.status === 'healthy'));

    for (const scenario of ['all', 'compliant', 'non-compliant', 'unknown']) {
      const result = await jsonFetch(`/api/demo/verify?scenario=${scenario}`);
      record(`/api/demo/verify?scenario=${scenario} returns PASS`, result.response.ok && result.body?.status === 'PASS');
    }

    const v1Health = await jsonFetch('/api/v1/health');
    record('/api/v1/health returns healthy without auth', v1Health.response.ok && v1Health.body?.status === 'healthy');

    const devicesNoAuth = await jsonFetch('/api/v1/devices');
    record('/api/v1/devices fails without API key', devicesNoAuth.response.status === 401);

    const devicesWithAuth = await jsonFetch('/api/v1/devices', { headers: { 'x-api-key': ADMIN_API_KEY } });
    record('/api/v1/devices succeeds with ADMIN_API_KEY', devicesWithAuth.response.status === 200);

    const minimumPayload = {
      eventId: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      badge: { badgeId: 'badge-001', employeeId: 'emp-001', cardSerialNumber: 'csn-001' },
      device: { deviceId: 'device-001', deviceSerial: 'serial-001' },
      reader: { readerType: 'BLE' },
      context: { locationId: 'loc-001' },
    };

    const missingSig = await jsonFetch('/api/v1/session/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(minimumPayload),
    });
    record('/api/v1/session/start rejects missing signature', missingSig.response.status === 401);

    const malformedPayload = {
      timestamp: new Date().toISOString(),
      nonce: `malformed-${Date.now()}`,
      reader: { readerType: 'BLE' },
      context: { locationId: 'loc-001' },
    };
    const malformedSig = sign(malformedPayload);
    const malformed = await jsonFetch('/api/v1/session/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-signature': malformedSig },
      body: JSON.stringify(malformedPayload),
    });
    record('/api/v1/session/start rejects signed malformed payload with INVALID_SESSION_START_PAYLOAD', malformed.response.status === 400 && malformed.body?.code === 'INVALID_SESSION_START_PAYLOAD');

    const validSig = sign(minimumPayload);
    const valid = await jsonFetch('/api/v1/session/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-signature': validSig },
      body: JSON.stringify(minimumPayload),
    });
    record('/api/v1/session/start accepts valid signed minimum payload', valid.response.status === 200);

    await Bun.$`npm run demo:media`.env(localEnv);
    record('demo media generation produced artifacts/demo-media/capture-report.json', existsSync('artifacts/demo-media/capture-report.json'));
  } finally {
    await stopServer(server, started);
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    console.error(`\n❌ rc:smoke failed (${failed.length} checks).`);
    process.exit(1);
  }
  console.log(`\n✅ rc:smoke passed (${checks.length} checks).`);
}

run().catch((error) => {
  console.error(`❌ rc:smoke error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
