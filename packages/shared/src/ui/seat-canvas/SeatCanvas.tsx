import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

// 单个座位单元格的视觉描述(领域→视觉由父组件转换)
export interface SeatCell {
  /** 唯一标识,用于 selectedKeys 命中、动画跟踪 */
  key: string;
  /** 0-based 行号 */
  r: number;
  /** 0-based 列号 */
  c: number;
  /** 主填充色(canvas 可识别的颜色:hex/rgb/hsl) */
  fill: string;
  /** 选中态描边色,默认走 theme.ringColor */
  ringColor?: string;
  /** 格内文字(可省) */
  label?: string;
  /** 文字色,默认白 */
  labelColor?: string;
  /** 不可点击的视觉(交互上仍由父组件决定是否触发 onCellClick) */
  disabled?: boolean;
}

export type SeatCanvasMode = 'click' | 'box-select' | 'readonly';

export interface SeatCanvasHandle {
  /** 居中重置缩放与平移 */
  resetView(): void;
  /** 以视口中心为锚点缩放 */
  zoomBy(factor: number): void;
  /** 当前 scale */
  getScale(): number;
  /** 手动让某个 cell 触发一次跳动 */
  pulse(key: string): void;
}

interface Props {
  rowCount: number;
  colCount: number;
  /** 稀疏单元格列表;空位不传 */
  cells: SeatCell[];
  mode?: SeatCanvasMode;
  /** 当前选中态;新加入的 key 会自动跳动 */
  selectedKeys?: ReadonlySet<string>;
  rowLabel?: (r: number) => string;
  colLabel?: (c: number) => string;
  showRowLabels?: boolean;
  showColLabels?: boolean;
  enableZoom?: boolean;
  /** 小地图:'auto' 时仅在大网格(任一边 ≥ 30)显示 */
  showMinimap?: boolean | 'auto';
  /** 容器高度,默认 'min(60vh, 480px)' */
  height?: string;
  onCellClick?: (
    cell: SeatCell,
    e: { x: number; y: number; shiftKey: boolean; metaKey: boolean },
  ) => void;
  /** 框选完成(仅 box-select) */
  onBoxSelect?: (rect: { r1: number; c1: number; r2: number; c2: number }) => void;
  /** 行号点击;additive=按住 Shift */
  onRowLabelClick?: (r: number, additive: boolean) => void;
  /** 列号点击;additive=按住 Shift */
  onColLabelClick?: (c: number, additive: boolean) => void;
  /** scale 变化时回调,父组件需要展示当前缩放比时用 */
  onScaleChange?: (scale: number) => void;
  /** 主题色覆盖 */
  theme?: {
    ringColor?: string;
    labelColor?: string;
    boxFillColor?: string;
    boxStrokeColor?: string;
  };
  className?: string;
}

const CELL = 26;
const GAP = 4;
const ROW_LABEL_W = 24;
const COL_LABEL_H = 16;
const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const FIT_PADDING = 16; // fit-to-view 时四周留白(屏幕 px)
const CLICK_THRESHOLD_PX = 5;
const CLICK_THRESHOLD_MS = 400;
const ANIM_MS = 240;
const MINIMAP_MAX_W = 160;
const MINIMAP_MAX_H = 110;
const MINIMAP_PAD = 6;

const DEFAULT_THEME = {
  ringColor: '#8b5cf6',
  labelColor: '#94a3b8',
  boxFillColor: 'rgba(139, 92, 246, 0.12)',
  boxStrokeColor: 'rgba(139, 92, 246, 0.6)',
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function cellOriginX(c: number, hasRowLabels: boolean) {
  return (hasRowLabels ? ROW_LABEL_W : 0) + GAP + c * (CELL + GAP);
}
function cellOriginY(r: number, hasColLabels: boolean) {
  return (hasColLabels ? COL_LABEL_H : 0) + GAP + r * (CELL + GAP);
}

export const SeatCanvas = forwardRef<SeatCanvasHandle, Props>(function SeatCanvas(
  {
    rowCount,
    colCount,
    cells,
    mode = 'click',
    selectedKeys,
    rowLabel,
    colLabel,
    showRowLabels = true,
    showColLabels = true,
    enableZoom = true,
    showMinimap = 'auto',
    height = 'min(60vh, 480px)',
    onCellClick,
    onBoxSelect,
    onRowLabelClick,
    onColLabelClick,
    onScaleChange,
    theme,
    className,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const themeMerged = useMemo(() => ({ ...DEFAULT_THEME, ...theme }), [theme]);

  // 内容内在尺寸(逻辑像素)
  const innerW = useMemo(
    () => (showRowLabels ? ROW_LABEL_W : 0) + colCount * CELL + (colCount + 1) * GAP,
    [showRowLabels, colCount],
  );
  const innerH = useMemo(
    () => (showColLabels ? COL_LABEL_H : 0) + rowCount * CELL + (rowCount + 1) * GAP,
    [showColLabels, rowCount],
  );

  // (r,c) -> cell 索引,命中检测用
  const cellGrid = useMemo(() => {
    const m = new Map<string, SeatCell>();
    for (const c of cells) m.set(`${c.r}|${c.c}`, c);
    return m;
  }, [cells]);

  // 视口物理尺寸(CSS px)
  const sizeRef = useRef({ w: 0, h: 0 });
  // 视口变换
  const tRef = useRef({ panX: 0, panY: 0, scale: 1 });
  const initedRef = useRef(false);
  // 选中跳动动画:key -> 起始时间
  const animMapRef = useRef<Map<string, number>>(new Map());
  // 框选矩形(逻辑行列,仅 box-select 模式)
  const boxRectRef = useRef<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  // 上一次选中集合,用于 diff 触发跳动
  const prevSelectedRef = useRef<Set<string>>(new Set());

  // ============ Minimap ============
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const minimapDragRef = useRef(false);
  const minimapEnabled = useMemo(() => {
    if (showMinimap === false) return false;
    if (showMinimap === true) return true;
    return rowCount >= 30 || colCount >= 30;
  }, [showMinimap, rowCount, colCount]);
  const minimapSize = useMemo(() => {
    const ratio = innerW / innerH;
    let mw = MINIMAP_MAX_W;
    let mh = mw / ratio;
    if (mh > MINIMAP_MAX_H) {
      mh = MINIMAP_MAX_H;
      mw = mh * ratio;
    }
    return { w: Math.max(40, Math.round(mw)), h: Math.max(40, Math.round(mh)) };
  }, [innerW, innerH]);
  const minimapScale = useMemo(
    () => Math.min(minimapSize.w / innerW, minimapSize.h / innerH),
    [innerH, innerW, minimapSize.h, minimapSize.w],
  );

  // 命中检测:client 坐标 → {kind, r, c, cell?}
  const hitTest = useCallback(
    (
      clientX: number,
      clientY: number,
    ): { kind: 'cell' | 'row' | 'col'; r: number; c: number; cell?: SeatCell } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const { panX, panY, scale } = tRef.current;
      const lx = (sx - panX) / scale;
      const ly = (sy - panY) / scale;

      const inRowArea = showRowLabels && lx >= 0 && lx < ROW_LABEL_W;
      const inColArea = showColLabels && ly >= 0 && ly < COL_LABEL_H;

      // 左上角列号/行号交叉死角
      if (inRowArea && inColArea) return null;

      if (inColArea) {
        const cBase = showRowLabels ? ROW_LABEL_W : 0;
        const c = Math.floor((lx - cBase - GAP) / (CELL + GAP));
        if (c >= 0 && c < colCount) return { kind: 'col', r: -1, c };
        return null;
      }
      if (inRowArea) {
        const rBase = showColLabels ? COL_LABEL_H : 0;
        const r = Math.floor((ly - rBase - GAP) / (CELL + GAP));
        if (r >= 0 && r < rowCount) return { kind: 'row', r, c: -1 };
        return null;
      }

      const cBase = showRowLabels ? ROW_LABEL_W : 0;
      const rBase = showColLabels ? COL_LABEL_H : 0;
      const c = Math.floor((lx - cBase - GAP) / (CELL + GAP));
      const r = Math.floor((ly - rBase - GAP) / (CELL + GAP));
      if (r < 0 || c < 0 || r >= rowCount || c >= colCount) return null;
      const x0 = cellOriginX(c, showRowLabels);
      const y0 = cellOriginY(r, showColLabels);
      if (lx < x0 || lx > x0 + CELL || ly < y0 || ly > y0 + CELL) return null;
      const cell = cellGrid.get(`${r}|${c}`);
      return { kind: 'cell', r, c, cell };
    },
    [cellGrid, colCount, rowCount, showColLabels, showRowLabels],
  );

  // 绘制
  const rafRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const drawMinimap = useCallback(() => {
    if (!minimapEnabled) return;
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w: mw, h: mh } = minimapSize;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, mw, mh);

    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, mw, mh);

    const offsetX = (mw - innerW * minimapScale) / 2;
    const offsetY = (mh - innerH * minimapScale) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(minimapScale, minimapScale);
    for (const cell of cells) {
      const ox = cellOriginX(cell.c, showRowLabels);
      const oy = cellOriginY(cell.r, showColLabels);
      ctx.fillStyle = cell.fill;
      ctx.fillRect(ox, oy, CELL, CELL);
    }
    ctx.restore();

    // 主视口在 minimap 上的矩形
    const { w, h } = sizeRef.current;
    const { panX, panY, scale } = tRef.current;
    if (w > 0 && h > 0 && scale > 0) {
      const visL = -panX / scale;
      const visT = -panY / scale;
      const visR = (w - panX) / scale;
      const visB = (h - panY) / scale;
      const vx = offsetX + visL * minimapScale;
      const vy = offsetY + visT * minimapScale;
      const vw = (visR - visL) * minimapScale;
      const vh = (visB - visT) * minimapScale;
      const cx = Math.max(0, vx);
      const cy = Math.max(0, vy);
      const cw = Math.min(mw, vx + vw) - cx;
      const ch = Math.min(mh, vy + vh) - cy;
      if (cw > 0 && ch > 0) {
        ctx.fillStyle = themeMerged.boxFillColor;
        ctx.strokeStyle = themeMerged.ringColor;
        ctx.lineWidth = 1.5;
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeRect(cx, cy, cw, ch);
      }
    }
  }, [
    cells,
    innerH,
    innerW,
    minimapEnabled,
    minimapScale,
    minimapSize,
    showColLabels,
    showRowLabels,
    themeMerged,
  ]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { panX, panY, scale } = tRef.current;
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    ctx.font = '10px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 缩得太小时,文字渲染既看不清又吃性能,直接跳过
    const drawText = scale >= 0.5;

    // 列号
    if (showColLabels && drawText) {
      ctx.fillStyle = themeMerged.labelColor;
      const cBase = showRowLabels ? ROW_LABEL_W : 0;
      for (let c = 0; c < colCount; c++) {
        const x = cBase + GAP + c * (CELL + GAP) + CELL / 2;
        ctx.fillText(colLabel ? colLabel(c) : String(c + 1), x, COL_LABEL_H / 2);
      }
    }
    // 行号
    if (showRowLabels && drawText) {
      ctx.fillStyle = themeMerged.labelColor;
      const rBase = showColLabels ? COL_LABEL_H : 0;
      for (let r = 0; r < rowCount; r++) {
        const y = rBase + GAP + r * (CELL + GAP) + CELL / 2;
        ctx.fillText(rowLabel ? rowLabel(r) : String(r + 1), ROW_LABEL_W / 2, y);
      }
    }

    // 单元格
    const now = performance.now();
    let needNextFrame = false;
    for (const cell of cells) {
      const ox = cellOriginX(cell.c, showRowLabels);
      const oy = cellOriginY(cell.r, showColLabels);
      let x = ox;
      let y = oy;
      let cw = CELL;
      let ch = CELL;
      const animStart = animMapRef.current.get(cell.key);
      if (animStart != null) {
        const elapsed = now - animStart;
        if (elapsed < ANIM_MS) {
          const t = elapsed / ANIM_MS;
          const s = 1 + 0.22 * Math.sin(Math.PI * t);
          cw = CELL * s;
          ch = CELL * s;
          x = ox + (CELL - cw) / 2;
          y = oy + (CELL - ch) / 2;
          needNextFrame = true;
        } else {
          animMapRef.current.delete(cell.key);
        }
      }

      roundRect(ctx, x, y, cw, ch, 4);
      ctx.fillStyle = cell.fill;
      ctx.fill();

      if (selectedKeys && selectedKeys.has(cell.key)) {
        ctx.strokeStyle = cell.ringColor ?? themeMerged.ringColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (cell.label && drawText) {
        ctx.fillStyle = cell.labelColor ?? '#fff';
        ctx.fillText(cell.label, ox + CELL / 2, oy + CELL / 2);
      }
    }

    // 框选矩形
    if (mode === 'box-select' && boxRectRef.current) {
      const { r1, c1, r2, c2 } = boxRectRef.current;
      const rMin = Math.min(r1, r2);
      const rMax = Math.max(r1, r2);
      const cMin = Math.min(c1, c2);
      const cMax = Math.max(c1, c2);
      const x = cellOriginX(cMin, showRowLabels) - 1;
      const y = cellOriginY(rMin, showColLabels) - 1;
      const w2 = (cMax - cMin + 1) * (CELL + GAP) - GAP + 2;
      const h2 = (rMax - rMin + 1) * (CELL + GAP) - GAP + 2;
      ctx.fillStyle = themeMerged.boxFillColor;
      ctx.strokeStyle = themeMerged.boxStrokeColor;
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, w2, h2);
      ctx.strokeRect(x, y, w2, h2);
    }

    ctx.restore();

    drawMinimap();

    if (needNextFrame) {
      schedule();
    }
  }, [
    cells,
    colCount,
    colLabel,
    drawMinimap,
    mode,
    rowCount,
    rowLabel,
    selectedKeys,
    showColLabels,
    showRowLabels,
    themeMerged,
  ]);

  // draw 是 useCallback,会随 props/state 重建;但 RAF 注册时若捕获旧 draw,
  // 回调时绘出的是过期 selectedKeys。用 drawRef 让 RAF 始终调用最新 draw,
  // 同时让 schedule 引用稳定,避免去重逻辑误丢更新。
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);
  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawRef.current();
    });
  }, []);

  // 计算 fit-to-view 变换:内容完整可见且居中,不放大超过 1x
  const computeFit = useCallback(
    (w: number, h: number) => {
      if (w <= 0 || h <= 0) return { panX: 0, panY: 0, scale: 1 };
      const avail = { w: w - FIT_PADDING * 2, h: h - FIT_PADDING * 2 };
      const fitScale = Math.min(1, avail.w / innerW, avail.h / innerH);
      const scale = clamp(fitScale, MIN_SCALE, MAX_SCALE);
      return {
        scale,
        panX: (w - innerW * scale) / 2,
        panY: (h - innerH * scale) / 2,
      };
    },
    [innerH, innerW],
  );

  // 容器 resize → 调整 canvas 物理尺寸
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const apply = () => {
      const r = wrap.getBoundingClientRect();
      const w = Math.max(0, Math.floor(r.width));
      const h = Math.max(0, Math.floor(r.height));
      sizeRef.current = { w, h };
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // 第一次有尺寸时 fit-to-view(对 100x100 这种大网格自动缩小到可见)
      if (!initedRef.current && w > 0) {
        initedRef.current = true;
        tRef.current = computeFit(w, h);
        onScaleChange?.(tRef.current.scale);
      }
      schedule();
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [computeFit, onScaleChange, schedule]);

  // 行列数变化时重新居中
  useEffect(() => {
    initedRef.current = false;
  }, [innerW, innerH]);

  // 任意可见 prop 变化 → 重绘
  useEffect(() => {
    schedule();
  }, [cells, selectedKeys, mode, rowCount, colCount, showColLabels, showRowLabels, themeMerged, schedule]);

  // 选中态 diff → 新选中的 key 触发跳动
  useEffect(() => {
    if (!selectedKeys) {
      prevSelectedRef.current = new Set();
      return;
    }
    const now = performance.now();
    for (const k of selectedKeys) {
      if (!prevSelectedRef.current.has(k)) {
        animMapRef.current.set(k, now);
      }
    }
    prevSelectedRef.current = new Set(selectedKeys);
    schedule();
  }, [selectedKeys, schedule]);

  // ============ 交互 ============
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<
    | null
    | {
        mode: 'pending' | 'pan' | 'box';
        startX: number;
        startY: number;
        startTime: number;
        startPan: { panX: number; panY: number };
        boxStart: { r: number; c: number } | null;
        moved: boolean;
        button: number;
        shiftKey: boolean;
        metaKey: boolean;
      }
  >(null);
  const pinchRef = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const t = tRef.current;
      const next = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE);
      if (next === t.scale) return;
      const k = next / t.scale;
      tRef.current = {
        scale: next,
        panX: sx - (sx - t.panX) * k,
        panY: sy - (sy - t.panY) * k,
      };
      onScaleChange?.(next);
      schedule();
    },
    [onScaleChange, schedule],
  );

  const clampPan = useCallback(() => {
    const { w, h } = sizeRef.current;
    const { scale, panX, panY } = tRef.current;
    const contentW = innerW * scale;
    const contentH = innerH * scale;
    // 允许两侧各超出 30% 视口,避免严重失控
    const xMin = Math.min(0, w - contentW) - w * 0.3;
    const xMax = w * 0.3;
    const yMin = Math.min(0, h - contentH) - h * 0.3;
    const yMax = h * 0.3;
    const npx = clamp(panX, xMin, xMax);
    const npy = clamp(panY, yMin, yMax);
    if (npx !== panX || npy !== panY) {
      tRef.current = { ...tRef.current, panX: npx, panY: npy };
    }
  }, [innerH, innerW]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 双指 = 捏合
    if (pointersRef.current.size === 2 && enableZoom) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: tRef.current.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      dragRef.current = null;
      return;
    }
    if (pointersRef.current.size !== 1) return;

    const hit = hitTest(e.clientX, e.clientY);
    dragRef.current = {
      mode: mode === 'box-select' && hit?.kind === 'cell' ? 'box' : 'pending',
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      startPan: { panX: tRef.current.panX, panY: tRef.current.panY },
      boxStart: hit?.kind === 'cell' ? { r: hit.r, c: hit.c } : null,
      moved: false,
      button: e.button,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    };
    if (mode === 'box-select' && hit?.kind === 'cell') {
      boxRectRef.current = { r1: hit.r, c1: hit.c, r2: hit.r, c2: hit.c };
      schedule();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 捏合
    if (pinchRef.current && pointersRef.current.size === 2 && enableZoom) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cxLocal = pinchRef.current.cx - rect.left;
      const cyLocal = pinchRef.current.cy - rect.top;
      const targetScale = clamp(
        pinchRef.current.scale * (dist / pinchRef.current.dist),
        MIN_SCALE,
        MAX_SCALE,
      );
      const prev = tRef.current.scale;
      const k = targetScale / prev;
      tRef.current = {
        scale: targetScale,
        panX: cxLocal - (cxLocal - tRef.current.panX) * k,
        panY: cyLocal - (cyLocal - tRef.current.panY) * k,
      };
      onScaleChange?.(targetScale);
      schedule();
      return;
    }

    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > CLICK_THRESHOLD_PX) d.moved = true;
    if (!d.moved) return;

    if (d.mode === 'pending') d.mode = 'pan';

    if (d.mode === 'pan') {
      tRef.current = {
        ...tRef.current,
        panX: d.startPan.panX + dx,
        panY: d.startPan.panY + dy,
      };
      clampPan();
      schedule();
    } else if (d.mode === 'box' && d.boxStart) {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit?.kind === 'cell') {
        const next = { r1: d.boxStart.r, c1: d.boxStart.c, r2: hit.r, c2: hit.c };
        const prev = boxRectRef.current;
        if (
          !prev ||
          prev.r1 !== next.r1 ||
          prev.c1 !== next.c1 ||
          prev.r2 !== next.r2 ||
          prev.c2 !== next.c2
        ) {
          boxRectRef.current = next;
          schedule();
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;

    const dt = performance.now() - d.startTime;
    if (!d.moved && dt <= CLICK_THRESHOLD_MS && d.button === 0) {
      // 单击
      const hit = hitTest(e.clientX, e.clientY);
      if (mode === 'box-select') {
        boxRectRef.current = null;
        schedule();
      }
      if (!hit) return;
      if (hit.kind === 'cell' && hit.cell) {
        onCellClick?.(hit.cell, {
          x: e.clientX,
          y: e.clientY,
          shiftKey: d.shiftKey,
          metaKey: d.metaKey,
        });
      } else if (hit.kind === 'row') {
        onRowLabelClick?.(hit.r, d.shiftKey);
      } else if (hit.kind === 'col') {
        onColLabelClick?.(hit.c, d.shiftKey);
      }
      return;
    }

    if (d.moved && d.mode === 'box' && boxRectRef.current) {
      onBoxSelect?.(boxRectRef.current);
      boxRectRef.current = null;
      schedule();
    }
  };

  // wheel: ctrl/meta+wheel 缩放;否则平移
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (!enableZoom) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
      } else {
        e.preventDefault();
        tRef.current = {
          ...tRef.current,
          panX: tRef.current.panX - e.deltaX,
          panY: tRef.current.panY - e.deltaY,
        };
        clampPan();
        schedule();
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [clampPan, enableZoom, schedule, zoomAt]);

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => {
        const { w, h } = sizeRef.current;
        tRef.current = computeFit(w, h);
        onScaleChange?.(tRef.current.scale);
        schedule();
      },
      zoomBy: (factor: number) => {
        const { w, h } = sizeRef.current;
        zoomAt(w / 2, h / 2, factor);
      },
      getScale: () => tRef.current.scale,
      pulse: (key: string) => {
        animMapRef.current.set(key, performance.now());
        schedule();
      },
    }),
    [computeFit, onScaleChange, schedule, zoomAt],
  );

  // minimap canvas 物理尺寸(DPR 处理),仅在启用时设置
  useEffect(() => {
    if (!minimapEnabled) return;
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { w: mw, h: mh } = minimapSize;
    canvas.width = mw * dpr;
    canvas.height = mh * dpr;
    canvas.style.width = mw + 'px';
    canvas.style.height = mh + 'px';
    schedule();
  }, [minimapEnabled, minimapSize, schedule]);

  // minimap 上的点击/拖动 → 把该点设为主视口中心
  const panMainToMinimap = (clientX: number, clientY: number) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { w: mw, h: mh } = minimapSize;
    const offsetX = (mw - innerW * minimapScale) / 2;
    const offsetY = (mh - innerH * minimapScale) / 2;
    const mx = clientX - rect.left - offsetX;
    const my = clientY - rect.top - offsetY;
    const lx = mx / minimapScale;
    const ly = my / minimapScale;
    const { w, h } = sizeRef.current;
    const { scale } = tRef.current;
    tRef.current = {
      ...tRef.current,
      panX: w / 2 - lx * scale,
      panY: h / 2 - ly * scale,
    };
    clampPan();
    schedule();
  };

  const onMinimapPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    minimapDragRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    panMainToMinimap(e.clientX, e.clientY);
  };
  const onMinimapPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!minimapDragRef.current) return;
    e.stopPropagation();
    panMainToMinimap(e.clientX, e.clientY);
  };
  const onMinimapPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!minimapDragRef.current) return;
    e.stopPropagation();
    minimapDragRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ display: 'block', touchAction: 'none', userSelect: 'none' }}
      />
      {minimapEnabled && (
        <canvas
          ref={minimapCanvasRef}
          onPointerDown={onMinimapPointerDown}
          onPointerMove={onMinimapPointerMove}
          onPointerUp={onMinimapPointerUp}
          onPointerCancel={onMinimapPointerUp}
          style={{
            position: 'absolute',
            top: MINIMAP_PAD,
            right: MINIMAP_PAD,
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 12px -4px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
});
