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

  const [priceDraft, setPriceDraft] = useState<PriceDraftRow[]>([]);

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
    }));
    try {
      await saveAreas({ sessionId, areas: payload }).unwrap();
      notify.success(t('session:detail.pricesSavedToast'));
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
          <Card variant="glass" className="p-5 space-y-3">
            {priceDraft.map((row, idx) => (
              <div key={row.areaId} className="grid grid-cols-[60px_1fr_1fr] gap-3 items-end">
                <div className="font-medium flex items-center gap-1.5">
                  <span
                    className="inline-block h-4 w-4 rounded"
                    style={{ background: areaColorMap.get(row.areaId) ?? '#94a3b8' }}
                    aria-hidden
                  />
                  {row.areaId}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`p-${row.areaId}`}>{t('session:detail.priceLabel')}</Label>
                  <Input
                    id={`p-${row.areaId}`}
                    value={row.price}
                    onChange={(e) => updatePriceRow(idx, { price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`o-${row.areaId}`}>{t('session:detail.originPriceLabel')}</Label>
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

