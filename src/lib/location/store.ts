import type { LocationSignal } from "./types";
import { LOCATION_USE_REDIS } from "./config";

type StoreBackend = {
  upsert(signal: LocationSignal): Promise<void>;
  getLast(deviceId: string): Promise<LocationSignal | null>;
};

class InMemoryLocationStore implements StoreBackend {
  private lastByDevice = new Map<string, LocationSignal>();
  async upsert(signal: LocationSignal) { this.lastByDevice.set(signal.deviceId, signal); }
  async getLast(deviceId: string) { return this.lastByDevice.get(deviceId) ?? null; }
}

class RedisLocationStore implements StoreBackend {
  constructor(private redis: any) {}
  private key(deviceId: string) { return `loc:last:${deviceId.replace(/[\s:]/g, "_")}`; }
  async upsert(signal: LocationSignal) { await this.redis.set(this.key(signal.deviceId), JSON.stringify(signal)); }
  async getLast(deviceId: string) {
    const raw = await this.redis.get(this.key(deviceId));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}

let singleton: StoreBackend | null = null;

export async function createLocationStore(): Promise<StoreBackend> {
  if (singleton) return singleton;

  // In production, you can enable Redis by setting LOCATION_USE_REDIS=true
  // and implementing a Redis client helper in src/lib/backend/redisClient.ts
  console.log("[Location] Using in-memory store");
  singleton = new InMemoryLocationStore();
  return singleton;
}
