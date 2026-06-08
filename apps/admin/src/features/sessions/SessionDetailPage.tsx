import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ArrowLeft,
  Edit2,
  Save,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  SessionStatus,
  SeatCanvas,
  buildAreaColorMap,
  extractErrorMessage,
  notify,
  type AdminSeat,
  type AreaSaleMode,
  type AllocateStrategy,
  type SeatCell,
  type SessionArea,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDateTime, sessionStatusKey } from '@/lib/format';
import {
  useGetSessionQuery,
  useListSessionAreasQuery,
  useListSessionSeatsQuery,
  useSaveSessionAreasMutation,
  useUpdateAreaSaleConfigMutation,
} from './sessionsApi';
import { useListRoomAreasQuery } from '@/features/rooms/roomsApi';
import { MonitorPanel } from '@/features/monitor/MonitorPanel';

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'muted'> = {
  [SessionStatus.Published]: 'success',
  [SessionStatus.Draft]: 'warning',
  [SessionStatus.Ended]: 'muted',
};

interface PriceDraftRow {
  areaId: string;
  price: string;
  originPrice: string;
  saleMode: AreaSaleMode;
  allocateStrategy: AllocateStrategy;
  /** 只读统计:区域内单座/情侣对总数 — 派座模式用以校验配置 */
  singleTotal?: number;
  coupleTotal?: number;
}

export default function SessionDetailPage() {
  const { t } = useTranslation(['session', 'common', 'room']);
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
  const [updateSaleConfig, { isLoading: savingSaleConfig }] = useUpdateAreaSaleConfigMutation();

  const [priceDraft, setPriceDraft] = useState<PriceDraftRow[]>([]);

  // 销售中场次禁止改 sale_mode(后端会拒绝;前端做软提示 + 禁用)
  const isOnSale = session?.status === SessionStatus.Published;

  const usedAreaIds = useMemo(
    () => Array.from(new Set(seats.map((s) => s.areaId))).sort(),
    [seats],
  );
  const areaColorMap = useMemo(() => buildAreaColorMap(usedAreaIds), [usedAreaIds]);

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
        saleMode: (sp?.saleMode ?? 1) as AreaSaleMode,
        allocateStrategy: (sp?.allocateStrategy ?? 1) as AllocateStrategy,
        singleTotal: sp?.singleTotal,
        coupleTotal: sp?.coupleTotal,
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
        notify.error(t('session:detail.priceInvalid', { id: row.areaId }));
        return;
      }
    }
    const payload: SessionArea[] = priceDraft.map((r) => ({
      sessionId,
      areaId: r.areaId,
      price: r.price,
      originPrice: r.originPrice || undefined,
      saleMode: r.saleMode,
      allocateStrategy: r.allocateStrategy,
    }));
    try {
      await saveAreas({ sessionId, areas: payload }).unwrap();
      notify.success(t('session:detail.pricesSavedToast'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  /** 单独切换售卖模式(需未开售)— 不重写价格,降低对销售中场次的误操作风险 */
  const handleToggleSaleMode = async (row: PriceDraftRow) => {
    if (isOnSale) {
      notify.warn('场次销售中,无法修改售卖模式;请先停售');
      return;
    }
    const nextMode: AreaSaleMode = row.saleMode === 2 ? 1 : 2;
    try {
      await updateSaleConfig({
        sessionId,
        areaId: row.areaId,
        saleMode: nextMode,
        allocateStrategy: row.allocateStrategy,
      }).unwrap();
      notify.success(nextMode === 2 ? '已切换为系统派座' : '已切换为用户选座');
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  if (loadingSession) return <div className="p-6 text-muted-foreground">{t('common:states.loading')}</div>;
  if (!session) return <div className="p-6 text-muted-foreground">{t('session:detail.notFound')}</div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={session.name || t('session:detail.titleFallback', { id: session.id })}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)} · {t('session:detail.statusLabel')}
            <Badge variant={STATUS_VARIANT[session.status] ?? 'default'}>
              {t(`session:status.${sessionStatusKey(session.status)}`)}
            </Badge>
            {session.openSaleTime && (
              <span className="text-xs text-muted-foreground">
                · {t('session:userSeat.openSaleAt', { time: formatDateTime(session.openSaleTime) })}
              </span>
            )}
          </span>
        }
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(`/shows/${session.showId}/sessions`)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('common:actions.back')}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/sessions/${session.id}/edit`)}>
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              {t('common:actions.edit')}
            </Button>
          </>
        }
      />
      <MonitorPanel sessionId={sessionId} />

      {/* 价格区域 */}
      <section>
        <h2 className="font-semibold mb-3">{t('session:detail.priceArea')}</h2>
        {priceDraft.length === 0 ? (
          <Card variant="glass" className="p-5 text-sm text-muted-foreground">
            <Trans i18nKey="session:detail.noSeatsHint" components={{ b: <b /> }} />
          </Card>
        ) : (
          <Card variant="glass" className="p-5 space-y-4">
            {priceDraft.map((row, idx) => (
              <div
                key={row.areaId}
                className="space-y-3 pb-3 border-b border-border/40 last:border-0 last:pb-0"
              >
                {/* 区域标识 + 售卖模式切换 */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-medium flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 rounded"
                      style={{ background: areaColorMap.get(row.areaId) ?? '#94a3b8' }}
                      aria-hidden
                    />
                    <span>{row.areaId} 区</span>
                    {row.singleTotal != null && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        单座 {row.singleTotal} · 情侣 {row.coupleTotal ?? 0} 对
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.saleMode === 2 ? 'success' : 'default'}>
                      {row.saleMode === 2 ? '系统派座' : '用户选座'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isOnSale || savingSaleConfig}
                      onClick={() => handleToggleSaleMode(row)}
                      title={isOnSale ? '场次销售中,无法切换售卖模式' : undefined}
                    >
                      切换为{row.saleMode === 2 ? '选座' : '派座'}
                    </Button>
                  </div>
                </div>

                {/* 价格 + 原价 + 派座策略(派座模式显示) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <Label htmlFor={`p-${row.areaId}`}>{t('session:detail.priceLabel')}</Label>
                    <Input
                      id={`p-${row.areaId}`}
                      value={row.price}
                      onChange={(e) => updatePriceRow(idx, { price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`o-${row.areaId}`}>
                      {t('session:detail.originPriceLabel')}
                    </Label>
                    <Input
                      id={`o-${row.areaId}`}
                      value={row.originPrice}
                      onChange={(e) => updatePriceRow(idx, { originPrice: e.target.value })}
                    />
                  </div>
                  {row.saleMode === 2 && (
                    <div className="space-y-1">
                      <Label htmlFor={`s-${row.areaId}`}>派座策略</Label>
                      <select
                        id={`s-${row.areaId}`}
                        value={row.allocateStrategy}
                        onChange={(e) =>
                          updatePriceRow(idx, {
                            allocateStrategy: Number(e.target.value) as AllocateStrategy,
                          })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value={1}>连坐优先</option>
                        <option value={2}>分散</option>
                        <option value={3}>任意</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isOnSale && (
              <div className="text-[11px] text-muted-foreground rounded-md bg-muted/40 px-3 py-2 border border-border/40">
                场次销售中:可改价/派座策略并立即生效;但切换售卖模式(选座 ↔ 派座)需先停售。
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={handleSavePrices} disabled={savingAreas} size="sm">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {savingAreas ? t('common:actions.saving') : t('session:detail.savePrices')}
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* 座位预览 */}
      <section>
        <h2 className="font-semibold mb-3">
          {t('session:detail.seatsPreviewTitle', {
            n: seats.length,
            areas: usedAreaIds.length,
          })}
        </h2>
        {seats.length === 0 ? (
          <Card variant="glass" className="p-5 text-sm text-muted-foreground">
            {t('session:detail.noSeatsDataHint')}
          </Card>
        ) : (
          <SeatPreview
            seats={seats}
            rowCount={session.rowCount ?? 0}
            colCount={session.colCount ?? 0}
            areaColorMap={areaColorMap}
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
  areaColorMap,
}: {
  seats: AdminSeat[];
  rowCount: number;
  colCount: number;
  areaColorMap: Map<string, string>;
}) {
  const effRow = rowCount || Math.max(0, ...seats.map((s) => s.rowNo));
  const effCol = colCount || Math.max(0, ...seats.map((s) => s.colNo));

  const cells = useMemo<SeatCell[]>(
    () =>
      seats.map((s) => ({
        key: String(s.id ?? `${s.rowNo}-${s.colNo}`),
        r: s.rowNo - 1,
        c: s.colNo - 1,
        fill: areaColorMap.get(s.areaId) ?? '#94a3b8',
        label: s.areaId,
      })),
    [seats, areaColorMap],
  );

  return (
    <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
      <SeatCanvas
        rowCount={effRow}
        colCount={effCol}
        cells={cells}
        mode="readonly"
        height="min(70vh, 560px)"
      />
    </div>
  );
}

