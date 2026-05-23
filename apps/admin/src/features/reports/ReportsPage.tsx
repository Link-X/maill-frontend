import { useMemo, useState } from 'react';
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
import { formatDateTime, formatMoney } from '@/lib/format';
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

const ORDER_STATUS_LABEL: Record<number, string> = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '退款中',
  4: '已退款',
  5: '部分退款',
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
  // 时间窗口：preset 或自定义；toQueryArg 把它转成接口入参
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
        title="数据报表"
        subtitle="营收 / 订单 / 演出 / 用户多维度看板"
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
      <TrendSection arg={queryArg} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ByShowSection arg={queryArg} className="lg:col-span-2" />
        <ByCategorySection arg={queryArg} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ByCitySection arg={queryArg} />
        <StatusDistributionSection arg={queryArg} />
        <HourDistributionSection arg={queryArg} />
      </div>

      <BySessionSection arg={queryArg} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UserStatsCard arg={queryArg} />
        <RefundStatsCard arg={queryArg} />
        <CancellationStatsCard arg={queryArg} />
      </div>
    </div>
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
  const presets: Array<{ key: RangePreset | 'custom'; label: string }> = [
    { key: '1d', label: '今日' },
    { key: '7d', label: '近 7 天' },
    { key: '30d', label: '近 30 天' },
    { key: '90d', label: '近 90 天' },
    { key: 'custom', label: '自定义' },
  ];
  return (
    <Card className="p-3 flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {presets.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onPresetChange(p.key)}
          className={cn(
            'px-3 h-8 rounded-full text-xs font-medium border transition-colors',
            preset === p.key
              ? 'bg-brand text-brand-foreground border-brand shadow-sm'
              : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:border-brand/40',
          )}
        >
          {p.label}
        </button>
      ))}
      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="datetime-local"
            value={customStart}
            onChange={(e) => onCustomChange(e.target.value, customEnd)}
            className="h-8 px-2 text-xs border border-input bg-background rounded-md"
          />
          <span className="text-xs text-muted-foreground">至</span>
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
function OverviewKpis({ arg }: { arg: RangeArg }) {
  const { data, isFetching } = useOverviewQuery(arg);
  const kpis = [
    {
      icon: Wallet,
      label: '营收',
      value: formatMoney(data?.revenue ?? 0),
      delta: data?.revenueDeltaPct,
    },
    {
      icon: ShoppingCart,
      label: '已支付订单',
      value: String(data?.orderCount ?? 0),
      delta: data?.orderCountDeltaPct,
    },
    {
      icon: Hourglass,
      label: '待支付',
      value: String(data?.pendingOrderCount ?? 0),
    },
    {
      icon: Undo2,
      label: '退款金额',
      value: formatMoney(data?.refundAmount ?? 0),
      sub: `${data?.refundCount ?? 0} 笔`,
    },
    {
      icon: Ticket,
      label: '已售票数',
      value: String(data?.ticketSoldCount ?? 0),
    },
    {
      icon: CheckCircle2,
      label: '核销率',
      value: fmtPct(data?.verifyRate),
      sub: `${data?.ticketVerifiedCount ?? 0} / ${data?.ticketSoldCount ?? 0}`,
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <k.icon className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
          <div className={cn('text-2xl font-semibold', isFetching && 'opacity-50')}>{k.value}</div>
          <div className="text-[11px] text-muted-foreground min-h-[14px]">
            {k.delta != null ? <DeltaBadge value={k.delta} /> : k.sub ?? ''}
          </div>
        </Card>
      ))}
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">持平</span>;
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
  const { data = [] } = useTimeseriesQuery({ ...arg, dim: 'day' });
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium inline-flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-brand" />
          营收 / 订单趋势
        </div>
        <span className="text-xs text-muted-foreground">{data.length} 个数据点</span>
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
            <Bar yAxisId="left" dataKey="orderCount" name="订单数" fill={COLOR_BRAND} radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              dataKey="revenue"
              name="营收"
              stroke="hsl(var(--rose))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              dataKey="refundAmount"
              name="退款"
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
  const [sort, setSort] = useState<'revenue' | 'tickets' | 'orderCount'>('revenue');
  const { data = [], isFetching } = useByShowQuery({ ...arg, limit: 10, sort });

  const columns: Column<ByShowItem>[] = [
    {
      key: 'name',
      title: '演出',
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{s.showName}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {[s.categoryName, s.cityName].filter(Boolean).join(' · ') || '-'}
          </div>
        </div>
      ),
    },
    { key: 'orderCount', title: '订单', width: '70px', render: (s) => s.orderCount },
    { key: 'ticketCount', title: '票数', width: '70px', render: (s) => s.ticketCount },
    {
      key: 'revenue',
      title: '营收',
      width: '110px',
      render: (s) => <span className="font-semibold">{formatMoney(s.revenue)}</span>,
    },
  ];

  return (
    <Card className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="font-medium inline-flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-brand" />
          演出销售榜 Top 10
        </div>
        <div className="flex gap-1">
          {([
            ['revenue', '营收'],
            ['tickets', '票数'],
            ['orderCount', '订单'],
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
        empty="暂无演出销售数据"
      />
    </Card>
  );
}

// ===================== 分类饼图 =====================
function ByCategorySection({ arg }: { arg: RangeArg }) {
  const { data = [] } = useByCategoryQuery(arg);
  const chartData = data.map((d) => ({
    name: d.categoryName ?? '未分类',
    value: d.revenue,
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <PieIcon className="h-4 w-4 text-brand" />
        分类营收占比
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
  const { data = [] } = useByCityQuery(arg);
  const chartData = data
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((d) => ({ name: d.cityName ?? '未指定', value: d.revenue }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-brand" />
        城市营收
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
  const { data = [] } = useStatusDistributionQuery(arg);
  const chartData = data.map((d: StatusDistributionItem) => ({
    name: ORDER_STATUS_LABEL[d.status] ?? String(d.status),
    value: d.count,
    color: ORDER_STATUS_COLOR[d.status] ?? COLOR_MUTED,
  }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <PieIcon className="h-4 w-4 text-brand" />
        订单状态分布
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
  const { data = [] } = useHourDistributionQuery(arg);
  const chartData = data.map((d) => ({ name: `${d.hour}时`, value: d.orderCount }));
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-brand" />
        24h 下单时段
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
  const { data = [], isFetching } = useBySessionQuery({ ...arg, limit: 20, sort: 'fillRate' });

  const columns: Column<BySessionItem>[] = [
    {
      key: 'show',
      title: '演出 · 场次',
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
      title: '售罄率',
      width: '180px',
      render: (s) => <FillBar rate={s.fillRate} sold={s.soldSeats} total={s.totalSeats} />,
    },
    {
      key: 'revenue',
      title: '营收',
      width: '110px',
      render: (s) => <span className="font-semibold">{formatMoney(s.revenue)}</span>,
    },
  ];

  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-brand" />
        场次售罄率排行
      </div>
      <DataTable<BySessionItem>
        columns={columns}
        data={data}
        rowKey={(s) => String(s.sessionId)}
        loading={isFetching}
        empty="暂无场次数据"
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
  const { data } = useUserStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Users className="h-4 w-4 text-brand" />
        用户行为
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="购买用户" value={String(data?.totalBuyers ?? 0)} />
        <StatItem
          label="复购用户"
          value={String(data?.repeatBuyers ?? 0)}
          sub={fmtPct(data?.repeatRate)}
        />
        <StatItem label="客单价" value={formatMoney(data?.avgOrderValue ?? 0)} />
        <StatItem
          label="平均座位"
          value={data?.avgSeatsPerOrder?.toFixed(2) ?? '0'}
          sub="个/单"
        />
      </div>
    </Card>
  );
}

function RefundStatsCard({ arg }: { arg: RangeArg }) {
  const { data } = useRefundStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Undo2 className="h-4 w-4 text-brand" />
        退款指标
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="退款金额" value={formatMoney(data?.refundAmount ?? 0)} />
        <StatItem label="退款率" value={fmtPct(data?.refundRate)} sub="占营收" />
        <StatItem label="全额退款" value={String(data?.fullRefundCount ?? 0)} />
        <StatItem
          label="部分退款"
          value={String(data?.partialRefundCount ?? 0)}
          sub={
            data?.refundingCount ? (
              <Badge variant="info">{data.refundingCount} 处理中</Badge>
            ) : undefined
          }
        />
      </div>
    </Card>
  );
}

function CancellationStatsCard({ arg }: { arg: RangeArg }) {
  const { data } = useCancellationStatsQuery(arg);
  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium inline-flex items-center gap-1.5">
        <Hourglass className="h-4 w-4 text-brand" />
        取消率
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="新建订单" value={String(data?.createdCount ?? 0)} />
        <StatItem label="取消率" value={fmtPct(data?.cancelRate)} />
        <StatItem label="超时取消" value={String(data?.expiredCancelledCount ?? 0)} />
        <StatItem label="用户取消" value={String(data?.userCancelledCount ?? 0)} />
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
