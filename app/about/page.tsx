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
  const [introduction, ...details] = description?.trim().split(
    /\r?\n\s*\r?\n|(?:<br\s*\/?>\s*){2,}/i,
  ) ?? [];

  const descriptionHtml = description
    ? <div className={styles.description}>
      <div dangerouslySetInnerHTML={{
        __html: safelyParseFormattedHtml(introduction),
      }} />
      {details.length > 0 && <>
        <hr className={styles.divider} />
        <div
          className={styles.technical}
          dangerouslySetInnerHTML={{
            __html: safelyParseFormattedHtml(details.join('\n\n')),
          }}
        />
      </>}
    </div>
    : undefined;

  return (
    <AboutPageClient
      title={title}
      subhead={subhead}
      descriptionHtml={descriptionHtml}
    />
  );
}
