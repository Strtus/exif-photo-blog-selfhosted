jest.mock('@upstash/redis', () => ({
  Redis: class Redis {},
}));

jest.mock('camelcase-keys', () => ({
  __esModule: true,
  default: <T>(value: T) => value,
}));

import {
  areOptionsSensitive,
  getWheresFromOptions,
} from '@/db';

describe('Photo query visibility', () => {
  it.each([
    null,
    '',
    'unexpected',
    1,
  ])('rejects invalid runtime hidden value: %p', hidden => {
    const options = { hidden } as never;

    expect(() => areOptionsSensitive(options))
      .toThrow('Invalid photo query visibility');
    expect(() => getWheresFromOptions(options))
      .toThrow('Invalid photo query visibility');
  });

  it('keeps public visibility public and filtered', () => {
    expect(areOptionsSensitive({})).toBe(false);
    expect(areOptionsSensitive({ hidden: 'exclude' })).toBe(false);
    expect(getWheresFromOptions({}).wheres)
      .toBe('WHERE hidden IS NOT TRUE');
  });

  it('keeps supported private visibility behind authentication', () => {
    expect(areOptionsSensitive({ hidden: 'include' })).toBe(true);
    expect(areOptionsSensitive({ hidden: 'only' })).toBe(true);
    expect(getWheresFromOptions({ hidden: 'only' }).wheres)
      .toBe('WHERE hidden IS TRUE');
  });
});
