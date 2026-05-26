import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Calendar, Users, Ticket, Clock, Shield, Heart, Bell, Star, Edit3 } from 'lucide-react';
import { Button, SessionStatus, parseExtend, notify, extractErrorMessage, type ShowExtend } from '@maill/shared';
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
import { Card } from '@/components/Card';
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
  const { data: sessions, isLoading: loadingSessions } = useListSessionsQuery(
    { showId, page: 1, size: 50, status: SessionStatus.Published },
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
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                  >
                    {a.avatarUrl && (
                      <img src={a.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span>{a.stageName || a.name}</span>
                  </Link>
                ))}
              </div>
            )}
            <ShowExtendInfo extend={show.extend} />
          </header>
        ) : null}

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
            <div className="space-y-2">
              {sessionList.map((s) => (
                <Card key={String(s.id)} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-medium">
                      {s.name || t('show:card.sessionFallback', { date: formatDateTime(s.startTime) })}
                    </div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(s.startTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t('show:detail.limitPerUserSuffix', { n: s.limitPerUser ?? '-' })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-brand hover:opacity-90 shrink-0"
                    onClick={() => navigate(`/session/${s.id}`)}
                  >
                    {t('show:detail.selectSeats')}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* 评价区块：评分概览 + 最近 5 条评价 + 写评价入口 */}
        <section>
          <h2 className="font-semibold mb-3 inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            评价 {show?.reviewCount ? `(${show.reviewCount})` : ''}
            {show?.avgRating && show.avgRating > 0 && (
              <span className="text-sm text-muted-foreground">
                · {show.avgRating.toFixed(1)} 分
              </span>
            )}
          </h2>

          {canReview && show?.reviewMode !== 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mb-3"
              onClick={() => navigate(`/review/publish?showId=${showId}`)}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              写评价
            </Button>
          )}

          {reviewsList.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无评价</p>
          )}

          <div className="space-y-2">
            {reviewsList.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border bg-card p-3 cursor-pointer"
                onClick={() => navigate(`/review/${r.id}`)}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{r.username || `用户 ${r.userId}`}</span>
                  {r.rating && (
                    <div className="flex gap-0.5 text-yellow-500">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={'h-3 w-3 ' + (n <= (r.rating ?? 0) ? 'fill-current' : '')}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm mt-1 line-clamp-3">{r.content}</p>
                {r.images && r.images.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {r.images.slice(0, 3).map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="w-16 h-16 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReviewLike(r.id, !!r.liked);
                    }}
                    className="inline-flex items-center gap-1"
                  >
                    <Heart
                      className={'h-3.5 w-3.5 ' + (r.liked ? 'fill-current text-destructive' : '')}
                    />
                    {r.likeCount ?? 0}
                  </button>
                  <span>{r.replyCount ?? 0} 回复</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ShowExtendInfo({ extend }: { extend?: string }) {
  const { t } = useTranslation(['show']);
  const data = parseExtend<ShowExtend>(extend);
  if (!data) return null;
  const items: { icon: typeof Clock; label: string; value: string }[] = [];
  if (typeof data.duration === 'number') {
    items.push({
      icon: Clock,
      label: t('show:detail.duration'),
      value: t('show:detail.durationValue', { n: data.duration }),
    });
  }
  if (data.ageLimit) {
    items.push({ icon: Users, label: t('show:detail.ageLimit'), value: String(data.ageLimit) });
  }
  if (data.refundRule) {
    items.push({ icon: Shield, label: t('show:detail.refundRule'), value: String(data.refundRule) });
  }
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-1.5 pt-1">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
          <Icon className="h-3.5 w-3.5 mt-0.5 text-brand shrink-0" />
          <span>
            <span className="text-foreground/70">{label}：</span>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
