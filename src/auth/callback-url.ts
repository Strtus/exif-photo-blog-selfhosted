import { PATH_ADMIN_PHOTOS } from '@/app/path';

export const getSafeCallbackPath = (raw: string | null | undefined) => {
  if (!raw) {
    return PATH_ADMIN_PHOTOS;
  }
  if (
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('\\') ||
    raw.includes('://')
  ) {
    return PATH_ADMIN_PHOTOS;
  }
  return raw;
};
