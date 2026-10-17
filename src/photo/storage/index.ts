import { DIRECT_STORAGE_IMAGES } from '@/app/config';
import {
  getNextImageUrlForRequest,
  NextImageSize,
} from '@/platforms/next-image';
import {
  generateFileNameWithId,
  getFileNamePartsFromStorageUrl,
  getSignedUrlForUrl,
  getStorageUrlsForPrefix,
  uploadFileFromClient,
} from '@/platforms/storage';
import { isUrlFromAwsS3 } from '@/platforms/storage/aws-s3';
import { isUrlFromCloudflareR2 } from '@/platforms/storage/cloudflare-r2';
import { isUrlFromMinio } from '@/platforms/storage/minio';
import { Photo } from '..';
import { fetchBase64ImageFromUrl } from '@/utility/image';

const PREFIX_PHOTO = 'photo';
const PREFIX_UPLOAD = 'upload';

const EXTENSION_DEFAULT = 'jpg';
const EXTENSION_OPTIMIZED = 'jpg';

// For the time being, make compatible with `next/image` sizes
const OPTIMIZED_FILE_SIZES = [{
  suffix: 'sm',
  size: 400,
  quality: 92,
}, {
  suffix: 'md',
  size: 1200,
  quality: 92,
}, {
  suffix: 'lg',
  size: 1920,
  quality: 92,
}] as const satisfies {
  suffix: string
  size: NextImageSize
  quality: number
}[];

type OptimizedSuffix = (typeof OPTIMIZED_FILE_SIZES)[number]['suffix'];

const OPTIMIZED_SUFFIX_DEFAULT: OptimizedSuffix = 'lg';

const getOptimizedFileName = ({
  fileNameBase,
  suffix,
}: {
  fileNameBase: string
  suffix: OptimizedSuffix
}) =>
  `${fileNameBase}-${suffix}.${EXTENSION_OPTIMIZED}`;

const getOptimizedUrl =({
  urlBase,
  fileNameBase,
  suffix,
}: {
  urlBase: string
  fileNameBase: string
  suffix: OptimizedSuffix
}) =>
  `${urlBase}/${getOptimizedFileName({ fileNameBase, suffix })}`;

export const getOptimizedPhotoFileMeta = (fileNameBase: string) =>
  OPTIMIZED_FILE_SIZES.map(({ suffix, ...rest }) => ({
    ...rest,
    fileName: getOptimizedFileName({ fileNameBase, suffix }),
  }));

export const getOptimizedUrlsFromPhotoUrl = (url: string) => {
  const { urlBase, fileNameBase } = getFileNamePartsFromStorageUrl(url);
  return getOptimizedPhotoFileMeta(fileNameBase).map(({ fileName }) =>
    `${urlBase}/${fileName}`);
};

export const generateRandomFileNameForPhoto = () =>
  generateFileNameWithId(PREFIX_PHOTO);

export const getStorageUploadUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_UPLOAD}-`);

export const getStoragePhotoUrls = () =>
  getStorageUrlsForPrefix(`${PREFIX_PHOTO}-`);

export const uploadTempPhotoFromClient = (
  file: File | Blob,
  extension = EXTENSION_DEFAULT,
) =>
  uploadFileFromClient(file, PREFIX_UPLOAD, extension);

export const uploadPhotoFromClient = (
  file: File | Blob,
  extension = EXTENSION_DEFAULT,
) =>
  uploadFileFromClient(file, PREFIX_PHOTO, extension);

const getSuffixFromNextImageSize = (nextSize: NextImageSize) =>
  OPTIMIZED_FILE_SIZES.find(({ size }) => size === nextSize)?.suffix
    ?? OPTIMIZED_SUFFIX_DEFAULT;

export const isExternalStoragePhotoUrl = (url: string) =>
  isUrlFromCloudflareR2(url) ||
  isUrlFromAwsS3(url) ||
  isUrlFromMinio(url);

const getNextImageSizeForDisplayWidth = (displayWidth: number): NextImageSize => {
  if (displayWidth <= 200) { return 200; }
  if (displayWidth <= 640) { return 640; }
  if (displayWidth <= 1080) { return 1080; }
  if (displayWidth <= 1200) { return 1200; }
  return 1920;
};

/** Public CDN URL for a photo (e.g. R2 -md/-sm), not /_next/image. */
export const getDirectPhotoDisplayUrl = (
  imageUrl: string,
  displayWidth: number,
) =>
  getOptimizedPhotoUrl({
    imageUrl,
    size: getNextImageSizeForDisplayWidth(displayWidth),
    useNextImage: false,
  });

export const getOptimizedPhotoUrl = (
  args: Parameters<typeof getNextImageUrlForRequest>[0] & {
    useNextImage?: boolean
  },
) => {
  const { useNextImage = !DIRECT_STORAGE_IMAGES } = args;
  const suffix = getSuffixFromNextImageSize(args.size);
  const {
    urlBase,
    fileNameBase,
  } = getFileNamePartsFromStorageUrl(args.imageUrl);
  return useNextImage
    ? getNextImageUrlForRequest(args)
    : getOptimizedUrl({ urlBase, fileNameBase, suffix });
};

// Generate small, low-bandwidth images for quick manipulations such as
// generating blur data or image thumbnails for AI text generation
export const getOptimizedPhotoUrlForManipulation = (
  imageUrl: string,
  addBypassSecret?: boolean,
) =>
  getOptimizedPhotoUrl({ imageUrl, addBypassSecret, size: 1200 });

export const getOptimizedPhotoUrlForSuffix = (
  url: string,
  suffix: OptimizedSuffix,
) => {
  const { urlBase, fileNameBase } = getFileNamePartsFromStorageUrl(url);
  return getOptimizedUrl({ urlBase, fileNameBase, suffix });
};

const getTestOptimizedPhotoUrl = (url: string) =>
  getOptimizedPhotoUrlForSuffix(url, 'sm');

export const doesPhotoUrlHaveOptimizedFiles = async (url: string) =>
  fetch(getTestOptimizedPhotoUrl(url)).then(res => res.ok);

export const getStorageUrlsForPhoto = async ({ url }: Photo) => {
  const getSortScoreForUrl = (url: string) => {
    const { fileNameBase } = getFileNamePartsFromStorageUrl(url);
    if (fileNameBase.endsWith('-sm')) { return 1; }
    if (fileNameBase.endsWith('-md')) { return 2; }
    if (fileNameBase.endsWith('-lg')) { return 3; }
    return 0;
  };

  const { fileNameBase } = getFileNamePartsFromStorageUrl(url);

  return getStorageUrlsForPrefix(fileNameBase).then(urls =>
    urls.sort((a, b) => getSortScoreForUrl(a.url) - getSortScoreForUrl(b.url)),
  );
};

export const getDataUrlsForPhotos = async (
  photos: Photo[],
  optimizedSuffix: OptimizedSuffix,
  nextImageWidth: NextImageSize,
  addBypassSecret: boolean,
): Promise<{ id: string, urlData: string }[]> =>
  Promise.all(photos
    .map(async({ id, url }) => {
      // Check for optimized image first
      const optimizedUrl = await getSignedUrlForUrl(
        getOptimizedPhotoUrlForSuffix(url, optimizedSuffix),
        'GET',
      );
      const optimizedUrlData = await fetchBase64ImageFromUrl(optimizedUrl);

      if (optimizedUrlData) {
        return { id, urlData: optimizedUrlData };
      } else {
        // Fall back on `next/image` if optimized image is not available
        const nextImageUrl = getOptimizedPhotoUrl({
          imageUrl: url,
          size: nextImageWidth,
          addBypassSecret,
        });
        const nextImageUrlData = await fetchBase64ImageFromUrl(nextImageUrl);
        return { id, urlData: nextImageUrlData };
      }
    }))
    .then(urls => urls.every(({ urlData }) => Boolean(urlData))
      ? urls as { id: string, urlData: string }[]
      // If any url is undefined, return an empty array
      : []);
