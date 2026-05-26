import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Settings } from 'lucide-react';
import { useListFavoritesQuery, useListGroupsQuery } from './favoritesApi';

// Tab 类型：全部 / 未分组 / 指定分组id
type Tab = 'all' | 'unset' | number;

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const { data: groups = [] } = useListGroupsQuery();

  // 根据 tab 构造请求参数
  const arg = tab === 'all'
    ? { page: 1, size: 50 }
    : tab === 'unset'
    ? { unset: true, page: 1, size: 50 }
    : { groupId: tab as number, page: 1, size: 50 };

  const { data, isLoading } = useListFavoritesQuery(arg);
  const list = data?.list ?? [];

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">我的收藏</h1>
        </div>
        <button type="button" onClick={() => navigate('/favorites/groups')} className="text-xs text-primary inline-flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" /> 管理分组
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>全部</Chip>
        <Chip active={tab === 'unset'} onClick={() => setTab('unset')}>未分组</Chip>
        {groups.map((g) => (
          <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>{g.name}</Chip>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid grid-cols-2 gap-3">
        {list.map((f) => {
          const s = f.show;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => s && navigate(`/show/${s.id}`)}
              className="rounded-2xl border bg-card p-2 text-left hover:shadow-md transition-shadow"
            >
              {s?.posterUrl ? (
                <img src={s.posterUrl} className="w-full aspect-[3/4] rounded object-cover mb-2" alt="" />
              ) : (
                <div className="w-full aspect-[3/4] rounded bg-muted mb-2 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="font-medium truncate text-sm">{s?.name ?? `演出 ${f.showId}`}</div>
              {s?.venue && <p className="text-xs text-muted-foreground truncate">{s.venue}</p>}
            </button>
          );
        })}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">还没有收藏的演出</p>
      )}
    </div>
  );
}

// 分组切换 Chip
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'shrink-0 rounded-full px-3 py-1 text-xs transition-colors ' +
        (active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80')
      }
    >
      {children}
    </button>
  );
}
