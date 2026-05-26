import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CalendarRange,
  Building2,
  Receipt,
  Tag,
  Image as ImageIcon,
  Users,
  FolderTree,
  Newspaper,
  MessageSquare,
  MessagesSquare,
  BarChart3,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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
import { duration, easing, spring } from '@/lib/motion';

const navItems = [
  { to: '/reports', key: 'admin:nav.reports', icon: BarChart3 },
  { to: '/shows', key: 'admin:nav.shows', icon: CalendarRange },
  { to: '/categories', key: 'admin:nav.categories', icon: Tag },
  { to: '/rooms', key: 'admin:nav.rooms', icon: Building2 },
  { to: '/orders', key: 'admin:nav.orders', icon: Receipt },
  { to: '/banners', key: 'admin:nav.banner', icon: ImageIcon },
  { to: '/artists', key: 'admin:nav.artists', icon: Users },
  { to: '/article-categories', key: 'admin:nav.articleCategories', icon: FolderTree },
  { to: '/articles', key: 'admin:nav.articles', icon: Newspaper },
  { to: '/messages', key: 'admin:nav.messages', icon: MessageSquare },
  { to: '/reviews', key: 'admin:nav.reviews', icon: MessagesSquare },
];

const cycleTheme = (mode: ThemeMode): ThemeMode =>
  mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

const themeIcon = (mode: ThemeMode) =>
  mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

const toggleLocale = (loc: AppLocale): AppLocale => (loc === 'zh-CN' ? 'en-US' : 'zh-CN');

// sidebar 宽度持久化 key，刷新后保留状态
const SIDEBAR_COLLAPSED_KEY = 'admin:sidebar:collapsed';

export default function AdminLayout() {
  const { t } = useTranslation(['admin', 'common', 'auth']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);
  const ThemeIcon = themeIcon(themeMode);

  // sidebar 折叠状态
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  });
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // header 滚动收紧
  const [scrolled, setScrolled] = useState(false);
  const headerHeight = scrolled ? 52 : 64;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <motion.aside
        className="border-r border-border/60 bg-card/40 backdrop-saturated flex flex-col overflow-hidden"
        animate={{ width: collapsed ? 64 : 240 }}
        transition={spring.layout}
      >
        <div className="h-16 flex items-center px-3.5 gap-2.5 border-b border-border/60 shrink-0">
          <motion.button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center text-brand-foreground shadow-elevate-1 shrink-0"
            whileHover={{ scale: 1.06, rotate: collapsed ? 0 : 4 }}
            whileTap={{ scale: 0.94 }}
            transition={spring.snappy}
            aria-label="toggle sidebar"
          >
            <Sparkles className="h-4 w-4" />
          </motion.button>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                className="font-semibold tracking-tight whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: duration.fast, ease: easing.standard }}
              >
                {t('common:appName')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? t(item.key) : undefined}
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
                    className="absolute inset-0 bg-gradient-brand rounded-lg shadow-elevate-2"
                    transition={spring.snappy}
                  />
                )}
                <motion.span
                  className="relative flex items-center justify-center shrink-0"
                  whileHover={!active ? { scale: 1.12 } : undefined}
                  transition={spring.snappy}
                >
                  <Icon className="h-4 w-4" />
                </motion.span>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      className="relative font-medium whitespace-nowrap overflow-hidden"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: duration.fast, ease: easing.standard }}
                    >
                      {t(item.key)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <motion.button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="w-full flex items-center justify-center gap-2 px-2 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <>
                <PanelLeftClose className="h-3.5 w-3.5" />
                <span>{t('common:actions.collapse', { defaultValue: '折叠' })}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <motion.header
          className={cn(
            'sticky top-0 z-30 border-b border-border/60 flex items-center justify-end gap-2 px-6 bg-card/60 backdrop-saturated transition-shadow',
            scrolled && 'shadow-elevate-1',
          )}
          animate={{ height: headerHeight }}
          transition={{ duration: duration.base, ease: easing.standard }}
        >
          <span className="text-sm text-muted-foreground mr-2">{user?.username ?? '-'}</span>
          <motion.div whileTap={{ scale: 0.94 }} transition={spring.snappy}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dispatch(setTheme(cycleTheme(themeMode)))}
              title={t(`common:theme.${themeMode}`)}
            >
              <motion.span
                key={themeMode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={spring.snappy}
                className="inline-flex"
              >
                <ThemeIcon className="h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} transition={spring.snappy}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dispatch(setLocale(toggleLocale(locale)))}
              title={t(`common:locale.${locale}`)}
            >
              <Languages className="h-4 w-4" />
              <span className="ml-1.5">{locale === 'zh-CN' ? '中' : 'EN'}</span>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} whileHover={{ y: -1 }} transition={spring.snappy}>
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
          </motion.div>
        </motion.header>
        <main
          className="flex-1 overflow-auto"
          onScroll={(e) => {
            const top = (e.target as HTMLDivElement).scrollTop;
            setScrolled(top > 12);
          }}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
