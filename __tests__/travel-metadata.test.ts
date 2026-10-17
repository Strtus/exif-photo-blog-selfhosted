import {
  formatPhotoLocation,
  normalizeManualLocation,
} from '@/photo/location';
import { validatePhotoTextUpdates } from '@/photo/batch';
import { convertFormDataToPhotoDbInsert } from '@/photo/form';
import { convertExifToFormData } from '@/photo/form/server';

describe('manual travel locations', () => {
  it('accepts Unicode names without requiring GPS or a country list', () => {
    expect(normalizeManualLocation({ country: ' 日本 ', city: ' 京都 ' }))
      .toEqual({ country: '日本', city: '京都' });
    expect(formatPhotoLocation({ country: '日本', city: '京都' }))
      .toBe('京都, 日本');
  });
  it('supports either field on its own and clears whitespace-only values', () => {
    expect(formatPhotoLocation({ country: 'Iceland' })).toBe('Iceland');
    expect(formatPhotoLocation({ city: 'Paris' })).toBe('Paris');
    expect(formatPhotoLocation({})).toBe('');
    expect(normalizeManualLocation({ country: '  ', city: '' }))
      .toEqual({ country: undefined, city: undefined });
  });
  it('rejects malformed or excessive location values', () => {
    expect(() => normalizeManualLocation({ city: 12 } as never)).toThrow();
    expect(() => normalizeManualLocation({ city: 'x'.repeat(101) })).toThrow();
  });
  it('preserves manual locations when EXIF is refreshed without GPS', () => {
    const exif = convertExifToFormData({
      tags: { Make: 'SONY', Model: 'ILCE-7RM2' },
      imageSize: { width: 4000, height: 3000 },
    } as never);
    const updated = convertFormDataToPhotoDbInsert({
      country: '日本', city: '京都', ...exif,
    });
    expect(updated.country).toBe('日本');
    expect(updated.city).toBe('京都');
    expect(updated.latitude).toBeUndefined();
    expect(updated.longitude).toBeUndefined();
  });
  it('clears manually edited location fields without affecting the photo text', () => {
    const updated = convertFormDataToPhotoDbInsert({
      country: '', city: ' ', title: 'My trip', caption: 'A quiet street',
    });
    expect(updated.country).toBeUndefined();
    expect(updated.city).toBeUndefined();
    expect(updated.title).toBe('My trip');
    expect(updated.caption).toBe('A quiet street');
  });
});

describe('batch photo text updates', () => {
  const photo = { photoId: 'Travel01', title: ' Kyoto ', caption: ' Quiet lane ' };
  it('trims edits and accepts blank values for an intentional clear', () => {
    expect(validatePhotoTextUpdates([photo]))
      .toEqual([{ ...photo, title: 'Kyoto', caption: 'Quiet lane' }]);
    expect(validatePhotoTextUpdates([{ ...photo, title: ' ', caption: '' }]))
      .toEqual([{ ...photo, title: '', caption: '' }]);
  });
  it('rejects invalid identifiers, non-string values, duplicates and large batches', () => {
    for (const value of [
      null,
      [{ ...photo, photoId: 'invalid' }],
      [{ ...photo, caption: null }],
      [photo, photo],
      Array(501).fill(photo),
    ]) { expect(() => validatePhotoTextUpdates(value)).toThrow(); }
  });
  it('enforces the same title and caption limits as the photo form', () => {
    expect(() => validatePhotoTextUpdates([{ ...photo, title: 'x'.repeat(256) }]))
      .toThrow();
    expect(() => validatePhotoTextUpdates([{ ...photo, caption: 'x'.repeat(1001) }]))
      .toThrow();
    expect(validatePhotoTextUpdates([{
      ...photo, title: 'x'.repeat(255), caption: 'x'.repeat(1000),
    }])).toHaveLength(1);
  });
});
