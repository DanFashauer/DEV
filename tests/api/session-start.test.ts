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

describe('Session Start API', () => {
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
  });

  it('should reject request with invalid signature', async () => {
    mockValidateAndAuthorizeSessionStart.mockResolvedValueOnce({
      valid: false,
      error: 'Invalid signature',
      code: 'invalid_signature',
    });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({ error: 'Invalid signature' });
  });

  it('should reject request when badge is not enrolled', async () => {
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

  it('should fail closed when posture is unknown', async () => {
    mockGetFleetContext.mockResolvedValueOnce({ status: 'unknown', enrolled: false });
    mockGetUEMContext.mockResolvedValueOnce({ complianceStatus: 'unknown', enrolled: false });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({ code: 'DEVICE_POSTURE_UNKNOWN' });
  });

  it('should deny when device is non-compliant', async () => {
    mockGetFleetContext.mockResolvedValueOnce({ status: 'non_compliant', enrolled: true });
    mockGetUEMContext.mockResolvedValueOnce({ complianceStatus: 'non_compliant', enrolled: true });
    mockGetEvaluator.mockReturnValue({
      evaluate: vi.fn().mockResolvedValue([{ type: 'quarantine_device', params: { reason: 'test' } }]),
    });

    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({ code: 'DEVICE_NON_COMPLIANT' });
  });

  it('should create a session when posture is compliant', async () => {
    const { POST } = await import('@/app/api/session/start/route');
    const response = await POST(makeRequest({ any: 'payload' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      decision: 'ACCESS_GRANTED',
      session: { sessionId: 'sess-001' },
    });
  });
});
