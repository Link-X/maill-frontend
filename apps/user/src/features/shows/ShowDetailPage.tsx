import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Ticket } from 'lucide-react';
import { Button, SessionStatus } from '@maill/shared';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/lib/format';
import { useGetShowQuery } from './showsApi';
import { useListSessionsQuery } from '@/features/sessions/sessionsApi';

export default function ShowDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const showId = id ?? '';
  const { data: show, isLoading: loadingShow } = useGetShowQuery(showId, { skip: !showId });
  const { data: sessions, isLoading: loadingSessions } = useListSessionsQuery(
    { showId, page: 1, size: 50, status: SessionStatus.Published },
    { skip: !showId },
  );
  const sessionList = sessions?.list ?? [];

  return (
    <div>
      {/* 海报区域 */}
      <div className="relative h-56 bg-gradient-brand-soft">
        {show?.posterUrl && (
          <img src={show.posterUrl} alt={show.name} className="w-full h-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loadingShow ? (
          <Skeleton className="h-8 w-2/3" />
        ) : show ? (
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{show.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {show.category && <Badge variant="brand">{show.category}</Badge>}
              {show.venue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {show.venue}
                </span>
              )}
            </div>
            {show.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">{show.description}</p>
            )}
          </header>
        ) : null}

        <section>
          <h2 className="font-semibold mb-3 inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-brand" />
            可选场次
          </h2>
          {loadingSessions ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : sessionList.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="暂无可售场次"
              description="商家正在准备中，敬请期待"
            />
          ) : (
            <div className="space-y-2">
              {sessionList.map((s) => (
                <Card key={String(s.id)} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-medium">{s.name || `${formatDateTime(s.startTime)} 场`}</div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(s.startTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        限 {s.limitPerUser ?? '-'} 张
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-brand hover:opacity-90 shrink-0"
                    onClick={() => navigate(`/session/${s.id}`)}
                  >
                    选座购票
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
