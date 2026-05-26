import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@maill/shared';
import { duration, easing, spring } from '@/lib/motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-border rounded-xl',
        className,
      )}
    >
      <motion.div
        className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4"
        initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={spring.gentle}
      >
        <Icon className="h-7 w-7" />
      </motion.div>
      <motion.h3
        className="text-base font-semibold"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.08 }}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.div
          className="text-sm text-muted-foreground mt-1.5 max-w-md"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.14 }}
        >
          {description}
        </motion.div>
      )}
      {action && (
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
