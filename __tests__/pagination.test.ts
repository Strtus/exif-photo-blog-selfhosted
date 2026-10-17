import {
  getLimitAndOffsetFromOptions,
  withValidatedPublicPagination,
} from '@/db/pagination';

describe('Photo query pagination', () => {
  it('preserves bounded public pagination', () => {
    expect(withValidatedPublicPagination({ limit: 25, offset: 50 }))
      .toEqual({ limit: 25, offset: 50 });
    expect(withValidatedPublicPagination({}))
      .toEqual({ limit: 100, offset: 0 });
  });

  it.each([
    { limit: null },
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { offset: -1 },
    { offset: 100_001 },
    { offset: 1.5 },
  ])('rejects unsafe public pagination: %p', options => {
    expect(() => withValidatedPublicPagination(options as never)).toThrow();
  });

  it('rejects invalid values again at the database boundary', () => {
    expect(() => getLimitAndOffsetFromOptions({
      limit: null,
    } as never)).toThrow('Invalid photo query limit');
    expect(() => getLimitAndOffsetFromOptions({
      offset: -1,
    })).toThrow('Invalid photo query offset');
  });

  it('preserves the internal LIMIT 0 control', () => {
    expect(getLimitAndOffsetFromOptions({ limit: 0 }))
      .toEqual({
        limitAndOffset: 'LIMIT $1 OFFSET $2',
        limitAndOffsetValues: [0, 0],
      });
  });
});
