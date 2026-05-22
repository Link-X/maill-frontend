import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin } from 'lucide-react';
import type { Show } from '@maill/shared';
import { Card } from '@/components/Card';

interface Props {
  show: Show;
}

export function ShowCard({ show }: Props) {
  const navigate = useNavigate();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Card
        interactive
        onClick={() => navigate(`/show/${show.id}`)}
        className="overflow-hidden"
      >
        <div className="relative h-40 bg-gradient-brand-soft">
          {show.posterUrl ? (
            <img src={show.posterUrl} alt={show.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand/60">
              <Sparkles className="h-10 w-10" />
            </div>
          )}
          {show.category && (
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-card/80 backdrop-blur text-xs font-medium">
              {show.category}
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold leading-snug line-clamp-2">{show.name}</h3>
          {show.venue && (
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {show.venue}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
