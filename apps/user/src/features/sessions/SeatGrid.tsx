import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { cn, type SeatColVO, type SeatRowVO, type AreaPriceVO } from '@maill/shared';
import { selectCartSeats, toggleSeat, type CartSeat } from './cartSlice';

const AREA_BG: Record<string, string> = {
  A: 'bg-area-a text-white',
  B: 'bg-area-b text-white',
  C: 'bg-area-c text-white',
  D: 'bg-area-d text-white',
};

interface Props {
  rows: SeatRowVO[];
  rowCount: number;
  columnCount: number;
  areaPriceMap: Map<string, AreaPriceVO>;
  limitPerUser: number;
  onLimitExceed: () => void;
}

export function SeatGrid({ rows, rowCount, columnCount, areaPriceMap, limitPerUser, onLimitExceed }: Props) {
  const dispatch = useDispatch();
  const selected = useSelector(selectCartSeats);
  const selectedIds = useMemo(
    () => new Set(selected.map((s) => String(s.seatId))),
    [selected],
  );

  const handleClick = (col: SeatColVO, row: SeatRowVO) => {
    if (col.type === 0) return; // 占位空位
    if (col.status === 1 || col.status === 2) return; // 已锁 / 已售
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

  return (
    <div className="space-y-3">
      {/* 舞台示意 */}
      <div className="flex justify-center">
        <div className="px-8 py-1.5 text-xs bg-muted text-muted-foreground rounded-full">舞台</div>
      </div>

      <div className="overflow-auto -mx-4 px-4">
        <div
          className="inline-grid gap-1 mx-auto"
          style={{ gridTemplateColumns: `repeat(${columnCount + 1}, minmax(22px, 22px))` }}
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
              onClick={(col) => handleClick(col, row)}
            />
          ))}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground text-center">{rowCount} 行 × {columnCount} 列</div>
    </div>
  );
}

function Row({
  row,
  selectedIds,
  onClick,
}: {
  row: SeatRowVO;
  selectedIds: Set<string>;
  onClick: (col: SeatColVO) => void;
}) {
  return (
    <>
      <div className="text-[10px] text-muted-foreground flex items-center justify-center">
        {row.rowsNum}
      </div>
      {row.columns.map((col, ci) => {
        if (col.type === 0) {
          return <div key={`p-${row.rowsId}-${ci}`} className="h-[22px] w-[22px]" />;
        }
        const id = String(col.colId);
        const isSelected = selectedIds.has(id);
        const isLocked = col.status === 1;
        const isSold = col.status === 2;
        const cls = isSelected
          ? 'bg-brand text-brand-foreground ring-2 ring-brand'
          : isSold
            ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
            : isLocked
              ? 'bg-warning/30 text-warning-foreground/60 cursor-not-allowed'
              : col.areaId && AREA_BG[col.areaId]
                ? `${AREA_BG[col.areaId]} hover:opacity-90`
                : 'bg-muted';
        return (
          <motion.button
            type="button"
            key={`s-${col.colId}-${ci}`}
            onClick={() => onClick(col)}
            disabled={isSold || isLocked}
            whileTap={isSold || isLocked ? undefined : { scale: 0.86 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={cn(
              'h-[22px] w-[22px] rounded text-[10px] font-medium leading-none',
              cls,
            )}
            aria-label={col.seatName ?? ''}
            title={col.seatName ?? ''}
          />
        );
      })}
    </>
  );
}
