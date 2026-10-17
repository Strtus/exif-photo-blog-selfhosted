/** @jest-environment node */
import { fetchImageBytes } from '@/utility/fetch';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const download = (chunks: number[], length?: string) => {
  let index = 0;
  const cancel = jest.fn();
  const body = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(new Uint8Array(chunks[index++]).fill(index));
      } else {
        controller.close();
      }
    },
    cancel,
  });
  const headers = length === undefined ? undefined : { 'content-length': length };
  global.fetch = jest.fn().mockResolvedValue(new Response(body, { headers }));
  return cancel;
};

describe('bounded image downloads', () => {
  it('rejects an oversized header and cancels the body before reading', async () => {
    const cancel = download([1], '100');
    await expect(fetchImageBytes('https://example.test/photo', 10))
      .rejects.toThrow('processing limit');
    expect(cancel).toHaveBeenCalled();
  });

  it.each([undefined, '1', 'invalid'])(
    'stops streaming over the limit with content-length %p', async length => {
      const cancel = download([6, 6, 6, 6], length);
      await expect(fetchImageBytes('https://example.test/photo', 10))
        .rejects.toThrow('processing limit');
      expect(cancel).toHaveBeenCalled();
    },
  );

  it('accepts an image exactly at the limit and preserves byte order', async () => {
    download([4, 6], '10');
    const bytes = await fetchImageBytes('https://example.test/photo', 10);
    expect(Array.from(new Uint8Array(bytes)))
      .toEqual([1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);
  });

  it('rejects HTTP errors instead of processing an error page as an image', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status: 404 }));
    await expect(fetchImageBytes('https://example.test/photo', 10))
      .rejects.toThrow('404');
  });

  it('rejects an invalid limit before making a request', async () => {
    global.fetch = jest.fn();
    await expect(fetchImageBytes('https://example.test/photo', -1))
      .rejects.toThrow('Invalid image size limit');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(['http', 'header', 'stream'])(
    'reports a %s failure without waiting for another cloned stream',
    async failure => {
      const source = new Response(new Uint8Array(20), {
        status: failure === 'http' ? 404 : 200,
        headers: failure === 'header' ? { 'content-length': '20' } : {},
      });
      // Fetch instrumentation can tee a response. Cancelling one branch does
      // not settle until the other branch is consumed or cancelled as well.
      global.fetch = jest.fn().mockResolvedValue(source.clone());
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await expect(Promise.race([
          fetchImageBytes('https://example.test/photo', 10),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Download stayed pending')), 250);
          }),
        ])).rejects.toThrow(failure === 'http' ? '404' : 'processing limit');
      } finally {
        clearTimeout(timer);
        await source.body?.cancel();
      }
    },
  );
});
