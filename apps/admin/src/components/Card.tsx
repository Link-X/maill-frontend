import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@maill/shared';
import { forwardRef } from 'react';
import { duration, easing, spring } from '@/lib/motion';

type CardVariant = 'default' | 'glass' | 'gradient';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'transition'> {
  variant?: CardVariant;
  // 鼠标悬浮抬起 + 阴影加深
  interactive?: boolean;
  // 点击时按下反馈（多用在可点击卡片）
  pressable?: boolean;
}

const variantClass: Record<CardVariant, string> = {
  default: 'bg-card border border-border/60',
  glass: 'bg-card/60 backdrop-saturated border border-border/40',
  gradient: 'bg-gradient-brand-soft border border-brand/20',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive, pressable, className, children, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl shadow-elevate-1 card-hairline transition-shadow',
          variantClass[variant],
          interactive && 'cursor-pointer hover:shadow-elevate-2',
          className,
        )}
        whileHover={interactive ? { y: -3 } : undefined}
        whileTap={pressable ? { scale: 0.985 } : undefined}
        transition={pressable ? spring.snappy : { duration: duration.base, ease: easing.standard }}
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
