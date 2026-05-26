import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Heart,
  Quote,
  FileText,
  Newspaper,
  Globe2,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import { extractErrorMessage, notify, cn } from '@maill/shared';
import { Skeleton } from '@/components/Skeleton';
import {
  useGetArtistQuery,
  useCheckFollowQuery,
  useFollowArtistMutation,
  useUnfollowArtistMutation,
} from './artistsApi';
import { useListByArtistQuery } from '@/features/articles/articlesApi';

const sectionVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function ArtistDetailPage() {
  const { t } = useTranslation(['artist', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const artistId = Number(id);
  const { data: artist, isLoading } = useGetArtistQuery(artistId, { skip: !artistId });
  const { data: articles = [] } = useListByArtistQuery(artistId, { skip: !artistId });
  const { data: following = false } = useCheckFollowQuery(artistId, { skip: !artistId });
  const [followArtist, { isLoading: following1 }] = useFollowArtistMutation();
  const [unfollowArtist, { isLoading: unfollowing }] = useUnfollowArtistMutation();
  const busy = following1 || unfollowing;

  const onToggleFollow = async () => {
    try {
      if (following) await unfollowArtist(artistId).unwrap();
      else await followArtist(artistId).unwrap();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (isLoading || !artist) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-12 w-2/3 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const displayName = artist.stageName || artist.name;
  const hasSubName = artist.stageName && artist.name !== artist.stageName;

  return (
    <div className="pb-8">
      {/* ===== 沉浸式 hero:模糊头像背景 + 渐变遮罩 + 居中大头像 ===== */}
      <header className="relative h-64 overflow-hidden">
        {/* 头像作模糊背景填满 */}
        {artist.avatarUrl ? (
          <img
            src={artist.avatarUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-brand-soft" />
        )}
        {/* 暗色 → 背景色渐变,让卡片下半部分自然过渡 */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-background"
        />

        {/* 玻璃返回按钮 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full
                     bg-white/65 dark:bg-white/10 backdrop-blur-xl
                     border border-white/40 dark:border-white/15
                     shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                     flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* 居中大头像 + ring 渐变光圈 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 flex items-end justify-center pb-6"
        >
          <div className="relative">
            {/* 光圈 */}
            <div
              aria-hidden
              className="absolute -inset-2 rounded-full bg-gradient-brand opacity-60 blur-xl"
            />
            {artist.avatarUrl ? (
              <img
                src={artist.avatarUrl}
                alt=""
                className="relative w-28 h-28 rounded-full object-cover ring-4 ring-background shadow-xl"
              />
            ) : (
              <div className="relative w-28 h-28 rounded-full bg-gradient-brand-soft ring-4 ring-background shadow-xl flex items-center justify-center">
                <Users className="h-12 w-12 text-brand" />
              </div>
            )}
          </div>
        </motion.div>
      </header>

      {/* ===== 名字 + 关注 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        className="px-4 mt-3 flex items-end justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{displayName}</h1>
          {hasSubName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{artist.name}</p>
          )}
        </div>
        <motion.button
          type="button"
          onClick={onToggleFollow}
          disabled={busy}
          whileTap={!busy ? { scale: 0.95 } : undefined}
          className={cn(
            'inline-flex items-center gap-1 h-9 px-4 rounded-full text-xs font-semibold transition-all shrink-0',
            following
              ? 'bg-card border border-border/60 text-foreground hover:border-destructive/40'
              : 'bg-gradient-brand text-brand-foreground shadow-md shadow-brand/30',
            busy && 'opacity-60 cursor-not-allowed',
          )}
        >
          <Heart
            key={`art-follow-${following}`}
            className={cn(
              'h-3.5 w-3.5',
              following ? 'fill-current text-rose-500 animate-heartbeat' : '',
            )}
          />
          {following ? t('artist:user.following') : t('artist:user.follow')}
        </motion.button>
      </motion.div>

      {/* ===== 数据 strip:粉丝 / 演出 / 国籍 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        className="px-4 mt-3"
      >
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card border border-border/60 px-3 py-3">
          <Stat icon={Heart} tone="rose" value={artist.followCount ?? 0} label="粉丝" />
          <Stat icon={Ticket} tone="amber" value={artist.showCount ?? 0} label="演出" />
          <Stat icon={Globe2} tone="sky" value={artist.nationality || '-'} label="国籍" />
        </div>
      </motion.section>

      {/* ===== 后续 sections stagger 入场 ===== */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="px-4 mt-4 space-y-4"
      >
        {/* tags */}
        {artist.tags && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5">
            {artist.tags.split(',').map((tag, i) => {
              const trimmed = tag.trim();
              if (!trimmed) return null;
              return (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 h-6 rounded-full
                             bg-gradient-brand-soft border border-brand/15
                             text-[11px] font-medium text-brand"
                >
                  {trimmed}
                </span>
              );
            })}
          </motion.div>
        )}

        {/* bio */}
        {artist.bio && (
          <SectionCard variants={itemVariants} icon={Quote} tone="brand" title={t('artist:user.bio')}>
            <p className="text-sm leading-relaxed text-foreground/85">{artist.bio}</p>
          </SectionCard>
        )}

        {/* description */}
        {artist.description && (
          <SectionCard
            variants={itemVariants}
            icon={FileText}
            tone="violet"
            title={t('artist:user.description')}
          >
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {artist.description}
            </p>
          </SectionCard>
        )}

        {/* 代表演出占位 */}
        <motion.section variants={itemVariants}>
          <SectionTitle icon={Ticket} tone="amber">
            {t('artist:user.tabShows')}
          </SectionTitle>
          <div className="rounded-2xl border border-dashed border-border/60 py-6 text-center">
            <Ticket className="h-7 w-7 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">{t('artist:user.noShows')}</p>
          </div>
        </motion.section>

        {/* 相关资讯 */}
        <motion.section variants={itemVariants}>
          <SectionTitle icon={Newspaper} tone="emerald">
            {t('artist:user.tabArticles')}
            {articles.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({articles.length})
              </span>
            )}
          </SectionTitle>
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-6 text-center">
              <Newspaper className="h-7 w-7 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{t('artist:user.noArticles')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <motion.button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(`/article/${a.id}`)}
                  whileTap={{ scale: 0.985 }}
                  className="group w-full text-left rounded-2xl
                             bg-card border border-border/60
                             p-2.5 flex gap-3 items-center
                             shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]
                             hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.16)]
                             hover:border-brand/30
                             transition-all duration-300"
                >
                  {a.coverUrl ? (
                    <img
                      src={a.coverUrl}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0
                                 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-brand-soft flex items-center justify-center shrink-0">
                      <Newspaper className="h-6 w-6 text-brand/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                      {a.title}
                    </div>
                    {a.summary && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {a.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
}

// ===== 子组件 =====

type Tone = 'brand' | 'rose' | 'amber' | 'sky' | 'violet' | 'emerald';
const toneClass: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  rose: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
};

function Stat({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof Heart;
  tone: Tone;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-1', toneClass[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-base font-bold tabular-nums leading-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Heart;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold mb-2">
      <span className={cn('h-5 w-5 rounded-md flex items-center justify-center', toneClass[tone])}>
        <Icon className="h-3 w-3" />
      </span>
      {children}
    </h3>
  );
}

function SectionCard({
  variants,
  icon,
  tone,
  title,
  children,
}: {
  variants?: typeof itemVariants;
  icon: typeof Heart;
  tone: Tone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section variants={variants}>
      <SectionTitle icon={icon} tone={tone}>
        {title}
      </SectionTitle>
      <div className="rounded-2xl bg-card border border-border/60 p-3.5">{children}</div>
    </motion.section>
  );
}
