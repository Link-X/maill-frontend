import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ArrowLeft } from 'lucide-react';
import { useListArtistsQuery } from './artistsApi';

export default function ArtistsListPage() {
  const { t } = useTranslation(['artist', 'common']);
  const navigate = useNavigate();
  const { data, isLoading } = useListArtistsQuery({ page: 1, size: 50 });
  const list = data?.list ?? [];

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('artist:user.listTitle')}</h1>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t('common:loading', 'Loading...')}</p>}
      <div className="grid grid-cols-2 gap-3">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(`/artist/${a.id}`)}
            className="rounded-2xl border bg-card p-3 text-left hover:shadow-md transition-shadow"
          >
            {a.avatarUrl ? (
              <img src={a.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-center">
              <div className="font-medium truncate">{a.stageName || a.name}</div>
              {a.stageName && a.name !== a.stageName && (
                <div className="text-xs text-muted-foreground truncate">{a.name}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {(a.followCount ?? 0)} · {(a.showCount ?? 0)}
              </div>
            </div>
          </button>
        ))}
      </div>
      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">
          {t('artist:user.noShows', '暂无艺人')}
        </p>
      )}
    </div>
  );
}
