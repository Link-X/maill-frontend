import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { extractErrorMessage, notify, type UserMessage } from '@maill/shared';
import { formatDateTime } from '@/lib/format';
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

export default function MessagesPage() {
  const { t } = useTranslation(['message', 'common']);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('all');

  const queryArg = tab === 'all' ? { page: 1, size: 50 } : { type: tab as number, page: 1, size: 50 };
  const { data, isLoading } = useListMessagesQuery(queryArg);
  const list = (data?.list ?? []) as UserMessage[];
  const { data: counts } = useUnreadCountsQuery();
  const [markRead] = useMarkReadMutation();
  const [markAllRead, { isLoading: marking }] = useMarkAllReadMutation();
  const [deleteMessages] = useDeleteMessagesMutation();

  const handleClickItem = async (um: UserMessage) => {
    if (um.isRead === 0) {
      try {
        await markRead([um.id]).unwrap();
      } catch {
        // 忽略已读失败
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
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common:actions.back')}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{t('message:page.title')}</h1>
        </div>
        <button
          type="button"
          onClick={handleReadAll}
          disabled={marking}
          className="text-xs text-primary inline-flex items-center gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          {t('message:user.readAll')}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        {TYPE_TABS.map((it) => {
          const unreadKey = UNREAD_KEYS[it.value];
          const unread = unreadKey && counts ? (counts as unknown as Record<string, number>)[unreadKey] ?? 0 : 0;
          const active = tab === it.value;
          return (
            <button
              key={String(it.value)}
              type="button"
              onClick={() => setTab(it.value)}
              className={
                'relative shrink-0 rounded-full px-3 py-1 text-xs transition-colors ' +
                (active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')
              }
            >
              {t(it.key)}
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-destructive text-white text-[10px] px-1 flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {list.map((um) => {
          const m = um.message;
          return (
            <button
              key={um.id}
              type="button"
              onClick={() => handleClickItem(um)}
              className={
                'w-full text-left rounded-2xl border bg-card p-3 hover:shadow-md transition-shadow relative ' +
                (um.isRead === 0 ? 'border-primary/40' : '')
              }
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {um.isRead === 0 && <span className="h-2 w-2 rounded-full bg-destructive" />}
                    <h3 className="font-medium truncate">{m?.title || '(no title)'}</h3>
                  </div>
                  {m?.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">{m.content}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {um.createTime ? formatDateTime(um.createTime) : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, um.id)}
                  className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center"
                  aria-label="delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">{t('message:user.empty')}</p>
      )}
    </div>
  );
}
