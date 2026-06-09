import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { cn } from '@maill/shared';
import { formatDateTime } from '@/lib/format';

/** 场次/选座页通用沉浸式页头:返回 + 标题 + 时间
 *  compact: 紧凑模式(选座页用) — 更小的上下留白与标题字号,把空间让给座位图 */
export function SessionPageHeader({
  title,
  startTime,
  sessionName,
  showName,
  compact = false,
}: {
  title: string;
  startTime: string;
  sessionName?: string;
  showName?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  return (
    <header
      className={cn('relative isolate px-4 overflow-hidden', compact ? 'pt-3 pb-3' : 'pt-3 pb-6')}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
      {!compact && (
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-44 h-44 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className={cn(
            `rounded-full
             bg-white/65 dark:bg-white/10 backdrop-blur-xl
             border border-white/40 dark:border-white/15
             shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
             flex items-center justify-center shrink-0
             active:scale-95 transition-transform`,
            compact ? 'h-9 w-9' : 'h-10 w-10',
          )}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div
            className={cn('font-semibold truncate leading-tight', compact ? 'text-base' : 'text-lg')}
          >
            {title}
          </div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3 text-brand" />
            <span className="truncate">
              {formatDateTime(startTime)}
              {sessionName && showName && <span className="ml-1">· {sessionName}</span>}
            </span>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
