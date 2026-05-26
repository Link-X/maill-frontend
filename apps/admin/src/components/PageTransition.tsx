import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { duration, easing } from '@/lib/motion';

// 路由切换：emphasized easing，让进入的"飞入到位"感更强
// AnimatePresence mode="wait" 让出场动画结束后才入场，避免重叠引起的跳变
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: duration.base, ease: easing.emphasized }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
