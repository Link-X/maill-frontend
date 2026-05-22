import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Receipt, User } from 'lucide-react';
import { cn } from '@maill/shared';
import { PageTransition } from '@/components/PageTransition';

const tabs = [
  { to: '/', icon: Home, labelKey: 'common:tabBar.home' },
  { to: '/orders', icon: Receipt, labelKey: 'common:tabBar.orders' },
  { to: '/profile', icon: User, labelKey: 'common:tabBar.profile' },
];

export default function MobileLayout() {
  const { t } = useTranslation(['common']);
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md bg-background text-foreground">
      <main className="flex-1 pb-20">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30
                   border-t border-border/60 bg-card/95 backdrop-blur-md
                   pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      >
        <ul className="grid grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center py-2 text-xs gap-0.5 transition-colors',
                      isActive ? 'text-brand' : 'text-muted-foreground',
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(tab.labelKey)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
