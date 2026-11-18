import { useTranslation } from 'react-i18next';

export default function AdminHome() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
      <p className="mt-2 text-zinc-400">{t('soon')}</p>
    </div>
  );
}