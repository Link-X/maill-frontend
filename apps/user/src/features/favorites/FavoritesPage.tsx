import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Settings2 } from 'lucide-react';
import { cn } from '@maill/shared';
import { ShowCard } from '@/features/shows/ShowCard';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useListFavoritesQuery, useListGroupsQuery } from './favoritesApi';

type Tab = 'all' | 'unset' | number;

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const { data: groups = [] } = useListGroupsQuery();

  const arg =
    tab === 'all'
      ? { page: 1, size: 50 }
      : tab === 'unset'
        ? { unset: true, page: 1, size: 50 }
        : { groupId: tab as number, page: 1, size: 50 };

  const { data, isLoading } = useListFavoritesQuery(arg);
  const list = data?.list ?? [];

  return (
    <div className="pb-6">
      {/* ===== 沉浸式 header ===== */}
      <header className="relative isolate px-4 pt-3 pb-5 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
        <div
          aria-hidden
          className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-rose-500/20 blur-3xl pointer-events-none"
        />

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="h-10 w-10 rounded-full
                       bg-white/65 dark:bg-white/10 backdrop-blur-xl
                       border border-white/40 dark:border-white/15
                       shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                       flex items-center justify-center
                       active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/favorites/groups')}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full
                       bg-white/70 dark:bg-white/10 backdrop-blur-md
                       border border-white/50 dark:border-white/15
                       text-xs font-medium text-brand
                       active:scale-95 transition-transform"
          >
            <Settings2 className="h-3.5 w-3.5" />
            管理分组
          </button>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight">我的收藏</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {list.length > 0 ? (
              <>
                共{' '}
                <span className="font-semibold text-brand">{list.length}</span> 场喜欢的演出
              </>
            ) : (
              '把心动的演出存起来,不会错过任何一场'
            )}
          </p>
        </div>
      </header>

      {/* ===== 分组 tab:layoutId 滑块 ===== */}
      <div className="px-4 mb-3">
        <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
          <Chip active={tab === 'all'} onClick={() => setTab('all')}>
            全部
          </Chip>
          <Chip active={tab === 'unset'} onClick={() => setTab('unset')}>
            未分组
          </Chip>
          {groups.map((g) => (
            <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
              {g.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="还没有收藏的演出"
            description="点击演出右上角的爱心,把心动场次收藏到这里"
          />
        ) : (
          <motion.div
            key={String(tab)}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            className="grid grid-cols-2 gap-3"
          >
            {list.map((f) =>
              f.show ? (
                <ShowCard key={f.id} show={f.show} />
              ) : (
                <div
                  key={f.id}
                  className="rounded-2xl border border-border/60 bg-card p-3 text-xs text-muted-foreground"
                >
                  演出已下架
                </div>
              ),
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition-colors',
        active ? 'text-brand-foreground' : 'text-foreground/70 hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="favorites-tab-pill"
          className="absolute inset-0 rounded-full bg-gradient-brand shadow-sm shadow-brand/30"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
