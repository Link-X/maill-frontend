import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Flame,
  Rocket,
  ArrowLeft,
  Edit2,
  Save,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  SessionStatus,
  cn,
  extractErrorMessage,
  notify,
  type AdminSeat,
  type SessionArea,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDateTime, sessionStatusLabel } from '@/lib/format';
import {
  useGetSessionQuery,
  useListSessionAreasQuery,
  useListSessionSeatsQuery,
  usePublishSessionMutation,
  useSaveSessionAreasMutation,
  useWarmupSessionMutation,
} from './sessionsApi';
import { useListRoomAreasQuery } from '@/features/rooms/roomsApi';

const AREA_COLORS: Record<string, string> = {
  A: 'bg-area-a text-white',
  B: 'bg-area-b text-white',
  C: 'bg-area-c text-white',
  D: 'bg-area-d text-white',
};

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [SessionStatus.Published]: 'success',
  [SessionStatus.Draft]: 'warning',
  [SessionStatus.Ended]: 'muted',
};

interface PriceDraftRow {
  areaId: string;
  price: string;
  originPrice: string;
}

export default function SessionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const sessionId = id ?? '';

  const { data: session, isLoading: loadingSession } = useGetSessionQuery(sessionId, {
    skip: !sessionId,
  });
  const { data: seats = [] } = useListSessionSeatsQuery(sessionId, { skip: !sessionId });
  const { data: areas = [] } = useListSessionAreasQuery(sessionId, { skip: !sessionId });
  const { data: roomAreas = [] } = useListRoomAreasQuery(session?.roomId ?? '', {
    skip: !session?.roomId,
  });

  const [saveAreas, { isLoading: savingAreas }] = useSaveSessionAreasMutation();
  const [warmup, { isLoading: warmingUp }] = useWarmupSessionMutation();
  const [publish, { isLoading: publishing }] = usePublishSessionMutation();

  const [priceDraft, setPriceDraft] = useState<PriceDraftRow[]>([]);

  const usedAreaIds = useMemo(
    () => Array.from(new Set(seats.map((s) => s.areaId))).sort(),
    [seats],
  );

  useEffect(() => {
    const sessionPriceMap = new Map(areas.map((a) => [a.areaId, a]));
    const roomPriceMap = new Map(roomAreas.map((a) => [a.areaId, a]));
    const next: PriceDraftRow[] = usedAreaIds.map((areaId) => {
      const sp = sessionPriceMap.get(areaId);
      const rp = roomPriceMap.get(areaId);
      return {
        areaId,
        price: sp?.price ?? rp?.defaultPrice ?? '',
        originPrice: sp?.originPrice ?? rp?.defaultOriginPrice ?? '',
      };
    });
    setPriceDraft(next);
  }, [usedAreaIds, areas, roomAreas]);

  const updatePriceRow = (idx: number, patch: Partial<PriceDraftRow>) => {
    setPriceDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSavePrices = async () => {
    for (const row of priceDraft) {
      if (!row.price || Number.isNaN(Number(row.price))) {
        notify.error(`区域 ${row.areaId} 的价格无效`);
        return;
      }
    }
    const payload: SessionArea[] = priceDraft.map((r) => ({
      sessionId,
      areaId: r.areaId,
      price: r.price,
      originPrice: r.originPrice || undefined,
    }));
    try {
      await saveAreas({ sessionId, areas: payload }).unwrap();
      notify.success('价格已保存');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handleWarmup = async () => {
    try {
      const res = (await warmup(sessionId).unwrap()) as string;
      notify.success(typeof res === 'string' ? res : '预热完成');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const handlePublish = async () => {
    try {
      await publish(sessionId).unwrap();
      notify.success('场次已发布开售');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (loadingSession) return <div className="p-6 text-muted-foreground">加载中...</div>;
  if (!session) return <div className="p-6 text-muted-foreground">场次不存在</div>;

  const canWarmup =
    session.status === SessionStatus.Draft && seats.length > 0 && areas.length > 0;
  const canPublish = session.status === SessionStatus.Draft;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={session.name || `场次 #${session.id}`}
        subtitle={
          <span className="inline-flex items-center gap-2">
            {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)} · 状态：
            <Badge variant={STATUS_VARIANT[session.status] ?? 'default'}>
              {sessionStatusLabel(session.status)}
            </Badge>
          </span>
        }
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(`/shows/${session.showId}/sessions`)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              返回
            </Button>
            <Button variant="outline" onClick={() => navigate(`/sessions/${session.id}/edit`)}>
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              编辑
            </Button>
            <Button variant="outline" disabled={!canWarmup || warmingUp} onClick={handleWarmup}>
              <Flame className="h-3.5 w-3.5 mr-1" />
              {warmingUp ? '预热中...' : '预热库存'}
            </Button>
            <Button
              disabled={!canPublish || publishing}
              onClick={handlePublish}
              className="bg-gradient-brand hover:opacity-90"
            >
              <Rocket className="h-3.5 w-3.5 mr-1.5" />
              {publishing ? '发布中...' : '发布开售'}
            </Button>
          </>
        }
      />

      {/* 价格区域 */}
      <section>
        <h2 className="font-semibold mb-3">价格区域</h2>
        {priceDraft.length === 0 ? (
          <Card variant="glass" className="p-5 text-sm text-muted-foreground">
            该场次还没有座位。请先确认 <b>场地</b> 已配置座位模板，并在创建场次后等待后端复制。
          </Card>
        ) : (
          <Card variant="glass" className="p-5 space-y-3">
            {priceDraft.map((row, idx) => (
              <div key={row.areaId} className="grid grid-cols-[60px_1fr_1fr] gap-3 items-end">
                <div className="font-medium flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded',
                      AREA_COLORS[row.areaId]?.split(' ')[0] ?? 'bg-muted',
                    )}
                    aria-hidden
                  />
                  {row.areaId}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`p-${row.areaId}`}>价格 *</Label>
                  <Input
                    id={`p-${row.areaId}`}
                    value={row.price}
                    onChange={(e) => updatePriceRow(idx, { price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`o-${row.areaId}`}>折扣前价格</Label>
                  <Input
                    id={`o-${row.areaId}`}
                    value={row.originPrice}
                    onChange={(e) => updatePriceRow(idx, { originPrice: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={handleSavePrices} disabled={savingAreas} size="sm">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {savingAreas ? '保存中...' : '保存价格'}
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* 座位预览 */}
      <section>
        <h2 className="font-semibold mb-3">
          座位预览（{seats.length} 个 · {usedAreaIds.length} 个区域）
        </h2>
        {seats.length === 0 ? (
          <Card variant="glass" className="p-5 text-sm text-muted-foreground">
            该场次暂无座位数据。请确认创建场次时正确选择了场地，并且场地已配置座位模板。
          </Card>
        ) : (
          <SeatPreview
            seats={seats}
            rowCount={session.rowCount ?? 0}
            colCount={session.colCount ?? 0}
          />
        )}
      </section>
    </div>
  );
}

function SeatPreview({
  seats,
  rowCount,
  colCount,
}: {
  seats: AdminSeat[];
  rowCount: number;
  colCount: number;
}) {
  const seatMap = useMemo(() => {
    const m = new Map<string, AdminSeat>();
    seats.forEach((s) => m.set(`${s.rowNo}-${s.colNo}`, s));
    return m;
  }, [seats]);

  const effRow = rowCount || Math.max(0, ...seats.map((s) => s.rowNo));
  const effCol = colCount || Math.max(0, ...seats.map((s) => s.colNo));

  return (
    <div className="overflow-auto border border-border/60 rounded-xl p-4 bg-card">
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${effCol + 1}, minmax(28px, 28px))` }}
      >
        <div />
        {Array.from({ length: effCol }).map((_, ci) => (
          <div key={`col-${ci}`} className="text-xs text-muted-foreground text-center">
            {ci + 1}
          </div>
        ))}
        {Array.from({ length: effRow }).map((_, ri) => {
          const rowNo = ri + 1;
          return (
            <PreviewRow
              key={`row-${rowNo}`}
              rowNo={rowNo}
              colCount={effCol}
              seatMap={seatMap}
              baseIndex={ri * effCol}
            />
          );
        })}
      </div>
    </div>
  );
}

function PreviewRow({
  rowNo,
  colCount,
  seatMap,
  baseIndex,
}: {
  rowNo: number;
  colCount: number;
  seatMap: Map<string, AdminSeat>;
  baseIndex: number;
}) {
  return (
    <>
      <div className="text-xs text-muted-foreground flex items-center justify-center">{rowNo}</div>
      {Array.from({ length: colCount }).map((_, ci) => {
        const colNo = ci + 1;
        const seat = seatMap.get(`${rowNo}-${colNo}`);
        const delay = ((baseIndex + ci) * 4) / 1000;
        if (!seat) {
          return <div key={`c-${rowNo}-${colNo}`} className="h-7 w-7" />;
        }
        return (
          <motion.div
            key={`c-${rowNo}-${colNo}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'h-7 w-7 rounded text-[10px] font-medium flex items-center justify-center',
              AREA_COLORS[seat.areaId] ?? 'bg-muted',
            )}
            title={`${rowNo}排${colNo}座 (区域${seat.areaId})`}
          >
            {seat.areaId}
          </motion.div>
        );
      })}
    </>
  );
}
