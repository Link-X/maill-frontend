import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, X, Trash2, History, SearchX, Newspaper, Users, Ticket } from 'lucide-react';
import { Input, cn } from '@maill/shared';
import { EmptyState } from '@/components/EmptyState';
import {
  useSearchAllQuery,
  useSearchHistoryQuery,
  useClearHistoryMutation,
} from './searchApi';

type Tab = 'all' | 'show' | 'artist' | 'article';

interface HitItem {
  id?: number | string;
  name?: string;
  stage_name?: string;
  title?: string;
  venue?: string;
  bio?: string;
  summary?: string;
  poster_url?: string;
  avatar_url?: string;
  cover_url?: string;
  _highlight?: Record<string, string>;
}

const tabLabel: Record<Tab, string> = {
  all: '全部',
  show: '演出',
  artist: '艺人',
  article: '资讯',
};

// 高亮样式:把后端返回的 <em> 改造为"荧光笔"效果(不斜体 + brand 色 + 浅 brand 底)
// 通过 Tailwind 任意 selector `[&_em]:` 给后代 em 注入样式,无需全局 CSS
const HIGHLIGHT_CLASS =
  '[&_em]:not-italic [&_em]:font-semibold [&_em]:text-brand [&_em]:bg-brand/10 [&_em]:px-0.5 [&_em]:rounded';

function Hl({ text, html, className }: { text?: string; html?: string; className?: string }) {
  if (html) {
    return (
      <span
        className={cn(HIGHLIGHT_CLASS, className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className={className}>{text ?? ''}</span>;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [kw, setKw] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const { data: history = [], refetch: refetchHistory } = useSearchHistoryQuery();
  const [clearHistory] = useClearHistoryMutation();
  const { data: results, isFetching } = useSearchAllQuery({ kw }, { skip: !kw });

  useEffect(() => {
    const t = setTimeout(() => setKw(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (kw) refetchHistory();
  }, [kw, refetchHistory]);

  const showList = (results?.show?.list ?? []) as HitItem[];
  const artistList = (results?.artist?.list ?? []) as HitItem[];
  const articleList = (results?.article?.list ?? []) as HitItem[];
  const totalHits = showList.length + artistList.length + articleList.length;

  // Enter 立即触发搜索(跳过 300ms 防抖)
  const triggerNow = () => {
    const trimmed = input.trim();
    if (trimmed) setKw(trimmed);
  };

  // 用户停留在某个 tab 但该 tab 无结果时,自动切到有结果的 tab(避免看到一片空)
  useEffect(() => {
    if (!kw || tab === 'all') return;
    const map: Record<Exclude<Tab, 'all'>, number> = {
      show: showList.length,
      artist: artistList.length,
      article: articleList.length,
    };
    if (map[tab] === 0) setTab('all');
  }, [kw, tab, showList.length, artistList.length, articleList.length]);

  return (
    <div className="pb-6">
      {/* ===== 沉浸式 header:返回 + 搜索框 ===== */}
      <header className="relative isolate px-4 pt-3 pb-3 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-60" />
        <div
          aria-hidden
          className="absolute -top-14 -right-10 w-40 h-40 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="h-10 w-10 rounded-full
                       bg-white/65 dark:bg-white/10 backdrop-blur-xl
                       border border-white/40 dark:border-white/15
                       shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                       flex items-center justify-center shrink-0
                       active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand" />
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') triggerNow();
              }}
              placeholder="搜索演出 / 艺人 / 资讯"
              className="pl-10 pr-10 h-10 rounded-xl
                         bg-white/80 dark:bg-white/[0.08] backdrop-blur-md
                         border-white/40 dark:border-white/15
                         shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setKw('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full
                           bg-muted hover:bg-muted/80 flex items-center justify-center
                           transition-colors"
                aria-label="清空"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== 未搜索:历史记录 ===== */}
      {!kw && (
        <div className="px-4 pt-3">
          {history.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <span className="h-5 w-5 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                    <History className="h-3 w-3" />
                  </span>
                  最近搜索
                </h3>
                <button
                  type="button"
                  onClick={() => clearHistory()}
                  className="text-xs text-muted-foreground inline-flex items-center gap-1
                             hover:text-destructive transition-colors active:scale-95"
                >
                  <Trash2 className="h-3 w-3" />
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    type="button"
                    onClick={() => setInput(h)}
                    className="inline-flex items-center px-3 h-7 rounded-full
                               bg-card border border-border/60 text-xs
                               hover:border-brand/40 hover:text-brand
                               active:scale-95 transition-all"
                  >
                    {h}
                  </motion.button>
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={Search}
              title="开始搜索"
              description="输入关键词,搜索演出、艺人或资讯"
            />
          )}
        </div>
      )}

      {/* ===== 已搜索:tabs + 结果 ===== */}
      {kw && (
        <div className="px-4 pt-2 space-y-4">
          {/* tabs:layoutId 渐变胶囊 */}
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
            {(['all', 'show', 'artist', 'article'] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'relative shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition-colors',
                    active ? 'text-brand-foreground' : 'text-foreground/70 hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="search-tab-pill"
                      className="absolute inset-0 rounded-full bg-gradient-brand shadow-sm shadow-brand/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{tabLabel[t]}</span>
                </button>
              );
            })}
          </div>

          {/* 搜索中提示 */}
          {isFetching && (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              搜索中…
            </div>
          )}

          {/* 演出 */}
          {(tab === 'all' || tab === 'show') && showList.length > 0 && (
            <Section title="演出" icon={Ticket} tone="brand" count={showList.length}>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {showList.map((s, i) => (
                  <ResultRow
                    key={i}
                    onClick={() => navigate(`/show/${s.id}`)}
                    cover={s.poster_url}
                    coverShape="poster"
                    title={<Hl text={s.name} html={s._highlight?.name} />}
                    subtitle={s.venue}
                    fallbackIcon={Ticket}
                  />
                ))}
              </motion.div>
            </Section>
          )}

          {/* 艺人 */}
          {(tab === 'all' || tab === 'artist') && artistList.length > 0 && (
            <Section title="艺人" icon={Users} tone="violet" count={artistList.length}>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {artistList.map((a, i) => (
                  <ResultRow
                    key={i}
                    onClick={() => navigate(`/artist/${a.id}`)}
                    cover={a.avatar_url}
                    coverShape="circle"
                    title={
                      <Hl
                        text={a.stage_name || a.name}
                        html={a._highlight?.stage_name || a._highlight?.name}
                      />
                    }
                    subtitle={a.bio ? <Hl text={a.bio} html={a._highlight?.bio} /> : undefined}
                    fallbackIcon={Users}
                  />
                ))}
              </motion.div>
            </Section>
          )}

          {/* 资讯 */}
          {(tab === 'all' || tab === 'article') && articleList.length > 0 && (
            <Section title="资讯" icon={Newspaper} tone="emerald" count={articleList.length}>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {articleList.map((art, i) => (
                  <ResultRow
                    key={i}
                    onClick={() => navigate(`/article/${art.id}`)}
                    cover={art.cover_url}
                    coverShape="rounded"
                    title={<Hl text={art.title} html={art._highlight?.title} />}
                    subtitle={
                      art.summary ? <Hl text={art.summary} html={art._highlight?.summary} /> : undefined
                    }
                    fallbackIcon={Newspaper}
                  />
                ))}
              </motion.div>
            </Section>
          )}

          {/* 无结果 */}
          {!isFetching && totalHits === 0 && (
            <EmptyState
              icon={SearchX}
              title="没有找到相关结果"
              description={`没有匹配 "${kw}" 的内容,换个关键词试试?`}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ===== 子组件 =====

type Tone = 'brand' | 'violet' | 'emerald';
const toneClass: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
};

function Section({
  title,
  icon: Icon,
  tone,
  count,
  children,
}: {
  title: string;
  icon: typeof Ticket;
  tone: Tone;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold mb-2.5">
        <span className={cn('h-5 w-5 rounded-md flex items-center justify-center', toneClass[tone])}>
          <Icon className="h-3 w-3" />
        </span>
        {title}
        <span className="text-xs font-normal text-muted-foreground">({count})</span>
      </h3>
      {children}
    </section>
  );
}

function ResultRow({
  onClick,
  cover,
  coverShape,
  title,
  subtitle,
  fallbackIcon: FallbackIcon,
}: {
  onClick: () => void;
  cover?: string;
  coverShape: 'poster' | 'circle' | 'rounded';
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  fallbackIcon: typeof Ticket;
}) {
  const coverCls =
    coverShape === 'circle'
      ? 'w-12 h-12 rounded-full'
      : coverShape === 'poster'
        ? 'w-14 h-[72px] rounded-lg'
        : 'w-16 h-16 rounded-xl';
  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="group w-full text-left rounded-2xl bg-card border border-border/60
                 p-2.5 flex gap-3 items-center
                 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]
                 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.16)]
                 hover:border-brand/30
                 transition-all duration-300"
    >
      {cover ? (
        <img src={cover} alt="" className={cn('object-cover shrink-0', coverCls)} />
      ) : (
        <div
          className={cn(
            'bg-gradient-brand-soft flex items-center justify-center shrink-0',
            coverCls,
          )}
        >
          <FallbackIcon className="h-5 w-5 text-brand/60" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-1">{title}</div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.button>
  );
}
