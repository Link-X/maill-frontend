import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit2, Trash2, Power } from 'lucide-react';
import {
  Button,
  Input,
  extractErrorMessage,
  notify,
  type Artist,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import {
  useListArtistsQuery,
  useUpdateArtistStatusMutation,
  useDeleteArtistMutation,
} from './artistsApi';
import { ArtistFormDrawer } from './ArtistFormDrawer';

export default function ArtistsPage() {
  const { t } = useTranslation(['artist', 'common']);
  const [keyword, setKeyword] = useState('');
  const { data: artists = [], isLoading } = useListArtistsQuery({ keyword: keyword || undefined });
  const [updateStatus] = useUpdateArtistStatusMutation();
  const [deleteArtist, { isLoading: deleting }] = useDeleteArtistMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Artist | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (a: Artist) => {
    setEditing(a);
    setDrawerOpen(true);
  };

  const toggleStatus = async (a: Artist) => {
    const willEnable = a.status !== 1;
    try {
      await updateStatus({ id: a.id, status: willEnable ? 1 : 0 }).unwrap();
      notify.success(t(willEnable ? 'artist:toggle.onlineToast' : 'artist:toggle.offlineToast'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteArtist(pendingDelete.id).unwrap();
      notify.success(t('artist:delete.successToast'));
      setPendingDelete(null);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const columns: Column<Artist>[] = [
    {
      key: 'avatar',
      title: t('artist:table.avatar'),
      width: '64px',
      render: (a) =>
        a.avatarUrl ? (
          <img src={a.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-4 w-4" />
          </div>
        ),
    },
    {
      key: 'name',
      title: t('artist:table.name'),
      render: (a) => <span className="font-medium">{a.name}</span>,
    },
    { key: 'stageName', title: t('artist:table.stageName'), render: (a) => a.stageName || '-' },
    { key: 'nationality', title: t('artist:table.nationality'), render: (a) => a.nationality || '-' },
    { key: 'tags', title: t('artist:table.tags'), render: (a) => a.tags || '-' },
    {
      key: 'followCount',
      title: t('artist:table.followCount'),
      width: '80px',
      render: (a) => a.followCount ?? 0,
    },
    {
      key: 'showCount',
      title: t('artist:table.showCount'),
      width: '70px',
      render: (a) => a.showCount ?? 0,
    },
    {
      key: 'status',
      title: t('artist:table.status'),
      width: '90px',
      render: (a) => (
        <Badge variant={a.status === 1 ? 'success' : 'muted'}>
          {t(a.status === 1 ? 'artist:status.online' : 'artist:status.offline')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: t('artist:table.actions'),
      width: '260px',
      render: (a) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
          <Button
            size="sm"
            variant={a.status === 1 ? 'destructive' : 'default'}
            onClick={() => toggleStatus(a)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {t(a.status === 1 ? 'artist:action.disableShort' : 'artist:action.enableShort')}
          </Button>
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
        title={t('artist:page.title')}
        subtitle={t('artist:page.subtitle')}
        icon={Users}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('artist:page.addBtn')}
          </Button>
        }
      />
      <div className="max-w-xs">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('artist:form.namePlaceholder')}
        />
      </div>
      <DataTable<Artist>
        columns={columns}
        data={artists}
        rowKey={(a) => String(a.id)}
        loading={isLoading}
      />

      <ArtistFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('artist:delete.title')}
        description={pendingDelete ? t('artist:delete.desc', { name: pendingDelete.name }) : ''}
        destructive
        confirmText={deleting ? t('artist:delete.btnDeleting') : t('artist:delete.btn')}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
