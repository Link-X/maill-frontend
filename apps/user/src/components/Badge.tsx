import { motion } from 'framer-motion';
import { cn } from '@maill/shared';
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'brand' | 'muted';

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/15 text-success ring-1 ring-success/30',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  info: 'bg-info/15 text-info ring-1 ring-info/30',
  brand: 'bg-brand/15 text-brand ring-1 ring-brand/30',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({
  variant = 'default',
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        variantClass[variant],
        className,
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      {children}
    </motion.span>
  );
}
