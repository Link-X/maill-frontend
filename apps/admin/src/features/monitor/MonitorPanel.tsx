import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Armchair, Layers, ShoppingBag, Activity } from 'lucide-react';
import { Card } from '@/components/Card';
import { useGetDashboardQuery } from './monitorApi';

interface Props {
  sessionId: number | string;
}

const COLORS = {
  available: 'hsl(var(--success))',
  sold: 'hsl(var(--brand))',
};

export function MonitorPanel({ sessionId }: Props) {
  const { t } = useTranslation('session');
  const { data, isLoading } = useGetDashboardQuery(sessionId, {
    skip: !sessionId,
    pollingInterval: 5000,
  });

  if (isLoading || !data) {
    return (
      <Card variant="glass" className="p-5 animate-pulse">
        <div className="h-24 bg-muted rounded" />
      </Card>
    );
  }

  const soldPct = data.totalSeats > 0 ? Math.round((data.soldCount / data.totalSeats) * 100) : 0;
  const chartData = [
    { name: 'sold', value: data.soldCount },
    { name: 'available', value: data.availableCount },
  ];

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-brand" />
        <h3 className="font-semibold">{t('session:monitor.title')}</h3>
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-4">
        <div className="relative h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.sold} />
                <Cell fill={COLORS.available} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              key={soldPct}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="text-2xl font-semibold text-brand"
            >
              {soldPct}%
            </motion.div>
            <div className="text-xs text-muted-foreground">{t('session:monitor.sold')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 self-center">
          <Metric label={t('session:monitor.totalSeats')} value={data.totalSeats} icon={Layers} color="text-foreground" />
          <Metric label={t('session:monitor.sold')} value={data.soldCount} icon={ShoppingBag} color="text-brand" />
          <Metric label={t('session:monitor.available')} value={data.availableCount} icon={Armchair} color="text-success" />
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Armchair;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/60">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`font-semibold ${color} tabular-nums`}
      >
        {value}
      </motion.span>
    </div>
  );
}
