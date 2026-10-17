export interface PhotoTextUpdate {
  photoId: string
  title: string
  caption: string
}

export const validatePhotoTextUpdates = (value: unknown): PhotoTextUpdate[] => {
  if (!Array.isArray(value) || value.length > 500) {
    throw new Error('Update up to 500 photos at a time');
  }
  const ids = new Set<string>();
  return value.map(update => {
    if (
      !update || typeof update.photoId !== 'string' ||
      !/^[\w-]{8}$/.test(update.photoId) ||
      typeof update.title !== 'string' ||
      typeof update.caption !== 'string'
    ) { throw new Error('Invalid photo text update'); }
    const { photoId } = update;
    const title = update.title.trim();
    const caption = update.caption.trim();
    if (title.length > 255 || caption.length > 1000) {
      throw new Error('Use up to 255 title and 1000 caption characters');
    }
    if (ids.has(photoId)) { throw new Error('Duplicate photo update'); }
    ids.add(photoId);
    return { photoId, title, caption };
  });
};
