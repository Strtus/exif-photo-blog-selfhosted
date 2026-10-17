import AdminAboutEditPage from '@/about/AdminAboutEditPage';
import { getAboutData } from '@/about/data';

export default async function AboutEditPage() {
  const { about } = await getAboutData()
    .catch(() => ({ about: undefined }));

  return <AdminAboutEditPage about={about} />;
}
