import { fetchImageBytes, MAX_IMAGE_PROCESSING_BYTES } from './fetch';
import { getFileNamePartsFromStorageUrl } from '@/platforms/storage';

export const removeBase64Prefix = (base64: string) => {
  return base64.match(/^data:image\/[a-z]{3,4};base64,(.+)$/)?.[1] ?? base64;
};

export const fetchBase64ImageFromUrl = async (
  url: string,
  fetchOptions?: RequestInit,
) => {
  const { fileExtension } = getFileNamePartsFromStorageUrl(url);
  const contentType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
  return fetchImageBytes(url, MAX_IMAGE_PROCESSING_BYTES, fetchOptions)
    .then(bytes =>
      `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`)
    .catch(() => undefined);
};
