#!/usr/bin/env bun

import { mkdirSync, writeFileSync } from 'node:fs';
import { copyFile, readdir, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { demoScenarios, type DemoScenario } from '../src/lib/demo/scenarios';

type PlaywrightModule = typeof import('@playwright/test');
type Browser = Awaited<ReturnType<PlaywrightModule['chromium']['launch']>>;
type BrowserContext = Awaited<ReturnType<Browser['newContext']>>;
type Page = Awaited<ReturnType<BrowserContext['newPage']>>;

type CaptureReport = {
  generatedAt: string;
  baseUrl: string;
  outputDir: string;
  simulated: true;
  safety: {
    deterministicDataOnly: true;
    webhooksCalled: false;
    productionDataMutated: false;
  };
  server: {
    startedByScript: boolean;
    health: 'ok' | 'unavailable';
  };
  browserAutomation: {
    available: boolean;
    blocker?: string;
  };
  screenshots: string[];
  storyboard: string[];
  video?: string;
  notes: string[];
};

type CaptureMode = 'media' | 'screenshots' | 'video';

const REPO_ROOT = resolve(import.meta.dir, '..');
const OUTPUT_DIR = join(REPO_ROOT, 'artifacts', 'demo-media');
const VIDEO_TMP_DIR = join(OUTPUT_DIR, '.video');
const DEFAULT_BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1440, height: 1400 };

const scenarioOutputs: Record<DemoScenario['id'], string> = {
  compliant: '02-compliant-access-granted.png',
  'non-compliant': '03-non-compliant-device-non-compliant.png',
  unknown: '04-unknown-posture-fail-closed.png',
};

const report: CaptureReport = {
  generatedAt: new Date().toISOString(),
  baseUrl: process.env.DEMO_MEDIA_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE_URL,
  outputDir: OUTPUT_DIR,
  simulated: true,
  safety: {
    deterministicDataOnly: true,
    webhooksCalled: false,
    productionDataMutated: false,
  },
  server: {
    startedByScript: false,
    health: 'unavailable',
  },
  browserAutomation: {
    available: false,
  },
  screenshots: [],
  storyboard: [],
  notes: [],
};

function ensureOutputDir() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function artifactPath(filename: string) {
  return join(OUTPUT_DIR, filename);
}

function relativeArtifactPath(path: string) {
  return path.replace(`${REPO_ROOT}/`, '');
}

async function sleep(ms: number) {
  await new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function isServerHealthy(baseUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_500);

  try {
    const response = await fetch(baseUrl, { signal: controller.signal });
    return response.ok || response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(baseUrl: string, timeoutMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerHealthy(baseUrl)) {
      return true;
    }
    await sleep(1_000);
  }
  return false;
}

async function ensureServer(baseUrl: string): Promise<ChildProcess | null> {
  if (await isServerHealthy(baseUrl)) {
    report.server.health = 'ok';
    report.notes.push(`Using existing local app server at ${baseUrl}.`);
    return null;
  }

  if (process.env.DEMO_MEDIA_EXPECT_SERVER === '1') {
    report.notes.push(`No app server responded at ${baseUrl}; DEMO_MEDIA_EXPECT_SERVER=1 prevented auto-start.`);
    return null;
  }

  const command = process.env.DEMO_MEDIA_SERVER_COMMAND ?? 'npm run dev';
  report.notes.push(`No app server responded at ${baseUrl}; starting '${command}'.`);
  const child = spawn(command, {
    cwd: REPO_ROOT,
    shell: true,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: new URL(baseUrl).port || process.env.PORT || '3000' },
  });

  report.server.startedByScript = true;
  child.stdout?.on('data', (chunk: Buffer) => process.stdout.write(`[demo-server] ${chunk.toString()}`));
  child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(`[demo-server] ${chunk.toString()}`));

  const healthy = await waitForServer(baseUrl, Number(process.env.DEMO_MEDIA_SERVER_TIMEOUT_MS ?? 60_000));
  report.server.health = healthy ? 'ok' : 'unavailable';
  if (!healthy) {
    report.notes.push(`Started server command did not become healthy before timeout: ${baseUrl}.`);
  }
  return child;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toneForScenario(scenario: DemoScenario) {
  if (scenario.outcome === 'ACCESS_GRANTED') {
    return { border: '#34d399', background: '#052e1b', badge: '#10b981' };
  }
  if (scenario.outcome === 'DEVICE_NON_COMPLIANT') {
    return { border: '#fb7185', background: '#3f0f18', badge: '#e11d48' };
  }
  return { border: '#a3a3a3', background: '#262626', badge: '#737373' };
}

function storyboardHtmlForScenario(scenario: DemoScenario) {
  const tone = toneForScenario(scenario);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SignalGrid demo storyboard - ${escapeHtml(scenario.cardTitle)}</title>
    <style>
      body { margin: 0; background: #020617; color: #f8fafc; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width: 1200px; min-height: 760px; padding: 56px; box-sizing: border-box; }
      .eyebrow { color: #67e8f9; font-size: 15px; letter-spacing: .22em; text-transform: uppercase; font-weight: 800; }
      h1 { margin: 20px 0 12px; font-size: 52px; line-height: 1; letter-spacing: -.04em; max-width: 920px; }
      .summary { color: #cbd5e1; font-size: 22px; line-height: 1.5; max-width: 980px; }
      .grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 28px; margin-top: 36px; }
      .card { border: 1px solid #334155; background: rgba(15, 23, 42, .82); border-radius: 28px; padding: 28px; box-shadow: 0 24px 80px rgba(0,0,0,.25); }
      .outcome { border-color: ${tone.border}; background: ${tone.background}; }
      .label { color: #94a3b8; font-size: 13px; letter-spacing: .18em; text-transform: uppercase; font-weight: 800; }
      .outcome h2 { overflow-wrap: anywhere; font-size: 42px; margin: 18px 0; }
      .badge { display: inline-block; border-radius: 999px; padding: 10px 14px; background: ${tone.badge}; color: white; font-weight: 800; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
      ul { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 14px; }
      li { border: 1px solid #334155; border-radius: 18px; padding: 16px; background: #0f172a; }
      strong { display: block; font-size: 17px; margin-bottom: 6px; }
      span, code { color: #cbd5e1; font-size: 15px; line-height: 1.45; }
      footer { margin-top: 34px; display: flex; gap: 18px; color: #a5f3fc; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">SignalGrid simulated demo storyboard</p>
      <h1>${escapeHtml(scenario.headline)}</h1>
      <p class="summary">${escapeHtml(scenario.summary)}</p>
      <section class="grid">
        <article class="card">
          <p class="label">Signals evaluated</p>
          <ul>
            ${scenario.signals
              .map((signal) => `<li><strong>${escapeHtml(signal.label)}</strong><span>${escapeHtml(signal.value)}</span></li>`)
              .join('\n            ')}
          </ul>
        </article>
        <article class="card outcome">
          <p class="label">Final outcome</p>
          <h2>${escapeHtml(scenario.outcome)}</h2>
          <p class="summary">${escapeHtml(scenario.operatorMessage)}</p>
          <p class="badge">Simulated HTTP ${scenario.simulatedHttpStatus}</p>
        </article>
      </section>
      <section class="card" style="margin-top: 28px;">
        <p class="label">Decision timeline</p>
        <ul>
          ${scenario.timeline
            .map((item, index) => `<li><strong>${index + 1}. ${escapeHtml(item.step)}</strong><span>${escapeHtml(item.detail)}</span></li>`)
            .join('\n          ')}
        </ul>
      </section>
      <footer>
        <span>Demo/simulated only</span>
        <span>No real webhooks called</span>
        <span>No production data mutated</span>
      </footer>
    </main>
  </body>
</html>`;
}

function storyboardSvgForScenario(scenario: DemoScenario) {
  const tone = toneForScenario(scenario);
  const signals = scenario.signals
    .map((signal, index) => {
      const y = 270 + index * 74;
      return `<rect x="70" y="${y}" width="500" height="54" rx="14" fill="#0f172a" stroke="#334155"/><text x="92" y="${y + 23}" fill="#f8fafc" font-size="18" font-weight="700">${escapeHtml(signal.label)}</text><text x="92" y="${y + 43}" fill="#cbd5e1" font-size="14">${escapeHtml(signal.value)}</text>`;
    })
    .join('');
  const timeline = scenario.timeline
    .map((item, index) => {
      const y = 530 + index * 56;
      return `<circle cx="92" cy="${y}" r="17" fill="${tone.badge}"/><text x="88" y="${y + 6}" fill="white" font-size="16" font-weight="800">${index + 1}</text><text x="124" y="${y - 5}" fill="#f8fafc" font-size="18" font-weight="700">${escapeHtml(item.step)}</text><text x="124" y="${y + 17}" fill="#cbd5e1" font-size="14">${escapeHtml(item.detail).slice(0, 110)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <rect width="1200" height="820" fill="#020617"/>
  <text x="70" y="72" fill="#67e8f9" font-family="Arial, sans-serif" font-size="16" font-weight="800" letter-spacing="4">SIGNALGRID SIMULATED DEMO</text>
  <text x="70" y="138" fill="#f8fafc" font-family="Arial, sans-serif" font-size="50" font-weight="800">${escapeHtml(scenario.cardTitle)}</text>
  <foreignObject x="70" y="165" width="900" height="84"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#cbd5e1;font:22px Arial,sans-serif;line-height:1.35">${escapeHtml(scenario.summary)}</div></foreignObject>
  <rect x="620" y="270" width="500" height="210" rx="24" fill="${tone.background}" stroke="${tone.border}"/>
  <text x="650" y="320" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="3">FINAL OUTCOME</text>
  <foreignObject x="650" y="345" width="420" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#f8fafc;font:800 38px Arial,sans-serif;line-height:1.05;overflow-wrap:anywhere">${escapeHtml(scenario.outcome)}</div></foreignObject>
  <foreignObject x="650" y="422" width="410" height="44"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#e2e8f0;font:16px Arial,sans-serif;line-height:1.35">${escapeHtml(scenario.operatorMessage)}</div></foreignObject>
  <text x="70" y="245" fill="#94a3b8" font-family="Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="3">SIGNALS EVALUATED</text>
  ${signals}
  <text x="70" y="500" fill="#94a3b8" font-family="Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="3">DECISION TIMELINE</text>
  ${timeline}
  <text x="70" y="785" fill="#a5f3fc" font-family="Arial, sans-serif" font-size="18" font-weight="700">Demo/simulated only • No real webhooks called • No production data mutated</text>
</svg>`;
}

function writeStoryboards() {
  for (const scenario of demoScenarios) {
    const htmlPath = artifactPath(`storyboard-${scenario.id}.html`);
    const svgPath = artifactPath(`storyboard-${scenario.id}.svg`);
    writeFileSync(htmlPath, storyboardHtmlForScenario(scenario));
    writeFileSync(svgPath, storyboardSvgForScenario(scenario));
    report.storyboard.push(relativeArtifactPath(htmlPath), relativeArtifactPath(svgPath));
  }
}

async function loadPlaywright() {
  return import('@playwright/test')
    .then((module) => module)
    .catch((error: unknown) => {
      report.browserAutomation.blocker = error instanceof Error ? error.message : String(error);
      return null;
    });
}

async function waitForDemoPage(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' });
  await page.getByText('SignalGrid interactive demo').waitFor({ timeout: 15_000 });
}

async function captureOverview(page: Page) {
  const output = artifactPath('01-demo-overview.png');
  await page.screenshot({ path: output, fullPage: true });
  report.screenshots.push(relativeArtifactPath(output));
}

async function captureScenario(page: Page, scenario: DemoScenario) {
  const card = page.locator('article').filter({ hasText: scenario.cardTitle }).first();
  await card.getByRole('button', { name: 'Run scenario' }).click();
  await page.getByText(`Safe demo session returned`).waitFor({ timeout: 15_000 });
  await page.getByText(scenario.outcome).first().waitFor({ timeout: 15_000 });
  const output = artifactPath(scenarioOutputs[scenario.id]);
  await page.screenshot({ path: output, fullPage: true });
  report.screenshots.push(relativeArtifactPath(output));
}

function hasFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return result.status === 0;
}

async function convertVideoToMp4(inputPath: string, outputPath: string) {
  await new Promise<void>((resolveConvert, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', '-i', inputPath, '-movflags', '+faststart', '-pix_fmt', 'yuv420p', outputPath], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolveConvert();
      } else {
        reject(new Error(`ffmpeg exited with code ${code ?? 'unknown'}`));
      }
    });
    ffmpeg.on('error', reject);
  });
}

async function captureWithBrowser(playwright: PlaywrightModule, baseUrl: string, mode: CaptureMode) {
  await rm(VIDEO_TMP_DIR, { recursive: true, force: true });
  mkdirSync(VIDEO_TMP_DIR, { recursive: true });

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: mode !== 'screenshots' ? { dir: VIDEO_TMP_DIR, size: { width: 1440, height: 900 } } : undefined,
  });
  const page = await context.newPage();

  try {
    await waitForDemoPage(page, baseUrl);
    if (mode !== 'video') {
      await captureOverview(page);
    }

    for (const scenario of demoScenarios) {
      await captureScenario(page, scenario);
      await sleep(400);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  if (mode !== 'screenshots') {
    const files = await readdir(VIDEO_TMP_DIR).catch(() => []);
    const videoFile = files.find((file) => file.endsWith('.webm'));
    if (!videoFile) {
      report.notes.push('Playwright did not produce a browser video file in this environment.');
      return;
    }

    const webmPath = join(VIDEO_TMP_DIR, videoFile);
    const mp4Path = artifactPath('signalgrid-demo.mp4');
    if (hasFfmpeg()) {
      try {
        await convertVideoToMp4(webmPath, mp4Path);
        report.video = relativeArtifactPath(mp4Path);
      } catch (error) {
        const fallbackWebm = artifactPath('signalgrid-demo.webm');
        await rename(webmPath, fallbackWebm);
        report.notes.push(
          `ffmpeg could not convert the video to MP4 (${error instanceof Error ? error.message : String(error)}); saved WebM fallback.`,
        );
        report.video = relativeArtifactPath(fallbackWebm);
      }
    } else {
      const fallbackWebm = artifactPath('signalgrid-demo.webm');
      await copyFile(webmPath, fallbackWebm);
      report.notes.push('ffmpeg is unavailable, so MP4 conversion was skipped; saved Playwright WebM fallback.');
      report.video = relativeArtifactPath(fallbackWebm);
    }
  }
}

function stopServer(server: ChildProcess | null) {
  if (!server?.pid) {
    return;
  }

  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

function writeReport() {
  const reportPath = artifactPath('capture-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${relativeArtifactPath(reportPath)}`);
}

function parseMode(): CaptureMode {
  const requested = process.env.DEMO_MEDIA_MODE ?? process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1];
  if (requested === 'screenshots' || requested === 'video') {
    return requested;
  }
  return 'media';
}

async function main() {
  ensureOutputDir();
  writeStoryboards();

  const mode = parseMode();
  const server = await ensureServer(report.baseUrl);

  try {
    if (report.server.health !== 'ok') {
      report.notes.push('Browser capture skipped because no local app server was reachable.');
      return;
    }

    const playwright = await loadPlaywright();
    if (!playwright) {
      report.notes.push('Browser capture skipped because Playwright could not be loaded.');
      return;
    }

    try {
      await captureWithBrowser(playwright, report.baseUrl, mode);
      report.browserAutomation.available = true;
    } catch (error) {
      report.browserAutomation.blocker = error instanceof Error ? error.message : String(error);
      report.notes.push('Browser capture was blocked; fallback storyboard artifacts were generated from deterministic scenarios.');
    }
  } finally {
    stopServer(server);
    writeReport();
  }

  console.log('\nGenerated demo media artifacts:');
  for (const path of [...report.screenshots, ...report.storyboard, ...(report.video ? [report.video] : [])]) {
    console.log(`- ${path}`);
  }

  if (!report.browserAutomation.available) {
    console.log('\nBrowser automation was unavailable; see artifacts/demo-media/capture-report.json for the blocker.');
  }
}

main().catch((error) => {
  report.notes.push(`Unexpected capture script error: ${error instanceof Error ? error.message : String(error)}`);
  writeReport();
  console.error(error);
  process.exit(1);
});
