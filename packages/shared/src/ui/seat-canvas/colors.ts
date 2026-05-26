// 4 色区域调色板,与 Tailwind `bg-area-a/b/c/d` 对齐
// 对应 --rose / --amber / --emerald / --sky 在 500 色阶下的近似值
// 用于 canvas fill (canvas 不识别 var(--xxx),故固化 hex)
export const SEAT_AREA_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9'] as const;

// 通用座位状态色:未售/已锁/已售/灰显
export const SEAT_STATE_COLORS = {
  empty: 'rgba(0,0,0,0)',       // 空位透明
  muted: '#94a3b8',              // slate-400,无 areaId 的占位
  sold: 'rgba(15,23,42,0.35)',   // 已售:深色 token
  locked: 'rgba(245,158,11,0.5)',// 已锁:暖色
  notOnSale: 'rgba(100,116,139,0.35)', // 未开售
} as const;

/**
 * 按入参顺序把 areaId 映射成调色板 hex 色。
 * 同一组 areaIds 重复调用结果稳定。
 */
export function buildAreaColorMap(areaIds: readonly string[]): Map<string, string> {
  const m = new Map<string, string>();
  areaIds.forEach((id, i) => m.set(id, SEAT_AREA_COLORS[i % SEAT_AREA_COLORS.length]));
  return m;
}
