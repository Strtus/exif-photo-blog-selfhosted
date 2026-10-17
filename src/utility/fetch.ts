export const MAX_IMAGE_PROCESSING_BYTES = 50_000_000;

export const assertImageSize = (size: number, maxBytes: number) => {
  if (size > maxBytes) {
    const limit = Math.round(maxBytes / 1_000_000);
    throw new Error(`Image exceeds the ${limit} MB processing limit`);
  }
};

// Bound every download, including responses without a trustworthy size header.
export const fetchImageBytes = async (
  url: string,
  maxBytes: number,
  options?: RequestInit,
): Promise<ArrayBuffer> => {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('Invalid image size limit');
  }
  const response = await fetch(url, { cache: 'no-store', ...options });
  try {
    if (!response.ok) {
      throw new Error(`Image download failed (${response.status})`);
    }
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length)) { assertImageSize(length, maxBytes); }
  } catch (error) {
    // A cloned/teed response can leave cancellation pending until its other
    // consumer finishes. Report the original error without waiting for it.
    void response.body?.cancel().catch(() => {});
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) { throw new Error('Unable to read image stream safely'); }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { break; }
      total += value.byteLength;
      assertImageSize(total, maxBytes);
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes.buffer;
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
};
