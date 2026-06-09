import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MapPin, Info, Clock, ChevronDown, ChevronRight, Timer, CalendarX } from 'lucide-react';
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
import { useGetSessionDetailQuery, useGetMyPurchaseLimitQuery } from './sessionsApi';
import { buildPriceColorMap } from './SeatGrid';
import { PriceLegendCard } from './PriceLegendCard';
import { SessionPageHeader } from './SessionPageHeader';
import { AllocateAreaSection } from './AllocateAreaSection';
import { setSessionContext } from './cartSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

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

  // 我的剩余可购张数(仅登录态有效;每次进入页面强制刷新一次)
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
        (data?.areaPriceList ?? [])
          .filter((a) => a.saleMode === 2)
          .map((a) => a.areaId),
      ),
    [data?.areaPriceList],
  );
  // 是否存在任何选座区 — 用于决定要不要渲染整张座位图
  // 极端场景:全场都是派座 → 座位图毫无意义,直接隐藏,让派座卡片成为主视觉
  const hasPickModeAreas = useMemo(
    () => (data?.areaPriceList ?? []).some((a) => (a.saleMode ?? 1) === 1),
    [data?.areaPriceList],
  );

  // 自动直达:整场都是用户选座(无派座区)→ 直接跳独立选座页;
  // 用 replace 让历史栈为 [show, seat],从选座页返回回到 show 页,杜绝 session↔seat 死循环
  useEffect(() => {
    if (data && hasPickModeAreas && allocateAreaIds.size === 0) {
      navigate(`/session/${sessionId}/seat`, { replace: true });
    }
  }, [data, hasPickModeAreas, allocateAreaIds, sessionId, navigate]);

  // 计算用户在本场次的"剩余可购张数"作为下单上限。
  //  - 已登录:用后端 myLimit.remaining(扣过已锁定+已支付)
  //  - 未登录:回退到场次的 limitPerUser(下单时后端会再校验,登录后这里会更准)
  const sessionLimitPerUser = data?.session.limitPerUser ?? 4;
  const effectiveLimit = isAuthed
    ? Math.max(0, myLimit?.remaining ?? sessionLimitPerUser)
    : sessionLimitPerUser;

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

  const { session, areaPriceList, showName, showVenue, showAddress, showCityName } = data;
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
      {/* ===== 沉浸式 header(共享组件) ===== */}
      <SessionPageHeader
        title={showName ?? session.name ?? `场次 #${session.id}`}
        startTime={session.startTime}
        sessionName={session.name}
        showName={showName}
      />

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

      {/* ===== 价格图例(共享组件) ===== */}
      <div className="px-4 mb-3">
        <PriceLegendCard areaPriceList={areaPriceList} priceColorMap={priceColorMap} />
      </div>

      {/* ===== 派座区(saleMode=2)— 内联下单,不进购物车 ===== */}
      <AllocateAreaSection
        sessionId={sessionId}
        areaPriceList={areaPriceList}
        priceColorMap={priceColorMap}
        onSale={sessionStatus === SessionStatus.Published}
        remainingLimit={effectiveLimit}
      />

      {/* ===== 选座区(saleMode=1)— 改为入口卡片,点击进独立选座页 ===== */}
      {/* 注:整场都是选座的场次已在上方 useEffect 自动直达选座页,不会渲染到这里; */}
      {/* 这里只在"混合模式"(派座 + 选座并存)下展示选座入口 */}
      {(() => {
        const pickAreas = areaPriceList.filter((a) => (a.saleMode ?? 1) === 1);
        if (pickAreas.length === 0) return null;
        return (
          <div className="px-4 space-y-2">
            {pickAreas.map((a) => (
              <PickAreaCard
                key={a.areaId}
                color={priceColorMap.get(a.areaId) ?? '#94a3b8'}
                price={formatMoney(a.price)}
                label={t('session:userSeat.goPick')}
                sub={t('session:userSeat.pickAreaSub')}
                onClick={() => navigate(`/session/${sessionId}/seat`)}
              />
            ))}
          </div>
        );
      })()}
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

function PickAreaCard({
  color,
  price,
  label,
  sub,
  onClick,
}: {
  color: string;
  price: string;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                 bg-card border border-border/60
                 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]
                 hover:border-brand/30 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)]
                 active:scale-[0.99] transition-all duration-200"
    >
      <span className="inline-block h-9 w-9 rounded-xl shrink-0" style={{ background: color }} />
      <div className="min-w-0 flex-1 text-left">
        <div className="font-semibold tabular-nums">{price}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand shrink-0">
        {label}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}
