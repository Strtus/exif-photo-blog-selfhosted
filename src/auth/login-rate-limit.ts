import { headers } from 'next/headers';
import { isIP } from 'node:net';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 5;
const MAX_TRACKED_CLIENTS = 10_000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

type Bucket = {
  count: number
  resetAt: number
};

export class LoginRateLimiter {
  private readonly attempts = new Map<string, Bucket>();
  private lastCleanupAt = 0;

  constructor(
    private readonly windowMs = WINDOW_MS,
    private readonly maxAttemptsPerIp = MAX_ATTEMPTS_PER_IP,
    private readonly maxTrackedClients = MAX_TRACKED_CLIENTS,
    private readonly cleanupIntervalMs = CLEANUP_INTERVAL_MS,
  ) {}

  private getActiveBucket(ip: string, now: number) {
    const bucket = this.attempts.get(ip);
    if (bucket && now >= bucket.resetAt) {
      this.attempts.delete(ip);
      return undefined;
    }
    return bucket;
  }

  private removeExpiredBuckets(now: number) {
    if (now - this.lastCleanupAt < this.cleanupIntervalMs) { return; }

    for (const [ip, bucket] of this.attempts) {
      if (now >= bucket.resetAt) {
        this.attempts.delete(ip);
      }
    }
    this.lastCleanupAt = now;
  }

  private evictOldestBucket() {
    const oldestIp = this.attempts.keys().next().value;
    if (oldestIp !== undefined) {
      this.attempts.delete(oldestIp);
    }
  }

  isLimited(ip: string, now = Date.now()) {
    return (this.getActiveBucket(ip, now)?.count ?? 0) >=
      this.maxAttemptsPerIp;
  }

  recordFailure(ip: string, now = Date.now()) {
    this.removeExpiredBuckets(now);

    const existing = this.getActiveBucket(ip, now);
    if (!existing && this.attempts.size >= this.maxTrackedClients) {
      this.evictOldestBucket();
    }

    const bucket = existing ?? {
      count: 0,
      resetAt: now + this.windowMs,
    };
    bucket.count += 1;

    // Refresh insertion order so capacity eviction removes the least recently
    // updated client first.
    this.attempts.delete(ip);
    this.attempts.set(ip, bucket);
  }

  clear(ip: string) {
    this.attempts.delete(ip);
  }
}

const loginRateLimiter = new LoginRateLimiter();

export const isLoginRateLimited = (ip: string) =>
  loginRateLimiter.isLimited(ip);

export const recordLoginFailure = (ip: string) =>
  loginRateLimiter.recordFailure(ip);

export const clearLoginFailures = (ip: string) =>
  loginRateLimiter.clear(ip);

const parseTrustedClientIp = (value: string | null) => {
  const ip = value?.trim();
  return ip && isIP(ip) ? ip : undefined;
};

export const getClientIpFromHeaders = async () => {
  const headerList = await headers();
  return parseTrustedClientIp(headerList.get('x-real-ip')) ?? 'unknown';
};
