import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Plus, Eye, Edit2, ArrowLeft } from 'lucide-react';
import {
  Button,
  SessionStatus,
  type ShowSession,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDateTime, sessionStatusKey } from '@/lib/format';
import { useGetShowQuery } from '@/features/shows/showsApi';
import { useListSessionsQuery } from './sessionsApi';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [SessionStatus.Published]: 'success',
  [SessionStatus.Draft]: 'warning',
  [SessionStatus.Ended]: 'muted',
};

export default function SessionsPage() {
  const { t } = useTranslation(['session', 'common']);
  const { id } = useParams<{ id: string }>();
  const showId = id ?? '';
  const navigate = useNavigate();
  const { data: show } = useGetShowQuery(showId, { skip: !showId });
  const { data: sessions = [], isLoading } = useListSessionsQuery(showId, { skip: !showId });

  const columns: Column<ShowSession>[] = [
    { key: 'name', title: t('session:table.name'), render: (s) => <span className="font-medium">{s.name ?? '-'}</span> },
    { key: 'openSaleTime', title: t('session:table.openSaleTime'), render: (s) => formatDateTime(s.openSaleTime) },
    { key: 'startTime', title: t('session:table.startTime'), render: (s) => formatDateTime(s.startTime) },
    { key: 'endTime', title: t('session:form.endTime'), render: (s) => formatDateTime(s.endTime) },
    { key: 'limit', title: t('session:table.limitPerUser'), width: '90px', render: (s) => s.limitPerUser ?? '-' },
    {
      key: 'status',
      title: t('session:table.status'),
      width: '88px',
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>
          {t(`session:status.${sessionStatusKey(s.status)}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: t('session:table.actions'),
      width: '180px',
      render: (s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${s.id}`)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.viewDetail')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${s.id}/edit`)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('common:actions.edit')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('session:page.titleWithShow', { showName: show?.name ?? t('session:page.showFallback') })}
        subtitle={t('session:page.forShowSubtitle')}
        icon={CalendarRange}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/shows')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('session:action.backToShows')}
            </Button>
            <Button
              onClick={() => navigate(`/sessions/new?showId=${showId}`)}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('session:action.createBtn')}
            </Button>
          </>
        }
      />
      <DataTable<ShowSession>
        columns={columns}
        data={sessions}
        rowKey={(s) => String(s.id)}
        loading={isLoading}
        empty={t('session:list.empty')}
      />
    </div>
  );
}
