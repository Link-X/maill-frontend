import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@maill/shared';
import { StickyBottomBar } from '@/components/StickyBottomBar';
import { formatMoney } from '@/lib/format';
import { selectCartSeats, selectCartTotalPrice } from './cartSlice';

export function SelectionBar({ sessionId }: { sessionId: number | string }) {
  const seats = useSelector(selectCartSeats);
  const total = useSelector(selectCartTotalPrice);
  const navigate = useNavigate();
  if (seats.length === 0) return null;
  return (
    <StickyBottomBar>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">已选 {seats.length} 个座位</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <AnimatePresence initial={false}>
              {seats.slice(0, 4).map((s) => (
                <motion.span
                  key={String(s.seatId)}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="text-[11px] px-1.5 py-0.5 rounded bg-brand/15 text-brand"
                >
                  {s.seatName}
                </motion.span>
              ))}
              {seats.length > 4 && (
                <span className="text-[11px] text-muted-foreground">+{seats.length - 4}</span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">合计</div>
          <div className="text-lg font-semibold text-brand">{formatMoney(total)}</div>
        </div>
        <Button
          className="shrink-0 bg-gradient-brand hover:opacity-90"
          onClick={() => navigate(`/order/confirm?sessionId=${sessionId}`)}
        >
          立即下单
        </Button>
      </div>
    </StickyBottomBar>
  );
}
