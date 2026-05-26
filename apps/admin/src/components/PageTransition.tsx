import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { duration, easing } from '@/lib/motion';

// 路由切换：纯 key 切换 + 入场动画
// 不用 AnimatePresence mode="wait"：在 RouterProvider + Outlet 架构下，
// Outlet 基于 RouterContext 渲染，老 motion.div 在 exit 期间内部已经是新页面，
// 会导致新页面被 exit 动画淡出后才有新 motion.div 入场，中间出现空白
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easing.emphasized }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
