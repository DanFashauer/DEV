import { NextResponse } from "next/server";

// GET /api/admin/devices - List all registered devices
export async function GET() {
  // Mock device data - replace with database query in production
  const devices = [
    {
      id: "device-001",
      name: "Kiosk Alpha",
      status: "active",
      lastSeen: "2026-02-18T05:00:00Z",
      osVersion: "17.2",
      appVersion: "1.0.0",
    },
    {
      id: "device-002",
      name: "Kiosk Beta",
      status: "inactive",
      lastSeen: "2026-02-17T12:30:00Z",
      osVersion: "17.2",
      appVersion: "1.0.0",
    },
    {
      id: "device-003",
      name: "Kiosk Gamma",
      status: "pending",
      lastSeen: "2026-02-18T04:45:00Z",
      osVersion: "17.1",
      appVersion: "0.9.5",
    },
  ];

  return NextResponse.json({ devices });
}

// POST /api/admin/devices - Register a new device
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, deviceId } = body;

    if (!name || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields: name, deviceId" },
        { status: 400 }
      );
    }

    // In production, save to database
    const newDevice = {
      id: deviceId,
      name,
      status: "pending",
      lastSeen: new Date().toISOString(),
      osVersion: "unknown",
      appVersion: "unknown",
    };

    return NextResponse.json({ device: newDevice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
