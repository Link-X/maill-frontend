import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, MapPin, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, Input } from '@maill/shared';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useListShowsQuery } from '@/features/shows/showsApi';
import { ShowCard } from '@/features/shows/ShowCard';
import { useListCategoriesQuery } from '@/features/categories/categoriesApi';
import { useListCitiesQuery } from '@/features/cities/citiesApi';
import { useListEffectiveBannersQuery } from '@/features/home/bannersApi';
import { BannerCarousel } from '@/features/home/BannerCarousel';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function HomePage() {
  const { t } = useTranslation(['show', 'common', 'city']);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [cityCode, setCityCode] = useState<string | undefined>(undefined);

  // 防抖：用户停止输入 300ms 后再发起搜索请求
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(name.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [name]);

  const { data: categories = [] } = useListCategoriesQuery();
  const { data: cities = [] } = useListCitiesQuery();
  const { data: banners = [] } = useListEffectiveBannersQuery();
  const { data, isLoading, isFetching } = useListShowsQuery({
    page: 1,
    size: PAGE_SIZE,
    name: debouncedName || undefined,
    categoryId,
    cityCode,
  });

  const list = data?.list ?? [];
  const currentCityName = cities.find((c) => c.code === cityCode)?.name ?? t('city:picker.allCities');

  return (
    <div className="pb-6">
      {/* ===== 紧凑 header:标题+城市一行,搜索一行 ===== */}
      <header className="relative isolate px-4 pt-3 pb-3 overflow-hidden">
        {/* 渐变背景大幅减弱,只在角落留一点 brand 提示,不与 banner 抢戏 */}
        <div
          aria-hidden
          className="absolute -top-20 -right-16 w-44 h-44 rounded-full bg-brand/10 blur-3xl pointer-events-none -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="relative space-y-2.5"
        >
          {/* 第一行:标题 + 城市 */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
              {t('show:list.title')}
            </h1>
            <CityPicker
              cities={cities}
              value={cityCode}
              label={currentCityName}
              onChange={setCityCode}
            />
          </div>

          {/* 第二行:搜索栏(玻璃质感) */}
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="block w-full text-left active:scale-[0.99] transition-transform"
          >
            <div className="relative pointer-events-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand" />
              <Input
                readOnly
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('show:list.searchPlaceholder')}
                className="pl-10 h-10 rounded-xl cursor-pointer
                           bg-card border-border/60
                           hover:border-brand/30 transition-colors"
              />
            </div>
          </button>
        </motion.div>
      </header>

      <div className="px-4 space-y-4">
        {banners.length > 0 && <BannerCarousel banners={banners} />}

        {/* 分类 tabs:layoutId 渐变胶囊 */}
        {categories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
            <CategoryChip
              active={categoryId === undefined}
              onClick={() => setCategoryId(undefined)}
            >
              {t('show:list.allCategories')}
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </CategoryChip>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={t('show:list.empty')}
            description={t('show:list.emptyHint')}
          />
        ) : (
          <motion.div
            key={`${categoryId ?? 'all'}-${cityCode ?? 'all'}-${debouncedName}`}
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
          >
            {list.map((show) => (
              <ShowCard key={String(show.id)} show={show} />
            ))}
          </motion.div>
        )}

        {/* 顶部浮动加载条:筛选切换时显示,不打断滚动 */}
        {isFetching && !isLoading && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30
                          inline-flex items-center gap-2 px-3 h-8 rounded-full
                          bg-card/85 backdrop-blur-md border border-border/60
                          shadow-sm text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            {t('common:states.loading')}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition-colors',
        active ? 'text-brand-foreground' : 'text-foreground/70 hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="home-category-pill"
          className="absolute inset-0 rounded-full bg-gradient-brand shadow-sm shadow-brand/30"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function CityPicker({
  cities,
  value,
  label,
  onChange,
}: {
  cities: import('@maill/shared').City[];
  value: string | undefined;
  label: string;
  onChange: (cityCode: string | undefined) => void;
}) {
  const { t } = useTranslation(['city']);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-xs font-medium bg-card border border-border/60 hover:border-brand/40 transition-colors max-w-[140px]"
      >
        <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-30 w-44 max-h-72 overflow-auto rounded-xl border border-border/60 bg-card shadow-lg shadow-black/5 py-1"
          >
            <CityOption
              active={value === undefined}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {t('city:picker.allCities')}
            </CityOption>
            {cities.map((c) => (
              <CityOption
                key={c.code}
                active={value === c.code}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
              >
                {c.name}
              </CityOption>
            ))}
            {cities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">{t('city:picker.empty')}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CityOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors',
        active && 'text-brand font-medium',
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
