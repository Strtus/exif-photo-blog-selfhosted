export const LOCATION_MAX_LENGTH = 100;

export type ManualPhotoLocation = {
  country?: string | null
  city?: string | null
};

export const normalizeLocationValue = (value: unknown): string | undefined => {
  if (value === undefined || value === null) { return undefined; }
  if (typeof value !== 'string') { throw new Error('Invalid location'); }
  const text = value.trim();
  if (text.length > LOCATION_MAX_LENGTH) {
    const limit = LOCATION_MAX_LENGTH;
    throw new Error(`Location must be ${limit} characters or less`);
  }
  return text || undefined;
};

export const normalizeManualLocation = ({
  country,
  city,
}: ManualPhotoLocation) => ({
  country: normalizeLocationValue(country),
  city: normalizeLocationValue(city),
});

export const formatPhotoLocation = ({ country, city }: ManualPhotoLocation) =>
  [city?.trim(), country?.trim()].filter(Boolean).join(', ');
