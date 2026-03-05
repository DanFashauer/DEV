/**
 * Location Signal Simulator
 * 
 * Simulates location signals from MDM, NAC, RTLS, or device-side sources.
 * Useful for testing the location signal API and audit ledger integration.
 * 
 * Usage:
 *   bun scripts/sim-location.ts
 *   bun scripts/sim-location.ts --deviceId kiosk-001 --zoneId ER-WAITING
 *   bun scripts/sim-location.ts --mode coarse --buildingId MAIN --floorId 2
 */

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const baseUrl = arg("baseUrl", "http://localhost:3000");
const deviceId = arg("deviceId", "dev-device-001");
const mode = (arg("mode", "presence") as "presence" | "coarse" | "precise");
const source = arg("source", "device.wifi");
const zoneId = arg("zoneId", "ER-TRIAGE");

const payload: any = {
  deviceId,
  observedAt: Date.now(),
  source,
  mode,
  siteId: arg("siteId", "HOSPITAL-001"),
  buildingId: arg("buildingId", "MAIN"),
  floorId: arg("floorId", "1"),
  zoneId,
};

if (mode === "precise") {
  payload.lat = Number(arg("lat", "28.5383"));
  payload.lon = Number(arg("lon", "-81.3792"));
  payload.accuracyM = Number(arg("accuracyM", "12"));
}

// Optional network context
if (arg("ip")) payload.ip = arg("ip");
if (arg("wifiBssid")) payload.wifiBssid = arg("wifiBssid");
if (arg("apName")) payload.apName = arg("apName");

async function main() {
  console.log(`[sim-location] Sending location signal to ${baseUrl}`);
  console.log(`[sim-location] Payload:`, JSON.stringify(payload, null, 2));

  const res = await fetch(`${baseUrl}/api/location/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(`[sim-location] Status: ${res.status}`);
  const text = await res.text();
  console.log(`[sim-location] Response:`, text);

  if (!res.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[sim-location] Error:`, err);
  process.exit(1);
});
