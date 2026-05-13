# SignalGrid demo media capture

SignalGrid includes a local, repeatable capture workflow for buyer- and investor-ready demo assets from the deterministic `/demo` experience. All generated outputs are clearly labeled as demo/simulated and are created from local app state only.

## What the workflow captures

The capture script writes files to `artifacts/demo-media/`:

- `01-demo-overview.png` — the initial `/demo` overview page.
- `02-compliant-access-granted.png` — the compliant device scenario ending in `ACCESS_GRANTED`.
- `03-non-compliant-device-non-compliant.png` — the non-compliant device scenario ending in `DEVICE_NON_COMPLIANT`.
- `04-unknown-posture-fail-closed.png` — the unknown posture scenario ending in `DEVICE_POSTURE_UNKNOWN`.
- `signalgrid-demo.mp4` — short browser-captured demo video when Playwright video capture and MP4 conversion are supported.
- `signalgrid-demo.webm` — WebM fallback when Playwright can record video but `ffmpeg` is unavailable for MP4 conversion.
- `storyboard-*.html` and `storyboard-*.svg` — deterministic fallback storyboards generated from `src/lib/demo/scenarios.ts`.
- `capture-report.json` — machine-readable status, artifact paths, and any capture blocker.

## Run locally

From the repository root:

```bash
npm run demo:media
```

The script first checks for a local app server at `http://localhost:3000`. If no server is reachable, it starts the app with `npm run dev`, waits for it to become healthy, captures media, and then stops the server it started.

To point at an already-running server:

```bash
DEMO_MEDIA_BASE_URL=http://localhost:3000 DEMO_MEDIA_EXPECT_SERVER=1 npm run demo:media
```

To customize how the script starts the app:

```bash
DEMO_MEDIA_SERVER_COMMAND="npm run dev" npm run demo:media
```

## Screenshots only

Use this when you want deterministic PNG assets and do not need video:

```bash
npm run demo:screenshots
```

## Video capture

Use this when the local environment has Playwright browser binaries available:

```bash
npm run demo:video
```

Playwright records browser video as WebM. If `ffmpeg` is installed, the script converts the recording to `artifacts/demo-media/signalgrid-demo.mp4`. If `ffmpeg` is not installed, the script keeps a `signalgrid-demo.webm` fallback and records that in `capture-report.json`.

## If Chromium or Playwright is unavailable

The workflow is designed not to fail the whole task just because browser automation is blocked. When Playwright cannot launch Chromium, when browser binaries are missing, or when no local app server is reachable, the script still writes:

- `storyboard-compliant.html` / `storyboard-compliant.svg`
- `storyboard-non-compliant.html` / `storyboard-non-compliant.svg`
- `storyboard-unknown.html` / `storyboard-unknown.svg`
- `capture-report.json`

Review `capture-report.json` for the exact blocker. Common fixes are:

```bash
npx playwright install chromium
```

or installing OS packages required by Chromium in the local environment. If you cannot install browsers in the environment, use the generated HTML/SVG storyboards as static customer-safe demo assets.

## Safety guarantees

The capture workflow only drives the deterministic `/demo` browser flow and `/api/demo/session-start` demo endpoint. It does not call real webhooks, does not mutate production data, and does not introduce paid external-service dependencies. The generated media includes simulated/demo labels so screenshots and videos are not confused with production evidence.

## Using assets in investor and customer demos

Recommended usage:

1. Start with `01-demo-overview.png` to explain the safe demo contract: deterministic inputs, no real webhooks, and no production data mutation.
2. Show `02-compliant-access-granted.png` to demonstrate the happy path and explain how identity, posture, location, and runtime risk combine into `ACCESS_GRANTED`.
3. Show `03-non-compliant-device-non-compliant.png` to demonstrate policy enforcement and remediation guidance without external side effects.
4. Show `04-unknown-posture-fail-closed.png` to demonstrate fail-closed handling when posture data is incomplete.
5. Use `signalgrid-demo.mp4` (or the WebM fallback) as a short asynchronous leave-behind for buyers and investors.
6. If browser screenshots are unavailable, use the HTML/SVG storyboards as static slides. They are generated from the same deterministic scenario source as the live demo.

Do not present these assets as production screenshots. They are simulated demo media intended for product walkthroughs, sales enablement, and investor/customer education.
