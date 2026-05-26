import { Button } from '@maill/shared';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { duration, easing, spring } from '@/lib/motion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const finalConfirmText = confirmText ?? t('common:actions.ok');
  const finalCancelText = cancelText ?? t('common:actions.cancel');
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: easing.standard }}
          />
          <motion.div
            className="relative z-10 bg-card/95 backdrop-saturated border border-border/60 rounded-xl w-full max-w-sm p-6 space-y-4 shadow-elevate-3 card-hairline"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: duration.fast, ease: easing.decelerated } }}
            transition={spring.gentle}
          >
            <h2 className="font-semibold text-lg">{title}</h2>
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                {finalCancelText}
              </Button>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                animate={destructive ? { boxShadow: ['0 0 0 0 hsl(var(--destructive) / 0.0)', '0 0 0 4px hsl(var(--destructive) / 0.15)', '0 0 0 0 hsl(var(--destructive) / 0.0)'] } : undefined}
                style={{ borderRadius: 6 }}
              >
                <Button variant={destructive ? 'destructive' : 'default'} size="sm" onClick={onConfirm}>
                  {finalConfirmText}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
