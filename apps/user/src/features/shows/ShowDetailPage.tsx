import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Ticket,
  Clock,
  Shield,
  Heart,
  Bell,
  Star,
  Edit3,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import {
  Button,
  SessionStatus,
  parseExtend,
  notify,
  extractErrorMessage,
  cn,
  type ShowExtend,
} from '@maill/shared';
import {
  useListReviewsQuery,
  useCheckPermissionQuery as useCheckReviewPermissionQuery,
  useLikeReviewMutation,
  useUnlikeReviewMutation,
} from '@/features/reviews/reviewsApi';
import {
  useCheckFavoriteQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/features/favorites/favoritesApi';
import {
  useCheckSubscribeQuery,
  useAddSubscribeMutation,
  useRemoveSubscribeMutation,
} from '@/features/subscriptions/subscribeApi';
import { Badge } from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/lib/format';
import { useGetShowQuery } from './showsApi';
import { useListSessionsQuery } from '@/features/sessions/sessionsApi';

export default function ShowDetailPage() {
  const { t } = useTranslation(['show', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const showId = id ?? '';
  const { data: show, isLoading: loadingShow } = useGetShowQuery(showId, { skip: !showId });
  // 不再硬过滤 status:未开售/销售中/已结束都展示,由 SessionRow 按 status 渲染状态徽章
  const { data: sessions, isLoading: loadingSessions } = useListSessionsQuery(
    { showId, page: 1, size: 50 },
    { skip: !showId },
  );
  const sessionList = sessions?.list ?? [];

  // 收藏相关
  const showIdNum = Number(showId);
  const { data: favorited = false } = useCheckFavoriteQuery(showIdNum, { skip: !showIdNum });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const toggleFavorite = async () => {
    try {
      if (favorited) {
        await removeFavorite(showIdNum).unwrap();
      } else {
        await addFavorite({ showId: showIdNum }).unwrap();
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  // 订阅相关
  const { data: subscribed = false } = useCheckSubscribeQuery(showIdNum, { skip: !showIdNum });
  const [addSubscribe] = useAddSubscribeMutation();
  const [removeSubscribe] = useRemoveSubscribeMutation();

  const toggleSubscribe = async () => {
    try {
      if (subscribed) {
        await removeSubscribe(showIdNum).unwrap();
      } else {
        await addSubscribe({ showId: showIdNum }).unwrap();
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  // 评价相关：列表 + 发布权限 + 点赞
  const { data: reviewsData } = useListReviewsQuery(
    { showId: showIdNum, sort: 'latest', page: 1, size: 5 },
    { skip: !showIdNum },
  );
  const reviewsList = reviewsData?.list ?? [];
  const { data: canReview = false } = useCheckReviewPermissionQuery(
    { showId: showIdNum },
    { skip: !showIdNum },
  );
  const [likeR] = useLikeReviewMutation();
  const [unlikeR] = useUnlikeReviewMutation();

  const toggleReviewLike = async (rid: number, liked: boolean) => {
    try {
      if (liked) {
        await unlikeR(rid).unwrap();
      } else {
        await likeR(rid).unwrap();
      }
    } catch {
      // 评价点赞失败暂不打扰用户
    }
  };

  return (
    <div>
      {/* 沉浸式海报区:模糊大背景 + 居中卡片海报 + 底部弧形过渡 */}
      <div className="relative h-72 overflow-hidden bg-gradient-brand-soft">
        {show?.posterUrl && (
          <>
            {/* 模糊大背景填满 */}
            <img
              src={show.posterUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70"
            />
            {/* 暗色遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-background/95" />
            {/* 居中卡片海报 */}
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <div
                className="relative h-52 w-36 rounded-2xl overflow-hidden
                           shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]
                           ring-1 ring-white/20"
              >
                <img src={show.posterUrl} alt={show.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </>
        )}

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
      </div>

      <div className="px-4 py-4 space-y-4">
        {loadingShow ? (
          <Skeleton className="h-8 w-2/3" />
        ) : show ? (
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{show.name}</h1>
              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition-colors active:scale-95 ' +
                    (favorited
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-card text-foreground border-border/60 hover:border-destructive/40')
                  }
                >
                  <Heart
                    key={`fav-${favorited}`}
                    className={
                      'h-3.5 w-3.5 ' +
                      (favorited ? 'fill-current animate-heartbeat' : '')
                    }
                  />
                  {favorited ? '已收藏' : '收藏'}
                </button>
                <button
                  type="button"
                  onClick={toggleSubscribe}
                  className={
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition-colors active:scale-95 ' +
                    (subscribed
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-card text-foreground border-border/60 hover:border-primary/40')
                  }
                >
                  <Bell
                    key={`sub-${subscribed}`}
                    className={
                      'h-3.5 w-3.5 ' +
                      (subscribed ? 'fill-current animate-heartbeat' : '')
                    }
                  />
                  {subscribed ? '已订阅' : '开售提醒'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {show.categoryName && <Badge variant="brand">{show.categoryName}</Badge>}
              {show.cityName && <Badge variant="info">{show.cityName}</Badge>}
            </div>
            {(show.venue || show.address) && (
              <p className="text-sm text-muted-foreground inline-flex items-start gap-1.5">
                <MapPin className="h-4 w-4 mt-0.5 text-brand shrink-0" />
                <span>
                  {show.venue && <span className="text-foreground/80 font-medium">{show.venue}</span>}
                  {show.venue && show.address && <span className="mx-1">·</span>}
                  {show.address}
                </span>
              </p>
            )}
            {show.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">{show.description}</p>
            )}
            {show.artists && show.artists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {show.artists.map((a) => (
                  <Link
                    key={a.id}
                    to={`/artist/${a.id}`}
                    className="group inline-flex items-center gap-2 rounded-full
                               bg-card border border-border/60
                               pl-1 pr-3 py-0.5 text-xs
                               hover:border-brand/40 hover:shadow-sm hover:-translate-y-0.5
                               transition-all duration-200"
                  >
                    {a.avatarUrl ? (
                      <img
                        src={a.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-border/40"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gradient-brand-soft flex items-center justify-center">
                        <Users className="h-3 w-3 text-brand" />
                      </span>
                    )}
                    <span className="font-medium group-hover:text-brand transition-colors">
                      {a.stageName || a.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <ShowExtendInfo extend={show.extend} />
          </header>
        ) : null}

        {/* 评分概览(若有数据) */}
        {show && show.reviewCount !== undefined && show.reviewCount > 0 && (
          <button
            type="button"
            onClick={() =>
              document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="w-full flex items-center justify-between gap-3 px-4 py-3
                       rounded-2xl bg-gradient-to-br from-yellow-500/[0.08] via-card to-card
                       border border-yellow-500/20
                       active:scale-[0.99] transition-transform"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-yellow-500 tabular-nums">
                {(show.avgRating ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/ 5.0</span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex gap-0.5 text-yellow-500 mb-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn('h-3.5 w-3.5', n <= Math.round(show.avgRating ?? 0) && 'fill-current')}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {show.reviewCount} 条用户评价
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          </button>
        )}

        <section>
          <h2 className="font-semibold mb-3 inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-brand" />
            {t('show:detail.availableSessions')}
          </h2>
          {loadingSessions ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : sessionList.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={t('show:detail.noSessions')}
              description={t('show:detail.noSessionsHint')}
            />
          ) : (
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {sessionList.map((s) => (
                <SessionRow
                  key={String(s.id)}
                  startTime={s.startTime}
                  name={s.name}
                  status={Number(s.status)}
                  openSaleTime={s.openSaleTime}
                  onClick={() => navigate(`/session/${s.id}`)}
                  selectSeatsLabel={t('show:detail.selectSeats')}
                  fallbackLabel={t('show:card.sessionFallback', { date: formatDateTime(s.startTime) })}
                  limitLabel={t('show:detail.limitPerUserSuffix', { n: s.limitPerUser ?? '-' })}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* 评价区块 */}
        <section id="reviews-section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              评价
              {show?.reviewCount ? (
                <span className="text-sm text-muted-foreground">({show.reviewCount})</span>
              ) : null}
            </h2>
            {canReview && show?.reviewMode !== 0 && (
              <button
                type="button"
                onClick={() => navigate(`/review/publish?showId=${showId}`)}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-full
                           bg-gradient-brand text-brand-foreground text-xs font-medium
                           shadow-sm shadow-brand/25
                           active:scale-95 transition-transform"
              >
                <Edit3 className="h-3.5 w-3.5" />
                写评价
              </button>
            )}
          </div>

          {reviewsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">还没有评价,期待你的第一条体验</p>
            </div>
          ) : (
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {reviewsList.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onClick={() => navigate(`/review/${r.id}`)}
                  onToggleLike={(e) => {
                    e.stopPropagation();
                    toggleReviewLike(r.id, !!r.liked);
                  }}
                />
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}

function ShowExtendInfo({ extend }: { extend?: string }) {
  const { t } = useTranslation(['show']);
  const data = parseExtend<ShowExtend>(extend);
  if (!data) return null;
  type Tone = 'brand' | 'amber' | 'sky';
  const items: { icon: typeof Clock; label: string; value: string; tone: Tone }[] = [];
  if (typeof data.duration === 'number') {
    items.push({
      icon: Clock,
      tone: 'brand',
      label: t('show:detail.duration'),
      value: t('show:detail.durationValue', { n: data.duration }),
    });
  }
  if (data.ageLimit) {
    items.push({ icon: Users, tone: 'amber', label: t('show:detail.ageLimit'), value: String(data.ageLimit) });
  }
  if (data.refundRule) {
    items.push({ icon: Shield, tone: 'sky', label: t('show:detail.refundRule'), value: String(data.refundRule) });
  }
  if (items.length === 0) return null;

  const toneClass: Record<Tone, string> = {
    brand: 'bg-brand/10 text-brand',
    amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
  };

  return (
    <div className={cn('grid gap-2 pt-2', items.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {items.map(({ icon: Icon, label, value, tone }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/40"
        >
          <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', toneClass[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="text-xs font-medium text-foreground/90 truncate">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== 场次行:左侧大日期块 + 中间时间/人数 + 右侧 CTA =====
function SessionRow({
  startTime,
  name,
  status,
  openSaleTime,
  onClick,
  selectSeatsLabel,
  fallbackLabel,
  limitLabel,
}: {
  startTime: string;
  name?: string;
  status: number;
  openSaleTime?: string;
  onClick: () => void;
  selectSeatsLabel: string;
  fallbackLabel: string;
  limitLabel: string;
}) {
  const date = new Date(startTime);
  const validDate = !Number.isNaN(date.getTime());
  const month = validDate ? `${date.getMonth() + 1}月` : '';
  const day = validDate ? String(date.getDate()).padStart(2, '0') : '--';
  const time = validDate
    ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '';

  // 状态徽章 + CTA 文案
  const isDraft = status === SessionStatus.Draft;
  const isEnded = status === SessionStatus.Ended;
  const isPublished = status === SessionStatus.Published;
  const ctaLabel = isPublished
    ? selectSeatsLabel
    : isEnded
      ? '已结束'
      : '即将开售';

  return (
    <motion.button
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'group w-full text-left rounded-2xl overflow-hidden',
        'bg-card border border-border/60',
        'shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]',
        'hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)]',
        isPublished && 'hover:border-brand/30',
        'transition-all duration-300',
      )}
    >
      <div className="flex items-center gap-3 p-3 pr-3.5">
        {/* 左侧渐变日期块 */}
        <div
          className={cn(
            'relative h-16 w-16 shrink-0 rounded-xl overflow-hidden',
            'text-brand-foreground flex flex-col items-center justify-center shadow-sm',
            isEnded
              ? 'bg-muted-foreground/40 shadow-muted-foreground/10'
              : isDraft
                ? 'bg-warning/80 shadow-warning/20'
                : 'bg-gradient-brand shadow-brand/20',
          )}
        >
          <span className="text-[10px] font-medium opacity-90">{month}</span>
          <span className="text-2xl font-bold leading-none tabular-nums">{day}</span>
        </div>

        {/* 中间信息 */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="font-semibold text-sm truncate inline-flex items-center gap-1.5">
            <span className="truncate">{name || fallbackLabel}</span>
            {isDraft && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning shrink-0">
                即将开售
              </span>
            )}
            {isEnded && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                已结束
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-3 flex-wrap">
            {time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-brand" />
                {time}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-brand" />
              {limitLabel}
            </span>
            {isDraft && openSaleTime && (
              <span className="inline-flex items-center gap-1 text-warning">
                <Calendar className="h-3 w-3" />
                开售 {formatDateTime(openSaleTime)}
              </span>
            )}
          </div>
        </div>

        {/* 右侧 CTA */}
        <Button
          size="sm"
          className={cn(
            'shrink-0 h-9 px-3.5',
            isPublished
              ? 'bg-gradient-brand hover:opacity-90 shadow-sm shadow-brand/25'
              : isEnded
                ? 'bg-muted text-muted-foreground hover:bg-muted'
                : 'bg-warning/90 text-warning-foreground hover:bg-warning',
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {ctaLabel}
          {isPublished && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
        </Button>
      </div>
    </motion.button>
  );
}

// ===== 评价卡:头像/用户名/时间 + 星级 + 内容 + 图片 + 点赞回复 =====
function ReviewCard({
  review,
  onClick,
  onToggleLike,
}: {
  review: {
    id: number;
    userId: number;
    username?: string;
    rating?: number;
    content?: string;
    images?: { id: number; url: string }[];
    liked?: boolean;
    likeCount?: number;
    replyCount?: number;
    createTime?: string;
  };
  onClick: () => void;
  onToggleLike: (e: React.MouseEvent) => void;
}) {
  const userInitial = (review.username || `U${review.userId}`).slice(0, 1).toUpperCase();
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.28 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group rounded-2xl bg-card border border-border/60
                 p-3 cursor-pointer hover:border-brand/30 hover:shadow-sm
                 transition-all duration-200"
    >
      <div className="flex items-center gap-2.5">
        <span className="h-9 w-9 rounded-full bg-gradient-brand text-brand-foreground
                         flex items-center justify-center text-xs font-semibold shrink-0">
          {userInitial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {review.username || `用户 ${review.userId}`}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {review.rating ? (
              <div className="flex gap-0.5 text-yellow-500">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn('h-3 w-3', n <= (review.rating ?? 0) && 'fill-current')}
                  />
                ))}
              </div>
            ) : null}
            {review.createTime && <span>{formatDateTime(review.createTime)}</span>}
          </div>
        </div>
      </div>

      {review.content && (
        <p className="text-sm mt-2 line-clamp-3 leading-relaxed text-foreground/90">
          {review.content}
        </p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="flex gap-1.5 mt-2.5">
          {review.images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-20 h-20 rounded-lg object-cover ring-1 ring-border/40"
            />
          ))}
          {review.images.length > 3 && (
            <span className="w-20 h-20 rounded-lg bg-muted/60 border border-border/40
                             flex items-center justify-center text-xs text-muted-foreground">
              +{review.images.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onToggleLike}
          className={cn(
            'inline-flex items-center gap-1 transition-colors active:scale-95',
            review.liked ? 'text-destructive' : 'hover:text-destructive',
          )}
        >
          <Heart
            key={`r-like-${review.id}-${review.liked}`}
            className={cn('h-3.5 w-3.5', review.liked && 'fill-current animate-heartbeat')}
          />
          {review.likeCount ?? 0}
        </button>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {review.replyCount ?? 0}
        </span>
      </div>
    </motion.div>
  );
}
