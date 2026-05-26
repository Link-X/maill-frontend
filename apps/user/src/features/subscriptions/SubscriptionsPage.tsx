import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Calendar, X } from 'lucide-react';
import { extractErrorMessage, notify } from '@maill/shared';
import { formatDateTime } from '@/lib/format';
import { useListSubscribesQuery, useRemoveSubscribeMutation } from './subscribeApi';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useListSubscribesQuery({ page: 1, size: 50 });
  const list = data?.list ?? [];
  const [removeSubscribe] = useRemoveSubscribeMutation();

  // 取消订阅
  const handleRemove = async (showId: number) => {
    try {
      await removeSubscribe(showId).unwrap();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">我的订阅</h1>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {list.map((s) => {
          const showName = s.show?.name ?? `演出 ${s.showId}`;
          return (
            <div key={s.id} className="rounded-2xl border bg-card p-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/show/${s.showId}`)}
                className="flex-1 text-left flex gap-3 min-w-0"
              >
                {s.show?.posterUrl ? (
                  <img
                    src={s.show.posterUrl}
                    alt=""
                    className="w-16 h-20 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-20 rounded bg-muted shrink-0 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{showName}</h3>
                  {s.show?.venue && (
                    <p className="text-xs text-muted-foreground truncate">{s.show.venue}</p>
                  )}
                  {s.show?.openSaleTime && (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      开售: {formatDateTime(s.show.openSaleTime)}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    提前 {s.notifyBeforeMinutes ?? 10} 分钟提醒
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(s.showId)}
                className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label="取消订阅"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">
          还没有订阅任何演出的开售提醒
        </p>
      )}
    </div>
  );
}
