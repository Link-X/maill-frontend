import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Ticket, Clock, Shield } from 'lucide-react';
import { Button, SessionStatus, parseExtend, type ShowExtend } from '@maill/shared';
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
              {show.categoryName && <Badge variant="brand">{show.categoryName}</Badge>}
              {show.cityName && <Badge variant="info">{show.cityName}</Badge>}
            </div>
            {(show.venue || show.address) && (
              <p className="text-sm text-muted-foreground inline-flex items-start gap-1.5">
                <MapPin className="h-4 w-4 mt-0.5 text-brand shrink-0" />
                <span>
                  {show.venue && <span className="text-foreground/80 font-medium">{show.venue}</span>}
                  {show.venue && show.address && <span className="mx-1">·</span>}
                  {show.address}
                </span>
              </p>
            )}
            {show.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">{show.description}</p>
            )}
            <ShowExtendInfo extend={show.extend} />
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

function ShowExtendInfo({ extend }: { extend?: string }) {
  const data = parseExtend<ShowExtend>(extend);
  if (!data) return null;
  const items: { icon: typeof Clock; label: string; value: string }[] = [];
  if (typeof data.duration === 'number') {
    items.push({ icon: Clock, label: '时长', value: `${data.duration} 分钟` });
  }
  if (data.ageLimit) {
    items.push({ icon: Users, label: '年龄', value: String(data.ageLimit) });
  }
  if (data.refundRule) {
    items.push({ icon: Shield, label: '退票', value: String(data.refundRule) });
  }
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-1.5 pt-1">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
          <Icon className="h-3.5 w-3.5 mt-0.5 text-brand shrink-0" />
          <span>
            <span className="text-foreground/70">{label}：</span>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
