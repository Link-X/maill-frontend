import { useState } from 'react';
import { Receipt, Search } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  OrderStatus,
  extractErrorMessage,
  notify,
  type AdminOrder,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  useLazyQueryOrderByNoQuery,
  useGetOrderItemsQuery,
} from './ordersApi';

const ORDER_STATUS_LABEL: Record<number, string> = {
  [OrderStatus.PendingPayment]: '待支付',
  [OrderStatus.Paid]: '已支付',
  [OrderStatus.Cancelled]: '已取消',
  [OrderStatus.Refunding]: '退款中',
  [OrderStatus.Refunded]: '已退款',
  [OrderStatus.PartialRefund]: '部分退款',
};

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'info' | 'muted'> = {
  [OrderStatus.PendingPayment]: 'warning',
  [OrderStatus.Paid]: 'success',
  [OrderStatus.Cancelled]: 'muted',
  [OrderStatus.Refunding]: 'info',
  [OrderStatus.Refunded]: 'muted',
  [OrderStatus.PartialRefund]: 'info',
};

export default function OrdersPage() {
  const [orderNo, setOrderNo] = useState('');
  const [foundOrder, setFoundOrder] = useState<AdminOrder | null>(null);
  const [queryOrder, { isFetching }] = useLazyQueryOrderByNoQuery();

  const handleSearch = async () => {
    if (!orderNo.trim()) {
      notify.warn('请输入订单号');
      return;
    }
    try {
      const data = await queryOrder(orderNo.trim()).unwrap();
      if (!data) {
        notify.warn('未找到订单');
        setFoundOrder(null);
        return;
      }
      setFoundOrder(data);
    } catch (e) {
      notify.error(extractErrorMessage(e));
      setFoundOrder(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="订单查询"
        subtitle="按订单号精确查询"
        icon={Receipt}
      />

      <Card className="p-4 space-y-3 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="orderNo">订单号</Label>
          <div className="flex gap-2">
            <Input
              id="orderNo"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="请输入完整订单号"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isFetching}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Search className="h-4 w-4 mr-1.5" />
              {isFetching ? '查询中...' : '查询'}
            </Button>
          </div>
        </div>
      </Card>

      {foundOrder && <OrderDetailBlock order={foundOrder} />}
    </div>
  );
}

function OrderDetailBlock({ order }: { order: AdminOrder }) {
  const { data: items = [], isLoading } = useGetOrderItemsQuery(order.id);

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">订单号</div>
            <div className="font-mono">{order.orderNo}</div>
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
            {ORDER_STATUS_LABEL[order.status] ?? String(order.status)}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="用户 ID" value={String(order.userId)} />
          <Info label="场次 ID" value={String(order.sessionId)} />
          <Info label="总金额" value={formatMoney(order.totalAmount)} />
          <Info label="创建时间" value={formatDateTime(order.createTime)} />
          <Info label="支付时间" value={formatDateTime(order.payTime)} />
          <Info label="过期时间" value={formatDateTime(order.expireTime)} />
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="font-medium">座位明细（{items.length}）</div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">无座位明细</div>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {items.map((it) => (
              <li
                key={String(it.id)}
                className="flex items-center justify-between border-b border-border/40 last:border-0 pb-1.5"
              >
                <span>{it.seatInfo}</span>
                <span className="text-muted-foreground">{formatMoney(it.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}
