import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Heart } from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useListFollowsQuery } from './artistsApi';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function FollowsPage() {
  const { t } = useTranslation(['artist', 'common']);
  const navigate = useNavigate();
  const { data: list = [], isLoading } = useListFollowsQuery({ page: 1, size: 50 });

  return (
    <div className="pb-6">
      {/* ===== 沉浸式 header ===== */}
      <header className="relative isolate px-4 pt-3 pb-5 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
        <div
          aria-hidden
          className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-violet-500/20 blur-3xl pointer-events-none"
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="h-10 w-10 rounded-full
                     bg-white/65 dark:bg-white/10 backdrop-blur-xl
                     border border-white/40 dark:border-white/15
                     shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                     flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight">{t('artist:user.follows')}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {list.length > 0 ? (
              <>
                关注了{' '}
                <span className="font-semibold text-brand">{list.length}</span> 位艺人
              </>
            ) : (
              '关注喜欢的艺人,第一时间获取动态'
            )}
          </p>
        </div>
      </header>

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
            title="还没关注任何艺人"
            description="发现喜欢的艺人,关注他们的最新动态和演出"
            action={
              <button
                type="button"
                onClick={() => navigate('/artists')}
                className="inline-flex items-center gap-1 h-9 px-4 rounded-full
                           bg-gradient-brand text-brand-foreground text-xs font-semibold
                           shadow-sm shadow-brand/30 active:scale-95 transition-transform"
              >
                去发现艺人
              </button>
            }
          />
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {list.map((a) => (
              <motion.button
                key={a.id}
                variants={itemVariants}
                type="button"
                onClick={() => navigate(`/artist/${a.id}`)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                className="group relative rounded-2xl bg-card border border-border/60
                           p-4 text-left overflow-hidden
                           shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]
                           hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.18)]
                           hover:border-brand/30
                           transition-all duration-300"
              >
                {/* 背景柔光圈,hover 时浮现 */}
                <div
                  aria-hidden
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full
                             bg-gradient-brand-soft opacity-0 group-hover:opacity-100
                             blur-2xl transition-opacity duration-300 pointer-events-none"
                />

                <div className="relative">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt=""
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-2
                                 ring-2 ring-white dark:ring-white/10 shadow-md
                                 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-brand-soft
                                    flex items-center justify-center mx-auto mb-2
                                    ring-2 ring-white dark:ring-white/10 shadow-md">
                      <Users className="h-8 w-8 text-brand" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-semibold text-sm truncate group-hover:text-brand transition-colors">
                      {a.stageName || a.name}
                    </div>
                    {a.stageName && a.name !== a.stageName && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{a.name}</div>
                    )}
                    <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <Heart className="h-3 w-3 fill-rose-500/60 text-rose-500/80" />
                      <span className="tabular-nums">{a.followCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
