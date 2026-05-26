// 动画 token：所有共享组件和页面消费这里的值，确保统一的"动作语言"

import type { Transition } from 'framer-motion';

// 时长：按动作距离感分档（单位：秒）
export const duration = {
  instant: 0.12, // 颜色、opacity 等纯属性
  fast: 0.18,    // 按钮 press、tabs 高亮
  base: 0.24,    // 卡片 hover、表格行 stagger 单位
  slow: 0.38,    // drawer、modal、页面切换
  lazy: 0.56,    // KPI count-up、图表 entry
} as const;

// Easing 三档：拒绝默认 ease，全部使用 Apple/Stripe 风的精调曲线
export const easing = {
  standard: [0.32, 0.72, 0, 1] as const,    // 进出对称，最常用
  emphasized: [0.16, 1, 0.3, 1] as const,   // 入场专用：先快后慢
  decelerated: [0, 0, 0.2, 1] as const,     // 离场专用
} as const;

// Spring 三档：物理动画
export const spring = {
  // 准物理位移：nav indicator、tabs 高亮、状态切换
  snappy: { type: 'spring', stiffness: 380, damping: 30, mass: 0.6 } satisfies Transition,
  // drawer、modal、卡片展开
  gentle: { type: 'spring', stiffness: 220, damping: 26, mass: 0.8 } satisfies Transition,
  // layout 重排
  layout: { type: 'spring', stiffness: 300, damping: 32, mass: 0.7 } satisfies Transition,
} as const;
