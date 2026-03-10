/**
 * Demo Validate Script
 * 
 * One-command pilot demo check:
 * - Checks server health
 * - Runs demo:seed
 * - Runs demo:flow
 * - Runs audit:verify
 * - Emits summary to scripts/reports/demo-validate-report.json
 * 
 * Usage:
 *   bun run demo:validate
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const REPORTS_DIR = join(process.cwd(), 'scripts', 'reports');

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

interface Report {
  suite: string;
  status: 'pass' | 'fail';
  startedAt: string;
  finishedAt: string;
  checks: { name: string; status: string; duration: number }[];
  failures: { name: string; error: string }[];
  correlationIds: string[];
  recommendations: string[];
}

const report: Report = {
  suite: 'demo-validate',
  status: 'pass',
  startedAt: new Date().toISOString(),
  checks: [],
  failures: [],
  correlationIds: [],
  recommendations: [],
};

function addCheck(name: string, passed: boolean, duration: number) {
  report.checks.push({
    name,
    status: passed ? 'pass' : 'fail',
    duration,
  });
  if (!passed) {
    report.status = 'fail';
  }
}

function addFailure(name: string, error: string) {
  report.failures.push({ name, error });
  report.status = 'fail';
  report.recommendations.push(`Investigate: ${name} - ${error}`);
}

function addCorrelationId(id: string) {
  report.correlationIds.push(id);
}

async function runCommand(cmd: string, args: string[], label: string): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`\n📋 ${label}...`);
    
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0;
      addCheck(label, passed, duration);
      
      if (passed) {
        console.log(`✅ ${label} passed (${duration}ms)`);
      } else {
        console.log(`❌ ${label} failed (${duration}ms)`);
        addFailure(label, `Exit code: ${code}`);
      }
      
      resolve(passed);
    });
    
    proc.on('error', (error) => {
      const duration = Date.now() - startTime;
      addCheck(label, false, duration);
      addFailure(label, error.message);
      resolve(false);
    });
  });
}

async function checkServerHealth(): Promise<boolean> {
  console.log(`\n🔍 Checking server health at ${SERVER_URL}...`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(SERVER_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Server is healthy');
      addCheck('server-health', true, 0);
      return true;
    } else {
      console.log(`❌ Server responded with status ${response.status}`);
      addCheck('server-health', false, 0);
      addFailure('server-health', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server is not reachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    addCheck('server-health', false, 0);
    addFailure('server-health', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  SignalGrid - Demo Validation                              ║
║                                                                            ║
║  Runs complete demo validation for pilot readiness                         ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();
  
  // Step 1: Check server health
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('\n❌ Server is not running. Start with: bun run dev');
    report.status = 'fail';
    report.recommendations.push('Start the development server before running demo validation');
    saveReport();
    process.exit(1);
  }

  // Step 2: Run demo:seed
  await runCommand('bun', ['run', 'demo:seed'], 'demo:seed');

  // Step 3: Run demo:flow
  await runCommand('bun', ['run', 'demo:flow'], 'demo:flow');

  // Step 4: Verify audit ledger
  await runCommand('bun', ['run', 'audit:verify'], 'audit:verify');

  // Finalize report
  report.finishedAt = new Date().toISOString();
  
  const totalDuration = Date.now() - startTime;
  
  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         VALIDATION SUMMARY                                   ║
╚════════════════════════════════════════════════════════════════════════════╝

  Suite: ${report.suite}
  Status: ${report.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
  Duration: ${totalDuration}ms
  
  Checks: ${report.checks.filter(c => c.status === 'pass').length}/${report.checks.length} passed
  
  ${report.failures.length > 0 ? `
  Failures:
${report.failures.map(f => `    - ${f.name}: ${f.error}`).join('\n')}
  ` : ''}
  
  ${report.recommendations.length > 0 ? `
  Recommendations:
${report.recommendations.map(r => `    - ${r}`).join('\n')}
  ` : ''}
  `);

  saveReport();
  
  process.exit(report.status === 'pass' ? 0 : 1);
}

function saveReport() {
  const reportPath = join(REPORTS_DIR, 'demo-validate-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch((error) => {
  console.error('❌ Demo validation failed:', error);
  report.status = 'fail';
  report.finishedAt = new Date().toISOString();
  addFailure('main', error.message);
  saveReport();
  process.exit(1);
});
