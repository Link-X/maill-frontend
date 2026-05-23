import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Receipt, MapPin, Calendar } from 'lucide-react';
import { OrderStatus, type OrderStatusResponse } from '@maill/shared';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime, formatMoney, orderStatusLabel } from '@/lib/format';
import { useListOrdersQuery } from '@/features/order/orderApi';

const TABS: Array<{ label: string; value: OrderStatus | undefined }> = [
  { label: '全部', value: undefined },
  { label: '待支付', value: OrderStatus.PendingPayment },
  { label: '已支付', value: OrderStatus.Paid },
  { label: '已取消', value: OrderStatus.Cancelled },
  { label: '已退款', value: OrderStatus.Refunded },
];

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'info' | 'muted'> = {
  [OrderStatus.PendingPayment]: 'warning',
  [OrderStatus.Paid]: 'success',
  [OrderStatus.Cancelled]: 'muted',
  [OrderStatus.Refunding]: 'info',
  [OrderStatus.Refunded]: 'muted',
  [OrderStatus.PartialRefund]: 'info',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
  const { data, isLoading } = useListOrdersQuery({
    page: 1,
    size: 50,
    status: activeTab,
  });
  const list = data?.list ?? [];

  return (
    <div className="px-4 py-3 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">我的订单</h1>
        <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={String(tab.value ?? 'all')}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`relative px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="order-tab-indicator"
                    className="absolute inset-0 bg-gradient-brand-soft rounded-md"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Receipt} title="暂无订单" description="去首页选一场喜欢的演出吧" />
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {list.map((order) => (
            <OrderCard key={order.orderNo} order={order} onClick={() => navigate(`/order/${order.orderNo}/pay`)} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function OrderCard({ order, onClick }: { order: OrderStatusResponse; onClick: () => void }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 4 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card interactive onClick={onClick} className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium leading-snug">{order.showName ?? '演出'}</div>
            <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3 flex-wrap">
              {order.sessionStartTime && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(order.sessionStartTime)}
                </span>
              )}
              {(order.showCityName || order.showVenue) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[order.showCityName, order.showVenue].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>{orderStatusLabel(order.status)}</Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {order.seatInfos.slice(0, 4).map((s, i) => (
            <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-brand/10 text-brand">
              {s}
            </span>
          ))}
          {order.seatInfos.length > 4 && (
            <span className="text-[11px] text-muted-foreground">+{order.seatInfos.length - 4}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">{order.orderNo}</span>
          <span className="font-semibold text-brand">{formatMoney(order.totalAmount)}</span>
        </div>
      </Card>
    </motion.div>
  );
}
