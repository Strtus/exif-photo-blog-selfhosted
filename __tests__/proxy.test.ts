jest.mock('@upstash/redis', () => ({
  Redis: class Redis {},
}));

jest.mock('camelcase-keys', () => ({
  __esModule: true,
  default: <T>(value: T) => value,
}));

jest.mock('../src/auth/server', () => ({
  auth: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../src/auth/server';
import { proxy } from '../proxy';

const runProxy = (pathname: string) => proxy(
  new NextRequest(`https://gallery.example${pathname}`),
  NextResponse.next(),
);

describe('Proxy aliases', () => {
  beforeEach(() => {
    jest.mocked(auth).mockReset();
  });

  it.each([
    ['/t/private', '/tag/private'],
    ['/t/private/photo-id', '/tag/private/photo-id'],
    ['/t/%70rivate', '/tag/%70rivate'],
  ])('redirects protected alias %s to its guarded path', (alias, target) => {
    const response = runProxy(alias) as NextResponse;

    expect(response.status).toBe(307);
    expect(response.headers.get('location'))
      .toBe(`https://gallery.example${target}`);
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('continues rewriting public tag aliases', () => {
    const response = runProxy('/t/landscape') as NextResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('https://gallery.example/tag/landscape');
  });

  it.each([
    '/tag/private',
    '/tag/%70rivate',
  ])('authenticates protected canonical path %s', pathname => {
    runProxy(pathname);

    expect(auth).toHaveBeenCalledTimes(1);
  });
});
