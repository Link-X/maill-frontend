import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

// 不用 AnimatePresence:它与 react-router 的 <Outlet /> 不兼容
// —— Outlet 跟随当前 pathname 渲染,mode="wait" 会让新页面延迟 mount,
//    期间 Suspense fallback 和路由组件反复挂载/卸载,造成切换 tab 时短暂空白。
// 改为依赖 key 变化触发 React 自身的 unmount→remount,新组件直接执行 initial→animate。
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
