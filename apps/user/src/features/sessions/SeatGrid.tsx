import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import {
  SeatStatus,
  SeatCanvas,
  SEAT_AREA_COLORS,
  SEAT_STATE_COLORS,
  type SeatCanvasHandle,
  type SeatCell,
  type SeatColVO,
  type SeatRowVO,
  type AreaPriceVO,
} from '@maill/shared';
import { selectCartSeats, toggleSeat, type CartSeat } from './cartSlice';

function normalizeAreaId(v: string | number | null | undefined): string {
  return v == null ? '' : String(v).trim();
}

/**
 * areaId → 区域填充色(hex)
 * 按价格降序排,价格越高越靠前拿到第一个色;
 * 即使两个区域同价也保留独立色(区域级一一对应)。
 */
export function buildPriceColorMap(areaPriceList: AreaPriceVO[]): Map<string, string> {
  const sorted = [...areaPriceList].sort((a, b) => Number(b.price) - Number(a.price));
  const m = new Map<string, string>();
  sorted.forEach((p, i) => {
    m.set(normalizeAreaId(p.areaId), SEAT_AREA_COLORS[i % SEAT_AREA_COLORS.length]);
  });
  return m;
}

interface Props {
  rows: SeatRowVO[];
  rowCount: number;
  columnCount: number;
  areaPriceList: AreaPriceVO[];
  limitPerUser: number;
  onLimitExceed: () => void;
}

export function SeatGrid({
  rows,
  rowCount,
  columnCount,
  areaPriceList,
  limitPerUser,
  onLimitExceed,
}: Props) {
  const dispatch = useDispatch();
  const selected = useSelector(selectCartSeats);
  const selectedKeys = useMemo(
    () => new Set(selected.map((s) => String(s.seatId))),
    [selected],
  );

  const priceColorMap = useMemo(() => buildPriceColorMap(areaPriceList), [areaPriceList]);
  const areaPriceMap = useMemo(() => {
    const m = new Map<string, AreaPriceVO>();
    areaPriceList.forEach((p) => m.set(p.areaId, p));
    return m;
  }, [areaPriceList]);

  // (key) -> {col,row} 反向查表,用于 onCellClick
  const cellCtxRef = useRef(new Map<string, { col: SeatColVO; row: SeatRowVO }>());

  // 把 SeatRowVO[] 拍平成 SeatCell[]
  const cells = useMemo<SeatCell[]>(() => {
    const out: SeatCell[] = [];
    const ctx = new Map<string, { col: SeatColVO; row: SeatRowVO }>();
    rows.forEach((row, ri) => {
      row.columns.forEach((col, ci) => {
        if (col.type === 0) return; // 空位:不渲染
        const key = String(col.colId);
        const status = col.status == null ? null : Number(col.status);
        const areaColor = priceColorMap.get(normalizeAreaId(col.areaId)) ?? SEAT_STATE_COLORS.muted;
        let fill = areaColor;
        let disabled = false;
        if (status === SeatStatus.Sold) {
          fill = SEAT_STATE_COLORS.sold;
          disabled = true;
        } else if (status === SeatStatus.Locked) {
          fill = SEAT_STATE_COLORS.locked;
          disabled = true;
        } else if (status === SeatStatus.NotOnSale) {
          fill = SEAT_STATE_COLORS.notOnSale;
          disabled = true;
        }
        out.push({ key, r: ri, c: ci, fill, disabled, label: col.colNum });
        ctx.set(key, { col, row });
      });
    });
    cellCtxRef.current = ctx;
    return out;
  }, [rows, priceColorMap]);

  // 缩放百分比显示
  const canvasRef = useRef<SeatCanvasHandle>(null);
  const [scale, setScale] = useState(1);

  const handleCellClick = (cell: SeatCell) => {
    if (cell.disabled) return;
    const ctx = cellCtxRef.current.get(cell.key);
    if (!ctx) return;
    const { col, row } = ctx;
    const id = String(col.colId);
    const isSelected = selectedKeys.has(id);
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

  return (
    <div className="space-y-3">
      {/* 舞台示意 */}
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

      <div className="relative">
        <div
          className="rounded-2xl border border-border/60
                     bg-gradient-to-b from-muted/30 to-card/60
                     shadow-inner overflow-hidden"
        >
          <SeatCanvas
            ref={canvasRef}
            rowCount={rowCount}
            colCount={columnCount}
            cells={cells}
            selectedKeys={selectedKeys}
            mode="click"
            height="min(60vh, 480px)"
            onCellClick={handleCellClick}
            onScaleChange={setScale}
            rowLabel={(r) => rows[r]?.rowsNum ?? String(r + 1)}
          />
        </div>

        {/* 浮动缩放控制 */}
        <div
          className="absolute right-2 bottom-2 flex flex-col items-center gap-1
                     bg-white/70 dark:bg-white/[0.08] backdrop-blur-xl
                     border border-white/40 dark:border-white/15
                     shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.55)]
                     rounded-full p-1 pointer-events-auto"
        >
          <ToolBtn ariaLabel="放大" onClick={() => canvasRef.current?.zoomBy(1.25)}>
            <Plus className="h-4 w-4" />
          </ToolBtn>
          {Math.abs(scale - 1) > 0.01 && (
            <div className="text-[9px] font-semibold text-foreground/70 tabular-nums leading-none">
              {Math.round(scale * 100)}%
            </div>
          )}
          <ToolBtn ariaLabel="缩小" onClick={() => canvasRef.current?.zoomBy(0.8)}>
            <Minus className="h-4 w-4" />
          </ToolBtn>
          <div className="h-px w-5 bg-border/60 my-0.5" />
          <ToolBtn ariaLabel="复位" onClick={() => canvasRef.current?.resetView()}>
            <RotateCcw className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
        <span>
          {rowCount} 行 × {columnCount} 列
        </span>
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
