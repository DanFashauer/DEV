/**
 * Test Server Bootstrap Script
 * 
 * Starts a Next.js dev server on a fixed port for testing,
 * waits for it to be healthy, and provides the server URL.
 * 
 * Usage:
 *   bun run scripts/test-server.ts start    # Start server
 *   bun run scripts/test-server.ts stop     # Stop server
 *   bun run scripts/test-server.ts wait     # Wait for health
 */

import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const PORT = 3010;
const HOST = `http://localhost:${PORT}`;
const MAX_WAIT_SECONDS = 60;
const HEALTH_ENDPOINT = '/api/health';

let serverProcess: ChildProcess | null = null;

/**
 * Kill any existing Next.js dev server processes on the test port
 */
async function killExistingServers(): Promise<void> {
  return new Promise((resolve) => {
    // Use lsof to find processes on the port
    const lsof = spawn('lsof', [`-ti:${PORT}`], { shell: true });
    
    let output = '';
    lsof.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    lsof.on('close', () => {
      if (output.trim()) {
        const pids = output.trim().split('\n').filter(Boolean);
        console.log(`Found ${pids.length} process(es) on port ${PORT}, killing...`);
        
        // Kill each PID
        for (const pid of pids) {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
          } catch (e) {
            // Process may already be gone
          }
        }
        
        // Give it a moment to clean up
        setTimeout(resolve, 1000);
      } else {
        resolve();
      }
    });
    
    lsof.on('error', () => {
      // lsof not available, try fuser
      const fuser = spawn('fuser', [`-k`, `${PORT}/tcp`], { shell: true });
      fuser.on('close', () => {
        setTimeout(resolve, 1000);
      });
    });
  });
}

/**
 * Wait for the server to be healthy
 */
async function waitForHealth(): Promise<boolean> {
  console.log(`Waiting for server health at ${HEALTH_ENDPOINT}...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_WAIT_SECONDS * 1000) {
    try {
      const response = await fetch(`${HOST}${HEALTH_ENDPOINT}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Server is healthy: ${JSON.stringify(data)}`);
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error(`Server did not become healthy within ${MAX_WAIT_SECONDS} seconds`);
  return false;
}

/**
 * Check if server is already healthy
 */
async function isServerHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${HOST}${HEALTH_ENDPOINT}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start the Next.js dev server (idempotent)
 */
async function startServer(): Promise<void> {
  // Check if server is already healthy - if so, reuse it
  if (await isServerHealthy()) {
    console.log(`✅ Server already running and healthy at ${HOST}`);
    console.log(`SERVER_URL=${HOST}`);
    console.log(`\nTo stop: bun run scripts/test-server.ts stop`);
    return;
  }
  
  console.log(`Starting Next.js dev server on port ${PORT}...`);
  
  // Start the server
  serverProcess = spawn('bun', ['run', 'dev', '--port', PORT.toString()], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: PORT.toString() },
  });
  
  serverProcess.stdout?.on('data', (data) => {
    process.stdout.write(`[dev] ${data}`);
  });
  
  serverProcess.stderr?.on('data', (data) => {
    process.stderr.write(`[dev] ${data}`);
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
  });
  
  // Wait for server to be healthy
  const healthy = await waitForHealth();
  
  if (!healthy) {
    console.error('Server failed to start');
    process.exit(1);
  }
  
  console.log(`\n✅ Server started successfully`);
  console.log(`SERVER_URL=${HOST}`);
  console.log(`\nTo stop: bun run scripts/test-server.ts stop`);
}

/**
 * Stop the server
 */
async function stopServer(): Promise<void> {
  console.log(`Stopping test server on port ${PORT}...`);
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
  
  await killExistingServers();
  console.log('✅ Server stopped');
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2] || 'start';
  
  switch (command) {
    case 'start':
      await startServer();
      break;
      
    case 'stop':
      await stopServer();
      break;
      
    case 'wait':
      const healthy = await waitForHealth();
      if (!healthy) {
        console.error('Server not healthy');
        process.exit(1);
      }
      console.log(`SERVER_URL=${HOST}`);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: test-server.ts [start|stop|wait]');
      process.exit(1);
  }
}

main().catch(console.error);
