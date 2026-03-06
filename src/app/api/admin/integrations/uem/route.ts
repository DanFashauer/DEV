// UEM Integration Admin API Route
// GET/PUT configuration + health check

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getUEMConfig, setUEMConfig, getUEMHealthStatus } from '@/lib/integrations/uem/store';
import { UEMConfig, UEMProviderSchema } from '@/lib/integrations/uem/store';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const config = await getUEMConfig();
    const health = await getUEMHealthStatus();

    // Don't return sensitive config - just the provider status
    const safeConfig = config
      ? {
          provider: config.provider,
          enabled: config.enabled,
        }
      : null;

    return NextResponse.json({
      config: safeConfig,
      health,
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
    const body = await request.json() as Partial<UEMConfig>;

    // Validate provider if provided
    if (body.provider) {
      const parsed = UEMProviderSchema.safeParse(body.provider);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid UEM provider. Must be: intune, jamf, or workspace_one' },
          { status: 400 }
        );
      }
    }

    const currentConfig = await getUEMConfig();

    const newConfig: UEMConfig = {
      provider: body.provider ?? currentConfig?.provider ?? 'intune',
      enabled: body.enabled ?? currentConfig?.enabled ?? false,
    };

    await setUEMConfig(newConfig);

    // Test connection if enabling
    if (newConfig.enabled) {
      const health = await getUEMHealthStatus();

      return NextResponse.json({
        success: true,
        config: {
          provider: newConfig.provider,
          enabled: newConfig.enabled,
        },
        health,
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        provider: newConfig.provider,
        enabled: newConfig.enabled,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
