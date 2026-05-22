import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@maill/shared';
import { forwardRef } from 'react';

type CardVariant = 'default' | 'glass' | 'gradient';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'transition'> {
  variant?: CardVariant;
  interactive?: boolean;
}

const variantClass: Record<CardVariant, string> = {
  default: 'bg-card border border-border/60',
  glass: 'bg-card/60 backdrop-blur-md border border-border/40',
  gradient: 'bg-gradient-brand-soft border border-brand/20',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive, className, children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30',
        variantClass[variant],
        interactive && 'cursor-pointer active:scale-[0.98]',
        className,
      )}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  ),
);
Card.displayName = 'Card';
