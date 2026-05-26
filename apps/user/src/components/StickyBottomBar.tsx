import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// 用 portal 渲染到 document.body,避免被祖先的 transform 接管定位
// (PageTransition 的 motion.div 有 scale/y 动画,会让 fixed 元素相对它而非 viewport 定位,
//  导致页面进入瞬间底部栏从上方"掉"下来。)
export function StickyBottomBar({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40
                 bg-card/95 backdrop-blur-md border-t border-border/60
                 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]
                 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {children}
    </div>,
    document.body,
  );
}
