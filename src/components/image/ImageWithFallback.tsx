'use client';

/* eslint-disable jsx-a11y/alt-text */
import { BLUR_ENABLED, DIRECT_STORAGE_IMAGES } from '@/app/config';
import { useAppState } from '@/app/AppState';
import {
  getDirectPhotoDisplayUrl,
  isExternalStoragePhotoUrl,
} from '@/photo/storage';
import { clsx}  from 'clsx/lite';
import Image, { ImageProps } from 'next/image';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export default function ImageWithFallback({
  ref: refProp,
  className,
  classNameImage = 'object-cover h-full',
  blurDataURL,
  blurCompatibilityLevel = 'low',
  priority,
  ...props
}: ImageProps & {
  ref?: RefObject<HTMLImageElement | null>
  blurCompatibilityLevel?: 'none' | 'low' | 'high'
  classNameImage?: string
}) {
  const ref = useRef<HTMLImageElement>(null);

  const { hasLoadedWithAnimations, shouldDebugImageFallbacks } = useAppState();

  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>();
  const [fadeFallbackTransition, setFadeFallbackTransition] =
    useState(!hasLoadedWithAnimations);

  const srcString = typeof props.src === 'string' ? props.src : undefined;
  const useDirectStorage = Boolean(
    DIRECT_STORAGE_IMAGES &&
    srcString &&
    isExternalStoragePhotoUrl(srcString),
  );
  const displayWidth = typeof props.width === 'number' ? props.width : 640;
  const directSrc = useDirectStorage && srcString && !fallbackSrc
    ? getDirectPhotoDisplayUrl(srcString, displayWidth)
    : undefined;
  const resolvedSrc = fallbackSrc ?? directSrc ?? props.src;

  const onLoad = useCallback(() => setIsLoading(false), [setIsLoading]);
  const onError = useCallback(() => {
    if (useDirectStorage && srcString && !fallbackSrc) {
      setFallbackSrc(srcString);
      setIsLoading(true);
    } else {
      setDidError(true);
    }
  }, [fallbackSrc, srcString, useDirectStorage,
    setFallbackSrc, setIsLoading, setDidError]);

  useEffect(() => {
    if (
      !ref.current?.complete ||
      (ref.current?.naturalWidth ?? 0) === 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFadeFallbackTransition(true);
    }
  }, []);

  const getBlurClass = () => {
    switch (blurCompatibilityLevel) {
      case 'high':
      // Fix poorly blurred placeholder data generated on client
        return 'blur-[4px] @xs:blue-md scale-[1.05]';
      case 'low':
        return 'blur-[2px] @xs:blue-md scale-[1.01]';
    }
  };

  return (
    <div
      className={clsx(
        'flex relative',
        className,
      )}
    >
      <Image ref={refProp ?? ref} {...{
        ...props,
        src: resolvedSrc,
        unoptimized: useDirectStorage,
        priority,
        className: classNameImage,
        onLoad,
        onError,
      }} />
      <div
        className={clsx(
          '@container',
          'absolute inset-0 pointer-events-none',
          'overflow-hidden',
          fadeFallbackTransition &&
            'transition-opacity duration-300 ease-in',
          !(BLUR_ENABLED && blurDataURL) && 'bg-main',
          (isLoading || didError || shouldDebugImageFallbacks)
            ? 'opacity-100'
            : 'opacity-0',
        )}
      >
        {(BLUR_ENABLED && blurDataURL)
          ? <img {...{
            ...props,
            src: blurDataURL,
            className: clsx(
              getBlurClass(),
              classNameImage,
            ),
          }} />
          :  <div className={clsx(
            'w-full h-full',
            'bg-gray-100/50 dark:bg-gray-900/50',
          )} />}
      </div>
    </div>
  );
}
