// NAC Integration Admin API Route
// GET/PUT configuration + health check

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { getNACConfig, setNACConfig, getNACHealthStatus } from '@/lib/integrations/nac/store';
import { NACConfig, NACProviderSchema } from '@/lib/integrations/nac/store';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const config = await getNACConfig();
    const health = await getNACHealthStatus();

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
    const body = await request.json() as Partial<NACConfig>;

    if (body.provider) {
      const parsed = NACProviderSchema.safeParse(body.provider);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid NAC provider. Must be: ise or clearpass' },
          { status: 400 }
        );
      }
    }

    const currentConfig = await getNACConfig();

    const newConfig: NACConfig = {
      provider: body.provider ?? currentConfig?.provider ?? 'ise',
      enabled: body.enabled ?? currentConfig?.enabled ?? false,
    };

    await setNACConfig(newConfig);

    if (newConfig.enabled) {
      const health = await getNACHealthStatus();

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
