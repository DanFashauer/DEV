import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSessionStoreFromRequest = vi.fn();
const mockAppendAuditRecord = vi.fn();
const mockEmitSessionEnd = vi.fn();

vi.mock('@/lib/tenant/sessionStore', () => ({
  getSessionStoreFromRequest: mockGetSessionStoreFromRequest,
}));

vi.mock('@/lib/auditLedger', () => ({
  appendAuditRecord: mockAppendAuditRecord,
}));

vi.mock('@/lib/integrations/webhooks/emitter', () => ({
  emitSessionEnd: mockEmitSessionEnd,
}));

describe('/api/session/[sessionId] uses tenant session-store source-of-truth', () => {
  const store = {
    get: vi.fn(),
    terminate: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    store.get.mockResolvedValue({
      sessionId: 'sess-001',
      userId: 'user-001',
      deviceId: 'device-001',
      status: 'active',
      nextAction: 'LAUNCH_APP',
      createdAt: '2026-03-29T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
      lastActivityAt: '2026-03-29T00:00:00.000Z',
    });
    store.terminate.mockResolvedValue(true);

    mockGetSessionStoreFromRequest.mockReturnValue(store);
    mockAppendAuditRecord.mockResolvedValue(undefined);
    mockEmitSessionEnd.mockResolvedValue(undefined);
  });

  it('GET resolves session store from request and returns session data', async () => {
    const { GET } = await import('@/app/api/session/[sessionId]/route');

    const response = await GET(
      new Request('https://example.test/api/session/sess-001', {
        headers: { 'x-tenant-id': 'Tenant-A' },
      }),
      { params: Promise.resolve({ sessionId: 'sess-001' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(mockGetSessionStoreFromRequest).toHaveBeenCalledTimes(1);
    expect(store.get).toHaveBeenCalledWith('sess-001');
    expect(data).toMatchObject({ success: true, session: { sessionId: 'sess-001' } });
  });

  it('DELETE resolves session store from request and terminates session', async () => {
    const { DELETE } = await import('@/app/api/session/[sessionId]/route');

    const response = await DELETE(
      new Request('https://example.test/api/session/sess-001', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ sessionId: 'sess-001' }) }
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(mockGetSessionStoreFromRequest).toHaveBeenCalledTimes(1);
    expect(store.get).toHaveBeenCalledWith('sess-001');
    expect(store.terminate).toHaveBeenCalledWith('sess-001');
    expect(data).toMatchObject({ success: true, message: 'Session terminated' });
  });
});
