import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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

const navItems = [
  { to: '/shows', key: 'admin:nav.shows' },
  { to: '/rooms', key: 'admin:nav.rooms' },
  { to: '/orders', key: 'admin:nav.orders' },
];

const cycleTheme = (mode: ThemeMode): ThemeMode =>
  mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

const toggleLocale = (loc: AppLocale): AppLocale => (loc === 'zh-CN' ? 'en-US' : 'zh-CN');

export default function AdminLayout() {
  const { t } = useTranslation(['admin', 'common', 'auth']);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const locale = useSelector(selectLocale);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-r border-border bg-card">
        <div className="h-14 flex items-center px-4 font-semibold border-b border-border">
          {t('common:appName')}
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2 rounded-md text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center justify-end gap-2 px-4">
          <span className="text-sm text-muted-foreground mr-2">{user?.username ?? '-'}</span>
          <Button size="sm" variant="outline" onClick={() => dispatch(setTheme(cycleTheme(themeMode)))}>
            {t(`common:theme.${themeMode}`)}
          </Button>
          <Button size="sm" variant="outline" onClick={() => dispatch(setLocale(toggleLocale(locale)))}>
            {t(`common:locale.${locale}`)}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              dispatch(logout());
              navigate('/login', { replace: true });
            }}
          >
            {t('auth:logout')}
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
