import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Edit2, CalendarRange, Power } from 'lucide-react';
import {
  Button,
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
import { nextToggleStatus, toggleLabel } from './statusUtils';
import { formatDateTime, showStatusLabel } from '@/lib/format';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [ShowStatus.OnSale]: 'success',
  [ShowStatus.Draft]: 'warning',
  [ShowStatus.OffShelf]: 'muted',
};

export default function ShowsPage() {
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
      notify.success(`已${toggleLabel(show.status)}：${show.name}`);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
    setPendingToggle(null);
  };

  const columns: Column<Show>[] = [
    {
      key: 'posterUrl',
      title: '海报',
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
    { key: 'name', title: '名称', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'category', title: '分类', render: (s) => s.categoryName ?? '-' },
    {
      key: 'venue',
      title: '城市 · 场地',
      render: (s) => {
        const parts = [s.cityName, s.venue].filter(Boolean);
        return parts.length ? parts.join(' · ') : '-';
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '88px',
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>{showStatusLabel(s.status)}</Badge>
      ),
    },
    { key: 'createTime', title: '创建时间', render: (s) => formatDateTime(s.createTime) },
    {
      key: 'actions',
      title: '操作',
      width: '260px',
      render: (s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            编辑
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/shows/${s.id}/sessions`)}
          >
            <CalendarRange className="h-3.5 w-3.5 mr-1" />
            场次
          </Button>
          <Button
            size="sm"
            variant={s.status === ShowStatus.OnSale ? 'destructive' : 'default'}
            onClick={() => setPendingToggle(s)}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {toggleLabel(s.status)}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="演出管理"
        subtitle="维护可售演出列表"
        icon={Sparkles}
        actions={
          <>
            <select
              className="h-9 border border-input bg-background px-3 text-sm rounded-md"
              value={statusFilter ?? ''}
              onChange={(e) =>
                setStatusFilter(e.target.value === '' ? undefined : Number(e.target.value))
              }
            >
              <option value="">全部状态</option>
              <option value={String(ShowStatus.Draft)}>草稿</option>
              <option value={String(ShowStatus.OnSale)}>已上架</option>
              <option value={String(ShowStatus.OffShelf)}>已下架</option>
            </select>
            <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-1.5" />
              新建演出
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
        title={`${pendingToggle ? toggleLabel(pendingToggle.status) : ''}演出`}
        description={
          pendingToggle && (
            <span>
              确定要{toggleLabel(pendingToggle.status)} <b>{pendingToggle.name}</b> 吗？
            </span>
          )
        }
        destructive={pendingToggle?.status === ShowStatus.OnSale}
        onConfirm={() => pendingToggle && toggleStatus(pendingToggle)}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
