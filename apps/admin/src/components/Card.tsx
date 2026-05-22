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
  ({ variant = 'default', interactive, className, children, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30 transition-shadow',
          variantClass[variant],
          interactive && 'cursor-pointer',
          className,
        )}
        whileHover={interactive ? { y: -2, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)' } : undefined}
        transition={{ duration: 0.15 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('px-5 py-4 border-b border-border/60', className)}>{children}</div>
);

export const CardBody = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('p-5', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={cn('font-semibold tracking-tight', className)}>{children}</h3>
);
