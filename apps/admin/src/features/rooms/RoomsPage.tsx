import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Grid3x3 } from 'lucide-react';
import { Button, type Room } from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { formatDateTime } from '@/lib/format';
import { useListRoomsQuery } from './roomsApi';
import { RoomFormDrawer } from './RoomFormDrawer';

export default function RoomsPage() {
  const navigate = useNavigate();
  const { data: rooms = [], isLoading } = useListRoomsQuery();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditing(room);
    setDrawerOpen(true);
  };

  const columns: Column<Room>[] = [
    { key: 'name', title: '场地名', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'venue', title: '所属场馆', render: (r) => r.venue ?? '-' },
    {
      key: 'size',
      title: '行x列',
      width: '120px',
      render: (r) => (
        <span className="font-mono text-xs">
          {r.rowCount} × {r.colCount}
        </span>
      ),
    },
    { key: 'createTime', title: '创建时间', render: (r) => formatDateTime(r.createTime) },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            编辑
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/rooms/${r.id}`)}>
            <Grid3x3 className="h-3.5 w-3.5 mr-1" />
            座位与价格
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="场地管理"
        subtitle="场地是座位模板的载体，可被多个场次复用"
        icon={Building2}
        actions={
          <Button onClick={openCreate} className="bg-gradient-brand hover:opacity-90">
            <Plus className="h-4 w-4 mr-1.5" />
            新建场地
          </Button>
        }
      />
      <DataTable<Room>
        columns={columns}
        data={rooms}
        rowKey={(r) => String(r.id)}
        loading={isLoading}
      />

      <RoomFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />
    </div>
  );
}
