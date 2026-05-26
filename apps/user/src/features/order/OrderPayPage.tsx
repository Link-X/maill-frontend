import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, Sparkles, QrCode, RefreshCcw } from 'lucide-react';
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
import { useGetOrderDetailsQuery, useCancelOrderMutation, useRefundTicketMutation } from './orderApi';
import { useCreatePaymentMutation } from '@/features/payment/paymentApi';

export default function OrderPayPage() {
  const { t } = useTranslation(['order']);
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
  const [refundTicket, { isLoading: refunding }] = useRefundTicketMutation();
  const [refundingTicketNo, setRefundingTicketNo] = useState<string | null>(null);

  const allTicketsReady = useMemo(
    () => (order?.tickets?.length ?? 0) > 0 && (order?.tickets ?? []).every((t) => !!t.qrCode),
    [order?.tickets],
  );

  useEffect(() => {
    if (polling && allTicketsReady) {
      setPolling(false);
      notify.success(t('order:pay.ticketsReady'));
    }
  }, [polling, allTicketsReady, t]);

  useEffect(() => {
    if (!polling) return;
    const timer = setTimeout(() => {
      setPolling(false);
      notify.warn(t('order:pay.ticketsSlowHint'));
    }, 30000);
    return () => clearTimeout(timer);
  }, [polling, t]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  if (!order) {
    return <div className="p-6 text-center text-muted-foreground">{t('order:pay.notFound')}</div>;
  }

  const handlePay = async () => {
    try {
      await createPayment({ orderNo: id, channel: 'mock' }).unwrap();
      notify.success(t('order:pay.paidGenerating'));
      setPolling(true);
      refetch();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder({ orderNo: id }).unwrap();
      notify.success(t('order:pay.cancelledToast'));
      navigate('/orders', { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleRefundTicket = async (ticketNo: string) => {
    setRefundingTicketNo(ticketNo);
    try {
      await refundTicket({ orderNo: id, ticketNo }).unwrap();
      notify.success(t('order:refund.ticketSubmittedToast', { ticketNo }));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    } finally {
      setRefundingTicketNo(null);
    }
  };

  const handleRefundAll = async () => {
    if (!order) return;
    try {
      await cancelOrder({ orderNo: id }).unwrap();
      notify.success(t('order:refund.allSubmittedToast'));
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
          // 用 replace 而不是 push，避免与 /orders 的 navigate(-1) 形成"详情 ↔ 列表"循环
          onClick={() => navigate('/orders', { replace: true })}
          aria-label={t('order:pay.backToList')}
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold">{t('order:pay.title')}</div>
      </div>

      <div className="px-4 space-y-4">
        <Card variant="gradient" className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground">{t('order:orderNo')}</div>
          <div className="font-mono text-sm">{order.orderNo}</div>
          <div className="flex items-center justify-between pt-2 border-t border-brand/20">
            <span className="text-sm text-muted-foreground">{t('order:detail.totalLabel')}</span>
            <span className="text-2xl font-semibold text-brand">{formatMoney(order.totalAmount)}</span>
          </div>
          {isPending && order.expireTime && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">{t('order:detail.payRemaining')}</span>
              <Countdown expireTime={order.expireTime} onExpire={refetch} />
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="font-medium">{order.showName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">
            {order.sessionName ?? ''} · {formatDateTime(order.sessionStartTime)}
          </div>
          {(order.showCityName || order.showVenue || order.showAddress) && (
            <div className="text-xs text-muted-foreground">
              {[order.showCityName, order.showVenue, order.showAddress].filter(Boolean).join(' · ')}
            </div>
          )}
          <div className="pt-2 border-t border-border/60">
            <div className="text-xs text-muted-foreground mb-1">{t('order:detail.seatsLabel')}</div>
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
              {t('order:detail.qrCode')}
            </h3>
            {(!order.tickets || order.tickets.length === 0) ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                {t('order:pay.generating')}
                {!polling && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setPolling(true)}>
                    {t('order:pay.refreshNow')}
                  </Button>
                )}
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {order.tickets.map((tk, i) => (
                    <motion.div
                      key={tk.ticketNo}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
                    >
                      <Card className="p-4 flex items-center gap-4">
                        <div className="bg-card p-2 rounded-lg border border-border/60">
                          {tk.qrCode ? (
                            <QRCodeSVG value={tk.qrCode} size={96} level="M" />
                          ) : (
                            <div className="h-24 w-24 flex items-center justify-center text-muted-foreground">
                              <Sparkles className="h-6 w-6 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-xs text-muted-foreground">{t('order:pay.ticketNo')}</div>
                          <div className="font-mono text-sm break-all">{tk.ticketNo}</div>
                          <div className="text-xs text-muted-foreground pt-1">
                            {order.seatInfos[i] ?? t('order:pay.ticketIndex', { n: i + 1 })}
                          </div>
                          {tk.status === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              disabled={refundingTicketNo === tk.ticketNo}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefundTicket(tk.ticketNo);
                              }}
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              {refundingTicketNo === tk.ticketNo
                                ? t('order:refund.ticketing')
                                : t('order:refund.ticket')}
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={refunding}
                    onClick={handleRefundAll}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1.5" />
                    {refunding ? t('order:refund.refundingAll') : t('order:refund.all')}
                  </Button>
                </div>
              </>
            )}
          </section>
        )}

        {isCancelled && (
          <Card className="p-4 text-center text-sm text-muted-foreground">
            {t('order:pay.cancelledStatus')}
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
              {cancelling ? t('order:cancelling') : t('order:cancelOrder')}
            </Button>
            <Button
              className="flex-[2] bg-gradient-brand hover:opacity-90"
              disabled={paying}
              onClick={handlePay}
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              {paying
                ? t('order:pay.paying')
                : t('order:pay.payNowAmount', { amount: formatMoney(order.totalAmount) })}
            </Button>
          </div>
        </StickyBottomBar>
      )}
    </div>
  );
}
