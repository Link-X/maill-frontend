import { useNavigate, useParams } from 'react-router-dom';
import { CalendarRange, Plus, Eye, Edit2, ArrowLeft } from 'lucide-react';
import {
  Button,
  SessionStatus,
  type ShowSession,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDateTime, sessionStatusLabel } from '@/lib/format';
import { useGetShowQuery } from '@/features/shows/showsApi';
import { useListSessionsQuery } from './sessionsApi';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [SessionStatus.Published]: 'success',
  [SessionStatus.Draft]: 'warning',
  [SessionStatus.Ended]: 'muted',
};

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>();
  const showId = id ?? '';
  const navigate = useNavigate();
  const { data: show } = useGetShowQuery(showId, { skip: !showId });
  const { data: sessions = [], isLoading } = useListSessionsQuery(showId, { skip: !showId });

  const columns: Column<ShowSession>[] = [
    { key: 'name', title: '名称', render: (s) => <span className="font-medium">{s.name ?? '-'}</span> },
    { key: 'startTime', title: '开始时间', render: (s) => formatDateTime(s.startTime) },
    { key: 'endTime', title: '结束时间', render: (s) => formatDateTime(s.endTime) },
    { key: 'limit', title: '每人限购', width: '90px', render: (s) => s.limitPerUser ?? '-' },
    {
      key: 'status',
      title: '状态',
      width: '88px',
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>{sessionStatusLabel(s.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${s.id}`)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            详情
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${s.id}/edit`)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            编辑
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${show?.name ?? '演出'} - 场次列表`}
        subtitle="一个演出可对应多个场次"
        icon={CalendarRange}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/shows')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              返回演出列表
            </Button>
            <Button
              onClick={() => navigate(`/sessions/new?showId=${showId}`)}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              新建场次
            </Button>
          </>
        }
      />
      <DataTable<ShowSession>
        columns={columns}
        data={sessions}
        rowKey={(s) => String(s.id)}
        loading={isLoading}
        empty="该演出还没有场次，点击右上角新建"
      />
    </div>
  );
}
