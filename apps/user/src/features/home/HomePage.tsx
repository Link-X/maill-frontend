import { useEffect, useRef, useState } from 'react';
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

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function HomePage() {
  const { t } = useTranslation(['show', 'common', 'city']);
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
    <div className="px-4 py-3 space-y-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t('show:list.title')}</h1>
          <CityPicker
            cities={cities}
            value={cityCode}
            label={currentCityName}
            onChange={setCityCode}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('show:list.searchPlaceholder')}
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        {/* 分类 tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
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
      </header>

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
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {list.map((show) => (
            <ShowCard key={String(show.id)} show={show} />
          ))}
        </motion.div>
      )}

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-muted-foreground">{t('common:states.loading')}</p>
      )}
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
        'shrink-0 px-3 h-8 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-brand text-brand-foreground border-brand shadow-sm'
          : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:border-brand/40',
      )}
    >
      {children}
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
