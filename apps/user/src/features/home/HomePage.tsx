import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@maill/shared';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useListShowsQuery } from '@/features/shows/showsApi';
import { ShowCard } from '@/features/shows/ShowCard';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function HomePage() {
  const { t } = useTranslation(['show']);
  const [name, setName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  // 防抖：用户停止输入 300ms 后再发起搜索请求
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(name.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [name]);

  const { data, isLoading, isFetching } = useListShowsQuery({
    page: 1,
    size: PAGE_SIZE,
    name: debouncedName || undefined,
  });

  const list = data?.list ?? [];

  return (
    <div className="px-4 py-3 space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('show:list')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('show:detail')}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Sparkles} title="暂无演出" description="换个关键词试试看" />
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {list.map((show) => (
            <ShowCard key={String(show.id)} show={show} />
          ))}
        </motion.div>
      )}

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-muted-foreground">加载中...</p>
      )}
    </div>
  );
}
