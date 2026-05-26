import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Square, MousePointer, X, Trash2, Plus, Minus, Maximize2 } from 'lucide-react';
import {
  cn,
  SeatType,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SeatCanvas,
  buildAreaColorMap,
  type SeatCanvasHandle,
  type SeatCell,
  type RoomArea,
  type RoomSeat,
} from '@maill/shared';

interface Props {
  rowCount: number;
  colCount: number;
  seats: RoomSeat[];
  areas: RoomArea[];
  onChange: (seats: RoomSeat[]) => void;
  roomId: number | string;
}

const cellKey = (rowNo: number, colNo: number) => `${rowNo}-${colNo}`;

// 矩形覆盖的所有 1-based (rowNo,colNo) key
function rectKeys(r1: number, c1: number, r2: number, c2: number): string[] {
  const rMin = Math.min(r1, r2);
  const rMax = Math.max(r1, r2);
  const cMin = Math.min(c1, c2);
  const cMax = Math.max(c1, c2);
  const out: string[] = [];
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) out.push(cellKey(r, c));
  }
  return out;
}

export function SeatGridEditor({ rowCount, colCount, seats, areas, onChange, roomId }: Props) {
  const { t } = useTranslation(['room', 'common']);

  const seatMap = useMemo(() => {
    const m = new Map<string, RoomSeat>();
    seats.forEach((s) => m.set(cellKey(s.rowNo, s.colNo), s));
    return m;
  }, [seats]);

  const areaIdList = useMemo(() => areas.map((a) => a.areaId), [areas]);
  const noAreas = areas.length === 0;

  // 按 areas 顺序(管理员配置序)映射颜色,与底层调色板对齐
  const colorMap = useMemo(() => buildAreaColorMap(areaIdList), [areaIdList]);

  // ---------- 选区 ----------
  const [committed, setCommitted] = useState<Set<string>>(new Set());

  const [targetAreaId, setTargetAreaId] = useState<string>('');
  useEffect(() => {
    if (!targetAreaId && areaIdList.length > 0) setTargetAreaId(areaIdList[0]);
    if (targetAreaId && !areaIdList.includes(targetAreaId)) {
      setTargetAreaId(areaIdList[0] ?? '');
    }
  }, [areaIdList, targetAreaId]);

  // ESC 清空选区
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && committed.size > 0) setCommitted(new Set());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [committed.size]);

  // ---------- 写入 ----------
  // seatName 作为后端数据字段保留中文,确保跨语言切换不影响 DB 一致性
  const writeCells = (entries: Array<{ rowNo: number; colNo: number; areaId: string | null }>) => {
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

  const applySelection = () => {
    if (!targetAreaId || committed.size === 0) return;
    const entries = Array.from(committed).map((k) => {
      const [r, c] = k.split('-').map(Number);
      return { rowNo: r, colNo: c, areaId: targetAreaId };
    });
    writeCells(entries);
    setCommitted(new Set());
  };

  const removeSelection = () => {
    if (committed.size === 0) return;
    const entries = Array.from(committed).map((k) => {
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

  // ---------- cells 构造 ----------
  // 所有格子都生成 SeatCell:空格 fill 透明,用于点击命中
  const cells = useMemo<SeatCell[]>(() => {
    const out: SeatCell[] = [];
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 1; c <= colCount; c++) {
        const key = cellKey(r, c);
        const seat = seatMap.get(key);
        const fill = seat
          ? colorMap.get(seat.areaId) ?? '#94a3b8'
          : noAreas
            ? 'rgba(148,163,184,0.18)' // 无区域时整体灰
            : 'rgba(148,163,184,0.32)'; // 浅灰空位,便于看到点击靶
        out.push({
          key,
          r: r - 1,
          c: c - 1,
          fill,
          label: seat?.areaId,
        });
      }
    }
    return out;
  }, [rowCount, colCount, seatMap, colorMap, noAreas]);

  // ---------- 渲染 ----------
  // 高度按行数自适应:每行约 30px,夹在 240..560 之间
  // 大网格(≥40 行)固定 560,留给用户用缩放工具浏览
  const canvasHeight = useMemo(() => {
    if (rowCount >= 40) return '560px';
    const h = Math.min(560, Math.max(240, rowCount * 30 + 40));
    return `${h}px`;
  }, [rowCount]);

  const canvasRef = useRef<SeatCanvasHandle>(null);
  const [scale, setScale] = useState(1);

  // SeatCanvas 取 cells 时已含全格,框选 keys 1-based
  const handleBoxSelect = (rect: { r1: number; c1: number; r2: number; c2: number }) => {
    const keys = rectKeys(rect.r1 + 1, rect.c1 + 1, rect.r2 + 1, rect.c2 + 1);
    setCommitted((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next;
    });
  };

  const handleCellClick = (cell: SeatCell) => {
    if (noAreas) return;
    // 有选区时,单击优先取消选区(批量编辑场景下,先退出选区再单点编辑)
    if (committed.size > 0) {
      setCommitted(new Set());
      return;
    }
    const r = cell.r + 1;
    const c = cell.c + 1;
    singleClick(r, c);
  };

  const handleRowLabelClick = (r: number, additive: boolean) => {
    const rowNo = r + 1;
    setCommitted((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      for (let c = 1; c <= colCount; c++) next.add(cellKey(rowNo, c));
      return next;
    });
  };
  const handleColLabelClick = (c: number, additive: boolean) => {
    const colNo = c + 1;
    setCommitted((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      for (let r = 1; r <= rowCount; r++) next.add(cellKey(r, colNo));
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {noAreas ? (
        <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground bg-muted/30">
          {t('room:seatEditor.noAreas')}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {t('room:seatEditor.fillAllPrefix')}
          </span>
          {areas.map((a) => (
            <button
              key={a.areaId}
              type="button"
              onClick={() => fillAll(a.areaId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white"
              style={{ background: colorMap.get(a.areaId) ?? '#94a3b8' }}
              title={t('room:seatEditor.fillAllTooltip', {
                rows: rowCount,
                cols: colCount,
                areaId: a.areaId,
              })}
            >
              <Square className="h-3 w-3" />
              {t('room:seatEditor.fillAllBtn', { areaId: a.areaId })}
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1 rounded-md text-xs border border-input hover:bg-accent"
          >
            {t('room:seatEditor.clearBtn')}
          </button>
        </div>
      )}

      {/* 批量应用工具栏 */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-2.5 rounded-lg border transition-colors',
          committed.size > 0 ? 'bg-brand/5 border-brand/30' : 'bg-muted/30 border-border/60',
        )}
      >
        <MousePointer
          className={cn(
            'h-4 w-4',
            committed.size > 0 ? 'text-brand' : 'text-muted-foreground',
          )}
        />
        <span className="text-sm text-muted-foreground">
          <Trans
            i18nKey="room:seatEditor.selectedCount"
            values={{ n: committed.size }}
            components={{
              b: <b className={committed.size > 0 ? 'text-brand' : 'text-foreground/70'} />,
            }}
          />
        </span>
        <Select value={targetAreaId} onValueChange={setTargetAreaId} disabled={noAreas}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue placeholder={t('room:seatEditor.selectArea')} />
          </SelectTrigger>
          <SelectContent>
            {areas.map((a) => (
              <SelectItem key={a.areaId} value={a.areaId}>
                {t('room:seatEditor.areaPrefix', { areaId: a.areaId })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={applySelection}
          disabled={!targetAreaId || noAreas || committed.size === 0}
          className="px-3 h-7 rounded-md text-xs font-medium bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('room:seatEditor.applyBtn')}
        </button>
        <button
          type="button"
          onClick={removeSelection}
          disabled={committed.size === 0}
          className="px-2.5 h-7 rounded-md text-xs border border-input hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current disabled:hover:border-input"
        >
          <Trash2 className="h-3 w-3" />
          {t('room:seatEditor.removeSeatsBtn')}
        </button>
        <button
          type="button"
          onClick={clearSelection}
          disabled={committed.size === 0}
          className="px-2.5 h-7 rounded-md text-xs border border-input hover:bg-accent inline-flex items-center gap-1 ml-auto disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <X className="h-3 w-3" />
          {t('room:seatEditor.clearSelectionBtn')}
        </button>
      </div>

      <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
        <SeatCanvas
          ref={canvasRef}
          rowCount={rowCount}
          colCount={colCount}
          cells={cells}
          mode="box-select"
          selectedKeys={committed}
          height={canvasHeight}
          onCellClick={handleCellClick}
          onBoxSelect={handleBoxSelect}
          onRowLabelClick={handleRowLabelClick}
          onColLabelClick={handleColLabelClick}
          onScaleChange={setScale}
        />
        <div className="absolute right-2 bottom-2 flex flex-col items-center gap-1 bg-card/90 backdrop-blur border border-border/60 shadow-sm rounded-full p-1">
          <ZoomBtn aria-label={t('common:actions.zoomIn', '放大')} onClick={() => canvasRef.current?.zoomBy(1.25)}>
            <Plus className="h-4 w-4" />
          </ZoomBtn>
          <div className="text-[9px] font-semibold text-muted-foreground tabular-nums leading-none">
            {Math.round(scale * 100)}%
          </div>
          <ZoomBtn aria-label={t('common:actions.zoomOut', '缩小')} onClick={() => canvasRef.current?.zoomBy(0.8)}>
            <Minus className="h-4 w-4" />
          </ZoomBtn>
          <div className="h-px w-5 bg-border/60 my-0.5" />
          <ZoomBtn aria-label={t('common:actions.fit', '适应窗口')} onClick={() => canvasRef.current?.resetView()}>
            <Maximize2 className="h-3.5 w-3.5" />
          </ZoomBtn>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {noAreas
          ? t('room:seatEditor.noAreasDisabledHint')
          : t('room:seatEditor.hint', { cycle: areaIdList.join(' → ') })}
      </p>
    </div>
  );
}

function ZoomBtn({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
      {...rest}
    >
      {children}
    </button>
  );
}
