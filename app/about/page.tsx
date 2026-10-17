import styles from './about.module.css';
import AboutPageClient from '@/about/AboutPageClient';
import { getAboutDataCached } from '@/about/data';
import {
  ABOUT_DESCRIPTION_DEFAULT,
  ABOUT_SUBHEAD,
  ABOUT_TITLE,
  SHOW_ABOUT_PAGE,
} from '@/app/config';
import { PATH_ROOT } from '@/app/path';
import { safelyParseFormattedHtml } from '@/utility/html';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  if (!SHOW_ABOUT_PAGE) { redirect(PATH_ROOT); }

  const { about } = await getAboutDataCached()
    .catch(() => ({ about: undefined }));

  const title = about?.title || ABOUT_TITLE;
  const subhead = about?.subhead || ABOUT_SUBHEAD;
  const description = about?.description || ABOUT_DESCRIPTION_DEFAULT;

  const descriptionHtml = description
    ? <div
      className={styles.description}
      dangerouslySetInnerHTML={{
        __html: safelyParseFormattedHtml(description),
      }}
    />
    : undefined;

  return (
    <AboutPageClient
      title={title}
      subhead={subhead}
      descriptionHtml={descriptionHtml}
    />
  );
}
