import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { duration, easing, spring } from '@/lib/motion';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-border/60">
      <div className="flex items-center gap-3">
        {Icon && (
          <motion.div
            className="h-11 w-11 rounded-xl bg-gradient-brand flex items-center justify-center text-brand-foreground shadow-elevate-2"
            initial={{ scale: 0.85, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={spring.snappy}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.04 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
        </motion.div>
      </div>
      {actions && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.base, ease: easing.emphasized, delay: 0.08 }}
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}
