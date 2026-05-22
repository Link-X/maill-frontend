import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation('show');
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('list')}</h1>
      <p className="text-muted-foreground mt-2">演出列表占位（Plan 3 实现）</p>
    </div>
  );
}
