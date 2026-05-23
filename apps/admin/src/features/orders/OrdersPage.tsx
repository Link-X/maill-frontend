import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// 把 enum 值映射到 order:status.* 的 key 后缀
const ORDER_STATUS_KEY: Record<number, string> = {
  [OrderStatus.PendingPayment]: 'pending',
  [OrderStatus.Paid]: 'paid',
  [OrderStatus.Cancelled]: 'cancelled',
  [OrderStatus.Refunding]: 'refunding',
  [OrderStatus.Refunded]: 'refunded',
  [OrderStatus.PartialRefund]: 'partial',
};

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'info' | 'muted'> = {
  [OrderStatus.PendingPayment]: 'warning',
  [OrderStatus.Paid]: 'success',
  [OrderStatus.Cancelled]: 'muted',
  [OrderStatus.Refunding]: 'info',
  [OrderStatus.Refunded]: 'muted',
  [OrderStatus.PartialRefund]: 'info',
};

const TICKET_STATUS_KEY: Record<number, string> = {
  [TicketStatus.Unverified]: 'unverified',
  [TicketStatus.Verified]: 'verified',
  [TicketStatus.Voided]: 'voided',
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
  const { t } = useTranslation(['order', 'common']);
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
      title: t('order:admin.table.orderNo'),
      render: (o) => <span className="font-mono text-xs">{o.orderNo}</span>,
    },
    {
      key: 'show',
      title: t('order:admin.table.show'),
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
      title: t('order:admin.table.seats'),
      width: '80px',
      render: (o) => (
        <span className="text-xs">
          {t('order:admin.table.seatsValue', { n: o.seatInfos.length })}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: t('order:admin.table.totalAmount'),
      width: '100px',
      render: (o) => <span className="font-semibold">{formatMoney(o.totalAmount)}</span>,
    },
    {
      key: 'status',
      title: t('order:admin.table.status'),
      width: '90px',
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>
          {ORDER_STATUS_KEY[o.status]
            ? t(`order:status.${ORDER_STATUS_KEY[o.status]}`)
            : String(o.status)}
        </Badge>
      ),
    },
    {
      key: 'createTime',
      title: t('order:admin.table.createTime'),
      width: '160px',
      render: (o) => <span className="text-xs">{formatDateTime(o.createTime)}</span>,
    },
    {
      key: 'actions',
      title: t('order:admin.table.actions'),
      width: '88px',
      render: (o) => (
        <Button size="sm" variant="outline" onClick={() => setDetailOrder(o)}>
          {t('common:actions.viewDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('order:admin.page.title')}
        subtitle={t('order:admin.page.subtitle', { total })}
        icon={Receipt}
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            {t('common:actions.refresh')}
          </Button>
        }
      />

      {/* 筛选条 */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="f-orderNo">{t('order:admin.filter.orderNoLabel')}</Label>
            <Input
              id="f-orderNo"
              value={draft.orderNo}
              onChange={(e) => setDraft({ ...draft, orderNo: e.target.value })}
              placeholder={t('order:admin.filter.orderNoPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('order:admin.filter.showLabel')}</Label>
            <Select
              value={draft.showId || '__all__'}
              onValueChange={(v) => setDraft({ ...draft, showId: v === '__all__' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('order:admin.filter.showAll')}</SelectItem>
                {shows.map((s) => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-session">{t('order:admin.filter.sessionLabel')}</Label>
            <Input
              id="f-session"
              value={draft.sessionId}
              onChange={(e) => setDraft({ ...draft, sessionId: e.target.value })}
              placeholder={t('order:admin.filter.sessionPlaceholder')}
              type="number"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('order:admin.filter.statusLabel')}</Label>
            <Select
              value={draft.status || '__all__'}
              onValueChange={(v) => setDraft({ ...draft, status: v === '__all__' ? '' : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('order:admin.filter.statusAll')}</SelectItem>
                {Object.entries(ORDER_STATUS_KEY).map(([v, keyName]) => (
                  <SelectItem key={v} value={v}>
                    {t(`order:status.${keyName}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-start">{t('order:admin.filter.startLabel')}</Label>
            <Input
              id="f-start"
              type="datetime-local"
              value={draft.startTime}
              onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-end">{t('order:admin.filter.endLabel')}</Label>
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
            {t('common:actions.reset')}
          </Button>
          <Button
            size="sm"
            onClick={applyFilter}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            {t('common:actions.query')}
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
            {t('common:pagination.prev')}
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
            {t('common:pagination.next')}
          </Button>
        </div>
      )}

      <Drawer
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `${t('order:admin.detailDrawer.titlePrefix')} ${detailOrder.orderNo}` : ''}
        width={520}
      >
        {detailOrder && <OrderDetail order={detailOrder} />}
      </Drawer>
    </div>
  );
}

function OrderDetail({ order }: { order: OrderStatusResponse }) {
  const { t } = useTranslation(['order', 'common']);
  return (
    <div className="space-y-4">
      <Card variant="gradient" className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{t('order:orderNo')}</div>
            <div className="font-mono text-sm break-all">{order.orderNo}</div>
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
            {ORDER_STATUS_KEY[order.status]
              ? t(`order:status.${ORDER_STATUS_KEY[order.status]}`)
              : String(order.status)}
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-brand/20">
          <span className="text-sm text-muted-foreground">{t('order:totalAmount')}</span>
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
        <div className="text-sm font-medium">
          {t('order:detail.seatsLabelWithCount', { n: order.seatInfos.length })}
        </div>
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
            {t('order:detail.ticketsLabelWithCount', { n: order.tickets.length })}
          </div>
          <ul className="space-y-1 text-xs">
            {order.tickets.map((tk) => (
              <li
                key={tk.ticketNo}
                className="flex items-center justify-between border-b border-border/40 last:border-0 py-1.5"
              >
                <span className="font-mono">{tk.ticketNo}</span>
                <Badge variant={tk.status === TicketStatus.Verified ? 'success' : 'muted'}>
                  {TICKET_STATUS_KEY[tk.status]
                    ? t(`order:ticketStatus.${TICKET_STATUS_KEY[tk.status]}`)
                    : String(tk.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 grid grid-cols-2 gap-3 text-xs">
        <Info label={t('order:detail.createdAt')} value={formatDateTime(order.createTime)} />
        <Info label={t('order:detail.paidAt')} value={formatDateTime(order.payTime)} />
        <Info label={t('order:detail.expireAt')} value={formatDateTime(order.expireTime)} />
        <Info label={t('order:admin.detailDrawer.orderId')} value={String(order.orderId)} />
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
