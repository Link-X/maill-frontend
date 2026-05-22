import { useTranslation } from 'react-i18next';

export default function OrdersPage() {
  const { t } = useTranslation('order');
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('myOrders')}</h1>
      <p className="text-muted-foreground mt-2">订单列表占位（Plan 4 实现）</p>
    </div>
  );
}
