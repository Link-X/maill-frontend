import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newspaper, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { useListArticlesQuery, useListArticleCategoriesQuery } from './articlesApi';

export default function ArticlesListPage() {
  const { t } = useTranslation(['article', 'common']);
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const { data: cats = [] } = useListArticleCategoriesQuery();
  const { data, isLoading } = useListArticlesQuery({ categoryId, page: 1, size: 50 });
  const list = data?.list ?? [];

  return (
    <div className="px-4 py-3 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('article:user.listTitle')}</h1>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        <CategoryChip active={categoryId === undefined} onClick={() => setCategoryId(undefined)}>
          {t('article:user.allCategories')}
        </CategoryChip>
        {cats.map((c) => (
          <CategoryChip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
            {c.name}
          </CategoryChip>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(`/article/${a.id}`)}
            className="w-full text-left rounded-2xl border bg-card p-3 flex gap-3 hover:shadow-md transition-shadow"
          >
            {a.coverUrl ? (
              <img src={a.coverUrl} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded bg-muted shrink-0 flex items-center justify-center">
                <Newspaper className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{a.title}</h3>
              {a.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.summary}</p>
              )}
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                {a.category?.name && <span>{a.category.name}</span>}
                {a.publishedAt && <span>· {formatDateTime(a.publishedAt)}</span>}
                <span>· {a.viewCount ?? 0} 浏览</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />
          </button>
        ))}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">{t('article:user.noArticles')}</p>
      )}
    </div>
  );
}

function CategoryChip({
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
      className={
        'shrink-0 rounded-full px-3 py-1 text-xs transition-colors ' +
        (active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80')
      }
    >
      {children}
    </button>
  );
}
