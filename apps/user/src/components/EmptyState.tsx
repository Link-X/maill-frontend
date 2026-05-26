import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="relative mb-4">
        {/* 呼吸光晕 */}
        <span
          aria-hidden
          className="absolute inset-0 -m-2 rounded-3xl bg-gradient-brand-soft blur-xl animate-breath-glow"
        />
        <div className="relative h-16 w-16 rounded-2xl bg-gradient-brand-soft flex items-center justify-center ring-1 ring-brand/15">
          <Icon className="h-7 w-7 text-brand" />
        </div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.28 }}
        className="font-semibold text-foreground"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.28 }}
          className="text-sm text-muted-foreground mt-1 max-w-[260px]"
        >
          {description}
        </motion.p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
