import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Skeleton } from '@/components/Skeleton';
import { formatDateTime } from '@/lib/format';
import { useGetArticleQuery } from './articlesApi';

export default function ArticleDetailPage() {
  const { t } = useTranslation(['article', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const articleId = id ?? '';
  const { data: article, isLoading } = useGetArticleQuery(articleId, { skip: !articleId });

  const sanitized = useMemo(() => DOMPurify.sanitize(article?.content ?? ''), [article?.content]);

  return (
    <div>
      <div className="relative h-44 bg-gradient-brand-soft">
        {article?.coverUrl && (
          <img src={article.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading || !article ? (
          <>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {article.category?.name && <span>{article.category.name}</span>}
              {article.author && <span>· {article.author}</span>}
              {article.publishedAt && <span>· {formatDateTime(article.publishedAt)}</span>}
              <span>· {article.viewCount ?? 0} 浏览</span>
            </div>

            {article.artist && (
              <Link
                to={`/artist/${article.artist.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
              >
                {article.artist.avatarUrl ? (
                  <img
                    src={article.artist.avatarUrl}
                    className="w-5 h-5 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                <span>{article.artist.stageName || article.artist.name}</span>
              </Link>
            )}

            <article
              className="prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </>
        )}
      </div>
    </div>
  );
}
