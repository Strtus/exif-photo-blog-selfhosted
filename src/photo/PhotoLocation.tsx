import { Photo } from '.';
import { formatPhotoLocation } from './location';
import { LuMapPin } from 'react-icons/lu';

export default function PhotoLocation({ photo }: { photo: Photo }) {
  const text = formatPhotoLocation(photo);
  return text
    ? <div className="flex min-w-0 items-start gap-1.5 text-medium">
      <LuMapPin size={14} className="mt-[3px] shrink-0" aria-hidden />
      <span className="min-w-0 break-words">{text}</span>
    </div>
    : null;
}
