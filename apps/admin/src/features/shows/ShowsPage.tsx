import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Plus, Edit2, CalendarRange, Power } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ShowStatus,
  extractErrorMessage,
  notify,
  type Show,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import {
  useListShowsQuery,
  useUpdateShowMutation,
} from './showsApi';
import { ShowFormDrawer } from './ShowFormDrawer';
import { nextToggleStatus, toggleActionKey } from './statusUtils';
import { formatDateTime, showStatusKey } from '@/lib/format';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [ShowStatus.OnSale]: 'success',
  [ShowStatus.Draft]: 'warning',
  [ShowStatus.OffShelf]: 'muted',
};

export default function ShowsPage() {
  const { t } = useTranslation(['show', 'common']);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const { data: shows = [], isLoading } = useListShowsQuery(
    statusFilter !== undefined ? { status: statusFilter } : undefined,
  );
  const [updateShow] = useUpdateShowMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Show | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Show | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (show: Show) => {
    setEditing(show);
    setDrawerOpen(true);
  };

  const toggleStatus = async (show: Show) => {
    try {
      await updateShow({ ...show, status: nextToggleStatus(show.status) }).unwrap();
      notify.success(t(`show:toggleSuccess.${toggleActionKey(show.status)}`, { name: show.name }));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
    setPendingToggle(null);
  };

  const columns: Column<Show>[] = [
    {
      key: 'posterUrl',
      title: t('show:table.poster'),
      width: '72px',
      render: (s) =>
        s.posterUrl ? (
          <img src={s.posterUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    { key: 'name', title: t('show:table.name'), render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'category', title: t('show:table.category'), render: (s) => s.categoryName ?? '-' },
    {
      key: 'venue',
      title: t('show:table.cityVenue'),
      render: (s) => {
        const parts = [s.cityName, s.venue].filter(Boolean);
        return parts.length ? parts.join(' · ') : '-';
      },
    },
    {
      key: 'status',
      title: t('show:table.status'),
      width: '88px',
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>
          {t(`show:status.${showStatusKey(s.status)}`)}
        </Badge>
      ),
    },
    { key: 'createTime', title: t('show:table.createTime'), render: (s) => formatDateTime(s.createTime) },
    {
      key: 'actions',
      title: t('show:table.actions'),
      width: '260px',
      render: (s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/shows/${s.id}/sessions`)}
          >
            <CalendarRange className="h-3.5 w-3.5 mr-1" />
            {t('show:action.sessions')}
          </Button>
          <Button
            size="sm"
            variant={s.status === ShowStatus.OnSale ? 'destructive' : 'default'}
            onClick={() => setPendingToggle(s)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {t(`show:action.${toggleActionKey(s.status)}`)}
          </Button>
        </div>
      ),
    },
  ];

  const pendingActionKey = pendingToggle ? toggleActionKey(pendingToggle.status) : 'publish';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('show:page.title')}
        subtitle={t('show:page.subtitle')}
        icon={Sparkles}
        actions={
          <>
            <Select
              value={statusFilter == null ? '__all__' : String(statusFilter)}
              onValueChange={(v) =>
                setStatusFilter(v === '__all__' ? undefined : Number(v))
              }
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('show:table.allStatus')}</SelectItem>
                <SelectItem value={String(ShowStatus.Draft)}>{t('show:status.draft')}</SelectItem>
                <SelectItem value={String(ShowStatus.OnSale)}>{t('show:status.onSale')}</SelectItem>
                <SelectItem value={String(ShowStatus.OffShelf)}>{t('show:status.offShelf')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-1.5" />
              {t('show:action.createBtn')}
            </Button>
          </>
        }
      />
      <DataTable<Show>
        columns={columns}
        data={shows}
        rowKey={(s) => String(s.id)}
        loading={isLoading}
      />

      <ShowFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        title={t(`show:toggleConfirm.title.${pendingActionKey}`)}
        description={
          pendingToggle &&
          t(`show:toggleConfirm.desc.${pendingActionKey}`, { name: pendingToggle.name })
        }
        destructive={pendingToggle?.status === ShowStatus.OnSale}
        onConfirm={() => pendingToggle && toggleStatus(pendingToggle)}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
