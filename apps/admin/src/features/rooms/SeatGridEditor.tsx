import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';
import { cn, SeatType, type RoomSeat } from '@maill/shared';

const AREA_IDS = ['A', 'B', 'C', 'D'] as const;
const AREA_COLORS: Record<string, string> = {
  A: 'bg-area-a text-white',
  B: 'bg-area-b text-white',
  C: 'bg-area-c text-white',
  D: 'bg-area-d text-white',
};

interface Props {
  rowCount: number;
  colCount: number;
  seats: RoomSeat[];
  onChange: (seats: RoomSeat[]) => void;
  roomId: number | string;
}

export function SeatGridEditor({ rowCount, colCount, seats, onChange, roomId }: Props) {
  const seatMap = useMemo(() => {
    const m = new Map<string, RoomSeat>();
    seats.forEach((s) => m.set(`${s.rowNo}-${s.colNo}`, s));
    return m;
  }, [seats]);

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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">一键填充：</span>
        {AREA_IDS.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => fillAll(area)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
              AREA_COLORS[area],
            )}
          >
            <Square className="h-3 w-3" />
            全部 {area}
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
                onCellClick={setCell}
              />
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        点击单元格切换区域：未占 → A → B → C → D → 未占。本 MVP 暂未实现情侣座，全部按普通座保存。
      </p>
    </div>
  );
}

function Row({
  rowNo,
  colCount,
  seatMap,
  onCellClick,
}: {
  rowNo: number;
  colCount: number;
  seatMap: Map<string, RoomSeat>;
  onCellClick: (rowNo: number, colNo: number, nextAreaId: string | null) => void;
}) {
  const cycleNextLocal = (current?: string): string | null => {
    if (!current) return AREA_IDS[0];
    const idx = AREA_IDS.indexOf(current as typeof AREA_IDS[number]);
    if (idx === -1 || idx === AREA_IDS.length - 1) return null;
    return AREA_IDS[idx + 1];
  };

  return (
    <>
      <div className="text-xs text-muted-foreground flex items-center justify-center">{rowNo}</div>
      {Array.from({ length: colCount }).map((_, ci) => {
        const colNo = ci + 1;
        const seat = seatMap.get(`${rowNo}-${colNo}`);
        const color = seat ? AREA_COLORS[seat.areaId] ?? 'bg-muted' : '';
        return (
          <motion.button
            type="button"
            key={`c-${rowNo}-${colNo}`}
            onClick={() => onCellClick(rowNo, colNo, cycleNextLocal(seat?.areaId))}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={cn(
              'h-7 w-7 rounded text-[10px] font-medium',
              seat ? color : 'bg-muted text-muted-foreground hover:bg-accent',
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
