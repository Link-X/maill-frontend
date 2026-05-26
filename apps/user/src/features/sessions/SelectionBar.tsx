import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Ticket, ChevronRight } from 'lucide-react';
import { cn } from '@maill/shared';
import { StickyBottomBar } from '@/components/StickyBottomBar';
import { formatMoney } from '@/lib/format';
import { selectCartSeats, selectCartTotalPrice } from './cartSlice';

const MAX_VISIBLE_CHIPS = 4;

export function SelectionBar({
  sessionId,
  limitPerUser,
}: {
  sessionId: number | string;
  limitPerUser: number;
}) {
  const { t } = useTranslation(['session']);
  const seats = useSelector(selectCartSeats);
  const total = useSelector(selectCartTotalPrice);
  const navigate = useNavigate();

  const hasSeats = seats.length > 0;
  const progress = Math.min(1, seats.length / limitPerUser);

  return (
    <StickyBottomBar>
      {/* 顶部进度条:已选 / 上限 */}
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <div className="text-muted-foreground inline-flex items-center gap-1.5">
          <Ticket className="h-3 w-3 text-brand" />
          {hasSeats ? (
            <span>
              已选{' '}
              <span className="font-semibold text-brand tabular-nums">{seats.length}</span> /{' '}
              <span className="tabular-nums">{limitPerUser}</span> 座
            </span>
          ) : (
            <span>请选择座位(最多 {limitPerUser} 个)</span>
          )}
        </div>
        {hasSeats && (
          <div className="text-muted-foreground/80 tabular-nums">
            {limitPerUser - seats.length > 0
              ? `还可选 ${limitPerUser - seats.length} 个`
              : '已达上限'}
          </div>
        )}
      </div>

      {/* 进度条 */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-brand rounded-full"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />
      </div>

      <div className="flex items-end gap-3">
        {/* 座位 chip 列表 */}
        <div className="min-w-0 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            {hasSeats ? (
              <motion.div
                key="chips"
                layout
                className="flex flex-wrap gap-1 min-h-[22px]"
              >
                <AnimatePresence initial={false}>
                  {seats.slice(0, MAX_VISIBLE_CHIPS).map((s) => (
                    <motion.span
                      key={String(s.seatId)}
                      layout
                      initial={{ scale: 0.6, opacity: 0, y: 4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.6, opacity: 0, y: -4 }}
                      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
                      className="text-[11px] px-1.5 py-0.5 rounded-md
                                 bg-brand/15 text-brand font-medium border border-brand/20"
                    >
                      {s.seatName}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {seats.length > MAX_VISIBLE_CHIPS && (
                  <span className="text-[11px] text-muted-foreground self-center ml-0.5">
                    +{seats.length - MAX_VISIBLE_CHIPS}
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-muted-foreground/70 min-h-[22px] flex items-center"
              >
                未选座位
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 总价 */}
        <div className="text-right shrink-0">
          <div className="text-[10px] text-muted-foreground leading-none">
            {t('session:selectionBar.total')}
          </div>
          <motion.div
            key={total}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="text-xl font-bold text-brand tabular-nums leading-tight mt-0.5"
          >
            {formatMoney(total)}
          </motion.div>
        </div>

        {/* 提交按钮 */}
        <motion.button
          type="button"
          disabled={!hasSeats}
          onClick={() => navigate(`/order/confirm?sessionId=${sessionId}`)}
          whileTap={hasSeats ? { scale: 0.96 } : undefined}
          className={cn(
            'inline-flex items-center gap-0.5 h-11 px-5 rounded-full shrink-0 text-sm font-semibold transition-all',
            hasSeats
              ? 'bg-gradient-brand text-brand-foreground shadow-md shadow-brand/30 hover:opacity-95'
              : 'bg-muted text-muted-foreground/60 cursor-not-allowed',
          )}
        >
          {t('session:selectionBar.submit')}
          {hasSeats && <ChevronRight className="h-4 w-4 -mr-1" />}
        </motion.button>
      </div>
    </StickyBottomBar>
  );
}
