import { useTranslation } from 'react-i18next';
export default function OrdersPage() {
  const { t } = useTranslation('admin');
  return <div className="p-6"><h1 className="text-xl font-semibold">{t('nav.orders')}</h1><p className="text-muted-foreground mt-2">Plan 4 实现</p></div>;
}
