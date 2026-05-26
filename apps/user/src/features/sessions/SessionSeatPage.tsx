import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Info, Clock, Calendar, ChevronDown } from 'lucide-react';
import { extractErrorMessage, notify, parseExtend, cn, type SessionExtend } from '@maill/shared';
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

  // 每次进入页面强制重新拉取，避免命中 RTK Query 缓存而看到陈旧的座位状态（已售/已锁未更新）
  const { data, isLoading, error } = useGetSessionDetailQuery(sessionId, {
    skip: !sessionId,
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

  const [noticeExpanded, setNoticeExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
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

  const { session, areaPriceList, seatSection, showName, showVenue, showAddress, showCityName } = data;
  const venueLine = [showCityName, showVenue].filter(Boolean).join(' · ');
  const sessionExtend = parseExtend<SessionExtend>(session.extend);
  const hasInfo =
    !!venueLine ||
    !!showAddress ||
    sessionExtend?.preSaleLeadMinutes != null ||
    !!sessionExtend?.notice;

  return (
    <div className="pb-36">
      {/* ===== 沉浸式 header ===== */}
      <header className="relative isolate px-4 pt-3 pb-6 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-44 h-44 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex items-center gap-3"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common:actions.back')}
            className="h-10 w-10 rounded-full
                       bg-white/65 dark:bg-white/10 backdrop-blur-xl
                       border border-white/40 dark:border-white/15
                       shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                       flex items-center justify-center shrink-0
                       active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold truncate leading-tight">
              {showName ?? session.name ?? `场次 #${session.id}`}
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-brand" />
              <span className="truncate">
                {formatDateTime(session.startTime)}
                {session.name && showName && <span className="ml-1">· {session.name}</span>}
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* ===== 信息卡片:浮在 header 底部 ===== */}
      {hasInfo && (
        <div className="relative -mt-3 px-4 mb-3">
          <div
            className="rounded-2xl bg-card border border-border/60
                       shadow-[0_10px_30px_-12px_rgba(15,23,42,0.15)]
                       overflow-hidden"
          >
            {(venueLine || showAddress) && (
              <InfoRow icon={MapPin} tone="brand">
                {venueLine && <div className="font-medium text-foreground">{venueLine}</div>}
                {showAddress && (
                  <div className="text-muted-foreground mt-0.5 leading-relaxed">{showAddress}</div>
                )}
              </InfoRow>
            )}
            {typeof sessionExtend?.preSaleLeadMinutes === 'number' && (
              <InfoRow icon={Clock} tone="amber" divider>
                {t('session:userSeat.leadMinutes', { n: sessionExtend.preSaleLeadMinutes })}
              </InfoRow>
            )}
            {sessionExtend?.notice && (
              <button
                type="button"
                onClick={() => setNoticeExpanded((v) => !v)}
                className="w-full text-left active:bg-accent/30 transition-colors"
              >
                <InfoRow icon={Info} tone="sky" divider>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        'text-muted-foreground leading-relaxed whitespace-pre-wrap',
                        !noticeExpanded && 'line-clamp-2',
                      )}
                    >
                      {String(sessionExtend.notice)}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5 transition-transform',
                        noticeExpanded && 'rotate-180',
                      )}
                    />
                  </div>
                </InfoRow>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== 价格图例 ===== */}
      <div className="px-4 mb-3">
        <div className="rounded-2xl bg-card border border-border/60 p-3">
          <div className="text-[11px] text-muted-foreground mb-2">价位区域</div>
          <div className="flex flex-wrap gap-1.5">
            {areaPriceList.map((p) => (
              <PriceLegendChip
                key={p.areaId}
                color={priceColorMap.get(p.areaId) ?? 'bg-muted'}
                price={formatMoney(p.price)}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-brand ring-2 ring-brand/25" />
              {t('session:userSeat.legendSelected')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-foreground/30 ring-1 ring-foreground/10" />
              {t('session:userSeat.legendSold')}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 座位栅格 ===== */}
      <div className="px-4">
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

      <SelectionBar sessionId={sessionId} limitPerUser={session.limitPerUser ?? 4} />
    </div>
  );
}

// ===== 子组件 =====

type Tone = 'brand' | 'amber' | 'sky';
const toneClass: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
};

function InfoRow({
  icon: Icon,
  tone,
  divider,
  children,
}: {
  icon: typeof MapPin;
  tone: Tone;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-start gap-2.5 px-3.5 py-2.5', divider && 'border-t border-border/40')}>
      <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', toneClass[tone])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 text-xs leading-relaxed">{children}</div>
    </div>
  );
}

function PriceLegendChip({ color, price }: { color: string; price: string }) {
  return (
    <span className="inline-flex items-center gap-1 pl-1 pr-2 h-5 rounded-full
                     bg-muted/60 border border-border/40 text-[11px] font-medium tabular-nums">
      <span className={cn('inline-block h-3 w-3 rounded-sm', color)} />
      {price}
    </span>
  );
}
