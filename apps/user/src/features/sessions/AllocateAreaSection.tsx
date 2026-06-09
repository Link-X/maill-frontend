import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Sparkles, Loader2, Users } from 'lucide-react';
import {
  cn,
  extractErrorMessage,
  notify,
  type AreaPriceVO,
  type AllocateTicketType,
} from '@maill/shared';
import { formatMoney } from '@/lib/format';
import {
  useSubmitByAreaMutation,
  useLazyGetOrderCreateStatusQuery,
} from '@/features/order/orderApi';

const POLL_INTERVAL_MS = 600;
const POLL_TIMEOUT_MS = 30_000;
const MAX_QTY = 4;

interface Props {
  sessionId: number | string;
  areaPriceList: AreaPriceVO[];
  /** areaId → 区域填充色,用于卡片色条 */
  priceColorMap: Map<string, string>;
  /** 不在销售中时禁用提交 */
  onSale: boolean;
  /**
   * 用户在该场次的剩余可购"张数"上限。
   * 单座下单时数量 ≤ remainingLimit;情侣对下单时对数 ≤ floor(remainingLimit / 2)(每对 2 张)。
   */
  remainingLimit: number;
}

/**
 * 派座下单区:列出 saleMode=2 的区域,内联选择「票种+数量」并直接下单。
 *
 * 与选座模式的差异:
 *  - 不进购物车,提交即调用 /api/order/submit/by-area
 *  - 区域内自带单座/情侣对两个 tab(只显示存在的票种)
 *  - 提交后轮询 /createStatus,与选座共用 OrderConfirmPage 的流程
 */
export function AllocateAreaSection({
  sessionId,
  areaPriceList,
  priceColorMap,
  onSale,
  remainingLimit,
}: Props) {
  const allocateAreas = useMemo(
    () => areaPriceList.filter((a) => a.saleMode === 2),
    [areaPriceList],
  );

  if (allocateAreas.length === 0) return null;

  return (
    <section className="px-4 mb-3">
      <div className="mb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold inline-flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            系统派座区
          </h3>
          {remainingLimit > 0 ? (
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              剩余可购 <span className="text-brand font-semibold">{remainingLimit}</span> 张
            </span>
          ) : (
            <span className="text-[10px] text-warning font-medium shrink-0">已达本场限购上限</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
          选区域 + 张数即可,系统自动派出最佳座位
        </p>
      </div>
      <div className="space-y-2.5">
        {allocateAreas.map((a) => (
          <AllocateAreaCard
            key={a.areaId}
            sessionId={sessionId}
            area={a}
            color={priceColorMap.get(a.areaId) ?? '#94a3b8'}
            onSale={onSale}
            remainingLimit={remainingLimit}
          />
        ))}
      </div>
    </section>
  );
}

function AllocateAreaCard({
  sessionId,
  area,
  color,
  onSale,
  remainingLimit,
}: {
  sessionId: number | string;
  area: AreaPriceVO;
  color: string;
  onSale: boolean;
  remainingLimit: number;
}) {
  const navigate = useNavigate();
  const hasSingle = (area.singleTotal ?? 0) > 0;
  const hasCouple = (area.coupleTotal ?? 0) > 0;
  const defaultType: AllocateTicketType = hasSingle ? 1 : 2;
  const [ticketType, setTicketType] = useState<AllocateTicketType>(defaultType);
  const [quantity, setQuantity] = useState(1);
  const [submit, { isLoading: submitting }] = useSubmitByAreaMutation();
  const [fetchStatus] = useLazyGetOrderCreateStatusQuery();
  const [polling, setPolling] = useState(false);
  const busy = submitting || polling;

  // 库存信息(后端目前未在 areaPriceList 中暴露 stock,前端按 total 兜底显示)
  const totalForType =
    ticketType === 1 ? (area.singleTotal ?? 0) : (area.coupleTotal ?? 0);
  const stockForType =
    ticketType === 1
      ? area.singleStock ?? area.singleTotal ?? 0
      : area.coupleStock ?? area.coupleTotal ?? 0;

  // 数量上限 = 三者取最小:库存、限购、卡片自定义 MAX_QTY
  //   - 单座:remainingLimit 直接作为"张数"上限
  //   - 情侣对:remainingLimit 是"张数",每对 = 2 张,所以"对数"上限 = floor(remainingLimit / 2)
  const limitByPurchase =
    ticketType === 2 ? Math.floor(remainingLimit / 2) : remainingLimit;
  const maxQty = Math.min(MAX_QTY, stockForType, Math.max(0, limitByPurchase));

  // 切换票种或上限变化时,夹紧当前数量(放 useEffect 里避免 render 期 setState)
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) setQuantity(maxQty);
  }, [maxQty, quantity]);

  const unitPrice = Number(area.price || 0);
  const totalPrice = unitPrice * quantity * (ticketType === 2 ? 2 : 1);
  const overLimit = maxQty === 0;

  const handleSubmit = async () => {
    if (!onSale) {
      notify.warn('场次未在售');
      return;
    }
    try {
      const { orderNo } = await submit({
        sessionId,
        areaId: area.areaId,
        ticketType,
        quantity,
      }).unwrap();
      setPolling(true);
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const status = await fetchStatus(orderNo).unwrap();
        if (status.state === 'SUCCESS') {
          notify.success('派座成功,跳转支付');
          navigate(`/order/${orderNo}/pay`, { replace: true });
          return;
        }
        if (status.state === 'FAILED' || status.state === 'NOT_FOUND') {
          notify.error(status.message ?? '派座失败,请重试');
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      notify.error('派座超时,请到"我的订单"确认是否生成');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    } finally {
      setPolling(false);
    }
  };

  return (
    <div
      className="rounded-2xl bg-card border border-border/60 overflow-hidden
                 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)]"
    >
      {/* 顶部:区域 + 价格 */}
      <div className="px-3.5 py-3 flex items-center justify-between gap-3 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block h-4 w-4 rounded-sm shrink-0"
            style={{ background: color }}
            aria-hidden
          />
          <span className="font-semibold text-sm truncate">
            {area.areaId} 区
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            剩 {stockForType}/{totalForType}
          </span>
        </div>
        <div className="text-brand font-bold tabular-nums">
          {formatMoney(area.price)}
          <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
            /{ticketType === 2 ? '对' : '张'}
          </span>
        </div>
      </div>

      {/* 票种切换(只在两种都存在时显示) */}
      {hasSingle && hasCouple && (
        <div className="px-3.5 pt-3 flex gap-1.5">
          <TicketTypeChip
            active={ticketType === 1}
            onClick={() => {
              setTicketType(1);
              setQuantity(1);
            }}
          >
            单座
          </TicketTypeChip>
          <TicketTypeChip
            active={ticketType === 2}
            onClick={() => {
              setTicketType(2);
              setQuantity(1);
            }}
          >
            <Users className="h-3 w-3 mr-1" />
            情侣对
          </TicketTypeChip>
        </div>
      )}

      {/* 数量 + 总价 + 提交 */}
      <div className="px-3.5 py-3 flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground leading-none flex items-center gap-1.5">
            <span>{ticketType === 2 ? '对数' : '张数'}</span>
            {maxQty > 0 && (
              <span className="text-muted-foreground/60 tabular-nums">
                · 上限 {maxQty}
              </span>
            )}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-1 h-9">
            <StepBtn
              ariaLabel="减少"
              disabled={quantity <= 1 || busy}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </StepBtn>
            <span className="min-w-[1.5rem] text-center font-semibold tabular-nums">
              {quantity}
            </span>
            <StepBtn
              ariaLabel="增加"
              disabled={quantity >= maxQty || busy}
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </StepBtn>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-muted-foreground leading-none">合计</div>
          <div className="mt-1 text-xl font-bold text-brand tabular-nums leading-none">
            {formatMoney(totalPrice)}
          </div>
        </div>

        <motion.button
          type="button"
          disabled={busy || !onSale || overLimit || quantity > maxQty}
          onClick={handleSubmit}
          whileTap={!busy && onSale && !overLimit ? { scale: 0.96 } : undefined}
          className={cn(
            'inline-flex items-center gap-1 h-9 px-4 rounded-full text-sm font-semibold shrink-0 transition',
            busy || !onSale || overLimit || quantity > maxQty
              ? 'bg-muted text-muted-foreground/60'
              : 'bg-gradient-brand text-brand-foreground shadow-md shadow-brand/30',
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {polling
            ? '派座中...'
            : submitting
              ? '提交中...'
              : overLimit
                ? '已达上限'
                : '立即下单'}
        </motion.button>
      </div>
    </div>
  );
}

function TicketTypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center text-xs px-3 h-7 rounded-full border transition',
        active
          ? 'bg-brand/15 border-brand/40 text-brand font-semibold'
          : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted/60',
      )}
    >
      {children}
    </button>
  );
}

function StepBtn({
  children,
  ariaLabel,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center transition',
        disabled
          ? 'text-muted-foreground/40 cursor-not-allowed'
          : 'text-foreground hover:bg-muted/60',
      )}
    >
      {children}
    </button>
  );
}
