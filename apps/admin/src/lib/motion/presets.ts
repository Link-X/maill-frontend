// 命名动画预设：组件直接消费，减少魔法数字
import type { Variants, Transition } from 'framer-motion';
import { duration, easing, spring } from './tokens';

// fadeUp：最常用的进入动画，opacity + y
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const fadeUpTransition: Transition = {
  duration: duration.base,
  ease: easing.emphasized,
};

// fadeIn：纯透明度，最克制
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const fadeInTransition: Transition = {
  duration: duration.fast,
  ease: easing.standard,
};

// scaleIn：opacity + scale，用于 modal/popup
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1 },
};

export const scaleInTransition: Transition = {
  duration: duration.base,
  ease: easing.emphasized,
};

// slideRight：左侧滑入，用于侧栏内容
export const slideRight: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

// popIn：spring 跳入，用于徽章、标签等小元素
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export const popInTransition: Transition = {
  ...spring.snappy,
};

// Stagger 容器：让子元素依次进入
export const staggerContainer = (delay = 0.04, initial = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: delay,
      delayChildren: initial,
    },
  },
});

// 列表 stagger 安全阈值：超过此行数不做 stagger，避免长列表卡顿
export const STAGGER_MAX_ITEMS = 30;
