import { motion } from 'framer-motion';
import { cn } from '@maill/shared';
import { spring } from '@/lib/motion';

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  // 为不同位置的 Tabs 提供独立的 layoutId 命名空间，避免冲突
  layoutId?: string;
}

export function Tabs({ items, value, onChange, layoutId = 'tabs-indicator' }: TabsProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative px-3 py-1.5 text-sm rounded-md transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 bg-background rounded-md shadow-elevate-1"
                transition={spring.snappy}
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
