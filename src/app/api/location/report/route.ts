import { NextResponse } from "next/server";
import type { LocationSignal } from "@/lib/location/types";
import { validateLocationSignal } from "@/lib/location/validate";
import { createLocationStore } from "@/lib/location/store";
import { dispatchIntegrationEvent } from "@/lib/integrations/dispatcher";
import { recordLocationObservation } from "@/lib/auditLedger";

export const dynamic = "force-dynamic";

/**
 * Location Signal Report API
 * 
 * Receives location signals from MDM, NAC, RTLS, or device-side sources.
 * Validates, stores, writes to audit ledger, and dispatches to webhooks.
 * 
 * Security:
 * - Device-bound tokens (future)
 * - Rate limiting (future)
 * - Audit ledger for tamper evidence
 * - HMAC-signed webhooks
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LocationSignal | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const v = validateLocationSignal(body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const store = await createLocationStore();
  await store.upsert(body);

  // Write to tamper-evident audit ledger
  await recordLocationObservation(body.deviceId, {
    observedAt: body.observedAt,
    source: body.source,
    mode: body.mode,
    siteId: body.siteId,
    buildingId: body.buildingId,
    floorId: body.floorId,
    zoneId: body.zoneId,
    lat: body.lat,
    lon: body.lon,
    accuracyM: body.accuracyM,
  });

  // Dispatch to webhook integrations
  await dispatchIntegrationEvent({
    type: "asset.location.observed",
    occurredAt: Date.now(),
    deviceId: body.deviceId,
    payload: { ...body },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
