import { useEffect } from 'react';
import { useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import { duration as durTok, easing } from '@/lib/motion';

interface AnimatedNumberProps {
  // 目标数值
  value: number;
  // 格式化函数：例如金额、百分比；默认 toFixed(0)
  format?: (v: number) => string;
  className?: string;
  // 动画时长，默认 0.56s（lazy 档）
  duration?: number;
  // 小数位（当不传 format 时生效）
  precision?: number;
}

// 数字 count-up：用 useMotionValue + animate，避免 React re-render；reduce-motion 时直接显示终值
export function AnimatedNumber({
  value,
  format,
  className,
  duration = durTok.lazy,
  precision = 0,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format(v) : v.toFixed(precision),
  );

  useEffect(() => {
    // 异常值兜底
    const safe = Number.isFinite(value) ? value : 0;
    if (reduced) {
      mv.set(safe);
      return;
    }
    const controls = animate(mv, safe, {
      duration,
      ease: easing.emphasized,
    });
    return () => controls.stop();
  }, [value, duration, mv, reduced]);

  return <motion.span className={className}>{display}</motion.span>;
}
