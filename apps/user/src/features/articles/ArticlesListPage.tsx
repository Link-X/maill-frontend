import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Newspaper, Eye, Clock, UserCircle2 } from 'lucide-react';
import { cn, type Article } from '@maill/shared';
import { formatDateTime } from '@/lib/format';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useListArticlesQuery, useListArticleCategoriesQuery } from './articlesApi';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function ArticlesListPage() {
  const { t } = useTranslation(['article', 'common']);
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const { data: cats = [] } = useListArticleCategoriesQuery();
  const { data, isLoading } = useListArticlesQuery({ categoryId, page: 1, size: 50 });
  const list = (data?.list ?? []) as Article[];
  const [featured, ...rest] = list;

  return (
    <div className="pb-6">
      {/* ===== Hero 头部 ===== */}
      <header className="relative isolate px-5 pt-6 pb-5 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-80" />
        <div
          aria-hidden
          className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-brand/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 left-1/3 w-40 h-40 rounded-full bg-brand-2/15 blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
              {t('article:user.listTitle')}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">演出资讯 · 艺人动态 · 行业前沿</p>
          </div>
          <span
            className="h-11 w-11 rounded-2xl bg-gradient-brand text-brand-foreground
                       flex items-center justify-center
                       shadow-lg shadow-brand/25"
          >
            <Newspaper className="h-5 w-5" />
          </span>
        </motion.div>
      </header>

      {/* ===== 分类 tab:layoutId 胶囊 ===== */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
          <CategoryChip
            active={categoryId === undefined}
            onClick={() => setCategoryId(undefined)}
          >
            {t('article:user.allCategories')}
          </CategoryChip>
          {cats.map((c) => (
            <CategoryChip
              key={c.id}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </CategoryChip>
          ))}
        </div>
      </div>

      {/* ===== 列表 ===== */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t('article:user.noArticles')}
            description="该分类下暂时没有内容,看看其他分类吧"
          />
        ) : (
          <motion.div
            key={String(categoryId ?? 'all')}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {/* 第一篇:特色大卡片 */}
            {featured && (
              <FeaturedCard article={featured} onClick={() => navigate(`/article/${featured.id}`)} />
            )}
            {/* 其余:横向紧凑卡片 */}
            {rest.map((a) => (
              <RowCard key={a.id} article={a} onClick={() => navigate(`/article/${a.id}`)} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ===== 内部子组件 =====

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
      className={cn(
        'relative shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition-colors',
        active ? 'text-brand-foreground' : 'text-foreground/70 hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="article-category-pill"
          className="absolute inset-0 rounded-full bg-gradient-brand shadow-sm shadow-brand/30"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function FeaturedCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -2 }}
      className="group relative w-full text-left rounded-2xl overflow-hidden
                 bg-card border border-border/60
                 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)]
                 hover:shadow-[0_16px_32px_-10px_rgba(15,23,42,0.18)]
                 transition-shadow duration-300"
    >
      {/* 16:9 封面 */}
      <div className="relative aspect-[16/9] bg-gradient-brand-soft overflow-hidden">
        {article.coverUrl ? (
          <img
            src={article.coverUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out
                       group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand/50">
            <Newspaper className="h-12 w-12" />
          </div>
        )}

        {/* 底部黑色渐变,让文字可读 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none"
        />

        {/* 左上分类徽章 */}
        {article.category?.name && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md
                          bg-white/85 dark:bg-black/55 backdrop-blur-md
                          text-foreground text-[11px] font-medium shadow-sm">
            {article.category.name}
          </div>
        )}

        {/* 标题与摘要压在底部 */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h2 className="text-lg font-semibold leading-snug line-clamp-2 drop-shadow-sm">
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-xs text-white/85 line-clamp-2 mt-1 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>
      </div>

      {/* 元信息 footer */}
      <div className="flex items-center justify-between px-3 py-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3 min-w-0">
          {article.artist ? (
            <span className="inline-flex items-center gap-1.5 truncate">
              {article.artist.avatarUrl ? (
                <img
                  src={article.artist.avatarUrl}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-4 w-4" />
              )}
              <span className="truncate">{article.artist.stageName || article.artist.name}</span>
            </span>
          ) : article.author ? (
            <span className="inline-flex items-center gap-1">
              <UserCircle2 className="h-3.5 w-3.5" />
              {article.author}
            </span>
          ) : null}
          {article.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(article.publishedAt)}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 shrink-0">
          <Eye className="h-3 w-3" />
          {article.viewCount ?? 0}
        </span>
      </div>
    </motion.button>
  );
}

function RowCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1 }}
      className="group w-full text-left rounded-2xl overflow-hidden
                 bg-card border border-border/60
                 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]
                 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.16)]
                 transition-shadow duration-300"
    >
      <div className="flex gap-3 p-2.5">
        {/* 左侧封面 */}
        <div className="relative h-24 w-24 rounded-xl overflow-hidden shrink-0 bg-gradient-brand-soft">
          {article.coverUrl ? (
            <img
              src={article.coverUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out
                         group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand/50">
              <Newspaper className="h-7 w-7" />
            </div>
          )}
          {article.category?.name && (
            <span className="absolute top-1 left-1 px-1.5 py-px rounded
                             bg-white/85 dark:bg-black/55 backdrop-blur-md
                             text-foreground text-[10px] font-medium">
              {article.category.name}
            </span>
          )}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand transition-colors">
              {article.title}
            </h3>
            {article.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 mt-1">
            <div className="flex items-center gap-2 min-w-0">
              {article.artist?.stageName || article.artist?.name || article.author ? (
                <span className="inline-flex items-center gap-1 truncate">
                  <UserCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {article.artist?.stageName || article.artist?.name || article.author}
                  </span>
                </span>
              ) : null}
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(article.publishedAt)}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Eye className="h-3 w-3" />
              {article.viewCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
