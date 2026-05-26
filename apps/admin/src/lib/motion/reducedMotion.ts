// reduced-motion 适配：除了 MotionConfig 全局兜底外，提供 hook 供组件 fine-tune
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

// 直接 re-export，统一入口
export const useReducedMotion = useFramerReducedMotion;

// 把任意进入动画的 y/x/scale 收敛成仅 opacity（用于自定义 motion.div initial/animate）
export function pruneMotion<T extends Record<string, unknown>>(
  value: T,
  reduced: boolean | null,
): T {
  if (!reduced) return value;
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (key === 'opacity') cleaned[key] = value[key];
  }
  return cleaned as T;
}
