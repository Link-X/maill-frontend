import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Star, Flag } from 'lucide-react';
import { extractErrorMessage, notify } from '@maill/shared';
import { formatDateTime } from '@/lib/format';
import {
  useGetReviewQuery,
  useListRepliesQuery,
  useLikeReviewMutation,
  useUnlikeReviewMutation,
  useReportReviewMutation,
} from './reviewsApi';

/**
 * 评价详情页：展示一级评价主体，下方分页加载二级回复，并提供点赞/回复/举报操作。
 */
export default function ReviewDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reviewId = Number(id);

  const { data: review, isLoading } = useGetReviewQuery(reviewId, { skip: !reviewId });
  const { data: replies } = useListRepliesQuery(
    { parentId: reviewId, page: 1, size: 50 },
    { skip: !reviewId },
  );
  const [likeReview] = useLikeReviewMutation();
  const [unlikeReview] = useUnlikeReviewMutation();
  const [reportReview] = useReportReviewMutation();

  const toggleLike = async () => {
    if (!review) return;
    try {
      if (review.liked) {
        await unlikeReview(review.id).unwrap();
      } else {
        await likeReview(review.id).unwrap();
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleReport = async () => {
    if (!review) return;
    // 简单交互：原生 prompt 收集举报原因，后续可替换为模态框
    const reason = window.prompt('举报原因');
    if (!reason) return;
    try {
      await reportReview({ reviewId: review.id, reason }).unwrap();
      notify.success('已举报');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (isLoading || !review) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
          aria-label="back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold">评价详情</h1>
      </div>

      <article className="space-y-2 rounded-2xl border bg-card p-3">
        <header className="flex items-center justify-between">
          <span className="font-medium">{review.username || `用户 ${review.userId}`}</span>
          {review.rating && (
            <div className="flex gap-0.5 text-yellow-500">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={'h-4 w-4 ' + (n <= (review.rating ?? 0) ? 'fill-current' : '')}
                />
              ))}
            </div>
          )}
        </header>
        <p className="text-sm whitespace-pre-wrap">{review.content}</p>
        {review.images && review.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {review.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                className="w-full aspect-square rounded object-cover"
                alt=""
              />
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {review.createTime ? formatDateTime(review.createTime) : ''}
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={toggleLike}
            className="inline-flex items-center gap-1 text-xs"
          >
            <Heart
              className={'h-3.5 w-3.5 ' + (review.liked ? 'fill-current text-destructive' : '')}
            />
            <span>{review.likeCount ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`/review/publish?parentId=${review.id}&replyToUserId=${review.userId}`)
            }
            className="inline-flex items-center gap-1 text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>回复</span>
          </button>
          <button
            type="button"
            onClick={handleReport}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>举报</span>
          </button>
        </div>
      </article>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{(replies?.list ?? []).length} 条回复</h3>
        {(replies?.list ?? []).map((r) => (
          <div key={r.id} className="rounded-xl bg-muted/40 p-3 space-y-1">
            <div className="text-xs">
              <span className="font-medium">{r.username || `用户 ${r.userId}`}</span>
              {r.replyToUsername && (
                <span className="text-muted-foreground">
                  {' '}
                  回复 <span className="font-medium">@{r.replyToUsername}</span>
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.content}</p>
            {r.images && r.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {r.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    className="w-full aspect-square rounded object-cover"
                    alt=""
                  />
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {r.createTime ? formatDateTime(r.createTime) : ''}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigate(`/review/publish?parentId=${review.id}&replyToUserId=${r.userId}`)
                }
                className="text-xs text-primary"
              >
                回复
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
