'use client';

import { useAppState } from '@/app/AppState';
import AnimateItems from '@/components/AnimateItems';
import AppGrid from '@/components/AppGrid';
import { ReactNode } from 'react';
import { useAppText } from '@/i18n/state/client';
import Link from 'next/link';
import { PATH_ADMIN_ABOUT_EDIT } from '@/app/path';
import { LuCirclePlus } from 'react-icons/lu';
import AdminEmptyState from '@/admin/AdminEmptyState';
import AdminAboutMenu from './AdminAboutMenu';
import clsx from 'clsx/lite';

export default function AboutPageClient({
  title,
  subhead,
  descriptionHtml,
}: {
  title?: string
  subhead?: string
  descriptionHtml?: ReactNode
}) {
  const { isUserSignedIn } = useAppState();
  const appText = useAppText();

  return (
    <AnimateItems
      type="bottom"
      items={[<div
        key="about-page"
        className="mt-5 max-w-2xl"
      >
        <AppGrid
          contentMain={<div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {title || appText.about.titleDefault}
                </h1>
                {subhead &&
                  <p className="text-medium">{subhead}</p>}
              </div>
              {isUserSignedIn && <AdminAboutMenu />}
            </div>
            {descriptionHtml
              ? descriptionHtml
              : isUserSignedIn &&
                  <Link
                    href={PATH_ADMIN_ABOUT_EDIT}
                    className={clsx(
                      'flex items-center justify-center gap-2.5',
                      'border border-dashed border-medium rounded-lg',
                    )}
                  >
                    <AdminEmptyState
                      icon={<LuCirclePlus size={22} />}
                      includeContainer={false}
                      className="gap-3! p-6!"
                    >
                      Add description
                    </AdminEmptyState>
                  </Link>}
          </div>} />
      </div>]}
    />
  );
}
