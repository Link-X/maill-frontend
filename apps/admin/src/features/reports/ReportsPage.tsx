import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Wallet,
  ShoppingCart,
  Hourglass,
  Undo2,
  Ticket,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  PieChart as PieIcon,
  Clock,
} from 'lucide-react';
import { cn } from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { DataTable, type Column } from '@/components/DataTable';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { formatDateTime, formatMoney } from '@/lib/format';
import { duration, easing, spring, fadeUp, fadeUpTransition, staggerContainer } from '@/lib/motion';
import {
  useOverviewQuery,
  useTimeseriesQuery,
  useByShowQuery,
  useByCategoryQuery,
  useByCityQuery,
  useStatusDistributionQuery,
  useHourDistributionQuery,
  useBySessionQuery,
  useUserStatsQuery,
  useRefundStatsQuery,
  useCancellationStatsQuery,
  type RangeArg,
  type RangePreset,
  type ByShowItem,
  type BySessionItem,
  type StatusDistributionItem,
} from './reportsApi';

// 用 CSS var 取主题色，跟 area 调色板/brand 保持一致
const CHART_COLORS = [
  'hsl(var(--brand))',
  'hsl(var(--rose))',
  'hsl(var(--amber))',
  'hsl(var(--emerald))',
  'hsl(var(--sky))',
  'hsl(var(--info))',
];
const COLOR_BRAND = 'hsl(var(--brand))';
const COLOR_MUTED = 'hsl(var(--muted-foreground))';

// order status enum → order:status.* key 后缀，供 i18n 查询
const ORDER_STATUS_KEY: Record<number, string> = {
  0: 'pending',
  1: 'paid',
  2: 'cancelled',
  3: 'refunding',
  4: 'refunded',
  5: 'partial',
};
const ORDER_STATUS_COLOR: Record<number, string> = {
  0: 'hsl(var(--warning))',
  1: 'hsl(var(--success))',
  2: 'hsl(var(--muted-foreground))',
  3: 'hsl(var(--info))',
  4: 'hsl(var(--muted-foreground))',
  5: 'hsl(var(--brand))',
};

const fmtPct = (v: number | undefined | null) =>
  v == null || Number.isNaN(v) ? '-' : `${(v * 100).toFixed(1)}%`;

export default function ReportsPage() {
  const { t } = useTranslation(['report', 'common']);
  const [preset, setPreset] = useState<RangePreset | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const queryArg: RangeArg = useMemo(() => {
    if (preset === 'custom') {
      return {
        startTime: customStart ? `${customStart}:00` : undefined,
        endTime: customEnd ? `${customEnd}:00` : undefined,
      };
    }
    return { range: preset };
  }, [preset, customStart, customEnd]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('report:page.title')}
        subtitle={t('report:page.subtitle')}
        icon={BarChart3}
      />

      <RangePicker
        preset={preset}
        onPresetChange={setPreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomChange={(s, e) => {
          setCustomStart(s);
          setCustomEnd(e);
        }}
      />

      <OverviewKpis arg={queryArg} />

      <FadeSection delay={0.18}>
        <TrendSection arg={queryArg} />
      </FadeSection>

      <FadeSection delay={0.24}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ByShowSection arg={queryArg} className="lg:col-span-2" />
          <ByCategorySection arg={queryArg} />
        </div>
      </FadeSection>

      <FadeSection delay={0.3}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ByCitySection arg={queryArg} />
          <StatusDistributionSection arg={queryArg} />
          <HourDistributionSection arg={queryArg} />
        </div>
      </FadeSection>

      <FadeSection delay={0.36}>
        <BySessionSection arg={queryArg} />
      </FadeSection>

      <FadeSection delay={0.42}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <UserStatsCard arg={queryArg} />
          <RefundStatsCard arg={queryArg} />
          <CancellationStatsCard arg={queryArg} />
        </div>
      </FadeSection>
    </div>
  );
}

// 简单的 fade-up 区块包装，让大段图表分批进入
function FadeSection({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: easing.emphasized, delay }}
    >
      {children}
    </motion.div>
  );
}

// ===================== 时间窗口 =====================
function RangePicker({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  preset: RangePreset | 'custom';
  onPresetChange: (p: RangePreset | 'custom') => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (s: string, e: string) => void;
}) {
  const { t } = useTranslation('report');
  // 1d 复用现有 range.today key
  const presets: Array<{ key: RangePreset | 'custom'; label: string }> = [
    { key: '1d', label: t('report:range.today') },
    { key: '7d', label: t('report:range.7d') },
    { key: '30d', label: t('report:range.30d') },
    { key: '90d', label: t('report:range.90d') },
    { key: 'custom', label: t('report:range.custom') },
  ];
  return (
    <Card className="p-3 flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {presets.map((p) => {
        const active = preset === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onPresetChange(p.key)}
            className={cn(
              'relative px-3 h-8 rounded-full text-xs font-medium transition-colors',
              active
                ? 'text-brand-foreground'
                : 'text-muted-foreground border border-border/60 hover:text-foreground hover:border-brand/40',
            )}
          >
            {active && (
              <motion.span
                layoutId="report-range-indicator"
                className="absolute inset-0 bg-brand rounded-full shadow-elevate-1"
                transition={spring.snappy}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        );
      })}
      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="datetime-local"
            value={customStart}
            onChange={(e) => onCustomChange(e.target.value, customEnd)}
            className="h-8 px-2 text-xs border border-input bg-background rounded-md"
          />
          <span className="text-xs text-muted-foreground">{t('report:range.to')}</span>
          <input
            type="datetime-local"
            value={customEnd}
            onChange={(e) => onCustomChange(customStart, e.target.value)}
            className="h-8 px-2 text-xs border border-input bg-background rounded-md"
          />
        </div>
      )}
    </Card>
  );
}

// ===================== 顶部 KPI =====================
type KpiKind = 'money' | 'int' | 'percent';
interface KpiItem {
  icon: typeof Wallet;
  label: string;
  numeric: number;
  kind: KpiKind;
  delta?: number;
  sub?: React.ReactNode;
}

function OverviewKpis({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data, isFetching } = useOverviewQuery(arg);
  const kpis: KpiItem[] = [
    {
      icon: Wallet,
      label: t('report:kpi.revenue'),
      numeric: data?.revenue ?? 0,
      kind: 'money',
      delta: data?.revenueDeltaPct,
    },
    {
      icon: ShoppingCart,
      label: t('report:kpi.paidOrders'),
      numeric: data?.orderCount ?? 0,
      kind: 'int',
      delta: data?.orderCountDeltaPct,
    },
    {
      icon: Hourglass,
      label: t('report:kpi.pending'),
      numeric: data?.pendingOrderCount ?? 0,
      kind: 'int',
    },
    {
      icon: Undo2,
      label: t('report:kpi.refundAmount'),
      numeric: data?.refundAmount ?? 0,
      kind: 'money',
      sub: t('report:kpi.refundCountSuffix', { n: data?.refundCount ?? 0 }),
    },
    {
      icon: Ticket,
      label: t('report:kpi.ticketsSold'),
      numeric: data?.ticketSoldCount ?? 0,
      kind: 'int',
    },
    {
      icon: CheckCircle2,
      label: t('report:kpi.verifyRate'),
      numeric: data?.verifyRate ?? 0,
      kind: 'percent',
      sub: t('report:kpi.verifyDetail', {
        verified: data?.ticketVerifiedCount ?? 0,
        sold: data?.ticketSoldCount ?? 0,
      }),
    },
  ];
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      variants={staggerContainer(0.05)}
      initial="hidden"
      animate="show"
    >
      {kpis.map((k) => (
        <motion.div key={k.label} variants={fadeUp} transition={fadeUpTransition}>
          <Card interactive className="p-4 space-y-1.5 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className="h-3.5 w-3.5 text-muted-foreground/70" />
            </div>
            <div className={cn('text-2xl font-semibold tabular-nums', isFetching && 'opacity-50')}>
              <AnimatedNumber
                value={k.numeric}
                format={
                  k.kind === 'money'
                    ? (v) => formatMoney(v)
                    : k.kind === 'percent'
                    ? (v) => `${(v * 100).toFixed(1)}%`
                    : (v) => v.toFixed(0)
                }
              />
            </div>
            <div className="text-[11px] text-muted-foreground min-h-[14px]">
              {k.delta != null ? <DeltaBadge value={k.delta} /> : k.sub ?? ''}
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const { t } = useTranslation('report');
  if (value === 0) return <span className="text-muted-foreground">{t('report:kpi.deltaFlat')}</span>;
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5',
        positive ? 'text-success' : 'text-destructive',
      )}
    >
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}
      {(value * 100).toFixed(1)}%
    </span>
  );
}

// ===================== 趋势 =====================
function TrendSection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data = [] } = useTimeseriesQuery({ ...arg, dim: 'day' });
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium inline-flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-brand" />
          {t('report:trend.title')}
        </div>
        <span className="text-xs text-muted-foreground">
          {t('report:trend.points', { n: data.length })}
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="orderCount" name={t('report:trend.orders')} fill={COLOR_BRAND} radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              dataKey="revenue"
              name={t('report:trend.revenue')}
              stroke="hsl(var(--rose))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              dataKey="refundAmount"
              name={t('report:trend.refund')}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ===================== 演出 Top10 =====================
function ByShowSection({ arg, className }: { arg: RangeArg; className?: string }) {
  const { t } = useTranslation('report');
  const [sort, setSort] = useState<'revenue' | 'tickets' | 'orderCount'>('revenue');
  const { data = [], isFetching } = useByShowQuery({ ...arg, limit: 10, sort });

  const columns: Column<ByShowItem>[] = [
    {
      key: 'name',
      title: t('report:byShow.colShow'),
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{s.showName}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {[s.categoryName, s.cityName].filter(Boolean).join(' · ') || '-'}
          </div>
        </div>
      ),
    },
    { key: 'orderCount', title: t('report:byShow.colOrders'), width: '70px', render: (s) => s.orderCount },
    { key: 'ticketCount', title: t('report:byShow.colTickets'), width: '70px', render: (s) => s.ticketCount },
    {
      key: 'revenue',
      title: t('report:byShow.colRevenue'),
      width: '110px',
      render: (s) => <span className="font-semibold">{formatMoney(s.revenue)}</span>,
    },
  ];

  return (
    <Card className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="font-medium inline-flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-brand" />
          {t('report:byShow.title')}
        </div>
        <div className="flex gap-1">
          {([
            ['revenue', t('report:byShow.sort.revenue')],
            ['tickets', t('report:byShow.sort.tickets')],
            ['orderCount', t('report:byShow.sort.orderCount')],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={cn(
                'px-2 h-6 text-xs rounded-md border transition-colors',
                sort === k
                  ? 'bg-brand text-brand-foreground border-brand'
                  : 'bg-card text-muted-foreground border-border/60 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <DataTable<ByShowItem>
        columns={columns}
        data={data}
        rowKey={(s) => String(s.showId)}
        loading={isFetching}
        empty={t('report:byShow.empty')}
      />
    </Card>
  );
}

// ===================== 分类饼图 =====================
function ByCategorySection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data = [] } = useByCategoryQuery(arg);
  const chartData = data.map((d) => ({
    name: d.categoryName ?? t('report:byCategory.uncategorized'),
    value: d.revenue,
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <PieIcon className="h-4 w-4 text-brand" />
        {t('report:byCategory.title')}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(v: number) => formatMoney(v)}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={70} label={(d) => d.name}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ===================== 城市柱状 =====================
function ByCitySection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data = [] } = useByCityQuery(arg);
  const chartData = data
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((d) => ({ name: d.cityName ?? t('report:byCity.unspecified'), value: d.revenue }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-brand" />
        {t('report:byCity.title')}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <YAxis tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <Tooltip
              formatter={(v: number) => formatMoney(v)}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill={COLOR_BRAND} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ===================== 状态分布饼图 =====================
function StatusDistributionSection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation(['report', 'order']);
  const { data = [] } = useStatusDistributionQuery(arg);
  const chartData = data.map((d: StatusDistributionItem) => ({
    name: ORDER_STATUS_KEY[d.status]
      ? t(`order:status.${ORDER_STATUS_KEY[d.status]}`)
      : String(d.status),
    value: d.count,
    color: ORDER_STATUS_COLOR[d.status] ?? COLOR_MUTED,
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <PieIcon className="h-4 w-4 text-brand" />
        {t('report:statusDistribution.title')}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={60}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ===================== 24h 时段柱状 =====================
function HourDistributionSection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data = [] } = useHourDistributionQuery(arg);
  const chartData = data.map((d) => ({
    name: `${d.hour}${t('report:hourDistribution.hourSuffix')}`,
    value: d.orderCount,
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-brand" />
        {t('report:hourDistribution.title')}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: COLOR_MUTED }} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: COLOR_MUTED }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ===================== 场次售罄率 =====================
function BySessionSection({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data = [], isFetching } = useBySessionQuery({ ...arg, limit: 20, sort: 'fillRate' });

  const columns: Column<BySessionItem>[] = [
    {
      key: 'show',
      title: t('report:bySession.colShow'),
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{s.showName}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {s.sessionName} · {formatDateTime(s.startTime)}
          </div>
        </div>
      ),
    },
    {
      key: 'fill',
      title: t('report:bySession.colFill'),
      width: '180px',
      render: (s) => <FillBar rate={s.fillRate} sold={s.soldSeats} total={s.totalSeats} />,
    },
    {
      key: 'revenue',
      title: t('report:bySession.colRevenue'),
      width: '110px',
      render: (s) => <span className="font-semibold">{formatMoney(s.revenue)}</span>,
    },
  ];

  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-brand" />
        {t('report:bySession.title')}
      </div>
      <DataTable<BySessionItem>
        columns={columns}
        data={data}
        rowKey={(s) => String(s.sessionId)}
        loading={isFetching}
        empty={t('report:bySession.empty')}
      />
    </Card>
  );
}

function FillBar({ rate, sold, total }: { rate: number; sold: number; total: number }) {
  const pct = Math.max(0, Math.min(1, rate));
  const color =
    pct >= 0.9 ? 'bg-destructive' : pct >= 0.7 ? 'bg-warning' : pct >= 0.4 ? 'bg-brand' : 'bg-info';
  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
        <div className={cn('h-full transition-all', color)} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="text-[11px] text-muted-foreground">
        {sold} / {total} · {fmtPct(rate)}
      </div>
    </div>
  );
}

// ===================== 用户行为 =====================
function UserStatsCard({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data } = useUserStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Users className="h-4 w-4 text-brand" />
        {t('report:userStats.title')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label={t('report:userStats.totalBuyers')} value={String(data?.totalBuyers ?? 0)} />
        <StatItem
          label={t('report:userStats.repeatBuyers')}
          value={String(data?.repeatBuyers ?? 0)}
          sub={fmtPct(data?.repeatRate)}
        />
        <StatItem label={t('report:userStats.avgOrderValue')} value={formatMoney(data?.avgOrderValue ?? 0)} />
        <StatItem
          label={t('report:userStats.avgSeats')}
          value={data?.avgSeatsPerOrder?.toFixed(2) ?? '0'}
          sub={t('report:userStats.avgSeatsUnit')}
        />
      </div>
    </Card>
  );
}

function RefundStatsCard({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data } = useRefundStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Undo2 className="h-4 w-4 text-brand" />
        {t('report:refundStats.title')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label={t('report:refundStats.refundAmount')} value={formatMoney(data?.refundAmount ?? 0)} />
        <StatItem
          label={t('report:refundStats.refundRate')}
          value={fmtPct(data?.refundRate)}
          sub={t('report:refundStats.ofRevenue')}
        />
        <StatItem label={t('report:refundStats.fullRefund')} value={String(data?.fullRefundCount ?? 0)} />
        <StatItem
          label={t('report:refundStats.partialRefund')}
          value={String(data?.partialRefundCount ?? 0)}
          sub={
            data?.refundingCount ? (
              <Badge variant="info">
                {t('report:refundStats.processing', { n: data.refundingCount })}
              </Badge>
            ) : undefined
          }
        />
      </div>
    </Card>
  );
}

function CancellationStatsCard({ arg }: { arg: RangeArg }) {
  const { t } = useTranslation('report');
  const { data } = useCancellationStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Hourglass className="h-4 w-4 text-brand" />
        {t('report:cancellationStats.title')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label={t('report:cancellationStats.createdCount')} value={String(data?.createdCount ?? 0)} />
        <StatItem label={t('report:cancellationStats.cancelRate')} value={fmtPct(data?.cancelRate)} />
        <StatItem label={t('report:cancellationStats.expired')} value={String(data?.expiredCancelledCount ?? 0)} />
        <StatItem label={t('report:cancellationStats.userCancelled')} value={String(data?.userCancelledCount ?? 0)} />
      </div>
    </Card>
  );
}

function StatItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
