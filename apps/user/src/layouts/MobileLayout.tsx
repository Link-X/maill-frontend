import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Newspaper, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@maill/shared';
import { PageTransition } from '@/components/PageTransition';

const tabs = [
  { to: '/', icon: Home, labelKey: 'common:tabBar.home' },
  { to: '/articles', icon: Newspaper, labelKey: 'common:tabBar.articles' },
  { to: '/profile', icon: User, labelKey: 'common:tabBar.profile' },
];

// 判断当前路径属于哪个一级 tab;只在主 tab 页(首页/资讯/我的)显示 tabbar,
// 其他二级页面(详情/选座/支付/订单列表/收藏/关注/订阅/消息/搜索/扫码…)一律隐藏
const matchTab = (pathname: string) => {
  if (pathname === '/') return '/';
  // 注意:只匹配 /articles 列表本身,不含 /article/:id 详情
  if (pathname === '/articles') return '/articles';
  if (pathname === '/profile') return '/profile';
  return null;
};

export default function MobileLayout() {
  const { t } = useTranslation(['common']);
  const { pathname } = useLocation();
  const activeTab = matchTab(pathname);
  const showTabBar = activeTab !== null;

  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md bg-background text-foreground">
      <main className={cn('flex-1', showTabBar && 'pb-28')}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Liquid Glass TabBar:仅在主 tab 页显示 */}
      {showTabBar && (
        <nav
          className="fixed left-1/2 -translate-x-1/2 z-30 w-[min(92vw,22rem)]
                     bottom-[max(1rem,env(safe-area-inset-bottom))]"
          aria-label="主导航"
        >
          <div
            className="relative rounded-full overflow-hidden
                       bg-white/55 dark:bg-white/[0.08]
                       backdrop-blur-2xl backdrop-saturate-150
                       border border-white/40 dark:border-white/15
                       shadow-[0_8px_32px_-4px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                       dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2
                         bg-gradient-to-b from-white/40 to-transparent
                         dark:from-white/10"
            />

            <ul className="relative grid grid-cols-3 px-1.5 py-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.to;
                const Icon = tab.icon;
                return (
                  <li key={tab.to} className="relative">
                    <NavLink
                      to={tab.to}
                      end={tab.to === '/'}
                      className="relative z-10 flex flex-col items-center justify-center
                                 gap-0.5 py-1.5 text-[11px] font-medium select-none
                                 transition-colors duration-200"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="tab-pill"
                          aria-hidden
                          className="absolute inset-0 -z-10 rounded-full
                                     bg-gradient-to-b from-white/90 to-white/60
                                     dark:from-white/20 dark:to-white/5
                                     border border-white/60 dark:border-white/20
                                     shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.8)]
                                     dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors duration-200',
                          isActive ? 'text-brand' : 'text-foreground/60',
                        )}
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                      <span
                        className={cn(
                          'transition-colors duration-200',
                          isActive ? 'text-brand' : 'text-foreground/60',
                        )}
                      >
                        {t(tab.labelKey)}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
