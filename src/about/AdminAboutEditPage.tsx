'use client';

import { PATH_ABOUT } from '@/app/path';
import LinkWithStatus from '@/components/LinkWithStatus';
import { useState } from 'react';
import { About, AboutInsert } from '.';
import FieldsetWithStatus from '@/components/FieldsetWithStatus';
import AdminChildPage from '@/components/AdminChildPage';
import { updateAboutAction } from './actions';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import { useAppText } from '@/i18n/state/client';
import { ABOUT_DESCRIPTION_DEFAULT, ABOUT_SUBHEAD, ABOUT_TITLE } from '@/app/config';

export default function AdminAboutEditPage({
  about,
}: {
  about?: About
}) {
  const appText = useAppText();

  const [aboutForm, setAboutForm] = useState<Partial<AboutInsert>>(about ?? {});

  return (
    <AdminChildPage
      backPath={PATH_ABOUT}
      backLabel="About"
      breadcrumb="Edit About Page"
    >
      <form
        className="space-y-8 mt-12 max-w-xl"
        action={updateAboutAction}
      >
        <div className="space-y-4">
          <FieldsetWithStatus
            label="Title"
            value={aboutForm?.title ?? ''}
            placeholder={ABOUT_TITLE || appText.about.titleDefault}
            onChange={title => setAboutForm(form =>
              ({ ...form, title }))}
          />
          <FieldsetWithStatus
            label="Subhead"
            value={aboutForm?.subhead ?? ''}
            placeholder={ABOUT_SUBHEAD}
            onChange={subhead => setAboutForm(form =>
              ({ ...form, subhead }))}
          />
          <FieldsetWithStatus
            label="Description"
            type="textarea"
            value={aboutForm?.description ?? ''}
            placeholder={ABOUT_DESCRIPTION_DEFAULT}
            onChange={description => setAboutForm(form =>
              ({ ...form, description }))}
          />
          <p className="text-dim text-sm">
            Supports simple formatting: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;br&gt;
          </p>
        </div>
        <div className="flex gap-2">
          <LinkWithStatus
            href={PATH_ABOUT}
            className="button"
          >
            Cancel
          </LinkWithStatus>
          <SubmitButtonWithStatus
            hideText="never"
            primary
          >
            Update
          </SubmitButtonWithStatus>
        </div>
      </form>
    </AdminChildPage>
  );
}
