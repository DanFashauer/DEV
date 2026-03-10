/**
 * Test Failure Summarizer
 * 
 * Reads reports from scripts/reports and prints a concise summary.
 * 
 * Usage:
 *   bun run test:summary
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = join(process.cwd(), 'scripts', 'reports');

interface Report {
  suite: string;
  status: 'pass' | 'fail';
  startedAt: string;
  finishedAt: string;
  checks: { name: string; status: string; duration: number }[];
  failures: { name: string; error: string }[];
  recommendations: string[];
}

function getReportFiles(): string[] {
  if (!existsSync(REPORTS_DIR)) {
    return [];
  }
  
  return readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('-report.json') || f.endsWith('.json'))
    .map(f => join(REPORTS_DIR, f));
}

function loadReport(filepath: string): Report | null {
  try {
    const content = readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load report: ${filepath}`, error);
    return null;
  }
}

function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    Test Failure Summary                                     ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  const reportFiles = getReportFiles();
  
  if (reportFiles.length === 0) {
    console.log('📋 No test reports found in scripts/reports/');
    console.log('\nRun tests first to generate reports:');
    console.log('  - bun run demo:validate');
    console.log('  - bun run test:api');
    console.log('  - bun run test:security');
    console.log('  - bun run test:e2e');
    return;
  }

  console.log(`Found ${reportFiles.length} report(s)\n`);

  let totalSuites = 0;
  let passedSuites = 0;
  let failedSuites = 0;
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let allFailures: { suite: string; name: string; error: string }[] = [];
  let allRecommendations: string[] = [];

  for (const filepath of reportFiles) {
    const report = loadReport(filepath);
    if (!report) continue;

    totalSuites++;
    
    if (report.status === 'pass') {
      passedSuites++;
    } else {
      failedSuites++;
    }

    if (report.checks) {
      for (const check of report.checks) {
        totalChecks++;
        if (check.status === 'pass') {
          passedChecks++;
        } else {
          failedChecks++;
        }
      }
    }

    if (report.failures) {
      for (const failure of report.failures) {
        allFailures.push({
          suite: report.suite,
          name: failure.name,
          error: failure.error,
        });
      }
    }

    if (report.recommendations) {
      allRecommendations.push(...report.recommendations);
    }
  }

  // Print summary
  console.log(`Total Suites: ${totalSuites}`);
  console.log(`  ✅ Passed: ${passedSuites}`);
  console.log(`  ❌ Failed: ${failedSuites}`);
  console.log();
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`  ✅ Passed: ${passedChecks}`);
  console.log(`  ❌ Failed: ${failedChecks}`);
  console.log();

  if (allFailures.length > 0) {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            FAILURES                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log();
    
    for (const failure of allFailures) {
      console.log(`❌ ${failure.suite} > ${failure.name}`);
      console.log(`   Error: ${failure.error}`);
      console.log();
    }
  }

  if (allRecommendations.length > 0) {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         RECOMMENDATIONS                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log();
    
    // Deduplicate recommendations
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    for (const recommendation of uniqueRecommendations) {
      console.log(`💡 ${recommendation}`);
    }
    console.log();
  }

  if (failedSuites === 0) {
    console.log('🎉 All tests passed! System is ready for pilot.');
  } else {
    console.log(`⚠️  ${failedSuites} suite(s) failed. Review failures above.`);
    process.exit(1);
  }
}

main();
