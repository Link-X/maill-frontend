import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  selectThemeMode,
  setTheme,
  selectLocale,
  setLocale,
  type ThemeMode,
  type AppLocale,
  OrderStatus,
  cn,
} from '@maill/shared';
import { logout, selectUser } from '@/features/auth/authSlice';
import {
  ScanLine,
  Users,
  Heart,
  Newspaper,
  Bell,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  UserRound,
  Wallet,
  CheckCircle2,
  RotateCcw,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { useUnreadCountsQuery } from '@/features/messages/messagesApi';

const themeOptions: { value: ThemeMode; icon: LucideIcon; key: string }[] = [
  { value: 'light', icon: Sun, key: 'common:theme.light' },
  { value: 'dark', icon: Moon, key: 'common:theme.dark' },
  { value: 'system', icon: Monitor, key: 'common:theme.system' },
];

const localeOptions: { value: AppLocale; key: string }[] = [
  { value: 'zh-CN', key: 'common:locale.zh-CN' },
  { value: 'en-US', key: 'common:locale.en-US' },
];

// stagger 入场动画
const sectionVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const } },
};

export default function ProfilePage() {
  const { t } = useTranslation(['common', 'auth', 'order', 'artist', 'article', 'message']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);
  const { data: counts } = useUnreadCountsQuery();
  const unreadTotal = counts?.total ?? 0;

  const orderQuickEntries: { icon: LucideIcon; label: string; status?: OrderStatus }[] = [
    { icon: Wallet, label: t('order:status.pending'), status: OrderStatus.PendingPayment },
    { icon: CheckCircle2, label: t('order:status.paid'), status: OrderStatus.Paid },
    { icon: RotateCcw, label: t('order:status.refunded'), status: OrderStatus.Refunded },
    { icon: Receipt, label: t('show:list.allCategories', { defaultValue: '全部订单' }), status: undefined },
  ];

  const goOrders = (status?: OrderStatus) => {
    if (status === undefined) navigate('/orders');
    else navigate(`/orders?status=${status}`);
  };

  return (
    <div className="pb-8">
      {/* ===== Hero 头部:渐变背景 + 装饰光斑 + 大头像 ===== */}
      {/* isolate 强制 header 建立独立堆叠上下文,锁住内部 absolute 元素的 z-index,
          避免 PageTransition 的 transform 撤销后背景层 "逃逸" 到外层被遮住 */}
      <header className="relative isolate pt-12 pb-16 px-5 overflow-hidden">
        {/* 背景渐变 + 两个装饰光球 */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand opacity-95" />
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/25 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-black/15 blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="relative flex items-center gap-4"
        >
          <div
            className="h-[68px] w-[68px] rounded-full
                       bg-white/25 backdrop-blur-md
                       ring-2 ring-white/40 shadow-lg shadow-black/20
                       flex items-center justify-center shrink-0"
          >
            <UserRound className="h-9 w-9 text-white" />
          </div>
          <div className="min-w-0 flex-1 text-white">
            <h2 className="text-xl font-semibold truncate drop-shadow-sm">
              {user?.username ?? '-'}
            </h2>
            <p className="text-xs text-white/80 mt-1 font-mono">UID · {user?.userId ?? '-'}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 shrink-0" />
        </motion.div>
      </header>

      {/* ===== 订单状态快捷入口:横向 4 格,浮在 hero 底部 ===== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="relative -mt-10 px-4"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-card border border-border/60
                     shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]
                     overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="text-sm font-semibold">{t('common:tabBar.orders')}</h3>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="text-xs text-muted-foreground inline-flex items-center gap-0.5 hover:text-brand transition-colors"
            >
              查看全部 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 px-1 pb-3 pt-1">
            {orderQuickEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.label + String(entry.status)}
                  type="button"
                  onClick={() => goOrders(entry.status)}
                  className="group flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
                >
                  <span className="h-10 w-10 rounded-xl bg-gradient-brand-soft text-brand
                                   flex items-center justify-center
                                   group-hover:scale-105 transition-transform duration-200">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-[11px] text-foreground/80">{entry.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.section>

      {/* ===== 关注与收藏 ===== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="px-4 mt-5"
      >
        <SectionTitle>我的收藏</SectionTitle>
        <motion.div variants={itemVariants}>
          <Card>
            <ListRow
              icon={Users}
              tone="violet"
              label={t('artist:user.listTitle')}
              onClick={() => navigate('/artists')}
            />
            <Divider />
            <ListRow
              icon={Heart}
              tone="rose"
              label={t('artist:user.follows')}
              onClick={() => navigate('/follows')}
            />
            <Divider />
            <ListRow
              icon={Heart}
              tone="rose"
              iconFilled
              label="收藏的演出"
              onClick={() => navigate('/favorites')}
            />
            <Divider />
            <ListRow
              icon={Bell}
              tone="amber"
              label="我的订阅"
              onClick={() => navigate('/subscriptions')}
            />
          </Card>
        </motion.div>
      </motion.section>

      {/* ===== 消息与内容 ===== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="px-4 mt-5"
      >
        <SectionTitle>消息与服务</SectionTitle>
        <motion.div variants={itemVariants}>
          <Card>
            <ListRow
              icon={Bell}
              tone="sky"
              label={t('message:page.title')}
              badge={unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : String(unreadTotal)) : undefined}
              onClick={() => navigate('/messages')}
            />
            <Divider />
            <ListRow
              icon={Newspaper}
              tone="emerald"
              label={t('article:user.listTitle')}
              onClick={() => navigate('/articles')}
            />
            <Divider />
            <ListRow
              icon={ScanLine}
              tone="brand"
              label={t('order:verify.title')}
              onClick={() => navigate('/verify')}
            />
          </Card>
        </motion.div>
      </motion.section>

      {/* ===== 偏好设置 ===== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="px-4 mt-5"
      >
        <SectionTitle>偏好设置</SectionTitle>
        <motion.div variants={itemVariants}>
          <Card>
            <SettingRow icon={Monitor} tone="brand" label={t('common:profile.theme')}>
              <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = themeMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => dispatch(setTheme(opt.value))}
                      aria-label={t(opt.key)}
                      title={t(opt.key)}
                      className={cn(
                        'h-7 w-7 rounded-md flex items-center justify-center transition-all',
                        active
                          ? 'bg-card text-brand shadow-sm scale-105'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </SettingRow>
            <Divider />
            <SettingRow icon={Languages} tone="brand" label={t('common:profile.language')}>
              <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
                {localeOptions.map((opt) => {
                  const active = locale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => dispatch(setLocale(opt.value))}
                      className={cn(
                        'px-2.5 h-7 rounded-md text-xs font-medium transition-all',
                        active
                          ? 'bg-card text-brand shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(opt.key)}
                    </button>
                  );
                })}
              </div>
            </SettingRow>
          </Card>
        </motion.div>
      </motion.section>

      {/* ===== 退出登录 ===== */}
      <section className="px-4 mt-7">
        <button
          type="button"
          onClick={() => {
            dispatch(logout());
            navigate('/login', { replace: true });
          }}
          className="w-full h-11 rounded-xl bg-card border border-border/60
                     text-destructive text-sm font-medium
                     flex items-center justify-center gap-1.5
                     hover:bg-destructive/5 hover:border-destructive/30
                     active:scale-[0.98] transition-all"
        >
          <LogOut className="h-4 w-4" />
          {t('auth:logout')}
        </button>
      </section>

      {/* ===== 底部版本号 ===== */}
      <footer className="text-center mt-6 text-[11px] text-muted-foreground/70">
        Maill · v1.0.0
      </footer>
    </div>
  );
}

// ===== 内部子组件 =====

type Tone = 'brand' | 'rose' | 'violet' | 'amber' | 'sky' | 'emerald';

const toneClass: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  rose: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1 tracking-wide">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="h-px bg-border/40 ml-[3.5rem]" />;
}

function ListRow({
  icon: Icon,
  label,
  tone = 'brand',
  iconFilled,
  badge,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  iconFilled?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 h-[52px]
                 hover:bg-accent/40 active:bg-accent/60 transition-colors text-left"
    >
      <span className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', toneClass[tone])}>
        <Icon className={cn('h-[18px] w-[18px]', iconFilled && 'fill-current')} />
      </span>
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      {badge !== undefined && (
        <span className="min-w-[20px] h-5 rounded-full bg-destructive text-white text-[11px] font-semibold px-1.5 flex items-center justify-center">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  tone = 'brand',
  children,
}: {
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 h-[52px]">
      <span className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', toneClass[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
