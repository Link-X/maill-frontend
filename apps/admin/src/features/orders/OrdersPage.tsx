import { useState } from 'react';
import { Receipt, Search, X, MapPin, Calendar, Ticket, RefreshCw } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  OrderStatus,
  TicketStatus,
  type OrderStatusResponse,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Drawer } from '@/components/Drawer';
import { DataTable, type Column } from '@/components/DataTable';
import { formatDateTime, formatMoney } from '@/lib/format';
import { useListAdminOrdersQuery, type AdminOrderListRequest } from './ordersApi';
import { useListShowsQuery } from '@/features/shows/showsApi';

const PAGE_SIZE = 20;

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

const TICKET_STATUS_LABEL: Record<number, string> = {
  [TicketStatus.Unverified]: '未使用',
  [TicketStatus.Verified]: '已核销',
  [TicketStatus.Voided]: '已作废',
};

interface FilterState {
  orderNo: string;
  showId: string;
  sessionId: string;
  status: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FILTER: FilterState = {
  orderNo: '',
  showId: '',
  sessionId: '',
  status: '',
  startTime: '',
  endTime: '',
};

export default function OrdersPage() {
  const [draft, setDraft] = useState<FilterState>(EMPTY_FILTER);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<OrderStatusResponse | null>(null);

  const { data: shows = [] } = useListShowsQuery();

  const queryArg: AdminOrderListRequest = {
    page,
    size: PAGE_SIZE,
    orderNo: filter.orderNo.trim() || undefined,
    showId: filter.showId ? Number(filter.showId) : undefined,
    sessionId: filter.sessionId ? Number(filter.sessionId) : undefined,
    status: filter.status === '' ? undefined : (Number(filter.status) as OrderStatus),
    // datetime-local 输出 "YYYY-MM-DDTHH:mm"，后端期望 "YYYY-MM-DDTHH:mm:ss"
    startTime: filter.startTime ? `${filter.startTime}:00` : undefined,
    endTime: filter.endTime ? `${filter.endTime}:00` : undefined,
  };

  const { data, isFetching, refetch } = useListAdminOrdersQuery(queryArg);
  const list = data?.list ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilter = () => {
    setPage(1);
    setFilter(draft);
  };
  const resetFilter = () => {
    setDraft(EMPTY_FILTER);
    setFilter(EMPTY_FILTER);
    setPage(1);
  };

  const columns: Column<OrderStatusResponse>[] = [
    {
      key: 'orderNo',
      title: '订单号',
      render: (o) => <span className="font-mono text-xs">{o.orderNo}</span>,
    },
    {
      key: 'show',
      title: '演出 / 场次',
      render: (o) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{o.showName ?? '-'}</div>
          <div className="text-xs text-muted-foreground truncate">
            {[o.showCityName, o.showVenue].filter(Boolean).join(' · ') || '-'}
          </div>
          {o.sessionStartTime && (
            <div className="text-xs text-muted-foreground">
              {formatDateTime(o.sessionStartTime)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'seats',
      title: '座位',
      width: '80px',
      render: (o) => <span className="text-xs">{o.seatInfos.length} 个</span>,
    },
    {
      key: 'totalAmount',
      title: '总金额',
      width: '100px',
      render: (o) => <span className="font-semibold">{formatMoney(o.totalAmount)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>
          {ORDER_STATUS_LABEL[o.status] ?? String(o.status)}
        </Badge>
      ),
    },
    {
      key: 'createTime',
      title: '创建时间',
      width: '160px',
      render: (o) => <span className="text-xs">{formatDateTime(o.createTime)}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      width: '88px',
      render: (o) => (
        <Button size="sm" variant="outline" onClick={() => setDetailOrder(o)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="订单管理"
        subtitle={`共 ${total} 条订单`}
        icon={Receipt}
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        }
      />

      {/* 筛选条 */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="f-orderNo">订单号（精确）</Label>
            <Input
              id="f-orderNo"
              value={draft.orderNo}
              onChange={(e) => setDraft({ ...draft, orderNo: e.target.value })}
              placeholder="完整订单号"
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>演出</Label>
            <Select
              value={draft.showId || '__all__'}
              onValueChange={(v) => setDraft({ ...draft, showId: v === '__all__' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部演出</SelectItem>
                {shows.map((s) => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-session">场次 ID</Label>
            <Input
              id="f-session"
              value={draft.sessionId}
              onChange={(e) => setDraft({ ...draft, sessionId: e.target.value })}
              placeholder="可选，数字"
              type="number"
            />
          </div>
          <div className="space-y-1.5">
            <Label>状态</Label>
            <Select
              value={draft.status || '__all__'}
              onValueChange={(v) => setDraft({ ...draft, status: v === '__all__' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部状态</SelectItem>
                {Object.entries(ORDER_STATUS_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-start">创建起</Label>
            <Input
              id="f-start"
              type="datetime-local"
              value={draft.startTime}
              onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-end">创建止</Label>
            <Input
              id="f-end"
              type="datetime-local"
              value={draft.endTime}
              onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={resetFilter}>
            <X className="h-3.5 w-3.5 mr-1" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={applyFilter}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            查询
          </Button>
        </div>
      </Card>

      <DataTable<OrderStatusResponse>
        columns={columns}
        data={list}
        rowKey={(o) => String(o.orderId)}
        loading={isFetching}
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            上一页
          </Button>
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            下一页
          </Button>
        </div>
      )}

      <Drawer
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `订单 ${detailOrder.orderNo}` : ''}
        width={520}
      >
        {detailOrder && <OrderDetail order={detailOrder} />}
      </Drawer>
    </div>
  );
}

function OrderDetail({ order }: { order: OrderStatusResponse }) {
  return (
    <div className="space-y-4">
      <Card variant="gradient" className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">订单号</div>
            <div className="font-mono text-sm break-all">{order.orderNo}</div>
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
            {ORDER_STATUS_LABEL[order.status] ?? String(order.status)}
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-brand/20">
          <span className="text-sm text-muted-foreground">总金额</span>
          <span className="text-xl font-semibold text-brand">{formatMoney(order.totalAmount)}</span>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="font-medium">{order.showName ?? '-'}</div>
        {(order.showCityName || order.showVenue || order.showAddress) && (
          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-brand shrink-0" />
            <span>
              {[order.showCityName, order.showVenue, order.showAddress].filter(Boolean).join(' · ')}
            </span>
          </p>
        )}
        {(order.sessionName || order.sessionStartTime) && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-brand" />
            {[order.sessionName, formatDateTime(order.sessionStartTime)].filter(Boolean).join(' · ')}
          </p>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-medium">座位（{order.seatInfos.length}）</div>
        <div className="flex flex-wrap gap-1.5">
          {order.seatInfos.map((s, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded bg-brand/10 text-brand"
            >
              {s}
            </span>
          ))}
        </div>
      </Card>

      {order.tickets && order.tickets.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="text-sm font-medium inline-flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-brand" />
            票券（{order.tickets.length}）
          </div>
          <ul className="space-y-1 text-xs">
            {order.tickets.map((t) => (
              <li
                key={t.ticketNo}
                className="flex items-center justify-between border-b border-border/40 last:border-0 py-1.5"
              >
                <span className="font-mono">{t.ticketNo}</span>
                <Badge variant={t.status === TicketStatus.Verified ? 'success' : 'muted'}>
                  {TICKET_STATUS_LABEL[t.status] ?? String(t.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 grid grid-cols-2 gap-3 text-xs">
        <Info label="创建时间" value={formatDateTime(order.createTime)} />
        <Info label="支付时间" value={formatDateTime(order.payTime)} />
        <Info label="过期时间" value={formatDateTime(order.expireTime)} />
        <Info label="订单 ID" value={String(order.orderId)} />
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value || '-'}</div>
    </div>
  );
}
