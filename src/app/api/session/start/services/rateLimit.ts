const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

type RateLimitRecord = { count: number; resetTime: number };

const deviceRateLimitMap = new Map<string, RateLimitRecord>();
const ipRateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(map: Map<string, RateLimitRecord>, identifier: string): boolean {
  const now = Date.now();
  const record = map.get(identifier);

  if (!record || now > record.resetTime) {
    map.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export function checkIpRateLimit(clientIp: string): boolean {
  return checkRateLimit(ipRateLimitMap, clientIp);
}

export function checkDeviceRateLimit(deviceId: string): boolean {
  return checkRateLimit(deviceRateLimitMap, deviceId);
}
