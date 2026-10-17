export const PHOTO_DEFAULT_LIMIT = 100;
export const PUBLIC_PHOTO_QUERY_MAX_LIMIT = 100;
export const PUBLIC_PHOTO_QUERY_MAX_OFFSET = 100_000;

type PaginationOptions = {
  limit?: number
  offset?: number
};

const getPaginationValue = (
  options: PaginationOptions,
  key: keyof PaginationOptions,
) => {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid photo query options');
  }
  return (options as Record<string, unknown>)[key];
};

const getSafeInteger = ({
  value,
  fallback,
  minimum,
  maximum,
  label,
}: {
  value: unknown
  fallback: number
  minimum: number
  maximum?: number
  label: 'limit' | 'offset'
}) => {
  const number = value === undefined ? fallback : value;
  if (
    typeof number !== 'number' ||
    !Number.isSafeInteger(number) ||
    number < minimum ||
    (maximum !== undefined && number > maximum)
  ) {
    throw new Error(`Invalid photo query ${label}`);
  }
  return number;
};

export const getValidatedPagination = (options: PaginationOptions) => ({
  limit: getSafeInteger({
    value: getPaginationValue(options, 'limit'),
    fallback: PHOTO_DEFAULT_LIMIT,
    minimum: 0,
    label: 'limit',
  }),
  offset: getSafeInteger({
    value: getPaginationValue(options, 'offset'),
    fallback: 0,
    minimum: 0,
    label: 'offset',
  }),
});

export const withValidatedPublicPagination = <T extends PaginationOptions>(
  options: T,
): T => ({
  ...options,
  limit: getSafeInteger({
    value: getPaginationValue(options, 'limit'),
    fallback: PHOTO_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PUBLIC_PHOTO_QUERY_MAX_LIMIT,
    label: 'limit',
  }),
  offset: getSafeInteger({
    value: getPaginationValue(options, 'offset'),
    fallback: 0,
    minimum: 0,
    maximum: PUBLIC_PHOTO_QUERY_MAX_OFFSET,
    label: 'offset',
  }),
});

export const getLimitAndOffsetFromOptions = (
  options: PaginationOptions,
  initialValuesIndex = 1,
) => {
  const { limit, offset } = getValidatedPagination(options);
  let valuesIndex = initialValuesIndex;

  return {
    limitAndOffset: `LIMIT $${valuesIndex++} OFFSET $${valuesIndex++}`,
    limitAndOffsetValues: [limit, offset],
  };
};
