import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Star } from 'lucide-react';
import type { Show } from '@maill/shared';

interface Props {
  show: Show;
}

export function ShowCard({ show }: Props) {
  const navigate = useNavigate();
  const rating = show.avgRating ?? 0;
  const hasRating = rating > 0;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/show/${show.id}`)}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className="group relative w-full text-left rounded-2xl overflow-hidden bg-card
                 border border-border/60
                 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)]
                 hover:shadow-[0_12px_28px_-8px_rgba(15,23,42,0.18)]
                 transition-shadow duration-300"
    >
      {/* 海报区 */}
      <div className="relative aspect-[3/4] bg-gradient-brand-soft overflow-hidden">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
            alt={show.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out
                       group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand/50">
            <Sparkles className="h-12 w-12" />
          </div>
        )}

        {/* 底部暗渐变,让文字可读 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none"
        />

        {/* 顶部分类标签 */}
        {show.categoryName && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md
                          bg-white/85 dark:bg-black/55 backdrop-blur-md
                          text-foreground text-[11px] font-medium shadow-sm">
            {show.categoryName}
          </div>
        )}

        {/* 右上评分徽章 */}
        {hasRating && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5
                          px-1.5 py-0.5 rounded-md
                          bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* 标题压在海报底部,沉浸式 */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
            {show.name}
          </h3>
        </div>
      </div>

      {/* 副信息区 */}
      <div className="px-3 py-2 min-h-[2.25rem] flex items-center">
        {(show.cityName || show.venue) ? (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 truncate w-full">
            <MapPin className="h-3 w-3 shrink-0 text-brand" />
            <span className="truncate">
              {[show.cityName, show.venue].filter(Boolean).join(' · ')}
            </span>
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">即将开演</span>
        )}
      </div>
    </motion.button>
  );
}
