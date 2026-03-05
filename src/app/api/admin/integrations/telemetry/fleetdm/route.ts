// FleetDM Integration Admin API
// GET/PUT configuration + test connection

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, adminError, adminSuccess } from '@/lib/adminAuth';
import { getTelemetryConfig, setFleetDMConfig, getFleetDMConfig } from '@/lib/integrations/telemetry/store';
import { getFleetDMAdapter } from '@/lib/integrations/telemetry/fleetdm';
import { FleetDMConfig } from '@/lib/integrations/telemetry/types';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const config = await getTelemetryConfig();
    const fleetConfig = await getFleetDMConfig();

    // Don't return API token in response
    const safeConfig = {
      mode: config.mode,
      fleetdm: fleetConfig
        ? {
            enabled: fleetConfig.enabled,
            baseUrl: fleetConfig.baseUrl,
            teamId: fleetConfig.teamId,
            syncIntervalMs: fleetConfig.syncIntervalMs,
            // Token is env-only, never returned
            hasApiToken: !!process.env.FLEETDM_API_TOKEN,
          }
        : undefined,
    };

    // Test connection if enabled
    let connectionStatus = null;
    if (fleetConfig?.enabled) {
      const adapter = await getFleetDMAdapter();
      connectionStatus = await adapter.testConnection();
    }

    return NextResponse.json({
      config: safeConfig,
      connectionStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as Partial<FleetDMConfig>;
    
    // Validate required fields if enabling
    if (body.enabled) {
      const baseUrl = body.baseUrl || process.env.FLEETDM_BASE_URL;
      const apiToken = body.apiToken || process.env.FLEETDM_API_TOKEN;
      
      if (!baseUrl) {
        return NextResponse.json(
          { error: 'FleetDM base URL is required' },
          { status: 400 }
        );
      }
      
      if (!apiToken) {
        return NextResponse.json(
          { error: 'FleetDM API token is required (set FLEETDM_API_TOKEN env var)' },
          { status: 400 }
        );
      }

      // Validate URL format
      try {
        new URL(baseUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid FleetDM base URL format' },
          { status: 400 }
        );
      }
    }

    const currentConfig = await getFleetDMConfig();
    
    const newConfig: FleetDMConfig = {
      enabled: body.enabled ?? currentConfig?.enabled ?? false,
      baseUrl: body.baseUrl ?? currentConfig?.baseUrl ?? '',
      apiToken: body.apiToken ?? '', // Won't be stored, only used for validation
      teamId: body.teamId ?? currentConfig?.teamId,
      syncIntervalMs: body.syncIntervalMs ?? currentConfig?.syncIntervalMs ?? 300000,
    };

    await setFleetDMConfig(newConfig);

    // Test connection if enabling
    if (newConfig.enabled) {
      const adapter = await getFleetDMAdapter();
      const result = await adapter.testConnection();
      
      if (!result.success) {
        return NextResponse.json({
          warning: result.message,
          config: {
            enabled: newConfig.enabled,
            baseUrl: newConfig.baseUrl,
            teamId: newConfig.teamId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        enabled: newConfig.enabled,
        baseUrl: newConfig.baseUrl,
        teamId: newConfig.teamId,
        syncIntervalMs: newConfig.syncIntervalMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
