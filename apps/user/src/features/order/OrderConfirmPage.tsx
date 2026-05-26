import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Ticket, ShieldCheck, ChevronRight, Wallet } from 'lucide-react';
import { extractErrorMessage, notify, cn } from '@maill/shared';
import { StickyBottomBar } from '@/components/StickyBottomBar';
import { formatMoney } from '@/lib/format';
import {
  selectCartSeats,
  selectCartTotalPrice,
  clearCart,
} from '@/features/sessions/cartSlice';
import { useSubmitOrderMutation } from './orderApi';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function OrderConfirmPage() {
  const { t } = useTranslation(['order', 'common']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search] = useSearchParams();
  const sessionIdParam = search.get('sessionId') ?? '';
  const seats = useSelector(selectCartSeats);
  const total = useSelector(selectCartTotalPrice);
  const [submitOrder, { isLoading }] = useSubmitOrderMutation();

  // 空状态:友好引导
  if (seats.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-5">
          <span
            aria-hidden
            className="absolute inset-0 -m-3 rounded-3xl bg-gradient-brand-soft blur-2xl animate-breath-glow"
          />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-brand-soft flex items-center justify-center ring-1 ring-brand/20">
            <Ticket className="h-9 w-9 text-brand" />
          </div>
        </div>
        <h2 className="font-semibold text-lg">{t('order:confirm.empty')}</h2>
        <p className="text-xs text-muted-foreground mt-1">还没有选择座位,先去挑一场喜欢的演出吧</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 inline-flex items-center gap-1 h-11 px-6 rounded-full
                     bg-gradient-brand text-brand-foreground text-sm font-semibold
                     shadow-md shadow-brand/30 active:scale-95 transition-transform"
        >
          {t('order:confirm.backHome')}
          <ChevronRight className="h-4 w-4" />
        </button>
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
    <div className="pb-32">
      {/* ===== 沉浸式 header ===== */}
      <header className="relative isolate px-4 pt-3 pb-6 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-40 h-40 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        />

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common:actions.back')}
            className="h-10 w-10 rounded-full
                       bg-white/65 dark:bg-white/10 backdrop-blur-xl
                       border border-white/40 dark:border-white/15
                       shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                       flex items-center justify-center shrink-0
                       active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{t('order:confirm.title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">确认信息无误后即可提交</p>
          </div>
        </div>
      </header>

      {/* ===== 座位列表卡:浮在 header 底部 ===== */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="relative -mt-3 px-4 space-y-3"
      >
        <motion.section
          variants={itemVariants}
          className="rounded-2xl bg-card border border-border/60
                     shadow-[0_10px_30px_-12px_rgba(15,23,42,0.15)]
                     overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-semibold inline-flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-brand" />
              {t('order:confirm.selectedSeats', { n: seats.length })}
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {seats.length} 张
            </span>
          </div>
          <ul>
            {seats.map((s, i) => (
              <li
                key={String(s.seatId)}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2.5',
                  i !== seats.length - 1 && 'border-b border-border/30',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-7 w-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Ticket className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium truncate">{s.seatName}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {formatMoney(s.price)}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* 总价卡:渐变背景 + 大号 */}
        <motion.section
          variants={itemVariants}
          className="rounded-2xl overflow-hidden relative isolate
                     bg-gradient-to-br from-brand/[0.08] via-card to-card
                     border border-brand/20
                     shadow-[0_8px_20px_-8px_hsl(var(--brand)/0.25)]"
        >
          <div
            aria-hidden
            className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-brand/15 blur-3xl -z-10"
          />
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <div className="text-xs text-muted-foreground">{t('order:confirm.totalLabel')}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">含税 · 不含手续费</div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-brand tabular-nums leading-none">
                {formatMoney(total)}
              </span>
            </div>
          </div>
        </motion.section>

        {/* 锁定提示:绿色 ShieldCheck */}
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl
                     bg-success/[0.06] border border-success/15"
        >
          <span className="h-6 w-6 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('order:confirm.lockHint')}
          </p>
        </motion.div>
      </motion.div>

      {/* ===== Sticky 底部栏 ===== */}
      <StickyBottomBar>
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground leading-none">
              {t('order:confirm.totalShort')}
            </div>
            <div className="text-2xl font-bold text-brand tabular-nums leading-tight mt-0.5">
              {formatMoney(total)}
            </div>
          </div>
          <motion.button
            type="button"
            disabled={isLoading}
            onClick={handleSubmit}
            whileTap={!isLoading ? { scale: 0.96 } : undefined}
            className={cn(
              'inline-flex items-center gap-1 h-12 px-6 rounded-full shrink-0 text-sm font-semibold transition-all',
              isLoading
                ? 'bg-muted text-muted-foreground/60 cursor-not-allowed'
                : 'bg-gradient-brand text-brand-foreground shadow-lg shadow-brand/35 hover:opacity-95',
            )}
          >
            <Wallet className="h-4 w-4" />
            {isLoading ? t('order:confirm.submittingBtn') : t('order:confirm.submitBtn')}
          </motion.button>
        </div>
      </StickyBottomBar>
    </div>
  );
}
