import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

type AuthResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

type SignatureResult =
  | { valid: true }
  | { valid: false; response: NextResponse };

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || "0.1.0";
const startedAt = Date.now();

const demoDevices = [
  {
    id: "device-healthcare-001",
    name: "Nurse Station iPad 01",
    status: "active",
    enrolled: true,
    enrolledAt: "2026-01-01T00:00:00.000Z",
    lastSeen: new Date().toISOString(),
    location: { zone: "nurse-station", building: "demo-hospital" },
  },
  {
    id: "device-logistics-001",
    name: "Dock Scanner 01",
    status: "active",
    enrolled: true,
    enrolledAt: "2026-01-01T00:00:00.000Z",
    lastSeen: new Date().toISOString(),
    location: { zone: "dock-3", building: "demo-warehouse" },
  },
  {
    id: "device-retail-001",
    name: "Front Counter Tablet 01",
    status: "inactive",
    enrolled: false,
    enrolledAt: null,
    lastSeen: new Date(Date.now() - 3_600_000).toISOString(),
    location: { zone: "front-counter", building: "demo-store" },
  },
];

const demoEvents = [
  {
    id: "evt-session-allowed-001",
    type: "session_allowed",
    severity: "info",
    deviceId: "device-healthcare-001",
    timestamp: new Date().toISOString(),
  },
  {
    id: "evt-session-denied-001",
    type: "session_denied",
    severity: "high",
    deviceId: "device-retail-001",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: "evt-quarantine-001",
    type: "quarantine",
    severity: "critical",
    deviceId: "device-logistics-001",
    timestamp: new Date(Date.now() - 120_000).toISOString(),
  },
];

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (!headers.has("X-Request-Id")) headers.set("X-Request-Id", crypto.randomUUID());
  return NextResponse.json(data, { ...init, headers });
}

function error(status: number, code: string, message: string) {
  return json(
    {
      error: message,
      code,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getConfiguredApiKey() {
  return process.env.ADMIN_API_KEY;
}

function getConfiguredHmacSecret() {
  return process.env.DEVICE_WEBHOOK_SECRET || process.env.BACKEND_SIGNING_SECRET;
}

function authorize(request: NextRequest): AuthResult {
  const configuredKey = getConfiguredApiKey();
  if (!configuredKey) {
    return {
      authorized: false,
      response: error(500, "API_KEY_NOT_CONFIGURED", "API key not configured"),
    };
  }

  const providedKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (providedKey !== configuredKey) {
    return {
      authorized: false,
      response: error(401, "UNAUTHORIZED", "Authentication required"),
    };
  }

  return { authorized: true };
}

function safeHexBuffer(value: string) {
  if (!/^[0-9a-f]+$/i.test(value)) return null;
  return Buffer.from(value, "hex");
}

async function verifySignature(request: NextRequest, bodyText: string): Promise<SignatureResult> {
  const secret = getConfiguredHmacSecret();
  if (!secret) {
    return {
      valid: false,
      response: error(500, "SIGNING_SECRET_NOT_CONFIGURED", "Signing secret not configured"),
    };
  }

  const signature = request.headers.get("x-signature");
  if (!signature) {
    return {
      valid: false,
      response: error(401, "UNAUTHORIZED", "Missing request signature"),
    };
  }

  const expected = crypto.createHmac("sha256", secret).update(bodyText).digest("hex");
  const actualBuffer = safeHexBuffer(signature);
  const expectedBuffer = Buffer.from(expected, "hex");

  if (!actualBuffer || actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return {
      valid: false,
      response: error(401, "UNAUTHORIZED", "Invalid request signature"),
    };
  }

  return { valid: true };
}

function parsePagination(request: NextRequest) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  return { limit, offset };
}

function paginate<T>(items: T[], request: NextRequest) {
  const { limit, offset } = parsePagination(request);
  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      total: items.length,
      limit,
      offset,
      hasMore: offset + limit < items.length,
    },
  };
}

function isFreshTimestamp(timestamp: unknown) {
  if (typeof timestamp !== "string") return false;
  const time = new Date(timestamp).getTime();
  return Number.isFinite(time) && Math.abs(Date.now() - time) <= 5 * 60 * 1000;
}


function isValidSessionStartPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as { device?: { deviceId?: unknown }; badge?: { badgeId?: unknown; badgeUid?: unknown } };
  const hasDeviceId = typeof p.device?.deviceId === "string" && p.device.deviceId.trim().length > 0;
  const hasBadgeId = typeof p.badge?.badgeId === "string" && p.badge.badgeId.trim().length > 0;
  const hasBadgeUid = typeof p.badge?.badgeUid === "string" && p.badge.badgeUid.trim().length > 0;
  return hasDeviceId && (hasBadgeId || hasBadgeUid);
}

function getPath(params: { path?: string[] }) {
  return `/${(params.path || []).join("/")}`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const path = getPath(await context.params);
  const url = new URL(request.url);

  if (path === "/health") {
    return json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: VERSION,
        uptime: Math.round((Date.now() - startedAt) / 1000),
        environment: process.env.NODE_ENV || "development",
      },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=30" } },
    );
  }

  if (path === "/metrics") {
    const auth = authorize(request);
    if (!auth.authorized) return auth.response;
    return new NextResponse(
      [
        "# HELP signalgrid_requests_total Total requests observed by the SignalGrid v1 API.",
        "# TYPE signalgrid_requests_total counter",
        "signalgrid_requests_total 1",
        "# HELP signalgrid_request_duration_ms Request latency percentiles in milliseconds.",
        "# TYPE signalgrid_request_duration_ms gauge",
        "signalgrid_request_duration_ms_p50 12",
        "signalgrid_request_duration_ms_p95 45",
        "signalgrid_request_duration_ms_p99 90",
        "",
      ].join("\n"),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  }

  if (path === "/devices") {
    const auth = authorize(request);
    if (!auth.authorized) return auth.response;
    const enrolledFilter = url.searchParams.get("enrolled");
    const filtered = enrolledFilter === null ? demoDevices : demoDevices.filter((device) => String(device.enrolled) === enrolledFilter);
    const { items, pagination } = paginate(filtered, request);
    return json({ devices: items, pagination }, { headers: { "Cache-Control": "private, max-age=60" } });
  }

  if (path === "/events") {
    const auth = authorize(request);
    if (!auth.authorized) return auth.response;
    const type = url.searchParams.get("type");
    const filtered = type ? demoEvents.filter((event) => event.type === type) : demoEvents;
    const { items, pagination } = paginate(filtered, request);
    return json({ events: items, pagination }, { headers: { "Cache-Control": "private, max-age=30" } });
  }

  return error(404, "NOT_FOUND", `Unknown v1 endpoint: ${path}`);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const path = getPath(await context.params);
  const bodyText = await request.text();
  let body: unknown;

  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return error(400, "BAD_REQUEST", "Request body must be valid JSON");
  }

  const signature = await verifySignature(request, bodyText);
  if (!signature.valid) {
    return signature.response;
  }

  const payload = body as { timestamp?: unknown; observedAt?: unknown; lat?: unknown; lon?: unknown };

  if (!isFreshTimestamp(payload.timestamp || payload.observedAt)) {
    return error(401, "UNAUTHORIZED", "Request timestamp is outside the allowed replay window");
  }

  if (path === "/session/start") {
    if (!isValidSessionStartPayload(body)) {
      return error(400, "INVALID_SESSION_START_PAYLOAD", "Session start payload must include device.deviceId and badge.badgeId or badge.badgeUid");
    }

    return json({
      sessionId: crypto.randomUUID(),
      decision: "ALLOW",
      nextAction: "launch_workspace",
      auditId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (path === "/location/report") {
    const lat = Number(payload.lat);
    const lon = Number(payload.lon);
    if ((payload.lat !== undefined && (lat < -90 || lat > 90)) || (payload.lon !== undefined && (lon < -180 || lon > 180))) {
      return error(400, "BAD_REQUEST", "Invalid location coordinates");
    }

    return json({ ok: true, receivedAt: new Date().toISOString() });
  }

  return error(404, "NOT_FOUND", `Unknown v1 endpoint: ${path}`);
}
