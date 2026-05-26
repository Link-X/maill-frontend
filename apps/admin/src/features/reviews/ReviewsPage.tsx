import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, EyeOff, RotateCcw, Trash2, Flag, Star } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  extractErrorMessage,
  notify,
  type ShowReview,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useAdminListReviewsQuery,
  useHideReviewMutation,
  useRestoreReviewMutation,
  useAdminDeleteReviewMutation,
} from './reviewsApi';

export default function ReviewsPage() {
  const { t } = useTranslation(['review', 'common']);
  const navigate = useNavigate();
  // 筛选条件
  const [status, setStatus] = useState<string>('__all__');
  const [keyword, setKeyword] = useState('');
  const [showIdStr, setShowIdStr] = useState('');
  const [page, setPage] = useState(1);

  const arg = {
    status: status === '__all__' ? undefined : (Number(status) as 0 | 1 | 2),
    keyword: keyword || undefined,
    showId: showIdStr ? Number(showIdStr) : undefined,
    page,
    size: 20,
  };
  const { data, isLoading } = useAdminListReviewsQuery(arg);
  const list = (data?.list ?? []) as ShowReview[];

  const [hide] = useHideReviewMutation();
  const [restore] = useRestoreReviewMutation();
  const [del, { isLoading: deleting }] = useAdminDeleteReviewMutation();
  const [pendingDelete, setPendingDelete] = useState<ShowReview | null>(null);

  // 统一处理 mutation 调用 + 提示
  const handle = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      notify.success(label);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const statusBadge = (s?: number) => {
    if (s === 0) return <Badge variant="success">{t('review:status.normal')}</Badge>;
    if (s === 1) return <Badge variant="warning">{t('review:status.reported')}</Badge>;
    if (s === 2) return <Badge variant="muted">{t('review:status.hidden')}</Badge>;
    return null;
  };

  const columns: Column<ShowReview>[] = [
    { key: 'id', title: 'ID', width: '70px', render: (r) => r.id },
    { key: 'showId', title: 'Show', width: '80px', render: (r) => r.showId },
    { key: 'username', title: '用户', render: (r) => r.username || r.userId },
    {
      key: 'rating',
      title: '评分',
      width: '80px',
      render: (r) =>
        r.rating ? (
          <span className="inline-flex items-center gap-1 text-yellow-500">
            <Star className="h-3 w-3 fill-current" />
            {r.rating}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'content',
      title: '内容',
      render: (r) => <span className="line-clamp-2 text-sm">{r.content}</span>,
    },
    {
      key: 'parent',
      title: '类型',
      width: '80px',
      render: (r) =>
        r.parentId ? <Badge variant="muted">回复</Badge> : <Badge variant="brand">一级</Badge>,
    },
    {
      key: 'status',
      title: t('review:list.report') || '状态',
      width: '90px',
      render: (r) => statusBadge(r.status),
    },
    {
      key: 'createTime',
      title: '时间',
      render: (r) => (r.createTime ? formatDateTime(r.createTime) : '-'),
    },
    {
      key: 'actions',
      title: t('common:actions.label', '操作'),
      width: '280px',
      render: (r) => (
        <div className="flex gap-2 flex-wrap">
          {r.status !== 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handle(() => hide(r.id).unwrap(), '已隐藏')}
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" />
              {t('review:action.hide')}
            </Button>
          )}
          {r.status === 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handle(() => restore(r.id).unwrap(), '已恢复')}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {t('review:action.restore')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setPendingDelete(r)}>
            <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
            {t('review:action.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('review:page.moderationTitle')}
        icon={MessageSquare}
        actions={
          <Button variant="outline" onClick={() => navigate('/reviews/reports')}>
            <Flag className="h-4 w-4 mr-1.5" />
            {t('review:page.reportsTitle')}
          </Button>
        }
      />

      <div className="flex gap-3 items-center flex-wrap">
        <div className="w-40">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部状态</SelectItem>
              <SelectItem value="0">{t('review:status.normal')}</SelectItem>
              <SelectItem value="1">{t('review:status.reported')}</SelectItem>
              <SelectItem value="2">{t('review:status.hidden')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Input
            value={showIdStr}
            onChange={(e) => setShowIdStr(e.target.value)}
            placeholder="Show ID"
            type="number"
          />
        </div>
        <div className="flex-1 max-w-sm">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="关键词"
          />
        </div>
      </div>

      <DataTable<ShowReview>
        columns={columns}
        data={list}
        rowKey={(r) => String(r.id)}
        loading={isLoading}
      />
      <p className="text-xs text-muted-foreground">{`第 ${page} 页,共 ${data?.total ?? 0} 条`}</p>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('review:action.deleteReview')}
        description="确定要硬删除该评价?此操作不可撤销。"
        destructive
        confirmText={deleting ? '删除中…' : t('review:action.delete')}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await handle(() => del(pendingDelete.id).unwrap(), '已删除');
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
