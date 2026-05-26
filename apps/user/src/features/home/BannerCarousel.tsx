import { useEffect, useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BANNER_LINK_TYPE, type Banner } from '@maill/shared';

const AUTOPLAY_MS = 4000;
// 手势切换阈值:位移超过容器宽度 15% 或者速度超过 500 才切换
const SWIPE_DISTANCE_RATIO = 0.15;
const SWIPE_VELOCITY = 500;
// 拖拽过程中标记为"已触发拖拽",避免与 click 事件冲突
const DRAG_THRESHOLD_PX = 5;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    if (banners.length <= 1) return;
    // 拖拽中不自动轮播,避免视觉冲突
    if (isDragging) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [banners.length, isDragging]);

  if (banners.length === 0) return null;

  const handleClick = (b: Banner) => {
    // 拖拽刚结束时屏蔽点击,防止误触
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (!b.linkTarget) return;
    switch (b.linkType) {
      case BANNER_LINK_TYPE.SHOW:
        navigate(`/show/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.ARTIST:
        navigate(`/artist/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.ARTICLE:
        navigate(`/article/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.URL:
        window.open(b.linkTarget, '_blank', 'noopener,noreferrer');
        break;
      default:
        break;
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    const width = containerRef.current?.offsetWidth ?? 0;
    const distance = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(distance) > DRAG_THRESHOLD_PX) draggedRef.current = true;

    const shouldSwipe =
      Math.abs(distance) > width * SWIPE_DISTANCE_RATIO || Math.abs(velocity) > SWIPE_VELOCITY;
    if (!shouldSwipe) return;
    // 左滑显示下一张,右滑显示上一张
    if (distance < 0) setIdx((i) => (i + 1) % banners.length);
    else setIdx((i) => (i - 1 + banners.length) % banners.length);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl aspect-[16/7] bg-muted touch-pan-y select-none"
    >
      <motion.div
        className="absolute inset-0 flex h-full"
        animate={{ x: `-${idx * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        drag={banners.length > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            className="relative w-full h-full shrink-0"
            onClick={() => handleClick(b)}
          >
            <img
              src={b.imageUrl}
              alt={b.title || ''}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>

      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
