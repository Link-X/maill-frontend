import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Square, MousePointer, X, Trash2 } from 'lucide-react';
import {
  cn,
  SeatType,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type RoomArea,
  type RoomSeat,
} from '@maill/shared';

const AREA_PALETTE = ['bg-area-a', 'bg-area-b', 'bg-area-c', 'bg-area-d'] as const;

interface Props {
  rowCount: number;
  colCount: number;
  seats: RoomSeat[];
  areas: RoomArea[];
  onChange: (seats: RoomSeat[]) => void;
  roomId: number | string;
}

interface Cell {
  rowNo: number;
  colNo: number;
}

const cellKey = (rowNo: number, colNo: number) => `${rowNo}-${colNo}`;

// 计算两点形成的矩形覆盖的所有 cell key
function rectKeys(a: Cell, b: Cell): string[] {
  const r1 = Math.min(a.rowNo, b.rowNo);
  const r2 = Math.max(a.rowNo, b.rowNo);
  const c1 = Math.min(a.colNo, b.colNo);
  const c2 = Math.max(a.colNo, b.colNo);
  const out: string[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) out.push(cellKey(r, c));
  }
  return out;
}

export function SeatGridEditor({ rowCount, colCount, seats, areas, onChange, roomId }: Props) {
  const seatMap = useMemo(() => {
    const m = new Map<string, RoomSeat>();
    seats.forEach((s) => m.set(cellKey(s.rowNo, s.colNo), s));
    return m;
  }, [seats]);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a, i) => m.set(a.areaId, AREA_PALETTE[i % AREA_PALETTE.length]));
    return m;
  }, [areas]);

  const areaIdList = useMemo(() => areas.map((a) => a.areaId), [areas]);
  const noAreas = areas.length === 0;

  // ---------- 选区 ----------
  // 已确认的选区（拖拽/行列号点击后落定的部分）
  const [committed, setCommitted] = useState<Set<string>>(new Set());
  // 当前正在拖拽的起止点（实时矩形高亮）
  const dragRef = useRef<{ start: Cell; current: Cell; moved: boolean } | null>(null);
  const [, forceTick] = useState(0);
  const tick = () => forceTick((t) => t + 1);

  // 当前展示用的选区 = committed ∪ rectKeys(dragStart, dragCurrent)
  const liveSelection = useMemo(() => {
    const next = new Set(committed);
    if (dragRef.current) {
      const { start, current } = dragRef.current;
      rectKeys(start, current).forEach((k) => next.add(k));
    }
    return next;
    // 依赖 committed 和 dragTick；dragTick 通过 tick() 触发重渲
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed, dragRef.current?.start, dragRef.current?.current]);

  // 目标区域 (默认第一个)
  const [targetAreaId, setTargetAreaId] = useState<string>('');
  useEffect(() => {
    if (!targetAreaId && areaIdList.length > 0) setTargetAreaId(areaIdList[0]);
    if (targetAreaId && !areaIdList.includes(targetAreaId)) {
      setTargetAreaId(areaIdList[0] ?? '');
    }
  }, [areaIdList, targetAreaId]);

  // 全局 pointerup：拖拽结束时落定选区或视作单击
  useEffect(() => {
    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      if (d.moved) {
        const keys = rectKeys(d.start, d.current);
        setCommitted((prev) => {
          const next = new Set(prev);
          keys.forEach((k) => next.add(k));
          return next;
        });
      } else {
        // 单击：循环切换该格子（与之前点击行为一致）
        singleClick(d.start.rowNo, d.start.colNo);
      }
      dragRef.current = null;
      tick();
    };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatMap, areaIdList, seats]);

  // Esc 键清空选区
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (committed.size > 0) setCommitted(new Set());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [committed.size]);

  // ---------- 写入操作 ----------
  const writeCells = (entries: Array<{ rowNo: number; colNo: number; areaId: string | null }>) => {
    // 一次性合并到 nextSeats，避免多次 onChange
    const next = new Map(seatMap);
    for (const { rowNo, colNo, areaId } of entries) {
      const key = cellKey(rowNo, colNo);
      if (areaId === null) {
        next.delete(key);
      } else {
        const existing = next.get(key);
        if (existing) {
          next.set(key, { ...existing, areaId });
        } else {
          next.set(key, {
            roomId,
            rowNo,
            colNo,
            type: SeatType.Normal,
            areaId,
            seatName: `${rowNo}排${colNo}座`,
          });
        }
      }
    }
    onChange(Array.from(next.values()));
  };

  const cycleNext = (current?: string): string | null => {
    if (areaIdList.length === 0) return null;
    if (!current) return areaIdList[0];
    const idx = areaIdList.indexOf(current);
    if (idx === -1 || idx === areaIdList.length - 1) return null;
    return areaIdList[idx + 1];
  };

  const singleClick = (rowNo: number, colNo: number) => {
    if (noAreas) return;
    const existing = seatMap.get(cellKey(rowNo, colNo));
    const next = cycleNext(existing?.areaId);
    writeCells([{ rowNo, colNo, areaId: next }]);
  };

  // 批量：把选区应用为 targetAreaId
  const applySelection = () => {
    if (!targetAreaId || liveSelection.size === 0) return;
    const entries = Array.from(liveSelection).map((k) => {
      const [r, c] = k.split('-').map(Number);
      return { rowNo: r, colNo: c, areaId: targetAreaId };
    });
    writeCells(entries);
    setCommitted(new Set());
  };

  // 批量：删除选区内的座位（变回"未占"）
  const removeSelection = () => {
    if (liveSelection.size === 0) return;
    const entries = Array.from(liveSelection).map((k) => {
      const [r, c] = k.split('-').map(Number);
      return { rowNo: r, colNo: c, areaId: null };
    });
    writeCells(entries);
    setCommitted(new Set());
  };

  const clearSelection = () => setCommitted(new Set());

  const fillAll = (areaId: string) => {
    const entries: Array<{ rowNo: number; colNo: number; areaId: string | null }> = [];
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 1; c <= colCount; c++) {
        entries.push({ rowNo: r, colNo: c, areaId });
      }
    }
    writeCells(entries);
  };

  const clearAll = () => onChange([]);

  // 选择整行/整列
  const selectRow = (rowNo: number, additive: boolean) => {
    setCommitted((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      for (let c = 1; c <= colCount; c++) next.add(cellKey(rowNo, c));
      return next;
    });
  };
  const selectCol = (colNo: number, additive: boolean) => {
    setCommitted((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      for (let r = 1; r <= rowCount; r++) next.add(cellKey(r, colNo));
      return next;
    });
  };

  // ---------- 渲染 ----------
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

      {/* 批量应用工具栏：常驻显示，避免出现/消失导致下方网格高度抖动打断拖选 */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-2.5 rounded-lg border transition-colors',
          liveSelection.size > 0
            ? 'bg-brand/5 border-brand/30'
            : 'bg-muted/30 border-border/60',
        )}
      >
        <MousePointer
          className={cn(
            'h-4 w-4',
            liveSelection.size > 0 ? 'text-brand' : 'text-muted-foreground',
          )}
        />
        <span className="text-sm text-muted-foreground">
          已选{' '}
          <b className={liveSelection.size > 0 ? 'text-brand' : 'text-foreground/70'}>
            {liveSelection.size}
          </b>{' '}
          个 · 应用为
        </span>
        <Select value={targetAreaId} onValueChange={setTargetAreaId} disabled={noAreas}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue placeholder="选择区域" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((a) => (
              <SelectItem key={a.areaId} value={a.areaId}>
                区域 {a.areaId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={applySelection}
          disabled={!targetAreaId || noAreas || liveSelection.size === 0}
          className="px-3 h-7 rounded-md text-xs font-medium bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          应用
        </button>
        <button
          type="button"
          onClick={removeSelection}
          disabled={liveSelection.size === 0}
          className="px-2.5 h-7 rounded-md text-xs border border-input hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current disabled:hover:border-input"
        >
          <Trash2 className="h-3 w-3" />
          删除座位
        </button>
        <button
          type="button"
          onClick={clearSelection}
          disabled={liveSelection.size === 0}
          className="px-2.5 h-7 rounded-md text-xs border border-input hover:bg-accent inline-flex items-center gap-1 ml-auto disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <X className="h-3 w-3" />
          清空选区
        </button>
      </div>

      <div className="overflow-auto border border-border/60 rounded-xl p-4 bg-card select-none">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `repeat(${colCount + 1}, minmax(28px, 28px))` }}
        >
          {/* 左上角 */}
          <div />
          {/* 列号（可点击全选当前列） */}
          {Array.from({ length: colCount }).map((_, ci) => {
            const colNo = ci + 1;
            return (
              <button
                key={`col-${ci}`}
                type="button"
                onClick={(e) => selectCol(colNo, e.shiftKey)}
                className="text-xs text-muted-foreground hover:text-brand hover:bg-brand/10 rounded transition-colors"
                title={`选中第 ${colNo} 列（Shift 追加）`}
              >
                {colNo}
              </button>
            );
          })}
          {Array.from({ length: rowCount }).map((_, ri) => {
            const rowNo = ri + 1;
            return (
              <Row
                key={`row-${rowNo}`}
                rowNo={rowNo}
                colCount={colCount}
                seatMap={seatMap}
                colorMap={colorMap}
                liveSelection={liveSelection}
                disabled={noAreas}
                onRowLabelClick={(additive) => selectRow(rowNo, additive)}
                onCellPointerDown={(colNo, e) => {
                  if (noAreas) return;
                  e.preventDefault();
                  dragRef.current = { start: { rowNo, colNo }, current: { rowNo, colNo }, moved: false };
                  tick();
                }}
                onCellPointerEnter={(colNo) => {
                  if (!dragRef.current) return;
                  const cur = dragRef.current.current;
                  if (cur.rowNo === rowNo && cur.colNo === colNo) return;
                  dragRef.current.current = { rowNo, colNo };
                  dragRef.current.moved = true;
                  tick();
                }}
              />
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {noAreas
          ? '当前没有可用区域，单元格已禁用。'
          : '单击切换：未占 → ' +
            areaIdList.join(' → ') +
            ' → 未占；按住拖动可框选；点行号/列号选中整行/整列（Shift 追加）；Esc 清空选区。'}
      </p>
    </div>
  );
}

function Row({
  rowNo,
  colCount,
  seatMap,
  colorMap,
  liveSelection,
  disabled,
  onRowLabelClick,
  onCellPointerDown,
  onCellPointerEnter,
}: {
  rowNo: number;
  colCount: number;
  seatMap: Map<string, RoomSeat>;
  colorMap: Map<string, string>;
  liveSelection: Set<string>;
  disabled: boolean;
  onRowLabelClick: (additive: boolean) => void;
  onCellPointerDown: (colNo: number, e: React.PointerEvent) => void;
  onCellPointerEnter: (colNo: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={(e) => onRowLabelClick(e.shiftKey)}
        className="text-xs text-muted-foreground hover:text-brand hover:bg-brand/10 rounded transition-colors"
        title={`选中第 ${rowNo} 排（Shift 追加）`}
      >
        {rowNo}
      </button>
      {Array.from({ length: colCount }).map((_, ci) => {
        const colNo = ci + 1;
        const key = `${rowNo}-${colNo}`;
        const seat = seatMap.get(key);
        const color = seat ? colorMap.get(seat.areaId) ?? 'bg-muted' : '';
        const isSelected = liveSelection.has(key);
        return (
          <motion.button
            type="button"
            key={`c-${rowNo}-${colNo}`}
            onPointerDown={(e) => onCellPointerDown(colNo, e)}
            onPointerEnter={() => onCellPointerEnter(colNo)}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={cn(
              'h-7 w-7 rounded text-[10px] font-medium relative',
              seat
                ? `${color} text-white`
                : disabled
                  ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              isSelected && 'ring-2 ring-brand ring-offset-1 ring-offset-card z-10',
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
