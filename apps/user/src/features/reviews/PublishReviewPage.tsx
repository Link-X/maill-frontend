import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { Button, extractErrorMessage, notify } from '@maill/shared';
import { ImageUploader } from '@/components/ImageUploader';
import {
  usePublishReviewMutation,
  useReplyReviewMutation,
  useCheckPermissionQuery,
} from './reviewsApi';

/**
 * 发布评价 / 回复评论 二合一页面：
 * - 通过 query 参数区分场景
 *   - showId（必填）+ orderId（可选）→ 发布一级评价
 *   - parentId（必填）+ replyToUserId（可选）→ 二级回复
 */
export default function PublishReviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showIdParam = params.get('showId');
  const orderIdParam = params.get('orderId');
  const parentIdParam = params.get('parentId');
  const replyToUserIdParam = params.get('replyToUserId');

  const showId = showIdParam ? Number(showIdParam) : 0;
  const orderId = orderIdParam ? Number(orderIdParam) : undefined;
  const parentId = parentIdParam ? Number(parentIdParam) : undefined;
  const replyToUserId = replyToUserIdParam ? Number(replyToUserIdParam) : undefined;

  const isReply = !!parentId;

  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);

  const [publishReview, { isLoading: publishing }] = usePublishReviewMutation();
  const [replyReview, { isLoading: replying }] = useReplyReviewMutation();
  const submitting = publishing || replying;

  // 仅一级评价才需要校验权限；二级回复跳过
  const { data: canReview = true, isLoading: checking } = useCheckPermissionQuery(
    { showId, orderId },
    { skip: !showId || isReply },
  );

  const handleSubmit = async () => {
    if (!content.trim()) {
      notify.error('请输入内容');
      return;
    }
    try {
      if (isReply && parentId) {
        await replyReview({
          parentId,
          replyToUserId,
          content: content.trim(),
          images: images.length ? images : undefined,
        }).unwrap();
        notify.success('回复已发布');
        navigate(-1);
      } else {
        await publishReview({
          showId,
          orderId,
          rating,
          content: content.trim(),
          images: images.length ? images : undefined,
        }).unwrap();
        notify.success('评价已发布');
        navigate(-1);
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (!showId && !parentId) {
    return <div className="p-4">参数错误</div>;
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
        <h1 className="text-xl font-semibold">{isReply ? '回复评论' : '发布评价'}</h1>
      </div>

      {!isReply && !checking && !canReview && (
        <p className="text-sm text-destructive">你暂时无法评价该演出</p>
      )}

      {!isReply && (
        <div className="space-y-2">
          <span className="text-sm font-medium">评分</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="text-yellow-500"
                aria-label={`rating ${n}`}
              >
                <Star className={'h-7 w-7 ' + (n <= rating ? 'fill-current' : '')} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium">内容</span>
        <textarea
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder={isReply ? '回复内容…' : '分享你的观看体验...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">晒图（最多 9 张，5MB/张）</span>
        <ImageUploader value={images} onChange={setImages} dir="reviews" />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || (!isReply && !canReview)}
        className="w-full bg-gradient-brand hover:opacity-90"
      >
        {submitting ? '发布中…' : isReply ? '回复' : '发布评价'}
      </Button>
    </div>
  );
}
