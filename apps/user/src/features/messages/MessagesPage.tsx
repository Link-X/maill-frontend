import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCheck,
  Trash2,
  BellOff,
  Receipt,
  BellRing,
  Info,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { extractErrorMessage, notify, cn, type UserMessage } from '@maill/shared';
import { formatDateTime } from '@/lib/format';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  useListMessagesQuery,
  useUnreadCountsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteMessagesMutation,
} from './messagesApi';

type TabType = 'all' | 1 | 2 | 3 | 4 | 5;

const TYPE_TABS: { value: TabType; key: string }[] = [
  { value: 'all', key: 'message:type.all' },
  { value: 1, key: 'message:type.order' },
  { value: 2, key: 'message:type.openSale' },
  { value: 3, key: 'message:type.system' },
  { value: 4, key: 'message:type.interaction' },
  { value: 5, key: 'message:type.followFeed' },
];

const UNREAD_KEYS: Record<TabType, string | null> = {
  all: 'total',
  1: 'order',
  2: 'openSale',
  3: 'system',
  4: 'interaction',
  5: 'followFeed',
};

type Tone = 'amber' | 'rose' | 'sky' | 'violet' | 'emerald' | 'brand';

// 消息类型 → 图标 + tone
const TYPE_META: Record<number, { icon: LucideIcon; tone: Tone }> = {
  1: { icon: Receipt, tone: 'amber' }, // 订单
  2: { icon: BellRing, tone: 'rose' }, // 开售提醒
  3: { icon: Info, tone: 'sky' }, // 系统通知
  4: { icon: MessageCircle, tone: 'violet' }, // 互动
  5: { icon: Sparkles, tone: 'emerald' }, // 关注动态
};

const toneClass: Record<Tone, string> = {
  amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
  brand: 'bg-brand/10 text-brand',
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function MessagesPage() {
  const { t } = useTranslation(['message', 'common']);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('all');

  const queryArg = tab === 'all' ? { page: 1, size: 50 } : { type: tab as number, page: 1, size: 50 };
  const { data, isLoading } = useListMessagesQuery(queryArg);
  const list = (data?.list ?? []) as UserMessage[];
  const { data: counts } = useUnreadCountsQuery();
  const unreadTotal = counts?.total ?? 0;
  const [markRead] = useMarkReadMutation();
  const [markAllRead, { isLoading: marking }] = useMarkAllReadMutation();
  const [deleteMessages] = useDeleteMessagesMutation();

  const handleClickItem = async (um: UserMessage) => {
    if (um.isRead === 0) {
      try {
        await markRead([um.id]).unwrap();
      } catch {
        // 忽略已读失败,不打扰用户
      }
    }
    const m = um.message;
    if (!m || !m.linkType || !m.linkTarget) return;
    switch (m.linkType) {
      case 1:
        navigate(`/show/${m.linkTarget}`);
        break;
      case 2:
        navigate(`/artist/${m.linkTarget}`);
        break;
      case 3:
        navigate(`/article/${m.linkTarget}`);
        break;
      case 4:
        navigate(`/orders`);
        break;
      case 5:
        window.open(m.linkTarget, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllRead(tab === 'all' ? undefined : (tab as number)).unwrap();
      notify.success('已全部已读');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteMessages([id]).unwrap();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="pb-6">
      {/* ===== 顶部 hero:渐变背景 + 玻璃返回 + 未读统计 + 内嵌 tabs ===== */}
      <header className="relative isolate px-4 pt-3 pb-3 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-80" />
        {/* 底部羽化：让 header 渐变向下溶解到普通背景，消除硬边界 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-10 bg-gradient-to-b from-transparent to-background"
        />
        <div aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand/20 blur-3xl" />

        <div className="flex items-center justify-between gap-2">
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
          <button
            type="button"
            onClick={handleReadAll}
            disabled={marking || unreadTotal === 0}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full
                       bg-white/70 dark:bg-white/10 backdrop-blur-md
                       border border-white/50 dark:border-white/15
                       text-xs font-medium text-brand
                       disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-95 transition-transform"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('message:user.readAll')}
          </button>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight">{t('message:page.title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {unreadTotal > 0 ? (
              <>
                你有{' '}
                <span className="font-semibold text-brand">{unreadTotal > 99 ? '99+' : unreadTotal}</span>{' '}
                条未读消息
              </>
            ) : (
              '所有消息都已查看 ✓'
            )}
          </p>
        </div>

        {/* ===== 类型 tab:嵌入 header,与渐变背景融为一体 ===== */}
        <div className="relative mt-4 -mx-4 px-4">
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {TYPE_TABS.map((it) => {
              const unreadKey = UNREAD_KEYS[it.value];
              const unread =
                unreadKey && counts
                  ? ((counts as unknown as Record<string, number>)[unreadKey] ?? 0)
                  : 0;
              const active = tab === it.value;
              return (
                <button
                  key={String(it.value)}
                  type="button"
                  onClick={() => setTab(it.value)}
                  className={cn(
                    'relative shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition-colors',
                    active ? 'text-brand-foreground' : 'text-foreground/65 hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="message-tab-pill"
                      className="absolute inset-0 rounded-full bg-gradient-brand shadow-sm shadow-brand/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative inline-flex items-center gap-1.5">
                    {t(it.key)}
                    {unread > 0 && (
                      <span
                        className={cn(
                          'min-w-[16px] h-[16px] rounded-full text-[10px] font-semibold px-1 flex items-center justify-center',
                          active ? 'bg-white/30 text-white' : 'bg-destructive text-white',
                        )}
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ===== 列表 ===== */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={t('message:user.empty')}
            description="没有可显示的消息,新动态会在这里推送给你"
          />
        ) : (
          <motion.div
            key={String(tab)}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {list.map((um) => (
              <MessageCard
                key={um.id}
                um={um}
                onClick={() => handleClickItem(um)}
                onDelete={(e) => handleDelete(e, um.id)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MessageCard({
  um,
  onClick,
  onDelete,
}: {
  um: UserMessage;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const m = um.message;
  const unread = um.isRead === 0;
  const meta = m?.type ? TYPE_META[m.type] : undefined;
  const Icon = meta?.icon ?? Info;
  const tone = meta?.tone ?? 'brand';

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'group w-full text-left rounded-2xl border transition-all relative overflow-hidden',
        unread
          ? 'bg-gradient-to-r from-brand/[0.06] to-transparent border-brand/30 shadow-sm shadow-brand/5'
          : 'bg-card border-border/60 hover:border-border',
      )}
    >
      {/* 未读左侧高亮条 */}
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-brand to-brand-2"
        />
      )}

      <div className="flex items-start gap-3 p-3 pl-4">
        {/* 类型彩色图标 */}
        <span
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
            toneClass[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className={cn('text-sm truncate', unread ? 'font-semibold' : 'font-medium')}>
              {m?.title || '(无标题)'}
            </h3>
            {unread && (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
            )}
          </div>
          {m?.content && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed whitespace-pre-wrap">
              {m.content}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/80 pt-0.5">
            {um.createTime ? formatDateTime(um.createTime) : ''}
          </p>
        </div>

        {/* 删除按钮:常态半透明,hover 显形 */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="删除"
          className="h-7 w-7 rounded-full
                     text-muted-foreground/40 hover:text-destructive
                     hover:bg-destructive/10
                     opacity-60 group-hover:opacity-100
                     flex items-center justify-center shrink-0
                     transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.button>
  );
}
