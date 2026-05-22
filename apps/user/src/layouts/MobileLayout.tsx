import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@maill/shared';

const tabs = [
  { to: '/', icon: '🏠', labelKey: 'common:tabBar.home' },
  { to: '/orders', icon: '🧾', labelKey: 'common:tabBar.orders' },
  { to: '/profile', icon: '👤', labelKey: 'common:tabBar.profile' },
];

export default function MobileLayout() {
  const { t } = useTranslation(['common']);
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md bg-background text-foreground">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background">
        <ul className="grid grid-cols-3">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center py-2 text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                <span aria-hidden className="text-lg leading-none">{tab.icon}</span>
                <span className="mt-1">{t(tab.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
