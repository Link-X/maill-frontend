import type { ReactNode } from 'react';

export function StickyBottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40
                 bg-card/95 backdrop-blur-md border-t border-border/60
                 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]
                 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {children}
    </div>
  );
}
