import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Flag, Check, Trash2, ArrowLeft } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  extractErrorMessage,
  notify,
  type ShowReviewReport,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import { useListReportsQuery, useHandleReportMutation } from './reviewsApi';

export default function ReportsPage() {
  const { t } = useTranslation(['review', 'common']);
  const navigate = useNavigate();
  // 默认仅展示待处理
  const [status, setStatus] = useState<string>('0');
  const arg = {
    status: status === '__all__' ? undefined : (Number(status) as 0 | 1 | 2),
    page: 1,
    size: 50,
  };
  const { data, isLoading } = useListReportsQuery(arg);
  const list = (data?.list ?? []) as ShowReviewReport[];
  const [handleReport] = useHandleReportMutation();

  const onAction = async (reportId: number, action: 'keep' | 'delete') => {
    try {
      await handleReport({ reportId, action }).unwrap();
      notify.success(action === 'delete' ? '已删除评价' : '已保留');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const statusBadge = (s?: number) => {
    if (s === 0) return <Badge variant="warning">{t('review:report.pending')}</Badge>;
    if (s === 1) return <Badge variant="success">{t('review:report.handledKeep')}</Badge>;
    if (s === 2) return <Badge variant="muted">{t('review:report.handledDelete')}</Badge>;
    return null;
  };

  const columns: Column<ShowReviewReport>[] = [
    { key: 'id', title: 'ID', width: '70px', render: (r) => r.id },
    { key: 'reviewId', title: 'Review', width: '90px', render: (r) => r.reviewId },
    { key: 'reporterId', title: '举报人', width: '90px', render: (r) => r.reporterId },
    { key: 'reason', title: '原因', render: (r) => r.reason },
    { key: 'status', title: '状态', width: '90px', render: (r) => statusBadge(r.status) },
    {
      key: 'createTime',
      title: '时间',
      render: (r) => (r.createTime ? formatDateTime(r.createTime) : '-'),
    },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      render: (r) =>
        r.status === 0 ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onAction(r.id, 'keep')}>
              <Check className="h-3.5 w-3.5 mr-1" />
              {t('review:action.keep')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction(r.id, 'delete')}>
              <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
              {t('review:action.delete')}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">已处理</span>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('review:page.reportsTitle')}
        icon={Flag}
        actions={
          <Button variant="outline" onClick={() => navigate('/reviews')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回评价
          </Button>
        }
      />

      <div className="w-40">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部</SelectItem>
            <SelectItem value="0">{t('review:report.pending')}</SelectItem>
            <SelectItem value="1">{t('review:report.handledKeep')}</SelectItem>
            <SelectItem value="2">{t('review:report.handledDelete')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<ShowReviewReport>
        columns={columns}
        data={list}
        rowKey={(r) => String(r.id)}
        loading={isLoading}
      />
    </div>
  );
}
