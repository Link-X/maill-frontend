import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  selectThemeMode,
  setTheme,
  selectLocale,
  setLocale,
  type ThemeMode,
  type AppLocale,
  cn,
} from '@maill/shared';
import { logout, selectUser } from '@/features/auth/authSlice';
import {
  ScanLine,
  Users,
  Heart,
  Newspaper,
  Bell,
  Receipt,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  UserRound,
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

export default function ProfilePage() {
  const { t } = useTranslation(['common', 'auth', 'order', 'artist', 'article', 'message']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);
  const { data: counts } = useUnreadCountsQuery();
  const unreadTotal = counts?.total ?? 0;

  return (
    <div className="pb-6">
      {/* 用户信息头部 */}
      <header className="relative px-4 pt-8 pb-6 bg-gradient-brand-soft">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-sm ring-2 ring-white/40">
            <UserRound className="h-8 w-8 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold truncate">{user?.username ?? '-'}</h2>
            <p className="text-xs text-muted-foreground mt-1">UID: {user?.userId ?? '-'}</p>
          </div>
        </div>
      </header>

      {/* 我的订单区(主要入口,大卡片显示) */}
      <section className="px-4 -mt-4">
        <Card>
          <ListRow
            icon={Receipt}
            label={t('common:tabBar.orders')}
            onClick={() => navigate('/orders')}
          />
          <Divider />
          <ListRow
            icon={ScanLine}
            label={t('order:verify.title')}
            onClick={() => navigate('/verify')}
          />
        </Card>
      </section>

      {/* 关注与收藏 */}
      <section className="px-4 mt-4">
        <SectionTitle>关注</SectionTitle>
        <Card>
          <ListRow
            icon={Users}
            label={t('artist:user.listTitle')}
            onClick={() => navigate('/artists')}
          />
          <Divider />
          <ListRow
            icon={Heart}
            label={t('artist:user.follows')}
            onClick={() => navigate('/follows')}
          />
          <Divider />
          <ListRow
            icon={Heart}
            label="我的收藏"
            iconFilled
            onClick={() => navigate('/favorites')}
          />
          <Divider />
          <ListRow
            icon={Bell}
            label="我的订阅"
            onClick={() => navigate('/subscriptions')}
          />
        </Card>
      </section>

      {/* 消息中心与内容 */}
      <section className="px-4 mt-4">
        <SectionTitle>消息</SectionTitle>
        <Card>
          <ListRow
            icon={Bell}
            label={t('message:page.title')}
            badge={unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : String(unreadTotal)) : undefined}
            onClick={() => navigate('/messages')}
          />
          <Divider />
          <ListRow
            icon={Newspaper}
            label={t('article:user.listTitle')}
            onClick={() => navigate('/articles')}
          />
        </Card>
      </section>

      {/* 设置 */}
      <section className="px-4 mt-4">
        <SectionTitle>设置</SectionTitle>
        <Card>
          <SettingRow icon={Monitor} label={t('common:profile.theme')}>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
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
                      'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                      active
                        ? 'bg-card text-brand shadow-sm'
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
          <SettingRow icon={Languages} label={t('common:profile.language')}>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {localeOptions.map((opt) => {
                const active = locale === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => dispatch(setLocale(opt.value))}
                    className={cn(
                      'px-2.5 h-7 rounded-md text-xs font-medium transition-colors',
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
      </section>

      {/* 退出登录 */}
      <section className="px-4 mt-6">
        <button
          type="button"
          onClick={() => {
            dispatch(logout());
            navigate('/login', { replace: true });
          }}
          className="w-full h-11 rounded-xl bg-card border border-border/60 text-destructive text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('auth:logout')}
        </button>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">{children}</h3>
  );
}

function Divider() {
  return <div className="h-px bg-border/50 ml-12" />;
}

function ListRow({
  icon: Icon,
  label,
  iconFilled,
  badge,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  iconFilled?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 h-12 hover:bg-accent/40 transition-colors text-left"
    >
      <span className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
        <Icon className={cn('h-4 w-4', iconFilled && 'fill-current')} />
      </span>
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      {badge !== undefined && (
        <span className="min-w-[20px] h-5 rounded-full bg-destructive text-white text-xs px-1.5 flex items-center justify-center">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 h-12">
      <span className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
