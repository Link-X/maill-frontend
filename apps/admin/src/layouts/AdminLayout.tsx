import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CalendarRange,
  Building2,
  Receipt,
  Tag,
  BarChart3,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
} from 'lucide-react';
import {
  Button,
  cn,
  selectThemeMode,
  setTheme,
  selectLocale,
  setLocale,
  type ThemeMode,
  type AppLocale,
} from '@maill/shared';
import { logout, selectUser } from '@/features/auth/adminAuthSlice';
import { PageTransition } from '@/components/PageTransition';

const navItems = [
  { to: '/shows', key: 'admin:nav.shows', icon: CalendarRange },
  { to: '/categories', key: 'admin:nav.categories', icon: Tag },
  { to: '/rooms', key: 'admin:nav.rooms', icon: Building2 },
  { to: '/orders', key: 'admin:nav.orders', icon: Receipt },
  { to: '/reports', key: 'admin:nav.reports', icon: BarChart3 },
];

const cycleTheme = (mode: ThemeMode): ThemeMode =>
  mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

const themeIcon = (mode: ThemeMode) =>
  mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

const toggleLocale = (loc: AppLocale): AppLocale => (loc === 'zh-CN' ? 'en-US' : 'zh-CN');

export default function AdminLayout() {
  const { t } = useTranslation(['admin', 'common', 'auth']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);
  const ThemeIcon = themeIcon(themeMode);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border/60 bg-card/40 backdrop-blur-md flex flex-col">
        <div className="h-16 flex items-center px-5 gap-2.5 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center text-brand-foreground shadow-md shadow-brand/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">{t('common:appName')}</span>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'text-brand-foreground'
                    : 'text-foreground/70 hover:text-foreground hover:bg-accent/40',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-gradient-brand rounded-lg shadow-md shadow-brand/30"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
                <Icon className="h-4 w-4 relative" />
                <span className="relative font-medium">{t(item.key)}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/60 flex items-center justify-end gap-2 px-6 bg-card/40 backdrop-blur-md">
          <span className="text-sm text-muted-foreground mr-2">{user?.username ?? '-'}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch(setTheme(cycleTheme(themeMode)))}
            title={t(`common:theme.${themeMode}`)}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch(setLocale(toggleLocale(locale)))}
            title={t(`common:locale.${locale}`)}
          >
            <Languages className="h-4 w-4" />
            <span className="ml-1.5">{locale === 'zh-CN' ? '中' : 'EN'}</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              dispatch(logout());
              navigate('/login', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1.5">{t('auth:logout')}</span>
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
