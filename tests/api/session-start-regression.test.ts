import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockValidateAndAuthorizeSessionStart = vi.fn();
const mockGetBadgeRegistry = vi.fn();
const mockGetSessionStore = vi.fn();
const mockGetEvaluator = vi.fn();
const mockResolveTenantId = vi.fn();
const mockAppendAuditRecord = vi.fn();
const mockRecordAuthFailure = vi.fn();
const mockEmitAuthFailure = vi.fn();
const mockEmitSessionStart = vi.fn();
const mockCheckDeviceRateLimit = vi.fn();
const mockCheckIpRateLimit = vi.fn();
const mockGetFleetContext = vi.fn();
const mockGetUEMContext = vi.fn();
const mockBuildDeniedPolicyInput = vi.fn();
const mockBuildGrantedPolicyInput = vi.fn();
const mockRecordDeniedPolicySideEffects = vi.fn();
const mockCreateDeniedDeviceResponse = vi.fn();

vi.mock('@/lib/backend/validation', () => ({
  validateAndAuthorizeSessionStart: mockValidateAndAuthorizeSessionStart,
}));

vi.mock('@/lib/tenant/badgeRegistry', () => ({
  getBadgeRegistry: mockGetBadgeRegistry,
}));

vi.mock('@/lib/tenant/sessionStore', () => ({
  getSessionStore: mockGetSessionStore,
}));

vi.mock('@/lib/tenant/policyEvaluator', () => ({
  getEvaluator: mockGetEvaluator,
}));

vi.mock('@/lib/tenant/tenantContext', () => ({
  resolveTenantId: mockResolveTenantId,
}));

vi.mock('@/lib/auditLedger', () => ({
  appendAuditRecord: mockAppendAuditRecord,
  recordAuthFailure: mockRecordAuthFailure,
}));

vi.mock('@/lib/integrations/webhooks/emitter', () => ({
  emitAuthFailure: mockEmitAuthFailure,
  emitSessionStart: mockEmitSessionStart,
}));

vi.mock('@/app/api/session/start/services/rateLimit', () => ({
  checkDeviceRateLimit: mockCheckDeviceRateLimit,
  checkIpRateLimit: mockCheckIpRateLimit,
}));

vi.mock('@/app/api/session/start/services/posture', () => ({
  getFleetContext: mockGetFleetContext,
  getUEMContext: mockGetUEMContext,
}));

vi.mock('@/app/api/session/start/services/policy', () => ({
  buildDeniedPolicyInput: mockBuildDeniedPolicyInput,
  buildGrantedPolicyInput: mockBuildGrantedPolicyInput,
  recordDeniedPolicySideEffects: mockRecordDeniedPolicySideEffects,
}));

vi.mock('@/app/api/session/start/services/responses', () => ({
  createDeniedDeviceResponse: mockCreateDeniedDeviceResponse,
}));

const baseEvent = {
  eventId: 'evt-001',
  timestamp: '2026-03-28T00:00:00.000Z',
  badge: {
    badgeId: 'badge-001',
    employeeId: 'emp-001',
    cardSerialNumber: 'csn-001',
  },
  device: {
    deviceId: 'device-001',
    deviceSerial: 'serial-001',
  },
  reader: {
    readerType: 'BLE',
  },
  context: {
    locationId: 'loc-001',
  },
};

const baseBadgeMapping = {
  userId: 'user-001',
  userName: 'Test User',
  active: true,
};

let badgeRegistry: {
  get: ReturnType<typeof vi.fn>;
  updateLastUsed: ReturnType<typeof vi.fn>;
};

let sessionStore: {
  getByDeviceId: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown): Request {
  return new Request('https://example.test/api/session/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/session/start regression matrix', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    mockResolveTenantId.mockReturnValue('tenant-test');
    mockCheckIpRateLimit.mockReturnValue(true);
    mockCheckDeviceRateLimit.mockReturnValue(true);

    mockValidateAndAuthorizeSessionStart.mockResolvedValue({
      valid: true,
      event: baseEvent,
    });

    mockGetFleetContext.mockResolvedValue({ status: 'compliant', enrolled: true });
    mockGetUEMContext.mockResolvedValue({ complianceStatus: 'compliant', enrolled: true });

    mockBuildDeniedPolicyInput.mockResolvedValue({
      policyContext: { test: true },
      riskScore: { riskScore: 90 },
    });

    mockBuildGrantedPolicyInput.mockResolvedValue({
      policyContext: { test: true },
      riskScore: { riskScore: 20, riskLevel: 'low' },
      deviceIdentity: { identityId: 'ident-001' },
    });

    badgeRegistry = {
      get: vi.fn().mockResolvedValue(baseBadgeMapping),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
    };

    sessionStore = {
      getByDeviceId: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        sessionId: 'sess-001',
        userId: 'user-001',
        nextAction: 'LAUNCH_APP',
        bundleId: 'com.example.enterpriseapp',
        createdAt: '2026-03-28T00:00:00.000Z',
        expiresAt: '2026-03-28T01:00:00.000Z',
      }),
      update: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({ expiresAt: '2026-03-28T01:00:00.000Z' }),
    };

    mockGetBadgeRegistry.mockReturnValue(badgeRegistry);
    mockGetSessionStore.mockReturnValue(sessionStore);
    mockGetEvaluator.mockReturnValue({ evaluate: vi.fn().mockResolvedValue([]) });

    mockAppendAuditRecord.mockResolvedValue(undefined);
    mockRecordAuthFailure.mockResolvedValue(undefined);
    mockEmitAuthFailure.mockResolvedValue(undefined);
    mockEmitSessionStart.mockResolvedValue(undefined);

    mockRecordDeniedPolicySideEffects.mockReturnValue(undefined);
    mockCreateDeniedDeviceResponse.mockReturnValue(
      Response.json({ decision: 'ACCESS_DENIED', success: false }, { status: 403 })
    );
  });

  it('covers validation failure', async () => {
    mockValidateAndAuthorizeSessionStart.mockResolvedValueOnce({
      valid: false,
      error: 'Invalid signature',
      code: 'INVALID_SIGNATURE',
    });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({ error: 'Invalid signature' });
    expect(mockRecordAuthFailure).toHaveBeenCalled();
  });

  it('covers badge not enrolled path', async () => {
    badgeRegistry.get.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Badge not enrolled',
      code: 'BADGE_NOT_ENROLLED',
    });
  });

  it('covers badge inactive path', async () => {
    badgeRegistry.get.mockResolvedValueOnce({ ...baseBadgeMapping, active: false });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({
      error: 'Badge is deactivated',
      code: 'BADGE_INACTIVE',
    });
  });

  it('covers existing active session extension path', async () => {
    sessionStore.getByDeviceId.mockResolvedValueOnce([
      {
        sessionId: 'sess-existing',
        userId: 'user-001',
        status: 'active',
        nextAction: 'LAUNCH_APP',
        bundleId: 'com.example.app',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    ]);

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      message: 'Existing session extended',
      session: { sessionId: 'sess-existing' },
    });
    expect(sessionStore.create).not.toHaveBeenCalled();
  });

  it('covers non-compliant posture denial path', async () => {
    mockGetFleetContext.mockResolvedValueOnce({ status: 'non_compliant', enrolled: true });
    mockGetUEMContext.mockResolvedValueOnce({ complianceStatus: 'non_compliant', enrolled: true });

    const evaluator = { evaluate: vi.fn().mockResolvedValue([{ type: 'quarantine_device', params: {} }]) };
    mockGetEvaluator.mockReturnValueOnce(evaluator);

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({ decision: 'ACCESS_DENIED', success: false });
    expect(mockCreateDeniedDeviceResponse).toHaveBeenCalled();
    expect(mockRecordDeniedPolicySideEffects).toHaveBeenCalled();
  });

  it('covers compliant success path', async () => {
    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      decision: 'ACCESS_GRANTED',
      success: true,
      session: { sessionId: 'sess-001', nextAction: 'LAUNCH_APP' },
      riskScore: 20,
      riskLevel: 'low',
    });
  });

  it('denies unknown posture by default policy', async () => {
    mockGetFleetContext.mockResolvedValueOnce({ status: 'unknown', enrolled: false });
    mockGetUEMContext.mockResolvedValueOnce({ complianceStatus: 'unknown', enrolled: false });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({
      error: 'Device posture unknown',
      code: 'DEVICE_POSTURE_UNKNOWN',
    });
    expect(mockRecordAuthFailure).toHaveBeenCalledWith(
      'device_posture_unknown',
      { type: 'device', id: baseEvent.device.deviceId },
      expect.objectContaining({
        meta: expect.objectContaining({ unknownPostureMode: 'deny' }),
      })
    );
  });

  it('allows unknown posture when UNKNOWN_POSTURE_MODE=allow', async () => {
    vi.stubEnv('UNKNOWN_POSTURE_MODE', 'allow');
    mockGetFleetContext.mockResolvedValueOnce({ status: 'unknown', enrolled: false });
    mockGetUEMContext.mockResolvedValueOnce({ complianceStatus: 'unknown', enrolled: false });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      decision: 'ACCESS_GRANTED',
      success: true,
      session: { sessionId: 'sess-001' },
    });
  });


  it('uses session nextAction as mode source for existing session extension response', async () => {
    sessionStore.getByDeviceId.mockResolvedValueOnce([
      {
        sessionId: 'sess-existing-2',
        userId: 'user-001',
        status: 'active',
        nextAction: 'UNLOCK_DEVICE',
        bundleId: 'com.example.app',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    ]);

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session).toMatchObject({
      sessionId: 'sess-existing-2',
      nextAction: 'UNLOCK_DEVICE',
    });
    expect(sessionStore.create).not.toHaveBeenCalled();
  });

  it('uses session nextAction as mode source for fresh session response', async () => {
    sessionStore.create.mockResolvedValueOnce({
      sessionId: 'sess-002',
      userId: 'user-001',
      nextAction: 'UNLOCK_DEVICE',
      bundleId: 'com.example.enterpriseapp',
      createdAt: '2026-03-28T00:00:00.000Z',
      expiresAt: '2026-03-28T01:00:00.000Z',
    });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session).toMatchObject({
      sessionId: 'sess-002',
      nextAction: 'UNLOCK_DEVICE',
    });
  });

  it('applies one effective directive resolver contract for extension and fresh paths', async () => {
    sessionStore.getByDeviceId.mockResolvedValueOnce([
      {
        sessionId: 'sess-existing-3',
        userId: 'user-001',
        status: 'active',
        // route should fall back to LAUNCH_APP via shared resolver
        nextAction: undefined,
        bundleId: 'com.example.existing',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    ]);

    const { POST } = await import('@/app/api/session/start/route');

    const extensionResponse = await POST(makeRequest({ any: 'payload' }));
    const extensionData = await extensionResponse.json();

    expect(extensionResponse.status).toBe(200);
    expect(extensionData.session).toMatchObject({
      sessionId: 'sess-existing-3',
      nextAction: 'LAUNCH_APP',
      bundleId: 'com.example.existing',
    });

    sessionStore.getByDeviceId.mockResolvedValueOnce([]);
    sessionStore.create.mockResolvedValueOnce({
      sessionId: 'sess-003',
      userId: 'user-001',
      nextAction: 'WAIT',
      bundleId: 'com.example.enterpriseapp',
      createdAt: '2026-03-28T00:00:00.000Z',
      expiresAt: '2026-03-28T01:00:00.000Z',
    });
    mockGetEvaluator.mockReturnValueOnce({
      evaluate: vi.fn().mockResolvedValue([
        { type: 'launch_app', params: { appBundleId: 'com.epic.ezyaccess' } },
      ]),
    });

    const freshResponse = await POST(makeRequest({ any: 'payload' }));
    const freshData = await freshResponse.json();

    expect(freshResponse.status).toBe(200);
    expect(freshData.session).toMatchObject({
      sessionId: 'sess-003',
      nextAction: 'LAUNCH_APP',
      bundleId: 'com.epic.ezyaccess',
    });
  });

  it('covers set_session_ttl policy action updating session expiry', async () => {
    const evaluator = {
      evaluate: vi.fn().mockResolvedValue([{ type: 'set_session_ttl', params: { seconds: 120 } }]),
    };
    mockGetEvaluator.mockReturnValueOnce(evaluator);
    sessionStore.get.mockResolvedValueOnce({ expiresAt: '2099-01-01T00:02:00.000Z' });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(sessionStore.update).toHaveBeenCalledTimes(1);
    expect(data.session.expiresAt).toBe('2099-01-01T00:02:00.000Z');
    expect(data.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'set_session_ttl', params: { seconds: 120 } }),
      ])
    );
  });
});
