import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Ticket, Check } from 'lucide-react';
import { Button, extractErrorMessage, notify } from '@maill/shared';
import { Card } from '@/components/Card';
import { StickyBottomBar } from '@/components/StickyBottomBar';
import { formatMoney } from '@/lib/format';
import {
  selectCartSeats,
  selectCartTotalPrice,
  clearCart,
} from '@/features/sessions/cartSlice';
import { useSubmitOrderMutation } from './orderApi';

export default function OrderConfirmPage() {
  const { t } = useTranslation(['order', 'common']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search] = useSearchParams();
  const sessionIdParam = search.get('sessionId') ?? '';
  const seats = useSelector(selectCartSeats);
  const total = useSelector(selectCartTotalPrice);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();

  if (seats.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <Ticket className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">{t('order:confirm.empty')}</p>
        <Button onClick={() => navigate('/')}>{t('order:confirm.backHome')}</Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      const result = await submitOrder({
        sessionId: sessionIdParam,
        seatIds: seats.map((s) => s.seatId),
      }).unwrap();
      notify.success(t('order:confirm.submittedToast'));
      dispatch(clearCart());
      navigate(`/order/${result.orderNo}/pay`, { replace: true });
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="pb-28">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold">{t('order:confirm.title')}</div>
      </div>

      <div className="px-4 space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-medium inline-flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-brand" />
            {t('order:confirm.selectedSeats', { n: seats.length })}
          </h3>
          <ul className="space-y-2">
            {seats.map((s) => (
              <li
                key={String(s.seatId)}
                className="flex items-center justify-between text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-success" />
                  {s.seatName}
                </span>
                <span className="text-muted-foreground">{formatMoney(s.price)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass" className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('order:confirm.totalLabel')}</span>
          <span className="text-2xl font-semibold text-brand">{formatMoney(total)}</span>
        </Card>

        <p className="text-xs text-muted-foreground px-1">{t('order:confirm.lockHint')}</p>
      </div>

      <StickyBottomBar>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{t('order:confirm.totalShort')}</div>
            <div className="text-xl font-semibold text-brand">{formatMoney(total)}</div>
          </div>
          <Button
            className="flex-1 bg-gradient-brand hover:opacity-90"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? t('order:confirm.submittingBtn') : t('order:confirm.submitBtn')}
          </Button>
        </div>
      </StickyBottomBar>
    </div>
  );
}
