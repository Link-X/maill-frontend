import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ticket } from 'lucide-react';
import { extractErrorMessage, notify } from '@maill/shared';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useGetSessionDetailQuery, useGetMyPurchaseLimitQuery } from './sessionsApi';
import { SeatGrid, buildPriceColorMap } from './SeatGrid';
import { SelectionBar } from './SelectionBar';
import { PriceLegendCard } from './PriceLegendCard';
import { SessionPageHeader } from './SessionPageHeader';
import { setSessionContext } from './cartSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

/** 独立选座页:顶部场次名/价位图例,中间座位图,底部价格计算 + 下单 */
export default function SeatSelectPage() {
  const { t } = useTranslation(['session', 'common']);
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const sessionId = id ?? '';

  // 每次进入强制重拉,避免命中缓存看到陈旧座位状态
  const { data, isLoading, error } = useGetSessionDetailQuery(sessionId, {
    skip: !sessionId,
    refetchOnMountOrArgChange: true,
  });

  const isAuthed = useSelector(selectIsAuthenticated);
  const { data: myLimit } = useGetMyPurchaseLimitQuery(sessionId, {
    skip: !sessionId || !isAuthed,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (sessionId) dispatch(setSessionContext(sessionId));
  }, [sessionId, dispatch]);

  useEffect(() => {
    if (error) notify.error(extractErrorMessage(error));
  }, [error]);

  const priceColorMap = useMemo(
    () => buildPriceColorMap(data?.areaPriceList ?? []),
    [data?.areaPriceList],
  );
  const allocateAreaIds = useMemo(
    () =>
      new Set(
        (data?.areaPriceList ?? []).filter((a) => a.saleMode === 2).map((a) => a.areaId),
      ),
    [data?.areaPriceList],
  );
  const hasPickModeAreas = useMemo(
    () => (data?.areaPriceList ?? []).some((a) => (a.saleMode ?? 1) === 1),
    [data?.areaPriceList],
  );

  const sessionLimitPerUser = data?.session.limitPerUser ?? 4;
  const effectiveLimit = isAuthed
    ? Math.max(0, myLimit?.remaining ?? sessionLimitPerUser)
    : sessionLimitPerUser;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t('session:userSeat.loadFailed')}
      </div>
    );
  }

  const { session, areaPriceList, seatSection, showName } = data;
  const sessionStatus = Number(session.status);

  return (
    <div className="pb-36">
      <SessionPageHeader
        title={showName ?? session.name ?? `场次 #${session.id}`}
        startTime={session.startTime}
        sessionName={session.name}
        showName={showName}
      />

      <div className="px-4 mb-3">
        <PriceLegendCard areaPriceList={areaPriceList} priceColorMap={priceColorMap} />
      </div>

      {hasPickModeAreas ? (
        <>
          <div className="px-4">
            <SeatGrid
              rows={seatSection.seatRows}
              rowCount={seatSection.rowCount}
              columnCount={seatSection.columnCount}
              areaPriceList={areaPriceList}
              limitPerUser={effectiveLimit}
              onLimitExceed={() =>
                notify.warn(
                  effectiveLimit === 0
                    ? '已达到本场次限购上限,无法再选'
                    : t('session:userSeat.limitToast', { n: effectiveLimit }),
                )
              }
              allocateAreaIds={allocateAreaIds}
            />
          </div>
          <SelectionBar
            sessionId={sessionId}
            limitPerUser={effectiveLimit}
            sessionStatus={sessionStatus}
          />
        </>
      ) : (
        <div className="px-4 pt-10">
          <EmptyState icon={Ticket} title={t('session:userSeat.noPickArea')} description="" />
        </div>
      )}
    </div>
  );
}
