import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@maill/shared';

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
  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        加载中...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        {empty ?? '暂无数据'}
      </div>
    );
  }
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
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
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.03 } },
          }}
        >
          {data.map((row) => (
            <motion.tr
              key={rowKey(row)}
              className="hover:bg-accent/40 transition-colors"
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
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
