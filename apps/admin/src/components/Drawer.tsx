import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { duration, easing, spring } from '@/lib/motion';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, children, footer, width = 480 }: DrawerProps) {
  const { t } = useTranslation('common');
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: easing.standard }}
          />
          <motion.aside
            className="h-full bg-card/95 backdrop-saturated border-l border-border/60 flex flex-col shadow-elevate-3"
            style={{ width }}
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={spring.gentle}
          >
            <header className="h-14 px-5 flex items-center justify-between border-b border-border/60">
              <h2 className="font-semibold text-base">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 hover:bg-accent active:scale-95"
                aria-label={t('common:drawer.closeAria')}
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <motion.div
              className="flex-1 overflow-auto p-5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.08 }}
            >
              {children}
            </motion.div>
            {footer && (
              <footer className="border-t border-border/60 p-4 flex justify-end gap-2 bg-muted/30">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
