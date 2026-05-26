import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@maill/shared';
import { SkeletonRows } from './Skeleton';
import { duration, easing, STAGGER_MAX_ITEMS } from '@/lib/motion';

export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  empty?: ReactNode;
}

export function DataTable<T>({ columns, data, rowKey, loading, empty }: DataTableProps<T>) {
  const { t } = useTranslation('common');
  if (loading) {
    return (
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card p-4">
        <SkeletonRows count={5} />
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        {empty ?? t('common:states.empty')}
      </div>
    );
  }

  // 长列表（> 30 行）不做 stagger，避免数据量大时卡顿
  const shouldStagger = data.length <= STAGGER_MAX_ITEMS;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-elevate-1 card-hairline">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('text-left px-4 py-3 font-medium text-xs uppercase tracking-wider', col.className)}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          className="divide-y divide-border/60"
          initial="hidden"
          animate="show"
          variants={
            shouldStagger
              ? { hidden: {}, show: { transition: { staggerChildren: 0.025 } } }
              : { hidden: {}, show: {} }
          }
        >
          {data.map((row) => (
            <motion.tr
              key={rowKey(row)}
              // hover 时整行底色升温 + 左侧浮现一条 2px brand 色 indicator（box-shadow inset 实现，无布局位移）
              className="group hover:bg-accent/40 hover:[box-shadow:inset_2px_0_0_0_hsl(var(--brand))] transition-[background-color,box-shadow] duration-150 ease-out"
              variants={
                shouldStagger
                  ? {
                      hidden: { opacity: 0, y: 4 },
                      show: { opacity: 1, y: 0 },
                    }
                  : undefined
              }
              transition={{ duration: duration.fast, ease: easing.emphasized }}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3.5', col.className)}>
                  {col.render
                    ? col.render(row)
                    : ((row as unknown as Record<string, unknown>)[col.key] as ReactNode) ?? '-'}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
