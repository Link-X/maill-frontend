import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';
import { cn, SeatType, type RoomArea, type RoomSeat } from '@maill/shared';

const AREA_PALETTE = ['bg-area-a', 'bg-area-b', 'bg-area-c', 'bg-area-d'] as const;

interface Props {
  rowCount: number;
  colCount: number;
  seats: RoomSeat[];
  areas: RoomArea[];
  onChange: (seats: RoomSeat[]) => void;
  roomId: number | string;
}

export function SeatGridEditor({ rowCount, colCount, seats, areas, onChange, roomId }: Props) {
  const seatMap = useMemo(() => {
    const m = new Map<string, RoomSeat>();
    seats.forEach((s) => m.set(`${s.rowNo}-${s.colNo}`, s));
    return m;
  }, [seats]);

  // areaId → 颜色类（按 areas 列表顺序分配），与 AreaPriceDrawer 中颜色一致
  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a, i) => m.set(a.areaId, AREA_PALETTE[i % AREA_PALETTE.length]));
    return m;
  }, [areas]);

  // 单元格循环顺序：未占 → areas[0] → areas[1] → ... → 未占
  const areaIdList = useMemo(() => areas.map((a) => a.areaId), [areas]);

  const cycleNext = (current?: string): string | null => {
    if (areaIdList.length === 0) return null;
    if (!current) return areaIdList[0];
    const idx = areaIdList.indexOf(current);
    if (idx === -1 || idx === areaIdList.length - 1) return null;
    return areaIdList[idx + 1];
  };

  const setCell = (rowNo: number, colNo: number, nextAreaId: string | null) => {
    const existing = seatMap.get(`${rowNo}-${colNo}`);
    let nextSeats: RoomSeat[];
    if (nextAreaId === null) {
      nextSeats = seats.filter((s) => !(s.rowNo === rowNo && s.colNo === colNo));
    } else if (existing) {
      nextSeats = seats.map((s) =>
        s.rowNo === rowNo && s.colNo === colNo ? { ...s, areaId: nextAreaId } : s,
      );
    } else {
      const newSeat: RoomSeat = {
        roomId,
        rowNo,
        colNo,
        type: SeatType.Normal,
        areaId: nextAreaId,
        seatName: `${rowNo}排${colNo}座`,
      };
      nextSeats = [...seats, newSeat];
    }
    onChange(nextSeats);
  };

  const fillAll = (areaId: string) => {
    const next: RoomSeat[] = [];
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 1; c <= colCount; c++) {
        next.push({
          roomId,
          rowNo: r,
          colNo: c,
          type: SeatType.Normal,
          areaId,
          seatName: `${r}排${c}座`,
        });
      }
    }
    onChange(next);
  };

  const clearAll = () => onChange([]);

  const noAreas = areas.length === 0;

  return (
    <div className="space-y-3">
      {noAreas ? (
        <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground bg-muted/30">
          请先在右上角「价格区域」中新增至少一个区域，再来放置座位。
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">一键填充：</span>
          {areas.map((a, i) => (
            <button
              key={a.areaId}
              type="button"
              onClick={() => fillAll(a.areaId)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white',
                AREA_PALETTE[i % AREA_PALETTE.length],
              )}
              title={`将所有 ${rowCount} × ${colCount} 个单元格批量设为 ${a.areaId} 区域的普通座`}
            >
              <Square className="h-3 w-3" />
              全部 {a.areaId}
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1 rounded-md text-xs border border-input hover:bg-accent"
          >
            清空
          </button>
        </div>
      )}

      <div className="overflow-auto border border-border/60 rounded-xl p-4 bg-card">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `repeat(${colCount + 1}, minmax(28px, 28px))` }}
        >
          <div />
          {Array.from({ length: colCount }).map((_, ci) => (
            <div key={`col-${ci}`} className="text-xs text-muted-foreground text-center">
              {ci + 1}
            </div>
          ))}
          {Array.from({ length: rowCount }).map((_, ri) => {
            const rowNo = ri + 1;
            return (
              <Row
                key={`row-${rowNo}`}
                rowNo={rowNo}
                colCount={colCount}
                seatMap={seatMap}
                colorMap={colorMap}
                disabled={noAreas}
                onCellClick={(r, c, current) => setCell(r, c, cycleNext(current))}
              />
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {noAreas
          ? '当前没有可用区域，单元格已禁用。'
          : `点击单元格切换区域：未占 → ${areaIdList.join(' → ')} → 未占。本 MVP 暂未实现情侣座，全部按普通座保存。`}
      </p>
    </div>
  );
}

function Row({
  rowNo,
  colCount,
  seatMap,
  colorMap,
  disabled,
  onCellClick,
}: {
  rowNo: number;
  colCount: number;
  seatMap: Map<string, RoomSeat>;
  colorMap: Map<string, string>;
  disabled: boolean;
  onCellClick: (rowNo: number, colNo: number, currentAreaId?: string) => void;
}) {
  return (
    <>
      <div className="text-xs text-muted-foreground flex items-center justify-center">{rowNo}</div>
      {Array.from({ length: colCount }).map((_, ci) => {
        const colNo = ci + 1;
        const seat = seatMap.get(`${rowNo}-${colNo}`);
        const color = seat ? colorMap.get(seat.areaId) ?? 'bg-muted' : '';
        return (
          <motion.button
            type="button"
            key={`c-${rowNo}-${colNo}`}
            onClick={() => onCellClick(rowNo, colNo, seat?.areaId)}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.92 }}
            whileHover={disabled ? undefined : { scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={cn(
              'h-7 w-7 rounded text-[10px] font-medium',
              seat
                ? `${color} text-white`
                : disabled
                  ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
            title={seat ? `${rowNo}排${colNo}座 (区域${seat.areaId})` : '点击启用'}
          >
            {seat?.areaId ?? ''}
          </motion.button>
        );
      })}
    </>
  );
}
