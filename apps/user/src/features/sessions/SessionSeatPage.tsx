import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Info, Clock, Calendar, ChevronDown, Timer, CalendarX } from 'lucide-react';
import {
  extractErrorMessage,
  notify,
  parseExtend,
  cn,
  SessionStatus,
  type SessionExtend,
} from '@maill/shared';
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

  const sessionStatus = Number(session.status);

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

      {/* ===== 状态横幅:未开售/已结束时显示 ===== */}
      {sessionStatus !== SessionStatus.Published && (
        <div className="px-4 mb-3">
          <SessionStatusBanner
            status={sessionStatus}
            openSaleTime={session.openSaleTime}
          />
        </div>
      )}

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
                color={priceColorMap.get(p.areaId) ?? '#94a3b8'}
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

      <SelectionBar
        sessionId={sessionId}
        limitPerUser={session.limitPerUser ?? 4}
        sessionStatus={sessionStatus}
      />
    </div>
  );
}

/** 把"开售剩余毫秒"格式化为 D 天 H 小时 M 分 S 秒 */
function formatCountdown(ms: number, t: (k: string) => string): string {
  if (ms <= 0) return '0' + t('session:userSeat.seconds');
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${t('session:userSeat.days')}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${t('session:userSeat.hours')}`);
  if (minutes > 0 || hours > 0 || days > 0)
    parts.push(`${minutes}${t('session:userSeat.minutes')}`);
  parts.push(`${seconds}${t('session:userSeat.seconds')}`);
  return parts.join(' ');
}

function SessionStatusBanner({
  status,
  openSaleTime,
}: {
  status: number;
  openSaleTime?: string;
}) {
  const { t } = useTranslation(['session']);
  const targetTs = openSaleTime ? new Date(openSaleTime).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== SessionStatus.Draft || !targetTs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, targetTs]);

  if (status === SessionStatus.Ended) {
    return (
      <div className="rounded-2xl bg-muted/60 border border-border/60 p-3 flex items-center gap-2">
        <CalendarX className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="text-sm text-muted-foreground">{t('session:userSeat.endedBanner')}</div>
      </div>
    );
  }

  // status=0 未开售
  const remainMs = targetTs - now;
  const showCountdown = targetTs > 0 && remainMs > 0;
  return (
    <div className="rounded-2xl bg-warning/10 border border-warning/30 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-warning shrink-0" />
        <div className="text-sm font-medium text-warning-foreground/90">
          {t('session:userSeat.notOnSaleBanner')}
        </div>
      </div>
      {openSaleTime && (
        <div className="text-[11px] text-muted-foreground pl-6">
          {t('session:userSeat.openSaleAt', {
            time: formatDateTime(openSaleTime),
          })}
        </div>
      )}
      {showCountdown && (
        <div className="text-[12px] font-semibold text-warning pl-6 tabular-nums">
          {t('session:userSeat.countdownPrefix')} {formatCountdown(remainMs, t)}
        </div>
      )}
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
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {price}
    </span>
  );
}
