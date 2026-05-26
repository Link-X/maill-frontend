import { motion } from 'framer-motion';
import { cn } from '@maill/shared';
import type { ReactNode } from 'react';
import { spring } from '@/lib/motion';

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'brand' | 'muted';

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/15 text-success ring-1 ring-success/30',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  info: 'bg-info/15 text-info ring-1 ring-info/30',
  brand: 'bg-brand/15 text-brand ring-1 ring-brand/30',
  muted: 'bg-muted text-muted-foreground',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  // 状态变化时通过此 key 触发翻牌动画（rotateX）；不传则用 children 作为 key
  flipKey?: string | number;
}

export function Badge({ variant = 'default', children, className, flipKey }: BadgeProps) {
  const k = flipKey ?? (typeof children === 'string' ? children : undefined);
  return (
    <motion.span
      key={k}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        variantClass[variant],
        className,
      )}
      initial={{ opacity: 0, scale: 0.85, rotateX: -90 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={spring.snappy}
      style={{ transformPerspective: 200 }}
    >
      {children}
    </motion.span>
  );
}
