import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { extractErrorMessage, notify, type AreaPriceVO } from '@maill/shared';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { formatDateTime, formatMoney } from '@/lib/format';
import { useGetSessionDetailQuery } from './sessionsApi';
import { SeatGrid } from './SeatGrid';
import { SelectionBar } from './SelectionBar';
import { setSessionContext } from './cartSlice';

const AREA_DOT: Record<string, string> = {
  A: 'bg-area-a',
  B: 'bg-area-b',
  C: 'bg-area-c',
  D: 'bg-area-d',
};

export default function SessionSeatPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const sessionId = id ?? '';

  const { data, isLoading, error } = useGetSessionDetailQuery(sessionId, { skip: !sessionId });

  useEffect(() => {
    if (sessionId) dispatch(setSessionContext(sessionId));
  }, [sessionId, dispatch]);

  useEffect(() => {
    if (error) notify.error(extractErrorMessage(error));
  }, [error]);

  // 不在 unmount 时清空 cart — 跳转 OrderConfirmPage 也会 unmount。
  // cart 在两种情况下清空：(1) setSessionContext 检测到 sessionId 变化；(2) 提交成功后显式 clearCart。

  const areaPriceMap = useMemo(() => {
    const m = new Map<string, AreaPriceVO>();
    (data?.areaPriceList ?? []).forEach((p) => m.set(p.areaId, p));
    return m;
  }, [data?.areaPriceList]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">场次数据加载失败</div>;
  }

  const { session, areaPriceList, seatSection } = data;

  return (
    <div className="pb-32">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{session.name || `场次 #${session.id}`}</div>
          <div className="text-xs text-muted-foreground">
            {formatDateTime(session.startTime)}
          </div>
        </div>
      </div>

      {/* 价格图例 */}
      <div className="px-4">
        <Card variant="glass" className="p-3 flex flex-wrap gap-3 text-xs">
          {areaPriceList.map((p) => (
            <span key={p.areaId} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded ${AREA_DOT[p.areaId] ?? 'bg-muted'}`} />
              区域 {p.areaId} · {formatMoney(p.price)}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <span className="inline-block h-3 w-3 rounded bg-brand" />
            已选
          </span>
        </Card>
      </div>

      <div className="px-4 py-4">
        <SeatGrid
          rows={seatSection.seatRows}
          rowCount={seatSection.rowCount}
          columnCount={seatSection.columnCount}
          areaPriceMap={areaPriceMap}
          limitPerUser={session.limitPerUser ?? 4}
          onLimitExceed={() =>
            notify.warn(`每人最多选 ${session.limitPerUser ?? 4} 个座位`)
          }
        />
      </div>

      <SelectionBar sessionId={sessionId} />
    </div>
  );
}
