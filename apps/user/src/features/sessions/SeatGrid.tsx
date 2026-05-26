import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn, SeatStatus, type SeatColVO, type SeatRowVO, type AreaPriceVO } from '@maill/shared';
import { selectCartSeats, toggleSeat, type CartSeat } from './cartSlice';

// 预设区域颜色（与 tailwind.config 中 bg-area-a/b/c/d 对应：rose/amber/emerald/sky）
const AREA_PALETTE = ['bg-area-a', 'bg-area-b', 'bg-area-c', 'bg-area-d'] as const;

const SEAT_SIZE = 26;
const SEAT_GAP = 4;
const ROW_LABEL_W = 24;
const MIN_SCALE = 0.6;
const MAX_SCALE = 3;

function normalizeAreaId(v: string | number | null | undefined): string {
  return v == null ? '' : String(v).trim();
}

/**
 * 按 areaId 生成 areaId → 颜色类 映射：每个区域单独一色。
 * 按价格降序排（高价区域优先拿到首个高亮色），价格不同→颜色不同；
 * 即使两个区域同价，也保留各自独立颜色（区域级一一对应）。
 */
export function buildPriceColorMap(areaPriceList: AreaPriceVO[]): Map<string, string> {
  const sorted = [...areaPriceList].sort((a, b) => Number(b.price) - Number(a.price));
  const m = new Map<string, string>();
  sorted.forEach((p, i) => {
    m.set(normalizeAreaId(p.areaId), AREA_PALETTE[i % AREA_PALETTE.length]);
  });
  return m;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

interface Props {
  rows: SeatRowVO[];
  rowCount: number;
  columnCount: number;
  areaPriceList: AreaPriceVO[];
  limitPerUser: number;
  onLimitExceed: () => void;
}

export function SeatGrid({ rows, rowCount, columnCount, areaPriceList, limitPerUser, onLimitExceed }: Props) {
  const dispatch = useDispatch();
  const selected = useSelector(selectCartSeats);
  const selectedIds = useMemo(
    () => new Set(selected.map((s) => String(s.seatId))),
    [selected],
  );

  const priceColorMap = useMemo(() => buildPriceColorMap(areaPriceList), [areaPriceList]);
  const areaPriceMap = useMemo(() => {
    const m = new Map<string, AreaPriceVO>();
    areaPriceList.forEach((p) => m.set(p.areaId, p));
    return m;
  }, [areaPriceList]);

  // ---------- 缩放（平移交给浏览器 overflow:auto 原生滚动） ----------
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // 围绕屏幕坐标 (clientX, clientY) 缩放：缩放后保持该点在视口中位置不变
  const zoomAtClient = (clientX: number, clientY: number, factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    // 焦点在 scroller（含 scroll offset）内的逻辑坐标
    const fx = clientX - rect.left + vp.scrollLeft;
    const fy = clientY - rect.top + vp.scrollTop;
    setScale((prev) => {
      const next = clamp(prev * factor, MIN_SCALE, MAX_SCALE);
      const k = next / prev;
      // 在 DOM 应用新 scale 后调整 scroll
      requestAnimationFrame(() => {
        vp.scrollLeft = fx * k - (clientX - rect.left);
        vp.scrollTop = fy * k - (clientY - rect.top);
      });
      return next;
    });
  };

  // Ctrl/Cmd + 滚轮缩放：必须用原生非 passive listener，否则 preventDefault 无效。
  // React 17+ 默认把 wheel 合成事件挂成 passive，故走 useEffect + addEventListener。
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomAtClient(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
    // zoomAtClient 闭包内读取的是 ref / setState 回调形式，不依赖 scale，无需重订阅
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 双指捏合 ----------
  // 仅追踪 touch pointer；不阻断 click（不 setPointerCapture，不 stopPropagation）
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = dist / pinchRef.current.dist;
      // 直接 setScale + 调整 scroll；用上一帧基准避免抖动
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const fx = pinchRef.current.cx - rect.left + vp.scrollLeft;
      const fy = pinchRef.current.cy - rect.top + vp.scrollTop;
      setScale((prev) => {
        const next = clamp(pinchRef.current!.scale * ratio, MIN_SCALE, MAX_SCALE);
        const k = next / prev;
        requestAnimationFrame(() => {
          vp.scrollLeft = fx * k - (pinchRef.current!.cx - rect.left);
          vp.scrollTop = fy * k - (pinchRef.current!.cy - rect.top);
        });
        return next;
      });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const zoomBy = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    zoomAtClient(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  const reset = () => {
    setScale(1);
    const vp = viewportRef.current;
    if (vp) requestAnimationFrame(() => {
      vp.scrollLeft = (vp.scrollWidth - vp.clientWidth) / 2;
      vp.scrollTop = 0;
    });
  };

  // ---------- 点击选座（普通 onClick，不与平移/缩放交叉） ----------
  const handleSeatClick = (col: SeatColVO, row: SeatRowVO) => {
    if (col.type === 0) return;
    if (col.status === SeatStatus.Locked || col.status === SeatStatus.Sold) return;

    const id = String(col.colId);
    const isSelected = selectedIds.has(id);
    if (!isSelected && selected.length >= limitPerUser) {
      onLimitExceed();
      return;
    }
    const priceVO = col.areaId ? areaPriceMap.get(col.areaId) : undefined;
    const payload: CartSeat = {
      seatId: col.colId,
      rowsNum: row.rowsNum,
      colNum: col.colNum,
      seatName: col.seatName ?? `${row.rowsNum}排${col.colNum}座`,
      areaId: col.areaId ?? '',
      price: priceVO?.price ?? '0',
    };
    dispatch(toggleSeat(payload));
  };

  const innerWidth = ROW_LABEL_W + columnCount * SEAT_SIZE + (columnCount + 1) * SEAT_GAP;
  const innerHeight = (rowCount + 1) * (SEAT_SIZE + SEAT_GAP) + 16;

  return (
    <div className="space-y-3">
      {/* 舞台示意:弧形 + brand 渐变 + 微光晕 */}
      <div className="relative flex justify-center isolate">
        <div
          aria-hidden
          className="absolute top-1 left-1/2 -translate-x-1/2 w-44 h-8 rounded-full bg-brand/25 blur-2xl -z-10"
        />
        <div
          className="px-12 py-2 text-[11px] font-medium tracking-[0.18em]
                     text-brand-foreground
                     bg-gradient-brand
                     rounded-b-[40%] rounded-t-md
                     shadow-[0_6px_16px_-6px_hsl(var(--brand)/0.5),inset_0_-1px_0_0_rgba(0,0,0,0.1)]"
        >
          STAGE · 舞台
        </div>
      </div>

      {/* 视口:原生 overflow:auto + 双指捏合;单指 tap 走原生 click 不被吞 */}
      <div className="relative">
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="overflow-auto rounded-2xl border border-border/60
                     bg-gradient-to-b from-muted/30 to-card/60
                     shadow-inner select-none"
          style={{ height: 'min(60vh, 480px)', touchAction: 'pan-x pan-y' }}
        >
          {/* scaler：宽高随 scale 撑开，让浏览器 scrollbar 反映 content 真实大小 */}
          <div
            style={{
              width: innerWidth * scale,
              height: innerHeight * scale,
              position: 'relative',
            }}
          >
            <div
              className="will-change-transform"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: '0 0',
                width: innerWidth,
                height: innerHeight,
                padding: 8,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${ROW_LABEL_W}px repeat(${columnCount}, ${SEAT_SIZE}px)`,
                  gap: SEAT_GAP,
                }}
              >
                {/* 列号 */}
                <div />
                {Array.from({ length: columnCount }).map((_, ci) => (
                  <div key={`c-${ci}`} className="text-[10px] text-muted-foreground text-center">
                    {ci + 1}
                  </div>
                ))}
                {/* 行 */}
                {rows.map((row) => (
                  <Row
                    key={row.rowsId || row.rowsNum}
                    row={row}
                    selectedIds={selectedIds}
                    priceColorMap={priceColorMap}
                    onClick={(col) => handleSeatClick(col, row)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 浮动缩放控制:玻璃质感胶囊 */}
        <div className="absolute right-2 bottom-2 flex flex-col items-center gap-1
                        bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl
                        border border-white/40 dark:border-white/15
                        shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.55)]
                        rounded-full p-1 pointer-events-auto">
          <ToolBtn ariaLabel="放大" onClick={() => zoomBy(1.25)}>
            <Plus className="h-4 w-4" />
          </ToolBtn>
          {scale !== 1 && (
            <div className="text-[9px] font-semibold text-foreground/70 tabular-nums leading-none">
              {Math.round(scale * 100)}%
            </div>
          )}
          <ToolBtn ariaLabel="缩小" onClick={() => zoomBy(0.8)}>
            <Minus className="h-4 w-4" />
          </ToolBtn>
          <div className="h-px w-5 bg-border/60 my-0.5" />
          <ToolBtn ariaLabel="复位" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
        <span>{rowCount} 行 × {columnCount} 列</span>
        <span className="text-muted-foreground/50">·</span>
        <span>两指捏合可缩放</span>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
    >
      {children}
    </button>
  );
}

function Row({
  row,
  selectedIds,
  priceColorMap,
  onClick,
}: {
  row: SeatRowVO;
  selectedIds: Set<string>;
  priceColorMap: Map<string, string>;
  onClick: (col: SeatColVO) => void;
}) {
  return (
    <>
      <div className="text-[10px] text-muted-foreground flex items-center justify-center">
        {row.rowsNum}
      </div>
      {row.columns.map((col, ci) => {
        if (col.type === 0) {
          return (
            <div
              key={`p-${row.rowsId}-${ci}`}
              style={{ height: SEAT_SIZE, width: SEAT_SIZE }}
            />
          );
        }
        const id = String(col.colId);
        const isSelected = selectedIds.has(id);
        const isLocked = col.status === SeatStatus.Locked;
        const isSold = col.status === SeatStatus.Sold;
        const areaColor = priceColorMap.get(normalizeAreaId(col.areaId)) ?? 'bg-muted';
        const cls = isSelected
          ? 'bg-gradient-brand text-brand-foreground ring-2 ring-brand/40 shadow-[0_2px_8px_-1px_hsl(var(--brand)/0.5)]'
          : isSold
            ? 'bg-foreground/25 text-background/50 cursor-not-allowed ring-1 ring-foreground/10'
            : isLocked
              ? 'bg-warning/40 text-warning-foreground/70 cursor-not-allowed'
              : `${areaColor} text-white hover:brightness-110 active:brightness-95`;
        return (
          <motion.button
            type="button"
            key={`s-${col.colId}-${ci}`}
            onClick={() => onClick(col)}
            disabled={isSold || isLocked}
            // 选中态加微微跳动;点击瞬间 scale 0.8 回弹
            animate={isSelected ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            whileTap={isSold || isLocked ? undefined : { scale: 0.8 }}
            transition={
              isSelected
                ? { duration: 0.32, ease: [0.32, 0.72, 0, 1] }
                : { type: 'spring', stiffness: 420, damping: 22 }
            }
            className={cn(
              'rounded-md text-[10px] font-medium leading-none flex items-center justify-center transition-colors',
              cls,
            )}
            style={{ height: SEAT_SIZE, width: SEAT_SIZE }}
            aria-label={col.seatName ?? ''}
            title={col.seatName ?? ''}
          />
        );
      })}
    </>
  );
}
