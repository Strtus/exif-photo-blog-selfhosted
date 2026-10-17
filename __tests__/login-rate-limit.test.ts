import {
  clearLoginFailures,
  getClientIpFromHeaders,
  isLoginRateLimited,
  LoginRateLimiter,
  recordLoginFailure,
} from '@/auth/login-rate-limit';
import { headers } from 'next/headers';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

const mockedHeaders = jest.mocked(headers);
const trackedIps = new Set<string>();

const recordFailure = (ip: string) => {
  trackedIps.add(ip);
  recordLoginFailure(ip);
};

afterEach(() => {
  trackedIps.forEach(clearLoginFailures);
  trackedIps.clear();
  mockedHeaders.mockReset();
});

describe('Login rate limiting', () => {
  it('limits one abusive client and allows it after clearing', () => {
    const ip = '192.0.2.1';
    for (let i = 0; i < 5; i++) {
      recordFailure(ip);
    }

    expect(isLoginRateLimited(ip)).toBe(true);
    clearLoginFailures(ip);
    expect(isLoginRateLimited(ip)).toBe(false);
  });

  it('does not let other clients lock out an unrelated client', () => {
    for (let i = 0; i < 20; i++) {
      recordFailure(`192.0.2.${i + 1}`);
    }

    expect(isLoginRateLimited('198.51.100.1')).toBe(false);
  });

  it('uses the proxy real IP instead of client forwarding data', async () => {
    mockedHeaders.mockResolvedValue({
      get: (name: string) => name === 'x-real-ip'
        ? '198.51.100.10'
        : name === 'x-forwarded-for'
          ? '203.0.113.99, 198.51.100.10'
          : null,
    } as Awaited<ReturnType<typeof headers>>);

    await expect(getClientIpFromHeaders()).resolves.toBe('198.51.100.10');
  });

  it('bounds tracked client state and expires old failures', () => {
    const limiter = new LoginRateLimiter(1_000, 1, 2, 1_000);
    limiter.recordFailure('192.0.2.1', 0);
    limiter.recordFailure('192.0.2.2', 0);
    limiter.recordFailure('192.0.2.3', 0);

    expect(limiter.isLimited('192.0.2.1', 0)).toBe(false);
    expect(limiter.isLimited('192.0.2.2', 0)).toBe(true);
    expect(limiter.isLimited('192.0.2.3', 999)).toBe(true);
    expect(limiter.isLimited('192.0.2.3', 1_000)).toBe(false);
  });
});
