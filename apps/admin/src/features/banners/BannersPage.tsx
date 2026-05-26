import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Plus, Edit2, Trash2, Power, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type Banner,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useListBannersQuery,
  useUpdateBannerStatusMutation,
  useDeleteBannerMutation,
  useSortBannersMutation,
} from './bannersApi';
import { BannerFormDrawer } from './BannerFormDrawer';

export default function BannersPage() {
  const { t } = useTranslation(['banner', 'common']);
  const { data: banners = [], isLoading } = useListBannersQuery();
  const [updateStatus] = useUpdateBannerStatusMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();
  const [sortBanners] = useSortBannersMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setDrawerOpen(true);
  };

  const toggleStatus = async (b: Banner) => {
    const willEnable = b.status !== 1;
    try {
      await updateStatus({ id: b.id, status: willEnable ? 1 : 0 }).unwrap();
      notify.success(t(willEnable ? 'banner:toggle.onlineToast' : 'banner:toggle.offlineToast'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const move = async (b: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex((x) => x.id === b.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= banners.length) return;
    const next = [...banners];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    try {
      await sortBanners({ orderedIds: next.map((x) => x.id) }).unwrap();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteBanner(pendingDelete.id).unwrap();
      notify.success(t('banner:delete.successToast'));
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const linkTypeLabel = (lt?: number) => {
    const map = [
      'banner:linkType.none',
      'banner:linkType.show',
      'banner:linkType.artist',
      'banner:linkType.article',
      'banner:linkType.url',
    ];
    return t(map[lt ?? 0] ?? 'banner:linkType.none');
  };

  const columns: Column<Banner>[] = [
    {
      key: 'image',
      title: t('banner:table.image'),
      width: '120px',
      render: (b) =>
        b.imageUrl ? (
          <img src={b.imageUrl} alt="" className="h-10 w-20 rounded object-cover" />
        ) : (
          <div className="h-10 w-20 rounded bg-muted flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        ),
    },
    { key: 'title', title: t('banner:table.title'), render: (b) => b.title || '-' },
    {
      key: 'linkType',
      title: t('banner:table.linkType'),
      width: '80px',
      render: (b) => linkTypeLabel(b.linkType),
    },
    { key: 'linkTarget', title: t('banner:table.linkTarget'), render: (b) => b.linkTarget || '-' },
    { key: 'sort', title: t('banner:table.sort'), width: '70px', render: (b) => b.sort ?? 0 },
    {
      key: 'window',
      title: t('banner:table.window'),
      render: (b) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>{b.startAt ? formatDateTime(b.startAt) : '-'}</div>
          <div>{b.endAt ? formatDateTime(b.endAt) : '-'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('banner:table.status'),
      width: '90px',
      render: (b) => (
        <Badge variant={b.status === 1 ? 'success' : 'muted'}>
          {t(b.status === 1 ? 'banner:status.online' : 'banner:status.offline')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: t('banner:table.actions'),
      width: '320px',
      render: (b) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            title={t('banner:action.moveUp')}
            onClick={() => move(b, 'up')}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            title={t('banner:action.moveDown')}
            onClick={() => move(b, 'down')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
          <Button
            size="sm"
            variant={b.status === 1 ? 'destructive' : 'default'}
            onClick={() => toggleStatus(b)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {t(b.status === 1 ? 'banner:action.disableShort' : 'banner:action.enableShort')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPendingDelete(b)}>
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
        title={t('banner:page.title')}
        subtitle={t('banner:page.subtitle')}
        icon={ImageIcon}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('banner:page.addBtn')}
          </Button>
        }
      />
      <DataTable<Banner>
        columns={columns}
        data={banners}
        rowKey={(b) => String(b.id)}
        loading={isLoading}
      />

      <BannerFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('banner:delete.title')}
        description={t('banner:delete.desc')}
        destructive
        confirmText={deleting ? t('banner:delete.btnDeleting') : t('banner:delete.btn')}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
