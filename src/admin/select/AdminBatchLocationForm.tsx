'use client';

import { useState } from 'react';
import FieldsetWithStatus from '@/components/FieldsetWithStatus';
import LoaderButton from '@/components/primitives/LoaderButton';
import { batchPhotoAction } from '@/photo/actions';
import { LOCATION_MAX_LENGTH } from '@/photo/location';
import { PhotoQueryOptions } from '@/db';
import { useAppState } from '@/app/AppState';
import { useAppText } from '@/i18n/state/client';
import { toastSuccess, toastWarning } from '@/toast';
import { FaCheck } from 'react-icons/fa6';
import { IoCloseSharp } from 'react-icons/io5';

export default function AdminBatchLocationForm({
  photoIds,
  photoOptions,
  photosText,
  disabled,
  pending,
  onPendingChange,
  onCancel,
  onComplete,
}: {
  photoIds?: string[]
  photoOptions?: PhotoQueryOptions
  photosText: string
  disabled: boolean
  pending: boolean
  onPendingChange: (pending: boolean) => void
  onCancel: () => void
  onComplete: () => void
}) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const { invalidateSwr, registerAdminUpdate } = useAppState();
  const text = useAppText().photo;
  const tooLong = country.length > LOCATION_MAX_LENGTH ||
    city.length > LOCATION_MAX_LENGTH;

  return <div className="space-y-3 w-full">
    <div className="flex items-center justify-between gap-2">
      <span>{text.location} · {photosText}</span>
      <LoaderButton
        icon={<IoCloseSharp size={19} />}
        onClick={onCancel}
        disabled={pending}
        tooltip="Cancel"
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldsetWithStatus
        id="batch-country"
        label={text.country}
        value={country}
        onChange={setCountry}
        placeholder="Japan / 日本"
        readOnly={pending}
        error={country.length > LOCATION_MAX_LENGTH
          ? `${LOCATION_MAX_LENGTH} characters or less` : undefined}
      />
      <FieldsetWithStatus
        id="batch-city"
        label={text.city}
        value={city}
        onChange={setCity}
        placeholder="Kyoto / 京都"
        readOnly={pending}
        error={city.length > LOCATION_MAX_LENGTH
          ? `${LOCATION_MAX_LENGTH} characters or less` : undefined}
      />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <span className="text-dim text-sm grow">{text.locationBatchNote}</span>
      <LoaderButton
        icon={<FaCheck size={15} />}
        disabled={disabled || pending || tooLong}
        primary
        hideText="never"
        onClick={async () => {
          onPendingChange(true);
          try {
            await batchPhotoAction({
              photoIds,
              photoOptions,
              location: { country, city },
            });
            invalidateSwr?.();
            registerAdminUpdate?.();
            toastSuccess(`Updated location for ${photosText}`);
            onComplete();
          } catch (error) {
            toastWarning(error instanceof Error
              ? error.message : 'Update failed');
          } finally {
            onPendingChange(false);
          }
        }}
      >
        Apply
      </LoaderButton>
    </div>
  </div>;
}
