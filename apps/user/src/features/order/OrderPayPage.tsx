import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Sparkles, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Button,
  OrderStatus,
  extractErrorMessage,
  notify,
} from '@maill/shared';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { Skeleton } from '@/components/Skeleton';
import { StickyBottomBar } from '@/components/StickyBottomBar';
import { formatMoney, formatDateTime } from '@/lib/format';
import { useGetOrderDetailsQuery, useCancelOrderMutation } from './orderApi';
import { useCreatePaymentMutation } from '@/features/payment/paymentApi';

export default function OrderPayPage() {
  const navigate = useNavigate();
  const { orderNo } = useParams<{ orderNo: string }>();
  const id = orderNo ?? '';
  const [polling, setPolling] = useState(false);

  const { data: order, isLoading, refetch } = useGetOrderDetailsQuery(id, {
    skip: !id,
    pollingInterval: polling ? 1000 : 0,
  });
  const [createPayment, { isLoading: paying }] = useCreatePaymentMutation();
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();

  const allTicketsReady = useMemo(
    () => (order?.tickets?.length ?? 0) > 0 && (order?.tickets ?? []).every((t) => !!t.qrCode),
    [order?.tickets],
  );

  useEffect(() => {
    if (polling && allTicketsReady) {
      setPolling(false);
      notify.success('票券已生成');
    }
  }, [polling, allTicketsReady]);

  useEffect(() => {
    if (!polling) return;
    const t = setTimeout(() => {
      setPolling(false);
      notify.warn('票券生成稍慢，可下拉刷新订单详情');
    }, 30000);
    return () => clearTimeout(t);
  }, [polling]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  if (!order) {
    return <div className="p-6 text-center text-muted-foreground">订单不存在</div>;
  }

  const handlePay = async () => {
    try {
      await createPayment({ orderNo: id, channel: 'mock' }).unwrap();
      notify.success('支付成功，正在生成票券...');
      setPolling(true);
      refetch();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder({ orderNo: id }).unwrap();
      notify.success('订单已取消');
      navigate('/orders', { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const isPending = order.status === OrderStatus.PendingPayment;
  const isPaid = order.status === OrderStatus.Paid;
  const isCancelled = order.status === OrderStatus.Cancelled;

  return (
    <div className="pb-28">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/orders')}
          aria-label="返回订单列表"
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold">订单详情</div>
      </div>

      <div className="px-4 space-y-4">
        <Card variant="gradient" className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground">订单号</div>
          <div className="font-mono text-sm">{order.orderNo}</div>
          <div className="flex items-center justify-between pt-2 border-t border-brand/20">
            <span className="text-sm text-muted-foreground">总价</span>
            <span className="text-2xl font-semibold text-brand">{formatMoney(order.totalAmount)}</span>
          </div>
          {isPending && order.expireTime && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">支付剩余</span>
              <Countdown expireTime={order.expireTime} onExpire={refetch} />
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="font-medium">{order.showName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">
            {order.sessionName ?? ''} · {formatDateTime(order.sessionStartTime)}
          </div>
          <div className="text-xs text-muted-foreground">{order.showVenue ?? ''}</div>
          <div className="pt-2 border-t border-border/60">
            <div className="text-xs text-muted-foreground mb-1">座位</div>
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
          </div>
        </Card>

        {isPaid && (
          <section className="space-y-3">
            <h3 className="font-medium inline-flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-brand" />
              入场二维码
            </h3>
            {(!order.tickets || order.tickets.length === 0) ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                票券正在生成中...
                {!polling && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setPolling(true)}>
                    手动刷新
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {order.tickets.map((t, i) => (
                  <motion.div
                    key={t.ticketNo}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
                  >
                    <Card className="p-4 flex items-center gap-4">
                      <div className="bg-card p-2 rounded-lg border border-border/60">
                        {t.qrCode ? (
                          <QRCodeSVG value={t.qrCode} size={96} level="M" />
                        ) : (
                          <div className="h-24 w-24 flex items-center justify-center text-muted-foreground">
                            <Sparkles className="h-6 w-6 animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">票号</div>
                        <div className="font-mono text-sm break-all">{t.ticketNo}</div>
                        <div className="text-xs text-muted-foreground pt-1">
                          {order.seatInfos[i] ?? `第 ${i + 1} 张`}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {isCancelled && (
          <Card className="p-4 text-center text-sm text-muted-foreground">
            订单已取消
          </Card>
        )}
      </div>

      {isPending && (
        <StickyBottomBar>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={cancelling}
              onClick={handleCancel}
            >
              取消订单
            </Button>
            <Button
              className="flex-[2] bg-gradient-brand hover:opacity-90"
              disabled={paying}
              onClick={handlePay}
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              {paying ? '支付中...' : `立即支付 ${formatMoney(order.totalAmount)}`}
            </Button>
          </div>
        </StickyBottomBar>
      )}
    </div>
  );
}
