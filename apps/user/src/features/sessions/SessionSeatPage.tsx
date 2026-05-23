import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Info, Clock } from 'lucide-react';
import { extractErrorMessage, notify, parseExtend, type SessionExtend } from '@maill/shared';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { formatDateTime, formatMoney } from '@/lib/format';
import { useGetSessionDetailQuery } from './sessionsApi';
import { SeatGrid, buildPriceColorMap } from './SeatGrid';
import { SelectionBar } from './SelectionBar';
import { setSessionContext } from './cartSlice';

export default function SessionSeatPage() {
  const { t } = useTranslation(['session', 'common']);
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

  const priceColorMap = useMemo(
    () => buildPriceColorMap(data?.areaPriceList ?? []),
    [data?.areaPriceList],
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">{t('session:userSeat.loadFailed')}</div>;
  }

  const { session, areaPriceList, seatSection, showName, showVenue, showAddress, showCityName } = data;
  const venueLine = [showCityName, showVenue].filter(Boolean).join(' · ');
  const sessionExtend = parseExtend<SessionExtend>(session.extend);

  return (
    <div className="pb-32">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          {/* 优先展示演出名 + 场次副标题；都没有则回落场次自己 */}
          <div className="font-semibold truncate">
            {showName ?? session.name ?? `场次 #${session.id}`}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {formatDateTime(session.startTime)}
            {session.name && showName && <span className="ml-1.5">· {session.name}</span>}
          </div>
        </div>
      </div>

      {/* 演出地点 */}
      {(venueLine || showAddress) && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-brand shrink-0" />
            <span>
              {venueLine && <span className="text-foreground/80">{venueLine}</span>}
              {venueLine && showAddress && <span className="mx-1">·</span>}
              {showAddress}
            </span>
          </p>
        </div>
      )}

      {/* 场次 extend：提前进场分钟数 + 现场须知 */}
      {sessionExtend && (sessionExtend.preSaleLeadMinutes != null || sessionExtend.notice) && (
        <div className="px-4 pb-2 space-y-1">
          {typeof sessionExtend.preSaleLeadMinutes === 'number' && (
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand" />
              {t('session:userSeat.leadMinutes', { n: sessionExtend.preSaleLeadMinutes })}
            </p>
          )}
          {sessionExtend.notice && (
            <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 text-brand shrink-0" />
              <span>{String(sessionExtend.notice)}</span>
            </p>
          )}
        </div>
      )}

      {/* 价格图例 */}
      <div className="px-4">
        <Card variant="glass" className="p-3 flex flex-wrap gap-3 text-xs">
          {areaPriceList.map((p) => (
            <span key={p.areaId} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-3 rounded ${priceColorMap.get(p.areaId) ?? 'bg-muted'}`}
              />
              {formatMoney(p.price)}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-brand" />
            {t('session:userSeat.legendSelected')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-foreground/30 ring-1 ring-foreground/10" />
            {t('session:userSeat.legendSold')}
          </span>
        </Card>
      </div>

      <div className="px-4 py-4">
        <SeatGrid
          rows={seatSection.seatRows}
          rowCount={seatSection.rowCount}
          columnCount={seatSection.columnCount}
          areaPriceList={areaPriceList}
          limitPerUser={session.limitPerUser ?? 4}
          onLimitExceed={() =>
            notify.warn(t('session:userSeat.limitToast', { n: session.limitPerUser ?? 4 }))
          }
        />
      </div>

      <SelectionBar sessionId={sessionId} />
    </div>
  );
}
