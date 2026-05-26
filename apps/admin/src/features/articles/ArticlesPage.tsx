import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper, Plus, Edit2, Trash2, Upload, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  type Article,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useListArticlesQuery,
  usePublishArticleMutation,
  useOfflineArticleMutation,
  useDeleteArticleMutation,
} from './articlesApi';

export default function ArticlesPage() {
  const { t } = useTranslation(['article', 'common']);
  const navigate = useNavigate();
  // 列表筛选状态：状态 / 关键字 / 当前页
  const [status, setStatus] = useState<string>('__all__');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListArticlesQuery({
    status: status === '__all__' ? undefined : (Number(status) as 0 | 1 | 2),
    keyword: keyword || undefined,
    page,
    size: 20,
  });
  const list = (data?.list ?? []) as Article[];

  const [publishArticle] = usePublishArticleMutation();
  const [offlineArticle] = useOfflineArticleMutation();
  const [deleteArticle, { isLoading: deleting }] = useDeleteArticleMutation();
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);

  const handlePublish = async (a: Article) => {
    try {
      await publishArticle(a.id).unwrap();
      notify.success(t('article:form.publishedToast'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };
  const handleOffline = async (a: Article) => {
    try {
      await offlineArticle(a.id).unwrap();
      notify.success(t('article:form.offlinedToast'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };
  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteArticle(pendingDelete.id).unwrap();
      notify.success(t('article:delete.successToast'));
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  // 状态徽标：0=草稿 1=已发布 2=已下架
  const statusBadge = (s?: number) => {
    if (s === 0) return <Badge variant="muted">{t('article:status.draft')}</Badge>;
    if (s === 1) return <Badge variant="success">{t('article:status.published')}</Badge>;
    if (s === 2) return <Badge variant="muted">{t('article:status.offline')}</Badge>;
    return null;
  };

  const columns: Column<Article>[] = [
    {
      key: 'cover',
      title: t('article:table.cover'),
      width: '80px',
      render: (a) =>
        a.coverUrl ? (
          <img src={a.coverUrl} alt="" className="h-10 w-16 rounded object-cover" />
        ) : (
          <div className="h-10 w-16 rounded bg-muted" />
        ),
    },
    {
      key: 'title',
      title: t('article:table.title'),
      render: (a) => <span className="font-medium">{a.title}</span>,
    },
    {
      key: 'category',
      title: t('article:table.category'),
      render: (a) => a.category?.name || '-',
    },
    {
      key: 'viewCount',
      title: t('article:table.viewCount'),
      width: '80px',
      render: (a) => a.viewCount ?? 0,
    },
    {
      key: 'status',
      title: t('article:table.status'),
      width: '90px',
      render: (a) => statusBadge(a.status),
    },
    {
      key: 'publishedAt',
      title: t('article:table.publishedAt'),
      render: (a) => (a.publishedAt ? formatDateTime(a.publishedAt) : '-'),
    },
    {
      key: 'actions',
      title: t('article:table.actions'),
      width: '280px',
      render: (a) => (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => navigate(`/articles/edit/${a.id}`)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
          {a.status !== 1 && (
            <Button size="sm" variant="default" onClick={() => handlePublish(a)}>
              <Upload className="h-3.5 w-3.5 mr-1" />
              {t('article:action.publish')}
            </Button>
          )}
          {a.status === 1 && (
            <Button size="sm" variant="outline" onClick={() => handleOffline(a)}>
              <Archive className="h-3.5 w-3.5 mr-1" />
              {t('article:action.offline')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setPendingDelete(a)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('article:page.title')}
        subtitle={t('article:page.subtitle')}
        icon={Newspaper}
        actions={
          <Button onClick={() => navigate('/articles/edit')} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('article:page.addBtn')}
          </Button>
        }
      />

      <div className="flex gap-3 items-center">
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
              <SelectItem value="0">{t('article:status.draft')}</SelectItem>
              <SelectItem value="1">{t('article:status.published')}</SelectItem>
              <SelectItem value="2">{t('article:status.offline')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 max-w-sm">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="标题前缀搜索"
          />
        </div>
      </div>

      <DataTable<Article>
        columns={columns}
        data={list}
        rowKey={(a) => String(a.id)}
        loading={isLoading}
      />

      {/* 暂不实现分页器,简单显示当前页与总数 */}
      <p className="text-xs text-muted-foreground">{`第 ${page} 页,共 ${data?.total ?? 0} 条`}</p>

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('article:delete.title')}
        description={pendingDelete ? t('article:delete.desc', { title: pendingDelete.title }) : ''}
        destructive
        confirmText={deleting ? t('article:delete.btnDeleting') : t('article:delete.btn')}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
